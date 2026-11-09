(() => {
  const demoRows = [
    { symbol: 'AAPL', company: 'Apple Inc.', change: '+1.84%', direction: 'up', copy: 'Price moved higher during the observation window. The demo evidence does not establish a verified cause.', source: 'Demo market fixture · 4:40 PM PT' },
    { symbol: 'MSFT', company: 'Microsoft Corp.', change: '+0.62%', direction: 'up', copy: 'Price was modestly higher. No source-backed event was attached to this demo observation.', source: 'Demo market fixture · 4:40 PM PT' },
    { symbol: 'NVDA', company: 'NVIDIA Corp.', change: '-1.21%', direction: 'down', copy: 'Price moved lower. StockBrief holds the cause question for human review rather than guessing.', source: 'Demo market fixture · 4:40 PM PT' },
  ];

  const $ = (selector) => document.querySelector(selector);
  const symbolsInput = $('#symbols');
  const runStatus = $('#run-status');
  const briefingList = $('#briefing-list');
  const reviewCallout = $('#review-callout');
  const pauseButton = $('#pause-button');
  const runButton = $('#run-button');
  const reviewDialog = $('#review-dialog');
  let paused = false;
  let runNumber = 1;

  function renderRows(symbols = demoRows.map((row) => row.symbol)) {
    const normalized = symbols.map((value) => value.trim().toUpperCase()).filter(Boolean).slice(0, 8);
    briefingList.innerHTML = normalized.map((symbol, index) => {
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

  function escapeHtml(value) {
    return String(value).replace(/[&<>'"]/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[character]));
  }

  function runCheck() {
    if (paused) {
      runStatus.textContent = 'Runs are paused by the owner. Resume before starting a new check.';
      return;
    }
    const runId = `SB-DEMO-${String(runNumber).padStart(4, '0')}`;
    runNumber += 1;
    $('#dialog-run-id').textContent = runId;
    $('#run-time').textContent = new Date().toLocaleString([], { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' });
    runStatus.textContent = `Run ${runId} completed in demo mode. Three checks passed; one explanation is held for review.`;
    reviewCallout.hidden = false;
  }

  $('#watchlist-form').addEventListener('submit', (event) => {
    event.preventDefault();
    const symbols = symbolsInput.value.split(',');
    renderRows(symbols);
    runStatus.textContent = 'Watchlist saved locally for this demo session. Run a check when ready.';
  });

  runButton.addEventListener('click', runCheck);
  pauseButton.addEventListener('click', () => {
    paused = !paused;
    pauseButton.setAttribute('aria-pressed', String(paused));
    pauseButton.textContent = paused ? 'Resume runs' : 'Pause runs';
    runStatus.textContent = paused ? 'Runs are paused. No retrieval or delivery action can start.' : 'Runs are resumed. The next check will use the current bounded configuration.';
  });
  $('#review-button').addEventListener('click', () => reviewDialog.showModal());
  renderRows();
})();
