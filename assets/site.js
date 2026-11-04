/* Marvel Primestone : comportements des pages éditoriales (sans dépendance).
   - Images du wiki : chargées par lots pour les éléments [data-wiki], cache local, liste blanche du domaine d'images.
   - Filtres de l'encyclopédie, recherche avec autocomplétion (index : search.json). */
(function () {
  'use strict';
  var BASE = document.documentElement.dataset.base || '';
  var OK_IMG = /^https:\/\/static\.wikia\.nocookie\.net\//;
  var store = {
    get: function (k) { try { return JSON.parse(localStorage.getItem(k) || 'null'); } catch (e) { return null; } },
    set: function (k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* stockage plein ou bloqué */ } }
  };

  /* ---------- images du wiki ---------- */
  function wikiImages() {
    var els = [].slice.call(document.querySelectorAll('[data-wiki]'));
    if (!els.length) return;
    var cache = store.get('ps_wiki') || {};
    var todo = [];
    els.forEach(function (el) {
      var t = el.getAttribute('data-wiki'), u = cache[t];
      if (u && OK_IMG.test(u)) apply(el, u); else if (u !== '') todo.push(t);
    });
    todo = todo.filter(function (t, i) { return todo.indexOf(t) === i; });
    for (var i = 0; i < todo.length; i += 40) fetchBatch(todo.slice(i, i + 40));
    function fetchBatch(titles) {
      var url = 'https://marvel.fandom.com/api.php?action=query&format=json&origin=*&redirects=1&prop=pageimages&piprop=thumbnail&pithumbsize=480&titles=' + encodeURIComponent(titles.join('|'));
      fetch(url).then(function (r) { return r.json(); }).then(function (d) {
        var q = d.query || {}, map = {};
        (q.normalized || []).forEach(function (n) { map[n.to] = n.from; });
        (q.redirects || []).forEach(function (n) { map[n.to] = map[n.from] || n.from; });
        Object.keys(q.pages || {}).forEach(function (k) {
          var p = q.pages[k], from = map[p.title] || p.title, src = p.thumbnail && p.thumbnail.source;
          cache[from] = src && OK_IMG.test(src) ? src : '';
        });
        titles.forEach(function (t) { if (!(t in cache)) cache[t] = ''; });
        store.set('ps_wiki', cache);
        els.forEach(function (el) { var u = cache[el.getAttribute('data-wiki')]; if (u) apply(el, u); });
      }).catch(function () { /* wiki indisponible : on garde l'initiale */ });
    }
    function apply(el, u) { el.style.setProperty('--img', 'url("' + u.replace(/"/g, '') + '")'); el.classList.remove('none'); el.textContent = ''; }
  }

  /* ---------- filtres (encyclopédie, archive) ---------- */
  function filters() {
    var list = document.querySelector('[data-filter-list]');
    if (!list) return;
    var items = [].slice.call(list.children), state = { cat: '', rel: '', q: '' };
    var q = document.querySelector('[data-filter-q]'), count = document.querySelector('[data-filter-count]');
    document.querySelectorAll('[data-filter]').forEach(function (b) {
      b.addEventListener('click', function () {
        var k = b.getAttribute('data-filter'), v = b.getAttribute('data-value');
        state[k] = state[k] === v ? '' : v;
        document.querySelectorAll('[data-filter="' + k + '"]').forEach(function (x) { x.setAttribute('aria-pressed', String(x.getAttribute('data-value') === state[k])); });
        run();
      });
    });
    if (q) q.addEventListener('input', function () { state.q = norm(q.value); run(); });
    function run() {
      var n = 0;
      items.forEach(function (it) {
        var show = (!state.cat || it.dataset.cat === state.cat) && (!state.rel || it.dataset.rel === state.rel) && (!state.q || it.dataset.text.indexOf(state.q) >= 0);
        it.hidden = !show; if (show) n++;
      });
      if (count) count.textContent = n + ' fiche' + (n > 1 ? 's' : '');
    }
    run();
  }

  /* ---------- recherche ---------- */
  function norm(s) { return String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[’']/g, ' '); }
  var INDEX = null;
  function loadIndex() { return INDEX ? Promise.resolve(INDEX) : fetch(BASE + 'search.json').then(function (r) { return r.json(); }).then(function (d) { INDEX = d; return d; }); }
  function score(e, q) {
    var n = norm(e.n), a = norm(e.a || ''), t = norm(e.s || '') + ' ' + norm(e.k || '');
    if (n === q || a === q) return 100;
    if (n.indexOf(q) === 0 || a.indexOf(q) === 0) return 80;
    if (n.indexOf(q) >= 0 || a.indexOf(q) >= 0) return 60;
    if (t.indexOf(q) >= 0) return 30;
    return 0;
  }
  function search(q, type) {
    q = norm(q).trim(); if (!q) return [];
    return INDEX.filter(function (e) { return !type || e.t === type; })
      .map(function (e) { return [score(e, q), e]; }).filter(function (x) { return x[0] > 0; })
      .sort(function (a, b) { return b[0] - a[0] || a[1].n.localeCompare(b[1].n); }).map(function (x) { return x[1]; });
  }
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function autocomplete() {
    var inp = document.querySelector('.qbox input'), dl = document.getElementById('qlist');
    if (!inp || !dl) return;
    inp.addEventListener('input', function () {
      if (inp.value.length < 2) return;
      loadIndex().then(function () { dl.innerHTML = search(inp.value).slice(0, 8).map(function (e) { return '<option value="' + esc(e.n) + '">' + esc(e.k || '') + '</option>'; }).join(''); });
    });
  }
  function searchPage() {
    var box = document.getElementById('results');
    if (!box) return;
    var params = new URLSearchParams(location.search), q = params.get('q') || '', type = '';
    var inp = document.getElementById('q2'); inp.value = q;
    document.querySelectorAll('[data-type]').forEach(function (b) {
      b.addEventListener('click', function () { type = type === b.dataset.type ? '' : b.dataset.type; document.querySelectorAll('[data-type]').forEach(function (x) { x.setAttribute('aria-pressed', String(x.dataset.type === type)); }); run(); });
    });
    inp.addEventListener('input', run);
    function run() {
      loadIndex().then(function () {
        var r = search(inp.value, type).slice(0, 60);
        document.getElementById('rcount').textContent = inp.value.trim() ? r.length + ' résultat' + (r.length > 1 ? 's' : '') : '';
        box.innerHTML = r.map(function (e) {
          return '<a class="card cBs" href="' + BASE + esc(e.u) + '"><span class="av"></span><span><h3>' + esc(e.n) + '</h3><p>' + esc(e.k) + (e.a ? ' · ' + esc(e.a) : '') + (e.s ? ' · ' + esc(e.s) : '') + '</p></span></a>';
        }).join('');
      });
    }
    run();
  }
  document.addEventListener('DOMContentLoaded', function () { wikiImages(); filters(); autocomplete(); searchPage(); });
})();
