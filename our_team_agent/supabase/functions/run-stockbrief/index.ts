import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const MODEL = Deno.env.get("OPENAI_MODEL") || "gpt-6-luna";
const OPENAI_API_URL = "https://api.openai.com/v1/responses";
const corsHeaders = {
  "Access-Control-Allow-Origin": Deno.env.get("ALLOWED_ORIGIN") || "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, idempotency-key",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type Evidence = {
  symbol: string;
  price: number;
  comparison_price: number;
  percent_change: number;
  market_status: string;
  currency: string;
  observed_at: string;
  source_name: string;
  source_url: string;
  freshness_seconds: number;
};

type ContextEvidence = {
  symbol: string;
  claim: string;
  source_name: string;
  source_url: string;
  published_at?: string;
  retrieved_at: string;
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function isEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function extractOutputText(response: any): string {
  if (typeof response?.output_text === "string") return response.output_text;
  const chunks = (response?.output || []).flatMap((item: any) => item?.content || []);
  return chunks.filter((item: any) => item?.type === "output_text").map((item: any) => item.text).join("");
}

function containsProhibitedAdvice(value: unknown) {
  const text = JSON.stringify(value);
  return /\b(buy|sell|hold|target price|outperform|underperform)\b/i.test(text);
}

const outputSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    overall_note: { type: "string" },
    briefing: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          symbol: { type: "string" },
          movement: { type: "string" },
          explanation: { type: "string" },
          suggestions: { type: "array", items: { type: "string" } },
          citations: { type: "array", items: { type: "string" } },
          limitations: { type: "array", items: { type: "string" } },
          support_status: { type: "string", enum: ["supported", "held_for_review"] },
        },
        required: ["symbol", "movement", "explanation", "suggestions", "citations", "limitations", "support_status"],
      },
    },
  },
  required: ["overall_note", "briefing"],
};

async function main(req: Request) {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);

  const openaiKey = Deno.env.get("OPENAI_API_KEY");
  if (!openaiKey) return json({ error: "model_not_configured", message: "OPENAI_API_KEY is not configured in Supabase Secrets." }, 503);

  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) return json({ error: "authentication_required" }, 401);

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY") || Deno.env.get("SUPABASE_PUBLISHABLE_KEY");
  if (!supabaseUrl || !supabaseKey) return json({ error: "supabase_not_configured" }, 503);

  const supabase = createClient(supabaseUrl, supabaseKey, { global: { headers: { Authorization: authHeader } } });
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) return json({ error: "invalid_session" }, 401);

  let body: any;
  try { body = await req.json(); } catch { return json({ error: "invalid_json" }, 400); }

  const symbols = Array.isArray(body?.symbols) ? body.symbols.map((symbol: unknown) => String(symbol).trim().toUpperCase()).filter(Boolean) : [];
  const recipientEmail = String(body?.recipient_email || "").trim();
  const marketEvidence: Evidence[] = Array.isArray(body?.market_evidence) ? body.market_evidence : [];
  const contextEvidence: ContextEvidence[] = Array.isArray(body?.context_evidence) ? body.context_evidence : [];
  const idempotencyKey = String(body?.idempotency_key || req.headers.get("Idempotency-Key") || "").trim();

  if (symbols.length < 1 || symbols.length > 20) return json({ error: "invalid_symbols", message: "Provide between 1 and 20 symbols." }, 400);
  if (!isEmail(recipientEmail)) return json({ error: "invalid_recipient" }, 400);
  if (!idempotencyKey || idempotencyKey.length > 100) return json({ error: "idempotency_key_required" }, 400);
  if (marketEvidence.some((item) => !symbols.includes(item.symbol))) return json({ error: "evidence_symbol_mismatch" }, 400);

  const { data: existing } = await supabase.from("briefing_runs").select("id,status,output").eq("user_id", userData.user.id).eq("idempotency_key", idempotencyKey).maybeSingle();
  if (existing) return json({ error: "duplicate_run", run_id: existing.id, status: existing.status, briefing: existing.output }, 409);

  const runId = crypto.randomUUID();
  const { error: insertError } = await supabase.from("briefing_runs").insert({
    id: runId,
    user_id: userData.user.id,
    idempotency_key: idempotencyKey,
    status: "running",
    model_id: MODEL,
  });
  if (insertError) return json({ error: "run_create_failed" }, 500);

  const input = JSON.stringify({ symbols, market_evidence: marketEvidence, context_evidence: contextEvidence });
  const instructions = [
    "You are StockBrief, a cautious market-monitoring assistant.",
    "Use only the supplied evidence. Never invent prices, events, causes, citations, or freshness.",
    "Describe movement without giving buy, sell, or hold advice. Suggestions must be neutral monitoring topics only.",
    "If evidence cannot support a causal explanation, set support_status to held_for_review and say no verified cause was found.",
    "Every citation must be copied exactly from a supplied source_url. Include limitations when evidence is missing or stale.",
    "Do not mention or repeat the recipient email. Return only the requested JSON structure.",
  ].join(" ");

  try {
    const response = await fetch(OPENAI_API_URL, {
      method: "POST",
      headers: { Authorization: `Bearer ${openaiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: MODEL,
        store: false,
        instructions,
        input,
        reasoning: { effort: "low" },
        text: { format: { type: "json_schema", name: "stockbrief_output", strict: true, schema: outputSchema } },
      }),
    });
    const responseBody = await response.json();
    if (!response.ok) throw new Error(`openai_${response.status}`);
    const text = extractOutputText(responseBody);
    const output = JSON.parse(text);
    if (containsProhibitedAdvice({ overall_note: output.overall_note, briefing: output.briefing })) throw new Error("policy_validation_failed");

    const needsReview = output.briefing.some((item: any) => item.support_status === "held_for_review");
    await supabase.from("briefing_runs").update({ status: needsReview ? "held_for_review" : "completed", output, completed_at: new Date().toISOString() }).eq("id", runId).eq("user_id", userData.user.id);
    if (needsReview) {
      const packets = output.briefing.filter((item: any) => item.support_status === "held_for_review").map((item: any) => ({ run_id: runId, user_id: userData.user.id, symbol: item.symbol, question: item.explanation, evidence: item.citations }));
      if (packets.length) await supabase.from("review_packets").insert(packets);
    }
    return json({ run_id: runId, model: MODEL, status: needsReview ? "held_for_review" : "completed", briefing: output });
  } catch (error) {
    await supabase.from("briefing_runs").update({ status: "failed", error_code: error instanceof Error ? error.message : "unknown_error", completed_at: new Date().toISOString() }).eq("id", runId).eq("user_id", userData.user.id);
    return json({ error: "briefing_failed", run_id: runId }, 502);
  }
}

Deno.serve(main);
