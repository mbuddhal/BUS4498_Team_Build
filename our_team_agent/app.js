(() => {
  const demoRows = [
    { symbol: 'AAPL', company: 'Apple Inc.', change: '+1.84%', direction: 'up', copy: 'Price moved higher during the observation window. The demo evidence does not establish a verified cause.', source: 'Demo market fixture · 4:40 PM PT' },
    { symbol: 'MSFT', company: 'Microsoft Corp.', change: '+0.62%', direction: 'up', copy: 'Price was modestly higher. No source-backed event was attached to this demo observation.', source: 'Demo market fixture · 4:40 PM PT' },
    { symbol: 'NVDA', company: 'NVIDIA Corp.', change: '-1.21%', direction: 'down', copy: 'Price moved lower. StockBrief holds the cause question for human review rather than guessing.', source: 'Demo market fixture · 4:40 PM PT' },
  ];

  const config = window.STOCKBRIEF_CONFIG || { mode: 'demo' };
  const liveMode = config.mode === 'live';
  const client = liveMode && window.supabase?.createClient
    ? window.supabase.createClient(config.supabaseUrl, config.supabasePublishableKey)
    : null;
  const $ = (selector) => document.querySelector(selector);
  const symbolsInput = $('#symbols');
  const recipientInput = $('#recipient');
  const scheduleInput = $('#schedule');
  const runStatus = $('#run-status');
  const briefingList = $('#briefing-list');
  const reviewCallout = $('#review-callout');
  const pauseButton = $('#pause-button');
  const runButton = $('#run-button');
  const reviewDialog = $('#review-dialog');
  const authForm = $('#auth-form');
  const authMessage = $('#auth-message');
  const authState = $('#auth-state');
  const signoutButton = $('#signout-button');
  let paused = false;
  let runNumber = 1;
  let currentUser = null;

  $('#mode-pill').textContent = liveMode ? 'Live connection' : 'Demo mode';
  if (liveMode) {
    runStatus.textContent = client ? 'Sign in to use the connected StockBrief workflow.' : 'Live configuration is incomplete; using demo mode is unavailable.';
    reviewCallout.hidden = true;
  }

  function escapeHtml(value) {
    return String(value).replace(/[&<>'"]/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[character]));
  }

  function normalizedSymbols() {
    return symbolsInput.value.split(',').map((value) => value.trim().toUpperCase()).filter(Boolean).slice(0, 20);
  }

  function renderRows(symbols = demoRows.map((row) => row.symbol)) {
    const normalized = symbols.map((value) => value.trim().toUpperCase()).filter(Boolean).slice(0, 8);
    briefingList.innerHTML = normalized.map((symbol) => {
      const row = demoRows.find((item) => item.symbol === symbol) || {
        symbol,
        company: 'Demo watchlist symbol',
        change: 'Held',
        direction: '',
        copy: 'No fixture is available for this symbol. The workflow holds it instead of inventing market data.',
        source: 'No verified source · held for review',
      };
      return `<article class="briefing-row"><div><div class="symbol">${escapeHtml(row.symbol)}</div><div class="company">${escapeHtml(row.company)}</div></div><div><div class="briefing-copy">${escapeHtml(row.copy)}</div><div class="source-link">${escapeHtml(row.source)}</div></div><div class="move ${row.direction === 'down' ? 'down' : ''}">${escapeHtml(row.change)}</div></article>`;
    }).join('') || '<p class="muted">Add at least one symbol to begin.</p>';
    $('#sources-value').textContent = `Demo fixtures · ${normalized.length} symbol${normalized.length === 1 ? '' : 's'}`;
  }

  function renderLiveBriefing(output) {
    const rows = Array.isArray(output?.briefing) ? output.briefing : [];
    briefingList.innerHTML = rows.map((row) => {
      const citations = Array.isArray(row.citations) && row.citations.length ? row.citations.join(' · ') : 'No verified source citation';
      const held = row.support_status === 'held_for_review';
      return `<article class="briefing-row"><div><div class="symbol">${escapeHtml(row.symbol)}</div><div class="company">${held ? 'Held for review' : 'Evidence-backed card'}</div></div><div><div class="briefing-copy">${escapeHtml(row.explanation || row.movement || 'No explanation returned.')}</div><div class="source-link">${escapeHtml(citations)}</div></div><div class="move ${held ? 'down' : ''}">${held ? 'Review' : 'Ready'}</div></article>`;
    }).join('') || '<p class="muted">The live workflow returned no briefing cards.</p>';
    $('#sources-value').textContent = `Live evidence · ${rows.length} card${rows.length === 1 ? '' : 's'}`;
    reviewCallout.hidden = !rows.some((row) => row.support_status === 'held_for_review');
    if (output?.run_id) $('#dialog-run-id').textContent = output.run_id;
  }

  async function refreshAuth() {
    if (!client) {
      currentUser = null;
      authState.textContent = 'Demo';
      authMessage.textContent = 'Demo mode is active. Sign-in becomes available when the live Supabase configuration is connected.';
      return;
    }
    const { data } = await client.auth.getSession();
    currentUser = data.session?.user || null;
    authState.textContent = currentUser ? 'Signed in' : 'Signed out';
    signoutButton.hidden = !currentUser;
    authForm.querySelector('.auth-submit').hidden = Boolean(currentUser);
    authForm.querySelector('#auth-email').disabled = Boolean(currentUser);
    authForm.querySelector('#auth-password').disabled = Boolean(currentUser);
    authMessage.textContent = currentUser ? `Signed in as ${currentUser.email}.` : 'Sign in with the Supabase test user before saving or running a live check.';
  }

  async function signIn(event) {
    event.preventDefault();
    if (!client) return;
    authMessage.textContent = 'Signing in…';
    const { error } = await client.auth.signInWithPassword({ email: $('#auth-email').value.trim(), password: $('#auth-password').value });
    authMessage.textContent = error ? `Sign-in failed: ${error.message}` : 'Signed in.';
    await refreshAuth();
  }

  async function saveWatchlistLive() {
    if (!currentUser) throw new Error('Sign in before saving the watchlist.');
    const symbols = normalizedSymbols();
    if (!symbols.length) throw new Error('Enter at least one symbol.');
    const payload = { user_id: currentUser.id, symbols, recipient_email: recipientInput.value.trim(), schedule: scheduleInput.value, is_active: true, paused: false };
    const { data: existing, error: lookupError } = await client.from('watchlists').select('id').eq('is_active', true).maybeSingle();
    if (lookupError) throw lookupError;
    const query = existing
      ? client.from('watchlists').update(payload).eq('id', existing.id)
      : client.from('watchlists').insert(payload);
    const { error } = await query;
    if (error) throw error;
  }

  async function runLiveCheck() {
    if (!currentUser) throw new Error('Sign in before running a live check.');
    const symbols = normalizedSymbols();
    const { data, error } = await client.functions.invoke('run-stockbrief', {
      body: {
        symbols,
        recipient_email: recipientInput.value.trim(),
        idempotency_key: crypto.randomUUID(),
        market_evidence: [],
        context_evidence: [],
      },
    });
    if (error) throw error;
    renderLiveBriefing(data);
    return data;
  }

  async function runCheck() {
    if (paused) {
      runStatus.textContent = 'Runs are paused by the owner. Resume before starting a new check.';
      return;
    }
    if (liveMode && client) {
      runStatus.textContent = 'Calling the authenticated Edge Function…';
      try {
        const data = await runLiveCheck();
        runStatus.textContent = `Live run ${data.run_id || ''} returned ${data.status || 'a result'}. No market-data provider is connected yet, so unsupported items may be held for review.`;
        $('#run-time').textContent = new Date().toLocaleString([], { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' });
      } catch (error) {
        runStatus.textContent = `Live run failed: ${error.message || 'check the Edge Function logs.'}`;
      }
      return;
    }
    const runId = `SB-DEMO-${String(runNumber).padStart(4, '0')}`;
    runNumber += 1;
    $('#dialog-run-id').textContent = runId;
    $('#run-time').textContent = new Date().toLocaleString([], { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' });
    runStatus.textContent = `Run ${runId} completed in demo mode. Three checks passed; one explanation is held for review.`;
    reviewCallout.hidden = false;
  }

  $('#watchlist-form').addEventListener('submit', async (event) => {
    event.preventDefault();
    const symbols = normalizedSymbols();
    if (liveMode && client) {
      runStatus.textContent = 'Saving your private watchlist…';
      try {
        await saveWatchlistLive();
        renderLiveBriefing({ briefing: symbols.map((symbol) => ({ symbol, explanation: 'Saved. Run a live check after approved evidence is connected.', citations: [], support_status: 'held_for_review' })) });
        runStatus.textContent = 'Watchlist saved to Supabase for the signed-in user.';
      } catch (error) {
        runStatus.textContent = `Watchlist save failed: ${error.message || 'check the database policies.'}`;
      }
      return;
    }
    renderRows(symbols);
    runStatus.textContent = 'Watchlist saved locally for this demo session. Run a check when ready.';
  });

  authForm.addEventListener('submit', signIn);
  signoutButton.addEventListener('click', async () => {
    if (client) await client.auth.signOut();
    await refreshAuth();
  });
  if (client) client.auth.onAuthStateChange(() => refreshAuth());
  runButton.addEventListener('click', runCheck);
  pauseButton.addEventListener('click', () => {
    paused = !paused;
    pauseButton.setAttribute('aria-pressed', String(paused));
    pauseButton.textContent = paused ? 'Resume runs' : 'Pause runs';
    runStatus.textContent = paused ? 'Runs are paused. No retrieval or delivery action can start.' : 'Runs are resumed. The next check will use the current bounded configuration.';
  });
  $('#review-button').addEventListener('click', () => reviewDialog.showModal());
  if (liveMode) {
    briefingList.innerHTML = '<p class="muted">Sign in and run a live check to load a briefing. No demo rows are shown in live mode.</p>';
    $('#sources-value').textContent = 'Awaiting authenticated evidence';
  } else {
    renderRows();
  }
  refreshAuth();
})();
