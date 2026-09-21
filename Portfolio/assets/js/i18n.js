/* ============================================================
   I18N — tradução PT / EN / ES sem tocar no HTML
   Vitor Hugo Santana · portfolio

   Estratégia: indexa blocos "folha" (elementos sem filhos de
   bloco) pelo textContent normalizado. Substitui innerHTML pelo
   valor do dicionário, que pode conter tags inline (<em>, <b>).
   Chave ausente = texto preservado. Nunca quebra.
   ============================================================ */
(function () {
  'use strict';

  var LS_KEY = 'vh:lang';
  var LANGS = { pt: 'Português', en: 'English', es: 'Español' };

  /* Não entra aqui: código, atalhos e SVG */
  var SKIP = { PRE: 1, CODE: 1, KBD: 1, SCRIPT: 1, STYLE: 1, NOSCRIPT: 1, SVG: 1, TEXTAREA: 1 };

  /* Se tiver descendente destes, não é bloco folha */
  var BLOCK = {
    P: 1, DIV: 1, UL: 1, OL: 1, LI: 1, SECTION: 1, HEADER: 1, FOOTER: 1,
    NAV: 1, FORM: 1, MAIN: 1, ASIDE: 1, ARTICLE: 1, TABLE: 1, DL: 1,
    H1: 1, H2: 1, H3: 1, H4: 1, H5: 1, H6: 1, BLOCKQUOTE: 1
  };

  /* ---------- normalização de chave ---------- */
  function norm(s) {
    return (s || '')
      .replace(/\u00a0/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  /* chave derivada do innerHTML: <br> conta como espaço,
     tags inline são removidas, entidades são decodificadas */
  var _tmp = document.createElement('div');
  function keyOf(el) {
    _tmp.innerHTML = (el.innerHTML || '').replace(/<br\s*\/?>/gi, ' ');
    return norm(_tmp.textContent);
  }

  /* ---------- coleta de nós traduzíveis ---------- */
  function isLeafBlock(el) {
    for (var i = 0; i < el.children.length; i++) {
      if (BLOCK[el.children[i].tagName]) return false;
    }
    return true;
  }

  function collect() {
    var all = document.querySelectorAll(
      'h1,h2,h3,h4,p,li,a,button,span,div,blockquote,cite,dt,dd,label,option,th,td'
    );

    /* 1ª passada: candidatos */
    var cand = [];
    for (var i = 0; i < all.length; i++) {
      var el = all[i];
      if (SKIP[el.tagName]) continue;
      if (el.closest('pre, code, svg, #cmdk, #langbar')) continue;
      if (!isLeafBlock(el)) continue;
      if (el.hasAttribute('data-year')) continue;

      var key = keyOf(el);
      if (!key || key.length < 2) continue;
      if (/^[\d\s\/%.,:—–→↑↓↵·-]+$/.test(key)) continue;
      cand.push({ el: el, key: key });
    }

    /* 2ª passada: descarta quem contém outro candidato
       (evita pai sobrescrever filho e criar nó órfão) */
    var out = [];
    for (var a = 0; a < cand.length; a++) {
      var nested = false;
      for (var b = 0; b < cand.length; b++) {
        if (a !== b && cand[a].el.contains(cand[b].el)) { nested = true; break; }
      }
      if (nested) continue;
      if (!cand[a].el.hasAttribute('data-i18n-src')) {
        cand[a].el.setAttribute('data-i18n-src', cand[a].el.innerHTML);
      }
      out.push(cand[a]);
    }
    return out;
  }

  var nodes = collect();

  /* ---------- aplicação ---------- */
  function apply(lang) {
    var dict = (window.VH_I18N && window.VH_I18N[lang]) || null;
    var missing = [];

    for (var i = 0; i < nodes.length; i++) {
      var n = nodes[i];

      if (lang === 'pt' || !dict) {
        n.el.innerHTML = n.el.getAttribute('data-i18n-src');
        continue;
      }

      var val = dict[n.key];
      if (val) n.el.innerHTML = val;
      else {
        n.el.innerHTML = n.el.getAttribute('data-i18n-src');
        missing.push(n.key);
      }
    }

    /* placeholders e aria-labels */
    var ph = (window.VH_I18N_ATTR && window.VH_I18N_ATTR[lang]) || null;
    document.querySelectorAll('[placeholder]').forEach(function (el) {
      if (!el.hasAttribute('data-i18n-ph')) {
        el.setAttribute('data-i18n-ph', el.getAttribute('placeholder'));
      }
      var orig = el.getAttribute('data-i18n-ph');
      el.setAttribute('placeholder', (ph && ph[norm(orig)]) || orig);
    });

    document.documentElement.lang = lang === 'pt' ? 'pt-BR' : lang;
    localStorage.setItem(LS_KEY, lang);
    window.VH_LANG = lang;

    document.querySelectorAll('[data-lang-btn]').forEach(function (b) {
      var on = b.getAttribute('data-lang-btn') === lang;
      b.classList.toggle('on', on);
      b.setAttribute('aria-pressed', on ? 'true' : 'false');
    });

    window.VH_I18N_MISSING = missing;
    if (missing.length && lang !== 'pt') {
      console.info('[i18n] ' + missing.length + ' sem tradução em "' + lang +
                   '". Rode vhDumpMissing() para gerar o esqueleto.');
    }
    document.dispatchEvent(new CustomEvent('vh:lang', { detail: { lang: lang } }));
  }

  /* ---------- helper de autoria ---------- */
  window.vhDumpMissing = function () {
    var m = window.VH_I18N_MISSING || [];
    var seen = {}, out = [];
    m.forEach(function (k) { if (!seen[k]) { seen[k] = 1; out.push(k); } });
    var txt = out.map(function (k) {
      return '  ' + JSON.stringify(k) + ': ' + JSON.stringify(k) + ',';
    }).join('\n');
    console.log(txt || '// nada faltando');
    if (navigator.clipboard) navigator.clipboard.writeText(txt);
    return out.length + ' chaves copiadas para a área de transferência';
  };

  window.vhSetLang = apply;
  window.VH_LANGS = LANGS;

  /* ---------- barra de idioma ---------- */
  function mountSwitcher() {
    var host = document.querySelector('.navbar');
    if (!host || document.getElementById('langbar')) return;

    var bar = document.createElement('div');
    bar.id = 'langbar';
    bar.className = 'langbar';
    bar.setAttribute('role', 'group');
    bar.setAttribute('aria-label', 'Idioma');

    Object.keys(LANGS).forEach(function (code) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'langbtn';
      b.textContent = code.toUpperCase();
      b.title = LANGS[code];
      b.setAttribute('data-lang-btn', code);
      b.addEventListener('click', function () { apply(code); });
      bar.appendChild(b);
    });

    var hint = host.querySelector('.kbd-hint');
    if (hint) host.insertBefore(bar, hint);
    else host.appendChild(bar);
  }

  /* ---------- boot ---------- */
  mountSwitcher();

  var saved = localStorage.getItem(LS_KEY);
  if (!saved) {
    var nav = (navigator.language || 'pt').slice(0, 2).toLowerCase();
    saved = (nav === 'en' || nav === 'es') ? nav : 'pt';
  }
  apply(saved);

})();