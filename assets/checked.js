/* halalsnap.org "Just checked" feed (#827). Generated into /assets/checked.js by
   halalsnap scripts/site/build-product-pages.js; edit it there.
   Polls public_feed() with the publishable key every 30 s while the tab is
   visible. The server returns at most 5 rows; nothing here can ask for more.
   Motion: fades and short eases only, none with prefers-reduced-motion (#814). */
(function () {
  'use strict';
  var root = document.getElementById('feed-app') || document.getElementById('just-checked');
  if (!root || !window.fetch || !root.getAttribute('data-api')) return;
  var STRIP = root.id === 'just-checked';
  var API = root.getAttribute('data-api').replace(/\/$/, '');
  var KEY = root.getAttribute('data-key');
  var N = STRIP ? 3 : 5;
  var POLL_MS = 30000;
  var feed = root.querySelector('#feed');
  var V = { halal: 'Halal', likely_halal: 'Likely halal', doubtful: 'Doubtful', haram: 'Not halal' };
  var SCHOOL = { shafi: 'Shafi\'i', hanafi: 'Hanafi', maliki: 'Maliki', hanbali: 'Hanbali', general: 'General' };
  var FIX = { TW: 'Taiwan', HK: 'Hong Kong', MO: 'Macao', PS: 'Palestine', ALL: 'All countries' };
  var dn = null;
  try { dn = new Intl.DisplayNames(['en'], { type: 'region' }); } catch (e) { /* old browser */ }
  function cname(cc) { if (FIX[cc]) return FIX[cc]; try { return (dn && dn.of(cc)) || cc; } catch (e) { return cc; } }
  function inC(cc) { var n = cname(cc); return /^(United|Netherlands|Philippines|Maldives|Czech|Gambia|Bahamas)/.test(n) ? 'in the ' + n : 'in ' + n; }
  function el(tag, cls, text) { var e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }

  var params = new URLSearchParams(location.search);
  var country = (params.get('country') || '').toUpperCase();
  var pickedCountry = /^[A-Z]{2}$/.test(country);
  if (!pickedCountry) country = 'ALL';
  var verdict = (params.get('verdict') || 'all').toLowerCase();
  if (!V[verdict]) verdict = 'all';
  if (STRIP) { country = 'ALL'; verdict = 'all'; pickedCountry = true; }

  var pages = {}, brands = {}, totals = {}, timer = null, failures = 0, first = true;

  function ago(iso) {
    var m = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
    if (!(m >= 0)) return '';
    if (m < 1) return 'just now';
    if (m < 60) return m + ' min ago';
    var h = Math.round(m / 60);
    if (h < 24) return h + ' h ago';
    var d = Math.round(h / 24);
    if (d < 30) return d + (d === 1 ? ' day ago' : ' days ago');
    return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  }
  function tickTimes() {
    var ts = root.querySelectorAll('[data-t]');
    for (var i = 0; i < ts.length; i++) ts[i].textContent = ago(ts[i].getAttribute('data-t'));
  }

  function item(it) {
    var li = el('li', 'item');
    li.setAttribute('data-id', it.id);
    li.setAttribute('data-at', it.checked_at);
    li.appendChild(el('div', 'cc', it.country)).setAttribute('aria-hidden', 'true');
    var main = el('div', 'it-main');
    var pn = el('div', 'pn');
    var href = pages[it.id];
    if (href) { var a = el('a', null, it.name); a.href = href; pn.appendChild(a); } else pn.textContent = it.name;
    main.appendChild(pn);
    main.appendChild(el('div', 'pm', it.brand + ' · ' + cname(it.country) + ' · ' + (SCHOOL[it.school] || 'General')));
    li.appendChild(main);
    var vd = el('div', 'vd vd-' + it.verdict);
    vd.appendChild(el('span', 'd')).setAttribute('aria-hidden', 'true');
    vd.appendChild(el('span', 'w', V[it.verdict] || it.verdict));
    var t = el('small', null, ago(it.checked_at));
    t.setAttribute('data-t', it.checked_at);
    vd.appendChild(t);
    li.appendChild(vd);
    return li;
  }

  function leave(li) {
    li.removeAttribute('data-id');
    li.classList.add('leave');
    setTimeout(function () { if (li.parentNode) li.parentNode.removeChild(li); }, 320);
  }

  function renderItems(items, full) {
    var empty = feed.querySelector('.empty');
    if (empty) feed.removeChild(empty);
    var lis = feed.querySelectorAll('li.item');
    var have = {};
    for (var i = 0; i < lis.length; i++) {
      var li = lis[i], id = li.getAttribute('data-id');
      if (li.classList.contains('leave')) continue;
      var keep = !full && id && items.some(function (x) { return x.id === id && x.checked_at === li.getAttribute('data-at'); });
      if (keep) have[id] = li;
      else if (full) { if (li.parentNode) li.parentNode.removeChild(li); }
      else leave(li);
    }
    var firstLeaving = feed.querySelector('li.leave');
    items.forEach(function (it, n) {
      var li = have[it.id];
      if (!li) {
        li = item(it);
        li.classList.add('enter');
        if (full) li.style.animationDelay = (n * 40) + 'ms';
        else li.classList.add('fresh');
      }
      feed.insertBefore(li, firstLeaving);
      if (li.classList.contains('fresh')) setTimeout(function (x) { return function () { x.classList.remove('fresh'); }; }(li), 1800);
    });
    if (!items.length) {
      feed.appendChild(el('li', 'empty', verdict === 'all'
        ? 'Nothing checked here yet. Try another country.'
        : 'No ' + V[verdict].toLowerCase() + ' reads here yet. Try another filter.'));
    }
  }

  function setStat(id, n) {
    var b = document.getElementById(id);
    if (!b || n == null) return;
    var txt = Number(n).toLocaleString('en');
    if (b.textContent === txt) return;
    b.textContent = txt;
    if (!first) { b.classList.add('bump'); setTimeout(function () { b.classList.remove('bump'); }, 900); }
  }

  function totalFor(cc, v) {
    if (cc === 'ALL') { var s = 0; for (var k in totals) s += totals[k][v] || 0; return s; }
    return (totals[cc] && totals[cc][v]) || 0;
  }

  function renderChrome(data) {
    if (STRIP) return;
    setStat('sProducts', data.products);
    setStat('sCountries', data.countries);
    setStat('s24', data.checked_24h);
    var n = totalFor(country, verdict);
    var what = verdict === 'all' ? 'products' : V[verdict].toLowerCase() + ' products';
    document.getElementById('gateTitle').textContent = 'See all ' + n.toLocaleString('en') + ' ' + what + ' checked ' + (country === 'ALL' ? 'in ' + Object.keys(totals).length + ' countries' : inC(country));
    var top = brands[country] || [];
    var list = document.getElementById('toplist');
    list.textContent = '';
    document.getElementById('topFor').textContent = (country === 'ALL' ? 'All countries' : cname(country)) + ', by products checked';
    top.forEach(function (b) {
      var li = el('li');
      if (b[2]) { var a = el('a', null, b[0]); a.href = b[2]; li.appendChild(a); } else li.appendChild(el('span', null, b[0]));
      li.appendChild(el('span', 'n', String(b[1])));
      list.appendChild(li);
    });
    if (!top.length) list.appendChild(el('li', 'mini', 'Not enough checks here yet.'));
    renderChips();
  }

  function chip(label, pressed, onClick, dot) {
    var b = el('button', 'fchip');
    b.type = 'button';
    b.setAttribute('aria-pressed', pressed ? 'true' : 'false');
    if (dot) b.appendChild(el('span', 'd d-' + dot)).setAttribute('aria-hidden', 'true');
    b.appendChild(document.createTextNode(label));
    b.addEventListener('click', onClick);
    return b;
  }
  function renderChips() {
    var cs = document.getElementById('countries');
    var vs = document.getElementById('verdicts');
    if (!cs || !vs) return;
    var ranked = Object.keys(totals).sort(function (a, b) { return totals[b].all - totals[a].all || a.localeCompare(b); });
    var shown = ranked.slice(0, 7);
    if (country !== 'ALL' && shown.indexOf(country) < 0) shown.push(country);
    cs.textContent = '';
    cs.appendChild(chip('All countries', country === 'ALL', function () { setFilter('ALL', verdict); }));
    shown.forEach(function (cc) { cs.appendChild(chip(cname(cc), country === cc, function () { setFilter(cc, verdict); })); });
    var rest = ranked.filter(function (cc) { return shown.indexOf(cc) < 0; }).sort(function (a, b) { return cname(a).localeCompare(cname(b)); });
    if (rest.length) {
      var sel = el('select', 'fselect');
      sel.setAttribute('aria-label', 'More countries');
      sel.appendChild(el('option', null, 'More countries'));
      rest.forEach(function (cc) { var o = el('option', null, cname(cc) + ' (' + totals[cc].all + ')'); o.value = cc; sel.appendChild(o); });
      sel.addEventListener('change', function () { if (sel.value) setFilter(sel.value, verdict); });
      cs.appendChild(sel);
    }
    vs.textContent = '';
    vs.appendChild(chip('All', verdict === 'all', function () { setFilter(country, 'all'); }));
    ['halal', 'likely_halal', 'doubtful', 'haram'].forEach(function (v) {
      vs.appendChild(chip(V[v], verdict === v, function () { setFilter(country, v); }, v));
    });
  }

  function setFilter(cc, v) {
    if (cc === country && v === verdict) return;
    country = cc; verdict = v;
    try {
      var q = new URLSearchParams();
      if (country !== 'ALL') q.set('country', country);
      if (verdict !== 'all') q.set('verdict', verdict);
      history.replaceState(null, '', location.pathname + (q.toString() ? '?' + q : ''));
    } catch (e) { /* file:// or sandboxed */ }
    renderChips();
    poll(true);
  }

  function call() {
    var headers = { apikey: KEY, 'Content-Type': 'application/json' };
    if (/^eyJ/.test(KEY)) headers.Authorization = 'Bearer ' + KEY;
    return fetch(API + '/rest/v1/rpc/public_feed', {
      method: 'POST', headers: headers,
      body: JSON.stringify({ p_country: country === 'ALL' ? null : country, p_verdict: verdict === 'all' ? null : verdict }),
    }).then(function (r) { if (!r.ok) throw new Error('feed ' + r.status); return r.json(); });
  }

  function schedule(ms) { clearTimeout(timer); timer = setTimeout(function () { poll(false); }, ms); }

  function poll(full) {
    if (document.hidden && !full) { schedule(POLL_MS); return; }
    var asked = country + '|' + verdict;
    feed.setAttribute('aria-busy', 'true');
    call().then(function (data) {
      if (asked !== country + '|' + verdict || !data || data.error) return;
      failures = 0;
      totals = data.totals || {};
      // First visit with no country picked: start at the visitor's own country when it has enough checks.
      if (first && !pickedCountry) {
        var m = (navigator.language || '').match(/-([A-Z]{2})$/i);
        var mine = m && m[1].toUpperCase();
        pickedCountry = true;
        if (mine && totals[mine] && totals[mine].all >= 5) { first = false; setFilter(mine, verdict); return; }
      }
      renderItems((data.items || []).slice(0, N), full || first);
      renderChrome(data);
      first = false;
    }).catch(function () {
      failures += 1;
    }).then(function () {
      feed.setAttribute('aria-busy', 'false');
      schedule(failures ? Math.min(POLL_MS * Math.pow(2, failures), 300000) : POLL_MS);
    });
  }

  function loadPages() {
    return fetch(root.getAttribute('data-pages') || '/products/pages.json').then(function (r) { return r.ok ? r.json() : {}; })
      .then(function (j) { pages = (j && j.pages) || {}; brands = (j && j.brands) || {}; })
      .catch(function () { /* links are a nicety */ });
  }

  document.addEventListener('visibilitychange', function () { if (!document.hidden) poll(false); });
  setInterval(tickTimes, 30000);
  tickTimes();
  loadPages().then(function () { poll(true); });
})();
