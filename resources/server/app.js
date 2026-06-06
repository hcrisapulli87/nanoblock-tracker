// @ts-nocheck
let catalogData = null
let missingData = null

function esc(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

async function api(path, options = {}) {
  const res = await fetch(path, options)
  if (res.status === 401) { showPin(); return null }
  return res.json()
}

function showPin() {
  document.getElementById('app').innerHTML = `
    <div class="pin-screen">
      <h1 class="pin-title">Nanoblock Tracker</h1>
      <p class="pin-sub">Enter your PIN to continue</p>
      <input class="pin-input" type="password" inputmode="numeric" maxlength="8" id="pin-input" placeholder="••••" autocomplete="off">
      <button class="pin-btn" onclick="submitPin()">Unlock</button>
      <p id="pin-error" class="pin-error"></p>
    </div>
  `
  setTimeout(() => document.getElementById('pin-input')?.focus(), 50)
}

async function submitPin() {
  const pin = document.getElementById('pin-input').value
  const res = await fetch('/api/auth', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ pin }),
  })
  if (res.ok) { catalogData = null; missingData = null; init() }
  else document.getElementById('pin-error').textContent = 'Incorrect PIN'
}

function showApp(view) {
  document.getElementById('app').innerHTML = `
    <div class="app-shell">
      <div class="content" id="content"></div>
      <nav class="bottom-nav">
        <button class="nav-btn" data-view="overview" onclick="switchView('overview')">
          <span class="nav-icon">📊</span><span class="nav-label">Overview</span>
        </button>
        <button class="nav-btn" data-view="catalog" onclick="switchView('catalog')">
          <span class="nav-icon">📋</span><span class="nav-label">Catalog</span>
        </button>
        <button class="nav-btn" data-view="missing" onclick="switchView('missing')">
          <span class="nav-icon">🛒</span><span class="nav-label">Missing</span>
        </button>
      </nav>
    </div>
  `
  switchView(view)
}

function setNav(view) {
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.toggle('active', b.dataset.view === view))
}

async function switchView(view) {
  localStorage.setItem('view', view)
  setNav(view)
  if (view === 'overview') await renderOverview()
  else if (view === 'catalog') await renderCatalog()
  else if (view === 'missing') await renderMissing()
}

async function renderOverview() {
  const el = document.getElementById('content')
  el.innerHTML = '<p class="loading">Loading…</p>'
  const d = await api('/api/stats')
  if (!d) return
  const pct = d.total ? Math.round(d.owned / d.total * 100) : 0
  el.innerHTML = `
    <h2 class="section-title">My Collection</h2>
    <div class="progress-card">
      <div class="prog-nums">${d.owned}<span class="prog-total"> / ${d.total}</span></div>
      <div class="prog-bar"><div class="prog-fill" style="width:${pct}%"></div></div>
      <div class="prog-pct">${pct}% complete</div>
    </div>
    <div class="cond-grid">
      <div class="cond-card"><div class="cond-count">${d.byCondition.sealed}</div><div class="cond-label">Sealed</div></div>
      <div class="cond-card"><div class="cond-count">${d.byCondition.built}</div><div class="cond-label">Built</div></div>
      <div class="cond-card"><div class="cond-count">${d.byCondition.loose}</div><div class="cond-label">Loose</div></div>
    </div>
  `
}

async function renderCatalog() {
  if (!catalogData) {
    document.getElementById('content').innerHTML = '<p class="loading">Loading…</p>'
    catalogData = await api('/api/catalog')
    if (!catalogData) return
  }
  renderList(catalogData, true)
}

async function renderMissing() {
  if (!missingData) {
    document.getElementById('content').innerHTML = '<p class="loading">Loading…</p>'
    missingData = await api('/api/missing')
    if (!missingData) return
  }
  renderList(missingData, false)
}

function renderList(data, showSearch) {
  const items = data.map(s => `
    <div class="set-item" data-name="${esc(s.pokemonName.toLowerCase())}" data-code="${esc(s.setCode.toLowerCase())}">
      <div>
        <div class="set-code">${esc(s.setCode)}</div>
        <div class="set-name">${esc(s.pokemonName)}</div>
      </div>
      ${s.owned ? `<span class="badge badge-${esc(s.condition)}">${esc(s.condition)}</span>` : '<span class="badge badge-missing">missing</span>'}
    </div>
  `).join('')
  document.getElementById('content').innerHTML = `
    <div>
      ${showSearch ? '<input class="search-input" id="search" placeholder="Search Pokémon…" oninput="filterList()" autocomplete="off">' : ''}
      <div id="list-items">${items}</div>
    </div>
  `
}

function filterList() {
  const q = document.getElementById('search').value.toLowerCase()
  document.querySelectorAll('.set-item').forEach(el => {
    el.style.display = (el.dataset.name.includes(q) || el.dataset.code.includes(q)) ? '' : 'none'
  })
}

async function init() {
  const d = await api('/api/stats')
  if (!d) return
  showApp(localStorage.getItem('view') || 'overview')
}

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/service-worker.js').catch(() => {})
}

init()
