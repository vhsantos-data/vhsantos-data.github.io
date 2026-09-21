/* ============================================================
   FUN.JS — modos visuais e ações divertidas
   Registra comandos em window.VH_FUN para o Ctrl+K consumir.
   ============================================================ */
(function () {
  'use strict';

  var LS = 'vh:fun';
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var body = document.body;

  /* ---------- catálogo ---------- */
  var THEMES = [
    { id: 'default', cls: '',        label: 'Tema: Verde (padrão)' },
    { id: 'amber',   cls: 't-amber', label: 'Tema: Âmbar' },
    { id: 'ice',     cls: 't-ice',   label: 'Tema: Azul frio' },
    { id: 'vapor',   cls: 't-vapor', label: 'Tema: Magenta' },
    { id: 'paper',   cls: 't-paper', label: 'Tema: Papel (claro)' }
  ];

  var MODES = [
    { id: 'crt',    cls: 'crt',    label: 'Modo CRT intenso' },
    { id: 'glitch', cls: 'glitch', label: 'Modo glitch' },
    { id: 'zen',    cls: 'zen',    label: 'Modo zen (leitura)' },
    { id: 'invert', cls: 'invert', label: 'Inverter cores' },
    { id: 'wire',   cls: 'wire',   label: 'Wireframe (raio-x)' },
    { id: 'float',  cls: 'float',  label: 'Sem gravidade' }
  ];

  /* ---------- estado ---------- */
  var state = { theme: 'default', modes: [], matrix: false, trail: false, stats: false };
  try {
    var saved = JSON.parse(localStorage.getItem(LS) || '{}');
    if (saved && typeof saved === 'object') {
      state.theme = saved.theme || 'default';
      state.modes = Array.isArray(saved.modes) ? saved.modes : [];
      state.matrix = !!saved.matrix;
      state.trail = !!saved.trail;
      state.stats = !!saved.stats;
    }
  } catch (e) {}

  function save() {
    try { localStorage.setItem(LS, JSON.stringify(state)); } catch (e) {}
  }

  function toast(msg) {
    if (window.__toast) return window.__toast(msg);
    console.log('[fun]', msg);
  }

  /* ---------- tema ---------- */
  function applyTheme(id) {
    THEMES.forEach(function (t) { if (t.cls) body.classList.remove(t.cls); });
    var found = THEMES.filter(function (t) { return t.id === id; })[0] || THEMES[0];
    if (found.cls) body.classList.add(found.cls);
    state.theme = found.id;
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) {
      meta.setAttribute('content',
        getComputedStyle(body).getPropertyValue('--bg').trim() || '#08100c');
    }
    save();
    renderBar();
  }

  function cycleTheme() {
    var i = 0;
    THEMES.forEach(function (t, k) { if (t.id === state.theme) i = k; });
    var next = THEMES[(i + 1) % THEMES.length];
    applyTheme(next.id);
    toast(next.label);
  }

  /* ---------- modos ---------- */
  function hasMode(id) { return state.modes.indexOf(id) > -1; }

  function setMode(id, on) {
    var m = MODES.filter(function (x) { return x.id === id; })[0];
    if (!m) return;
    body.classList.toggle(m.cls, on);
    var i = state.modes.indexOf(id);
    if (on && i === -1) state.modes.push(id);
    if (!on && i > -1) state.modes.splice(i, 1);
    save();
    renderBar();
  }

  function toggleMode(id) {
    var on = !hasMode(id);
    setMode(id, on);
    var m = MODES.filter(function (x) { return x.id === id; })[0];
    toast(m.label + (on ? ' ativado' : ' desativado'));
    return on;
  }

  function resetAll() {
    stopMatrix();
    stopTrail();
    setStats(false);
    MODES.forEach(function (m) { body.classList.remove(m.cls); });
    applyTheme('default');
    state.modes.length = 0;
    state.matrix = false;
    state.trail = false;
    state.stats = false;
    save();
    renderBar();
    toast('Tudo restaurado ao padrão');
  }

  /* ---------- MATRIX RAIN ---------- */
  var mx = { canvas: null, ctx: null, raf: 0, cols: [], size: 15, last: 0 };

  function startMatrix() {
    if (reduced || mx.canvas) return;

    var c = document.createElement('canvas');
    c.id = 'matrix';
    document.body.insertBefore(c, document.body.firstChild);
    mx.canvas = c;
    mx.ctx = c.getContext('2d');

    function resize() {
      c.width = window.innerWidth;
      c.height = window.innerHeight;
      var n = Math.ceil(c.width / mx.size);
      mx.cols = [];
      for (var i = 0; i < n; i++) {
        mx.cols.push(Math.floor(Math.random() * -60));
      }
    }
    resize();
    mx._resize = resize;
    window.addEventListener('resize', resize);

    var GLYPHS = 'アイウエオカキクケコサシスセソタチツテトナニヌネノ0123456789｢｣<>/\\=+*-';

    function draw(ts) {
      mx.raf = requestAnimationFrame(draw);
      if (ts - mx.last < 55) return;
      mx.last = ts;

      var ctx = mx.ctx;
      var accent = getComputedStyle(body).getPropertyValue('--accent').trim() || '#00ff88';
      var bg = getComputedStyle(body).getPropertyValue('--bg').trim() || '#08100c';

      ctx.fillStyle = bg;
      ctx.globalAlpha = 0.16;
      ctx.fillRect(0, 0, c.width, c.height);
      ctx.globalAlpha = 1;

      ctx.fillStyle = accent;
      ctx.font = (mx.size - 2) + 'px JetBrains Mono, monospace';

      for (var i = 0; i < mx.cols.length; i++) {
        var y = mx.cols[i];
        var ch = GLYPHS.charAt(Math.floor(Math.random() * GLYPHS.length));
        ctx.fillText(ch, i * mx.size, y * mx.size);
        if (y * mx.size > c.height && Math.random() > 0.975) mx.cols[i] = 0;
        else mx.cols[i] = y + 1;
      }
    }
    mx.raf = requestAnimationFrame(draw);
    requestAnimationFrame(function () { c.classList.add('on'); });

    state.matrix = true;
    save();
    renderBar();
  }

  function stopMatrix() {
    if (!mx.canvas) return;
    cancelAnimationFrame(mx.raf);
    if (mx._resize) window.removeEventListener('resize', mx._resize);
    mx.canvas.classList.remove('on');
    var el = mx.canvas;
    el.id = '';
    setTimeout(function () { if (el.parentNode) el.parentNode.removeChild(el); }, 700);
    mx.canvas = null;
    mx.ctx = null;
    state.matrix = false;
    save();
    renderBar();
  }

  function toggleMatrix() {
    if (reduced) { toast('Matrix indisponível com movimento reduzido'); return false; }
    if (mx.canvas) { stopMatrix(); toast('Matrix desligado'); return false; }
    startMatrix(); toast('Matrix ligado'); return true;
  }

  /* ---------- CURSOR TRAIL ---------- */
  var trail = { on: false, handler: null, last: 0 };

  function startTrail() {
    if (reduced || trail.on) return;
    trail.handler = function (e) {
      var now = Date.now();
      if (now - trail.last < 28) return;
      trail.last = now;

      var d = document.createElement('div');
      d.className = 'trail-dot';
      d.style.left = e.clientX + 'px';
      d.style.top = e.clientY + 'px';
      document.body.appendChild(d);

      requestAnimationFrame(function () {
        d.style.opacity = '0';
        d.style.transform = 'translate(-50%,-50%) scale(3.4)';
      });
      setTimeout(function () { if (d.parentNode) d.parentNode.removeChild(d); }, 640);
    };
    window.addEventListener('mousemove', trail.handler, { passive: true });
    trail.on = true;
    state.trail = true;
    save();
    renderBar();
  }

  function stopTrail() {
    if (!trail.on) return;
    window.removeEventListener('mousemove', trail.handler);
    trail.on = false;
    state.trail = false;
    save();
    renderBar();
  }

  function toggleTrail() {
    if (reduced) { toast('Rastro indisponível com movimento reduzido'); return false; }
    if (trail.on) { stopTrail(); toast('Rastro do cursor desligado'); return false; }
    startTrail(); toast('Rastro do cursor ligado'); return true;
  }

  /* ---------- STATS OVERLAY ---------- */
  var st = { el: null, raf: 0, frames: 0, t0: 0, fps: 0, timer: 0 };

  function buildStats() {
    var d = document.createElement('div');
    d.id = 'stats';
    d.innerHTML =
      '<div class="st-row"><span>fps</span><b data-k="fps">—</b></div>' +
      '<div class="st-row"><span>viewport</span><b data-k="vp">—</b></div>' +
      '<div class="st-row"><span>scroll</span><b data-k="sc">—</b></div>' +
      '<div class="st-row"><span>nós DOM</span><b data-k="dom">—</b></div>' +
      '<div class="st-row"><span>idioma</span><b data-k="lang">—</b></div>' +
      '<div class="st-row"><span>tema</span><b data-k="th">—</b></div>';
    document.body.appendChild(d);
    return d;
  }

  function setStats(on) {
    if (on && (!st.el || !st.el.parentNode)) st.el = buildStats();
    if (!st.el) { state.stats = false; save(); renderBar(); return; }
    cancelAnimationFrame(st.raf);
    clearInterval(st.timer);
    st.el.classList.toggle('on', on);
    state.stats = on;
    save();
    renderBar();

    if (on) {
      st.t0 = performance.now();
      st.frames = 0;

      function loop(ts) {
        st.raf = requestAnimationFrame(loop);
        st.frames++;
        if (ts - st.t0 >= 500) {
          st.fps = Math.round((st.frames * 1000) / (ts - st.t0));
          st.frames = 0;
          st.t0 = ts;
        }
      }
      st.raf = requestAnimationFrame(loop);

      st.timer = setInterval(function () {
        if (!st.el || !st.el.parentNode) { clearInterval(st.timer); return; }
        var q = function (k) { return st.el.querySelector('[data-k="' + k + '"]'); };
        var h = document.documentElement.scrollHeight - window.innerHeight;
        var pct = h > 0 ? Math.round((window.scrollY / h) * 100) : 0;
        q('fps').textContent = st.fps || '—';
        q('vp').textContent = window.innerWidth + '×' + window.innerHeight;
        q('sc').textContent = pct + '%';
        q('dom').textContent = document.getElementsByTagName('*').length;
        q('lang').textContent = (window.VH_LANG || 'pt').toUpperCase();
        q('th').textContent = state.theme;
      }, 400);
    }
  }

  function toggleStats() {
    var on = !state.stats;
    setStats(on);
    toast('Painel de stats ' + (on ? 'ligado' : 'desligado'));
    return on;
  }

  /* ---------- KONAMI: chuva de partículas ---------- */
  function confetti() {
    if (reduced) return;
    var accent = getComputedStyle(body).getPropertyValue('--accent').trim() || '#00ff88';
    for (var i = 0; i < 40; i++) {
      (function (n) {
        setTimeout(function () {
          var p = document.createElement('div');
          p.style.cssText = [
            'position:fixed', 'top:-12px', 'width:3px', 'height:12px',
            'background:' + accent, 'z-index:9992', 'pointer-events:none',
            'left:' + (Math.random() * 100) + 'vw',
            'opacity:' + (0.35 + Math.random() * 0.5),
            'transition:transform 2.4s linear, opacity 2.4s linear'
          ].join(';');
          document.body.appendChild(p);
          requestAnimationFrame(function () {
            p.style.transform = 'translateY(' + (window.innerHeight + 40) + 'px) rotate(' +
              (Math.random() * 540 - 270) + 'deg)';
            p.style.opacity = '0';
          });
          setTimeout(function () { if (p.parentNode) p.parentNode.removeChild(p); }, 2500);
        }, n * 28);
      })(i);
    }
  }

  /* ---------- FUN BAR ---------- */
  var bar = null;

  function renderBar() {
    if (!bar) {
      bar = document.createElement('div');
      bar.id = 'funbar';
      document.body.appendChild(bar);
    }
    var items = [];

    if (state.theme !== 'default') {
      var t = THEMES.filter(function (x) { return x.id === state.theme; })[0];
      items.push({ label: t.label.replace('Tema: ', ''), off: function () { applyTheme('default'); } });
    }
    state.modes.forEach(function (id) {
      var m = MODES.filter(function (x) { return x.id === id; })[0];
      if (m) items.push({ label: m.label.replace('Modo ', ''), off: function () { setMode(id, false); } });
    });
    if (state.matrix) items.push({ label: 'matrix', off: stopMatrix });
    if (state.trail)  items.push({ label: 'rastro', off: stopTrail });
    if (state.stats)  items.push({ label: 'stats', off: function () { setStats(false); } });

    bar.innerHTML = '';
    bar.classList.toggle('on', items.length > 0);

    items.forEach(function (it) {
      var b = document.createElement('button');
      b.className = 'funchip';
      b.type = 'button';
      b.textContent = it.label;
      b.title = 'Desativar';
      b.addEventListener('click', it.off);
      bar.appendChild(b);
    });

    if (items.length > 0) {
      var all = document.createElement('button');
      all.className = 'funchip';
      all.type = 'button';
      all.textContent = 'limpar tudo';
      all.addEventListener('click', resetAll);
      bar.appendChild(all);
    }
  }

  /* ---------- API pública para o Ctrl+K ---------- */
 
  window.VH_FUN = {
    themes: THEMES,
    modes: MODES,
    state: state,
    applyTheme: applyTheme,
    cycleTheme: cycleTheme,
    toggleMode: toggleMode,
    hasMode: hasMode,
    toggleMatrix: toggleMatrix,
    toggleTrail: toggleTrail,
    toggleStats: toggleStats,
    confetti: confetti,
    reset: resetAll,

    /* itens injetados na command palette */
    items: function () {
      var out = [];

      THEMES.forEach(function (t) {
        out.push({
          n: t.label,
          k: 'tema',
          fun: 1,
          active: function () { return state.theme === t.id; },
          run: function () { applyTheme(t.id); toast(t.label); }
        });
      });

      MODES.forEach(function (m) {
        out.push({
          n: m.label,
          k: 'modo',
          fun: 1,
          active: function () { return hasMode(m.id); },
          run: function () { toggleMode(m.id); }
        });
      });

      out.push({
        n: 'Matrix rain',
        k: 'efeito', fun: 1,
        active: function () { return state.matrix; },
        run: toggleMatrix
      });
      out.push({
        n: 'Rastro do cursor',
        k: 'efeito', fun: 1,
        active: function () { return state.trail; },
        run: toggleTrail
      });
      out.push({
        n: 'Painel de stats (fps, DOM)',
        k: 'debug', fun: 1,
        active: function () { return state.stats; },
        run: toggleStats
      });
      out.push({
        n: 'Alternar tema (ciclar)',
        k: 'tema', fun: 1,
        run: cycleTheme
      });
      out.push({
        n: 'Chuva de partículas',
        k: 'efeito', fun: 1,
        run: function () { confetti(); toast('Enjoy'); }
      });
      out.push({
        n: 'Restaurar tudo ao padrão',
        k: 'reset', fun: 1,
        run: resetAll
      });

      return out;
    }
  };

  /* ---------- restaura estado salvo ---------- */
  applyTheme(state.theme);
  state.modes.slice().forEach(function (id) { setMode(id, true); });
  if (state.matrix) startMatrix();
  if (state.trail) startTrail();
  if (state.stats) setStats(true);
  renderBar();

  /* ---------- atalhos diretos ---------- */
  document.addEventListener('keydown', function (e) {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    var tag = (e.target.tagName || '').toLowerCase();
    if (tag === 'input' || tag === 'textarea' || tag === 'select') return;
    if (e.target.isContentEditable) return;

    /* Shift + tecla */
    if (!e.shiftKey) return;
    var k = e.key.toLowerCase();

    if (k === 't') { e.preventDefault(); cycleTheme(); }
    else if (k === 'm') { e.preventDefault(); toggleMatrix(); }
    else if (k === 'z') { e.preventDefault(); toggleMode('zen'); }
    else if (k === 'g') { e.preventDefault(); toggleMode('glitch'); }
    else if (k === 'd') { e.preventDefault(); toggleStats(); }
    else if (k === 'x') { e.preventDefault(); resetAll(); }
  });

})();