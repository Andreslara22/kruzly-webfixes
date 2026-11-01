// Ajuste remoto para WhatsApp Web dentro de Kruzly (builds de prueba).
// La app baja este archivo y lo ejecuta en la página. Después de editarlo,
// en la app basta con tocar Recargar.
//
// v4: v3 sí dio altura a body y al primer div, pero el login vive en OTRO
// hijo de body cuyos contenedores siguen en 0 px.
// v5: v4 estiraba de más (forzaba cajas de 43 px). Ahora solo se fuerzan
// las que miden 0, y como el QR no sirve en el mismo teléfono, se toca solo
// "Link with phone number instead" para ir directo al código.
// v6: el toque de v5 no se disparaba; ahora busca el texto visible aunque venga
// partido en varios nodos y toca el elemento clicable con eventos de puntero.
// v12: tarjeta de vinculación arriba, sin espacio vacío.
// v11: botón grande para copiar el código de 8 letras.
// v10: vinculación con zoom para que se lea bien en el teléfono.
// v7: v6 tocó un contenedor de toda la página; ahora toca el elemento más pequeño.
(function () {
  var V = 'v12';
  if (window.__kruzlyFixVersion === V) return;
  window.__kruzlyFixVersion = V;

  function zoomNow() { return parseFloat(document.documentElement.style.zoom) || 1; }
  function h() { return rawH() / zoomNow(); }
  function rawH() { return Math.max(window.innerHeight || 0, (window.visualViewport && window.visualViewport.height) || 0, document.documentElement.clientHeight || 0) || 2000; }

  function force() {
    var px = h() + 'px';
    var targets = [document.documentElement, document.body];
    if (document.body) {
      Array.prototype.forEach.call(document.body.children, function (c) {
        if (c.tagName === 'DIV') {
          targets.push(c);
          var inner = c.querySelector(':scope > div');
          if (inner) targets.push(inner);
        }
      });
      // Ancestros del login que midan 0
      var walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
      var t, found = null;
      while ((t = walker.nextNode())) { if (/Link with phone|Scan to log in|Vincular con|Escanea/i.test(t.nodeValue)) { found = t.parentElement; break; } }
      var e = found, n = 0;
      while (e && e !== document.body && n < 20) {
        if (e.getBoundingClientRect().height < 2 && getComputedStyle(e).display !== 'none' && getComputedStyle(e).position !== 'absolute' && targets.indexOf(e) < 0) targets.push(e);
        e = e.parentElement; n++;
      }
    }
    targets.forEach(function (e) {
      if (!e) return;
      e.style.setProperty('height', px, 'important');
      e.style.setProperty('min-height', px, 'important');
      e.style.setProperty('max-height', 'none', 'important');
      e.style.setProperty('overflow', 'visible', 'important');
    });
    return targets;
  }

  console.log('[kruzly] whatsapp.js ' + V + ' cargado');
  var targets = force();
  if (window.MutationObserver && document.body) {
    new MutationObserver(function () { force(); }).observe(document.body, { attributes: true, attributeFilter: ['style', 'class'] });
  }
  var ticks = 0;
  var timer = setInterval(function () { force(); if (++ticks > 20) clearInterval(timer); }, 500);

  function rect(e) {
    if (!e) return 'null';
    var r = e.getBoundingClientRect();
    return e.tagName + ' ' + Math.round(r.width) + 'x' + Math.round(r.height) + ' style="' + (e.getAttribute('style') || '').slice(0, 120) + '"';
  }
  // Ir directo a "vincular con número": el QR no se puede escanear desde el mismo teléfono.
  // v6: se busca el TEXTO (puede venir partido en varios nodos), se ignora la copia
  // oculta para lectores de pantalla (x=-999) y se toca el elemento clicable.
  var RX = /Link with phone number|Log in with phone number|Vincular con (el )?n[uú]mero|Iniciar sesi[oó]n con (el )?n[uú]mero/i;
  function visible(e) { var r = e.getBoundingClientRect(); return r.width > 2 && r.height > 2 && r.right > 0 && r.bottom > 0; }
  function tap(e) {
    var r = e.getBoundingClientRect(), x = r.left + r.width / 2, y = r.top + r.height / 2;
    var o = { bubbles: true, cancelable: true, view: window, clientX: x, clientY: y, button: 0 };
    try { e.dispatchEvent(new PointerEvent('pointerdown', o)); } catch (err) {}
    e.dispatchEvent(new MouseEvent('mousedown', o));
    try { e.dispatchEvent(new PointerEvent('pointerup', o)); } catch (err) {}
    e.dispatchEvent(new MouseEvent('mouseup', o));
    e.click();
  }
  // v7: v6 subía hasta un contenedor con tabindex que cubría toda la página.
  // Ahora se elige el elemento visible MÁS PEQUEÑO cuyo texto sea solo el enlace,
  // y si tras 2.5 s la pantalla no cambió, se prueba con su padre (máx. 3 intentos).
  function findLink() {
    var all = document.body.querySelectorAll('*'), best = null, bestArea = 1e12;
    for (var i = 0; i < all.length; i++) {
      var e = all[i], tx = (e.textContent || '').trim();
      if (tx.length > 60 || !RX.test(tx) || !visible(e)) continue;
      var r = e.getBoundingClientRect(), a = r.width * r.height;
      if (a < bestArea) { best = e; bestArea = a; }
    }
    return best;
  }
  function describe(e) {
    var r = e.getBoundingClientRect();
    var top = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
    return e.tagName + (e.getAttribute('role') ? '[role=' + e.getAttribute('role') + ']' : '') + ' "' + (e.textContent || '').trim().slice(0, 50) + '" ' +
      Math.round(r.left) + ',' + Math.round(r.top) + ' ' + Math.round(r.width) + 'x' + Math.round(r.height) +
      ' encima=' + (top ? top.tagName + '.' + String(top.className || '').slice(0, 30) + ' "' + (top.textContent || '').trim().slice(0, 30) + '"' : 'nada');
  }
  var attempts = 0, tries = 0, waiting = false;
  var clickTimer = setInterval(function () {
    if (waiting) return;
    if (++tries > 40 || attempts >= 3) { clearInterval(clickTimer); return; }
    var link = findLink();
    if (!link) { if (attempts > 0) { console.log('[kruzly] el enlace ya no está: la pantalla cambió'); clearInterval(clickTimer); } return; }
    var target = link;
    for (var up = 0; up < attempts && target.parentElement; up++) {
      var p = target.parentElement;
      if ((p.textContent || '').trim().length > 60) break;
      target = p;
    }
    var btn = target.closest('[role="button"], button, a');
    if (btn && (btn.textContent || '').trim().length <= 60) target = btn;
    attempts++;
    console.log('[kruzly] intento ' + attempts + ' toque en ' + describe(target));
    tap(target);
    waiting = true;
    setTimeout(function () { waiting = false; }, 2500);
  }, 800);

  // v8: la página YA funciona (el toque llevó a "Enter phone number") pero no se pinta.
  // El hit-test nunca llega al contenido: típico de visibility:hidden / opacity:0 que
  // WhatsApp quita al terminar una animación de arranque que aquí no termina.
  // 1) Animaciones y transiciones a 0 s para que lleguen a su estado final.
  // 2) Forzar visible/opaco lo que siga escondido dentro de la app.
  // 3) Una etiqueta roja "Kruzly v8" arriba a la izquierda: si NO se ve, el WebView no pinta nada.
  try {
    var st = document.createElement('style');
    st.textContent = '*,*::before,*::after{animation-duration:0s!important;animation-delay:0s!important;transition-duration:0s!important;transition-delay:0s!important}';
    (document.head || document.documentElement).appendChild(st);
  } catch (err) { console.log('[kruzly] estilo: ' + err); }
  function badge() {
    if (document.getElementById('kruzly-badge')) return;
    var b = document.createElement('div');
    b.id = 'kruzly-badge';
    b.textContent = 'Kruzly v12';
    b.style.cssText = 'position:fixed!important;left:8px!important;top:8px!important;z-index:2147483647!important;background:#e53935!important;color:#fff!important;font:bold 28px sans-serif!important;padding:6px 12px!important;pointer-events:none!important;opacity:1!important;visibility:visible!important';
    document.documentElement.appendChild(b);
    setTimeout(function () { b.style.setProperty('display', 'none', 'important'); }, 4000);
  }
  var revealedLog = {}, revealedCount = 0;
  function reveal() {
    badge();
    var root = document.querySelector('.app-wrapper-web') || document.getElementById('app') || document.body;
    var chain = root, guard = 0;
    var list = [];
    while (chain && chain !== document.documentElement && guard++ < 10) { list.push(chain); chain = chain.parentElement; }
    var all = root.querySelectorAll('*');
    for (var i = 0; i < all.length; i++) list.push(all[i]);
    for (var j = 0; j < list.length; j++) {
      var e = list[j];
      if (e.id === 'kruzly-badge') continue;
      var cs = getComputedStyle(e), why = [];
      if (cs.display === 'none') continue;
      if (parseFloat(cs.opacity) < 0.05) { e.style.setProperty('opacity', '1', 'important'); why.push('opacity ' + cs.opacity); }
      if (cs.visibility === 'hidden' || cs.visibility === 'collapse') { e.style.setProperty('visibility', 'visible', 'important'); why.push('visibility'); }
      if (cs.contentVisibility && cs.contentVisibility !== 'visible') { e.style.setProperty('content-visibility', 'visible', 'important'); why.push('content-visibility ' + cs.contentVisibility); }
      if (/matrix\(0, 0, 0, 0|scale\(0/.test(cs.transform)) { e.style.setProperty('transform', 'none', 'important'); why.push('transform ' + cs.transform); }
      if (cs.clipPath && /inset\(50%|circle\(0/.test(cs.clipPath)) { e.style.setProperty('clip-path', 'none', 'important'); why.push('clip-path'); }
      // v9: el login vive dentro de una caja de 28 px con overflow:auto que recorta todo.
      if (/auto|hidden|scroll|clip/.test(cs.overflowY + cs.overflow) && e.clientWidth > 500 && e.clientHeight < 200 && e.scrollHeight > e.clientHeight + 50) {
        var hh = Math.max(e.scrollHeight, h()) + 'px';
        e.style.setProperty('height', hh, 'important');
        e.style.setProperty('min-height', hh, 'important');
        e.style.setProperty('max-height', 'none', 'important');
        e.style.setProperty('overflow', 'visible', 'important');
        why.push('caja recortada ' + e.clientHeight + 'px de ' + e.scrollHeight + 'px');
      }
      if (why.length) {
        var key = e.tagName + '.' + String(e.className || '').slice(0, 40);
        if (!revealedLog[key]) {
          revealedLog[key] = 1; revealedCount++;
          if (revealedCount <= 12) { var r = e.getBoundingClientRect(); console.log('[kruzly] mostrado ' + key + ' ' + Math.round(r.width) + 'x' + Math.round(r.height) + ' por ' + why.join(', ')); }
        }
      }
    }
  }
  try { reveal(); } catch (err) { console.log('[kruzly] reveal: ' + err); }
  var rTicks = 0;
  var rTimer = setInterval(function () {
    try { reveal(); } catch (err) {}
    if (++rTicks > 40) clearInterval(rTimer);
  }, 500);
  setTimeout(function () {
    var cx = window.innerWidth / 2, cy = 300;
    var top = document.elementFromPoint(cx, cy);
    console.log('[kruzly] v8 cosas mostradas=' + revealedCount + ' encima(' + cx + ',' + cy + ')=' + (top ? top.tagName + '.' + String(top.className || '').slice(0, 40) + ' "' + (top.textContent || '').trim().slice(0, 40) + '"' : 'nada'));
  }, 6000);

  // v10: pantallas de vinculación más cómodas en el teléfono. WhatsApp Web se dibuja
  // a 1024 px de ancho y en el celular todo se ve diminuto. Mientras no haya sesión
  // (QR, número, código) se agranda todo con zoom y la tarjeta se ajusta al ancho.
  var LOGIN_RX = /Enter phone number|Scan to log in|Enter code|Link with phone|Log in with|Ingresa (tu|el) n[uú]mero|Escanea|Introduce el c[oó]digo|Vincular con/i;
  var LOGIN_ZOOM = 1.8;
  function mobileLogin() {
    var logged = document.querySelector('#pane-side, [data-testid="chat-list"], [aria-label="Chat list"], [aria-label="Lista de chats"]');
    var txt = document.body ? (document.body.innerText || '').slice(0, 1500) : '';
    var want = (!logged && LOGIN_RX.test(txt)) ? LOGIN_ZOOM : 1;
    if (zoomNow() !== want) {
      if (want === 1) document.documentElement.style.removeProperty('zoom');
      else document.documentElement.style.setProperty('zoom', String(want));
      force();
      console.log('[kruzly] zoom ' + want + (logged ? ' (sesión iniciada)' : ''));
    }
    if (want !== 1) {
      var avail = window.innerWidth / want;
      var all = (document.querySelector('.app-wrapper-web') || document.body).querySelectorAll('div, form');
      for (var i = 0; i < all.length; i++) {
        var e = all[i];
        if (e.offsetWidth > avail - 8 && e.offsetWidth < window.innerWidth + 2 && LOGIN_RX.test((e.textContent || '').slice(0, 400)) && e.offsetHeight < h() - 4) {
          e.style.setProperty('max-width', (avail - 16) + 'px', 'important');
          e.style.setProperty('min-width', '0', 'important');
          e.style.setProperty('box-sizing', 'border-box', 'important');
          e.style.setProperty('margin-left', 'auto', 'important');
          e.style.setProperty('margin-right', 'auto', 'important');
        }
      }
    }
  }
  // v12: la tarjeta quedaba centrada a media pantalla (contenedores altos con
  // centrado vertical). Se sube: arriba con un margen pequeño.
  var TITLE_RX = /^(Enter phone number|Scan to log in|Enter code on (your )?phone|Steps to log in|Ingresa (tu|el) n[uú]mero.*|Introduce el c[oó]digo.*|Escanea.*)$/i;
  function liftCard() {
    if (zoomNow() === 1) return;
    var title = null, all = document.body.querySelectorAll('h1, h2, div, span');
    for (var i = 0; i < all.length; i++) {
      var e = all[i];
      if (e.children.length === 0 && TITLE_RX.test((e.textContent || '').trim()) && e.getBoundingClientRect().width > 2) { title = e; break; }
    }
    if (!title) return;
    var avail = window.innerWidth / zoomNow(), card = null, e2 = title, n = 0;
    while (e2 && e2 !== document.body && n++ < 25) {
      if (!card && e2.offsetWidth >= avail - 60) { card = e2; }
      else if (card) {
        e2.style.setProperty('justify-content', 'flex-start', 'important');
        e2.style.setProperty('align-content', 'flex-start', 'important');
        e2.style.setProperty('margin-top', '0', 'important');
        e2.style.setProperty('padding-top', '0', 'important');
        if (getComputedStyle(e2).position === 'absolute') e2.style.setProperty('top', '0', 'important');
      }
      e2 = e2.parentElement;
    }
    if (card) {
      card.style.setProperty('margin-top', '12px', 'important');
      card.style.setProperty('transform', 'none', 'important');
      if (getComputedStyle(card).position === 'absolute') card.style.setProperty('top', '0', 'important');
    }
  }
  var _ml = mobileLogin;
  mobileLogin = function () { _ml(); liftCard(); };
  try { mobileLogin(); } catch (err) { console.log('[kruzly] zoom: ' + err); }
  setInterval(function () { try { mobileLogin(); } catch (err) {} }, 1000);

  // v11: en la pantalla del código de 8 letras, botón grande "Copiar código".
  // Abrir la app de WhatsApp desde aquí necesita un build (la app bloquea enlaces
  // que no sean web), así que por ahora se copia y se indica cómo cambiar de app.
  function findCode() {
    var el = document.querySelector('[data-link-code]');
    if (el) { var c = (el.getAttribute('data-link-code') || '').replace(/[^A-Za-z0-9]/g, ''); if (c.length === 8) return c.toUpperCase(); }
    var txt = document.body ? (document.body.innerText || '') : '';
    if (!/Enter code|code on (your )?phone|Introduce (el|este) c[oó]digo|Ingresa (el|este) c[oó]digo/i.test(txt)) return null;
    // El código puede venir letra por letra en renglones separados: se juntan.
    var lines = txt.split('\n'), items = [], buf = '';
    for (var i = 0; i < lines.length; i++) {
      var ln = lines[i].trim();
      if (/^[A-Z0-9\-–]$/.test(ln)) { buf += ln; continue; }
      if (buf) { items.push(buf); buf = ''; }
      if (ln) items.push(ln);
    }
    if (buf) items.push(buf);
    for (var j = 0; j < items.length; j++) {
      var m = items[j].replace(/\s+/g, '').match(/^([A-Z0-9]{4})[-–]?([A-Z0-9]{4})$/);
      if (m && j > 0 && m[1] + m[2] !== 'WHATSAPP') return m[1] + m[2];
    }
    return null;
  }
  function copyText(t) {
    var ok = false;
    try { var ta = document.createElement('textarea'); ta.value = t; ta.style.cssText = 'position:fixed;top:0;left:0;opacity:0'; document.body.appendChild(ta); ta.select(); ok = document.execCommand('copy'); ta.remove(); } catch (err) {}
    try { if (navigator.clipboard) navigator.clipboard.writeText(t); ok = true; } catch (err) {}
    return ok;
  }
  function codeButton() {
    var code = findCode(), box = document.getElementById('kruzly-code');
    if (!code) { if (box) box.remove(); return; }
    if (box && box.getAttribute('data-code') === code) return;
    if (box) box.remove();
    box = document.createElement('div');
    box.id = 'kruzly-code';
    box.setAttribute('data-code', code);
    var z = zoomNow();
    box.style.cssText = 'position:fixed!important;left:0!important;right:0!important;bottom:0!important;z-index:2147483646!important;background:#1F1A3D!important;color:#fff!important;padding:' + Math.round(24 / z) + 'px!important;font-family:sans-serif!important;text-align:center!important;box-shadow:0 -4px 16px rgba(0,0,0,.25)!important';
    var pretty = code.slice(0, 4) + '-' + code.slice(4);
    box.innerHTML = '<div style="font-size:' + Math.round(26 / z) + 'px;opacity:.85">Tu código</div>' +
      '<div style="font-size:' + Math.round(64 / z) + 'px;font-weight:bold;letter-spacing:4px;margin:4px 0">' + pretty + '</div>' +
      '<button id="kruzly-copy" style="font-size:' + Math.round(34 / z) + 'px;font-weight:bold;background:#25D366;color:#fff;border:0;border-radius:999px;padding:' + Math.round(18 / z) + 'px ' + Math.round(48 / z) + 'px;margin:8px 0">Copiar código</button>' +
      '<div id="kruzly-copy-hint" style="font-size:' + Math.round(24 / z) + 'px;opacity:.85;margin-top:6px">Luego abre WhatsApp desde la notificación "Introduce el código" o desde apps recientes, y pégalo.</div>';
    document.documentElement.appendChild(box);
    document.getElementById('kruzly-copy').addEventListener('click', function () {
      var ok = copyText(code);
      this.textContent = ok ? '¡Copiado!' : 'Cópialo a mano: ' + pretty;
      console.log('[kruzly] código copiado=' + ok);
    });
    console.log('[kruzly] código en pantalla ' + pretty);
  }
  setInterval(function () { try { codeButton(); } catch (err) {} }, 1000);

  setTimeout(function () {
    var t = force();
    console.log('[kruzly] whatsapp.js ' + V + ' innerH=' + window.innerHeight + ' vvH=' + (window.visualViewport ? window.visualViewport.height : '-') +
      ' clientH=' + document.documentElement.clientHeight + ' screenH=' + screen.height);
    t.forEach(function (e, i) { console.log('[kruzly] nivel' + i + ' ' + rect(e)); });
  }, 2000);
})();
