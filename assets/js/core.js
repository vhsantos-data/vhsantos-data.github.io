/* ============================================================
   CORE.JS — comportamento compartilhado
   Vitor Hugo Santana · portfolio
   Ativa módulos condicionalmente (no-op se o elemento não existe)
   ============================================================ */
(function () {
  'use strict';

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $  = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

  /* ---------------------------------------------------------
     1. ANO DINÂMICO
     --------------------------------------------------------- */
  $$('[data-year]').forEach(function (el) {
    el.textContent = new Date().getFullYear();
  });

  /* ---------------------------------------------------------
     2. HEADER ON SCROLL + BARRA DE PROGRESSO
     --------------------------------------------------------- */
  var hd = $('#hd');
  var prog = $('#prog');
  var ticking = false;

  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () {
      var y = window.scrollY || document.documentElement.scrollTop;

      if (hd) {
        if (y > 20) hd.classList.add('scrolled');
        else hd.classList.remove('scrolled');
      }

      if (prog) {
        var h = document.documentElement.scrollHeight - window.innerHeight;
        prog.style.width = (h > 0 ? (y / h) * 100 : 0) + '%';
      }
      ticking = false;
    });
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll, { passive: true });
  onScroll();

  /* ---------------------------------------------------------
     3. MENU MOBILE
     --------------------------------------------------------- */
  var burger = $('#burger');
  var nav = $('#nav');

  if (burger && nav) {
    burger.addEventListener('click', function () {
      var open = nav.classList.toggle('open');
      burger.classList.toggle('open', open);
      burger.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    nav.addEventListener('click', function (e) {
      if (e.target.tagName === 'A') {
        nav.classList.remove('open');
        burger.classList.remove('open');
        burger.setAttribute('aria-expanded', 'false');
      }
    });
  }

  /* ---------------------------------------------------------
     4. NAV ATIVO AUTOMÁTICO
     Compara o último segmento da URL com o href do link
     --------------------------------------------------------- */
  (function activeNav() {
    if (!nav) return;
    var path = location.pathname.split('/').pop() || 'index.html';

    $$('a', nav).forEach(function (a) {
      var href = (a.getAttribute('href') || '').split('/').pop().split('#')[0];
      if (!href) return;
      if (href === path) a.classList.add('active');
      // subpágina de case marca "Projetos"
      if (location.pathname.indexOf('/cases/') > -1 && href === 'projetos.html') {
        a.classList.add('active');
      }
    });
  })();

  /* ---------------------------------------------------------
     5. REVEAL ON SCROLL + CONTADORES + SKILL BARS
     --------------------------------------------------------- */
  var items = $$('.rv');

  function animateCount(el) {
    if (el.dataset.done) return;
    el.dataset.done = '1';

    var target = parseFloat(el.dataset.count);
    var suffix = el.dataset.suffix || '';
    var prefix = el.dataset.prefix || '';
    var dec = (el.dataset.dec ? parseInt(el.dataset.dec, 10) : 0);
    var dur = 1100;
    var start = null;

    function step(ts) {
      if (!start) start = ts;
      var p = Math.min((ts - start) / dur, 1);
      var eased = 1 - Math.pow(1 - p, 3);
      var val = target * eased;
      el.textContent = prefix + val.toFixed(dec) + suffix;
      if (p < 1) requestAnimationFrame(step);
      else el.textContent = prefix + target.toFixed(dec) + suffix;
    }
    requestAnimationFrame(step);
  }

  function fillAllStatic() {
    $$('[data-count]').forEach(function (el) {
      var dec = (el.dataset.dec ? parseInt(el.dataset.dec, 10) : 0);
      el.textContent = (el.dataset.prefix || '') +
        parseFloat(el.dataset.count).toFixed(dec) +
        (el.dataset.suffix || '');
      el.dataset.done = '1';
    });
  }

  if (reduced || !('IntersectionObserver' in window)) {
    items.forEach(function (el) { el.classList.add('in'); });
    fillAllStatic();
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        en.target.classList.add('in');
        io.unobserve(en.target);
        $$('[data-count]', en.target).forEach(animateCount);
        if (en.target.hasAttribute('data-count')) animateCount(en.target);
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });

    items.forEach(function (el) { io.observe(el); });
  }

  /* ---------------------------------------------------------
     6. COMMAND PALETTE (Ctrl+K / Cmd+K)
     --------------------------------------------------------- */
  (function palette() {
    var box = $('#cmdk');
    if (!box) return;

    var input = $('input', box);
    var list = $('ul', box);

    // detecta se estamos em subpasta (/cases/) para ajustar caminho
    var up = location.pathname.indexOf('/cases/') > -1 ? '../' : '';

    /* Os grupos, por ordem de utilidade: primeiro o que leva a
       algum lado, depois o que faz alguma coisa, e só no fim o que
       serve para brincar. O Ctrl+K tinha vinte e tal linhas numa
       lista achatada e não se via onde acabava o útil. */
    var GRUPOS = [
      { g: 'ir',     t: 'Ir para' },
      { g: 'acao',   t: 'Ações' },
      { g: 'tema',   t: 'Aparência' },
      { g: 'modo',   t: 'Modos' },
      { g: 'efeito', t: 'Efeitos e depuração' },
      { g: 'reset',  t: 'Repor' }
    ];
    var ORDEM = {};
    GRUPOS.forEach(function (x, i) { ORDEM[x.g] = i; });

    var ITEMS = [
      { g: 'ir',   n: 'Home',                    k: 'página',  u: up + 'index.html' },
      { g: 'ir',   n: 'Sobre',                   k: 'página',  u: up + 'sobre.html' },
      { g: 'ir',   n: 'Projetos',                k: 'página',  u: up + 'projetos.html' },
      { g: 'ir',   n: 'PHOSPHOR — peça autoral', k: 'página',  u: up + 'phosphor.html' },
      { g: 'ir',   n: 'Lab — snippets',          k: 'página',  u: up + 'lab.html' },
      { g: 'ir',   n: 'Contato',                 k: 'página',  u: up + 'contato.html' },
      { g: 'ir',   n: 'Case: falhas operacionais', k: 'case',  u: up + 'cases/falhas-operacionais.html' },
      { g: 'acao', n: 'Copiar email',            k: 'ação',    a: 'mail' },
      { g: 'acao', n: 'Ir para o topo',          k: 'ação',    a: 'top' },
      { g: 'acao', n: 'GitHub',                  k: 'externo', u: 'https://github.com/vhsantos-data', x: 1 },
      { g: 'acao', n: 'LinkedIn',                k: 'externo', u: 'https://www.linkedin.com/in/vhsantos-data', x: 1 }
    ];

    /* junta navegação + comandos de diversão do fun.js */
    function allItems() {
      var base = ITEMS.slice();
      if (window.VH_FUN && typeof window.VH_FUN.items === 'function') {
        base = base.concat(window.VH_FUN.items());
      }
      /* estável: dentro do grupo mantém-se a ordem de origem */
      return base.map(function (it, i) { return { it: it, i: i }; })
        .sort(function (a, b) {
          var ga = ORDEM[a.it.g] === undefined ? 99 : ORDEM[a.it.g];
          var gb = ORDEM[b.it.g] === undefined ? 99 : ORDEM[b.it.g];
          return ga - gb || a.i - b.i;
        })
        .map(function (x) { return x.it; });
    }

    var filtered = allItems();
    var sel = 0;

    var linhas = [];   /* só os <li> navegáveis, na ordem de `filtered` */

    function render() {
      list.innerHTML = '';
      linhas = [];
      if (!filtered.length) {
        var vazio = document.createElement('li');
        vazio.innerHTML = '<span class="ci-name" style="color:var(--fg-ghost)">Nada encontrado</span>';
        list.appendChild(vazio);
        return;
      }
      var grupoAtual = null;
      filtered.forEach(function (it, i) {
        if (it.g !== grupoAtual) {
          grupoAtual = it.g;
          var titulo = GRUPOS.filter(function (x) { return x.g === it.g; })[0];
          if (titulo) {
            var cab = document.createElement('li');
            cab.className = 'cmdk-group';
            cab.setAttribute('aria-hidden', 'true');
            cab.textContent = titulo.t;
            list.appendChild(cab);
          }
        }
        var li = document.createElement('li');
        if (i === sel) li.className = 'sel';
        if (it.active && it.active()) li.setAttribute('data-active', '1');
        li.innerHTML = '<span class="ci-name"></span><span class="ci-kind"></span>';
        $('.ci-name', li).textContent = it.n;
        var kind = $('.ci-kind', li);
        kind.textContent = it.k;
        if (it.fun) kind.classList.add('fun');
        li.addEventListener('click', function () { run(it); });
        li.addEventListener('mouseenter', function () {
          sel = i;
          linhas.forEach(function (l, j) { l.classList.toggle('sel', j === i); });
        });
        list.appendChild(li);
        linhas.push(li);
      });
      /* com grupos a lista ficou mais alta: a selecção tem de se ver */
      if (linhas[sel] && linhas[sel].scrollIntoView) {
        linhas[sel].scrollIntoView({ block: 'nearest' });
      }
    }

    function run(it) {
      /* comandos vindos do fun.js: executa e mantém aberto */
      if (typeof it.run === 'function') { it.run(); render(); return; }
      if (it.a === 'crt') { document.body.classList.toggle('crt'); close(); return; }
      if (it.a === 'top') { window.scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' }); close(); return; }
      if (it.a === 'mail') {
        var mail = (document.body.dataset.email || 'vhsantosdata@gmail.com');
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(mail);
          toast('Email copiado: ' + mail);
        } else {
          location.href = 'mailto:' + mail;
        }
        close();
        return;
      }
      if (it.x) window.open(it.u, '_blank', 'noopener');
      else location.href = it.u;
    }

    function open() {
      box.classList.add('open');
      input.value = '';
      filtered = allItems();
      sel = 0;
      render();
      setTimeout(function () { input.focus(); }, 30);
    }
    function close() { box.classList.remove('open'); }

    input.addEventListener('input', function () {
      var q = input.value.trim().toLowerCase();
      filtered = allItems().filter(function (it) {
        return (it.n + ' ' + it.k).toLowerCase().indexOf(q) > -1;
      });
      sel = 0;
      render();
    });

    box.addEventListener('click', function (e) { if (e.target === box) close(); });

    $$('[data-cmdk-open]').forEach(function (b) {
      b.addEventListener('click', open);
    });

    document.addEventListener('keydown', function (e) {
      var isK = (e.key === 'k' || e.key === 'K');
      if ((e.ctrlKey || e.metaKey) && isK) { e.preventDefault(); box.classList.contains('open') ? close() : open(); return; }
      if (!box.classList.contains('open')) return;

      if (e.key === 'Escape') { e.preventDefault(); close(); }
      else if (e.key === 'ArrowDown') { e.preventDefault(); sel = Math.min(sel + 1, filtered.length - 1); render(); }
      else if (e.key === 'ArrowUp')   { e.preventDefault(); sel = Math.max(sel - 1, 0); render(); }
      else if (e.key === 'Enter')     { e.preventDefault(); if (filtered[sel]) run(filtered[sel]); }
    });
  })();

  /* ---------------------------------------------------------
     7. TABS (lab.html)
     --------------------------------------------------------- */
  $$('[data-tabs]').forEach(function (group) {
    var tabs = $$('.tab', group);
    var scope = group.closest('.wrap') || group.parentNode;
    var panels = $$('.panel', scope);

    tabs.forEach(function (t, i) {
      t.setAttribute('role', 'tab');
      t.addEventListener('click', function () {
        tabs.forEach(function (x) { x.classList.remove('on'); x.setAttribute('aria-selected', 'false'); });
        panels.forEach(function (p) { p.classList.remove('on'); });
        t.classList.add('on');
        t.setAttribute('aria-selected', 'true');
        if (panels[i]) panels[i].classList.add('on');
      });
    });
  });

  /* ---------------------------------------------------------
     8. BOTÃO COPIAR CÓDIGO
     --------------------------------------------------------- */
  $$('.copybtn').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var panel = btn.closest('.panel') || btn.parentNode.parentNode;
      var code = $('pre', panel);
      if (!code) return;

      var text = code.innerText;
      var original = btn.textContent;

      function done(ok) {
        btn.textContent = ok ? 'Copiado' : 'Erro';
        btn.classList.toggle('done', ok);
        setTimeout(function () {
          btn.textContent = original;
          btn.classList.remove('done');
        }, 1600);
      }

      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(function () { done(true); }, function () { done(false); });
      } else {
        // fallback browsers antigos
        var ta = document.createElement('textarea');
        ta.value = text;
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        try { document.execCommand('copy'); done(true); }
        catch (err) { done(false); }
        document.body.removeChild(ta);
      }
    });
  });

  /* ---------------------------------------------------------
     9. FILTRO DE PROJETOS (projetos.html)
     Filtra por data-stack nos cards
     --------------------------------------------------------- */
  (function projectFilter() {
    var bar = $('#filterbar');
    if (!bar) return;

    var cards = $$('.proj[data-stack]');
    var counter = $('#fcount');

    function apply(key) {
      var shown = 0;

      cards.forEach(function (c) {
        var tokens = (c.dataset.stack || '').toLowerCase().split(/\s+/);
        var match = (key === 'all') || tokens.indexOf(key) > -1;
        c.classList.toggle('hide', !match);
        if (match) shown++;
      });

      // renumera os índices visíveis
      var i = 0;
      cards.forEach(function (c) {
        if (c.classList.contains('hide')) return;
        i++;
        var idx = $('.proj-idx', c);
        if (idx) idx.textContent = String(i).padStart(3, '0');
      });

      if (counter) {
        counter.textContent = shown + (shown === 1 ? ' projeto' : ' projetos');
      }
    }

    $$('.fbtn', bar).forEach(function (b) {
      b.setAttribute('aria-pressed', b.classList.contains('on') ? 'true' : 'false');
      b.addEventListener('click', function () {
        $$('.fbtn', bar).forEach(function (x) {
          x.classList.remove('on');
          x.setAttribute('aria-pressed', 'false');
        });
        b.classList.add('on');
        b.setAttribute('aria-pressed', 'true');
        apply((b.dataset.filter || 'all').toLowerCase());
      });
    });

    apply('all');
  })();

  /* ---------------------------------------------------------
     10. FORMULÁRIO DE CONTATO
     Validação client-side + fallback mailto
     --------------------------------------------------------- */
  (function contactForm() {
    var form = $('#cform');
    if (!form) return;

    var ok = $('#formok');

    function setInvalid(field, invalid, msg) {
      field.classList.toggle('invalid', invalid);
      var err = $('.err', field);
      if (err && msg) err.textContent = msg;
    }

    function validate() {
      var valid = true;

      $$('.field', form).forEach(function (field) {
        var input = $('input, textarea', field);
        if (!input || !input.required) return;

        var v = input.value.trim();

        if (!v) {
          setInvalid(field, true, 'Campo obrigatório.');
          valid = false;
          return;
        }
        if (input.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)) {
          setInvalid(field, true, 'Email inválido.');
          valid = false;
          return;
        }
        if (input.tagName === 'TEXTAREA' && v.length < 20) {
          setInvalid(field, true, 'Escreva pelo menos 20 caracteres.');
          valid = false;
          return;
        }
        setInvalid(field, false);
      });

      return valid;
    }

    // limpa erro ao digitar
    $$('input, textarea', form).forEach(function (i) {
      i.addEventListener('input', function () {
        var f = i.closest('.field');
        if (f) f.classList.remove('invalid');
      });
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!validate()) return;

      var nome = ($('#f-nome') || {}).value || '';
      var email = ($('#f-email') || {}).value || '';
      var assunto = ($('#f-assunto') || {}).value || 'Contato pelo portfolio';
      var msg = ($('#f-msg') || {}).value || '';

      var dest = document.body.dataset.email || 'vhsantosdata@gmail.com';
      var body = 'Nome: ' + nome + '\nEmail: ' + email + '\n\n' + msg;

      // abre o cliente de email do visitante
      window.location.href = 'mailto:' + dest +
        '?subject=' + encodeURIComponent('[Portfolio] ' + assunto) +
        '&body=' + encodeURIComponent(body);

      if (ok) {
        ok.classList.add('show');
        ok.textContent = 'Abrindo seu cliente de email. Se não abrir, escreva direto para ' + dest;
      }
      form.reset();
    });
  })();

  /* ---------------------------------------------------------
     11. TYPEWRITER (opcional, via data-type)
     --------------------------------------------------------- */
  (function typewriter() {
    var els = $$('[data-type]');
    if (!els.length || reduced) {
      els.forEach(function (el) { el.textContent = el.dataset.type; });
      return;
    }

    els.forEach(function (el) {
      var full = el.dataset.type;
      var delay = parseInt(el.dataset.typeDelay || '0', 10);
      var speed = parseInt(el.dataset.typeSpeed || '38', 10);
      el.textContent = '';

      setTimeout(function () {
        var i = 0;
        var timer = setInterval(function () {
          el.textContent = full.slice(0, ++i);
          if (i >= full.length) clearInterval(timer);
        }, speed);
      }, delay);
    });
  })();

  /* ---------------------------------------------------------
     12. RELÓGIO DE UPTIME (footer)
     --------------------------------------------------------- */
  (function uptime() {
    var el = $('#uptime');
    if (!el) return;

    // data de entrada em produção do sistema de falhas
    var since = new Date(el.dataset.since || '2026-01-01T00:00:00');

    function tick() {
      var diff = Date.now() - since.getTime();
      if (diff < 0) { el.textContent = '—'; return; }
      var d = Math.floor(diff / 86400000);
      var h = Math.floor((diff % 86400000) / 3600000);
      var m = Math.floor((diff % 3600000) / 60000);
      el.textContent = d + 'd ' + String(h).padStart(2, '0') + 'h ' + String(m).padStart(2, '0') + 'm';
    }
    tick();
    setInterval(tick, 30000);
  })();

  /* ---------------------------------------------------------
     13. EASTER EGG — KONAMI CODE → modo CRT
     ↑ ↑ ↓ ↓ ← → ← → B A
     --------------------------------------------------------- */
  (function konami() {
    var seq = ['ArrowUp','ArrowUp','ArrowDown','ArrowDown','ArrowLeft','ArrowRight','ArrowLeft','ArrowRight','b','a'];
    var pos = 0;

    document.addEventListener('keydown', function (e) {
      var key = e.key.length === 1 ? e.key.toLowerCase() : e.key;
      if (key === seq[pos]) {
        pos++;
        if (pos === seq.length) {
          pos = 0;
          if (window.VH_FUN) {
            window.VH_FUN.confetti();
            window.VH_FUN.toggleMode('glitch');
          } else {
            document.body.classList.toggle('crt');
          }
        }
      } else {
        pos = (key === seq[0]) ? 1 : 0;
      }
    });
  })();

  /* ---------------------------------------------------------
     13.5 TOAST — feedback discreto
     --------------------------------------------------------- */
  function toast(msg) {
    var t = document.createElement('div');
    t.textContent = msg;
    t.setAttribute('role', 'status');
    t.style.cssText = [
      'position:fixed', 'bottom:26px', 'left:50%',
      'transform:translateX(-50%) translateY(14px)',
      'background:#0e1a14', 'border:1px solid #27402f', 'color:#d8e6dd',
      'font-family:inherit', 'font-size:12px', 'letter-spacing:.06em',
      'padding:13px 20px', 'z-index:9996', 'opacity:0',
      'transition:opacity 220ms ease, transform 220ms ease',
      'pointer-events:none'
    ].join(';');
    document.body.appendChild(t);

    requestAnimationFrame(function () {
      t.style.opacity = '1';
      t.style.transform = 'translateX(-50%) translateY(0)';
    });
    setTimeout(function () {
      t.style.opacity = '0';
      t.style.transform = 'translateX(-50%) translateY(14px)';
      setTimeout(function () { t.remove(); }, 260);
    }, 2200);
  }
  window.__toast = toast;
  /* ---------------------------------------------------------
     14. LOG DE ASSINATURA NO CONSOLE
     --------------------------------------------------------- */
  console.log(
    '%c VITOR.HUGO %c dados & automação ',
    'background:#00ff88;color:#050807;font-weight:bold;padding:3px 6px',
    'background:#0e1a14;color:#8fa89a;padding:3px 6px'
  );
  console.log('%cCtrl+K abre a navegação por teclado. Konami code faz outra coisa.', 'color:#5c7266');

})();