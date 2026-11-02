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
// v26: freno al reacomodo por cambio de tamaño (bucle que hacía temblar todo).
// v25: vista de celular reactivada para el build 17 (sin reserva de botones, sin zoom con los dedos).
// v24: al cambiar el tamaño de la web (teclado) se reajustan las alturas forzadas.
// v23: se desactiva la vista de celular del chat (temblor y caja de texto oculta). Se mantienen zoom, código y vinculación.
// v22: sin temblor: al cambiar el tamaño solo se reajustan los paneles, no se reescribe ni desplaza la página.
// v21: el chat deja espacio abajo para los botones de Android (la caja de texto quedaba debajo).
// v20: en el chat se ocultan capas absolutas vacías (posible origen de la línea vertical).
// v19: sin bucle de escritura de estilos (parpadeo al abrir chat).
// v18: chat sin desplazamiento ni teclado que tape, sin línea vertical, botón ‹ separado del avatar.
// v17: medidas en px y capa 200 (el panel vacío con z-index 100 tapaba la lista).
// v16: vista de celular rehecha sobre la estructura real (lista o chat a pantalla completa).
// v15: v14 dejó todo en blanco: se quita la vista de una columna y se registra la estructura.
// v14: vista de celular con sesión: una columna, zoom según el teléfono, botón ‹.
// v13: no tocar animaciones ni opacidad (trababan el código), sin etiqueta roja.
// v12: tarjeta de vinculación arriba, sin espacio vacío.
// v11: botón grande para copiar el código de 8 letras.
// v10: vinculación con zoom para que se lea bien en el teléfono.
// v7: v6 tocó un contenedor de toda la página; ahora toca el elemento más pequeño.
(function () {
  var V = 'v26';
  if (window.__kruzlyFixVersion === V) return;
  window.__kruzlyFixVersion = V;

  function zoomNow() { return parseFloat(document.documentElement.style.zoom) || 1; }
  function h() { return rawH() / zoomNow(); }
  function rawH() { return Math.max(window.innerHeight || 0, (window.visualViewport && window.visualViewport.height) || 0, document.documentElement.clientHeight || 0) || 2000; }

  function setIf(e, prop, val) {
    if (e.style.getPropertyValue(prop) === val && e.style.getPropertyPriority(prop) === 'important') return;
    e.style.setProperty(prop, val, 'important');
  }
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
    // v19: escribir solo si cambia. Antes cada escritura disparaba el MutationObserver,
    // que volvía a escribir: bucle que hacía parpadear la pantalla al abrir un chat.
    targets.forEach(function (e) {
      if (!e) return;
      setIf(e, 'height', px);
      setIf(e, 'min-height', px);
      setIf(e, 'max-height', 'none');
      setIf(e, 'overflow', 'visible');
    });
    return targets;
  }

  console.log('[kruzly] whatsapp.js ' + V + ' cargado');
  var targets = force();
  if (window.MutationObserver && document.body) {
    // v19: el observador ya no vigila el estilo del body (ahí se producía el bucle).
    new MutationObserver(function () { force(); }).observe(document.body, { attributes: true, attributeFilter: ['class'] });
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
  // v13: ya NO se ponen las animaciones a 0 s: WhatsApp espera a que terminen
  // (transitionend) y el código se quedaba cargando.
  function badge() {
    return;
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
      if (false) { e.style.setProperty('opacity', '1', 'important'); why.push('opacity ' + cs.opacity); }
      if (false) { e.style.setProperty('visibility', 'visible', 'important'); why.push('visibility'); }
      if (false) { e.style.setProperty('content-visibility', 'visible', 'important'); why.push('content-visibility ' + cs.contentVisibility); }
      if (false) { e.style.setProperty('transform', 'none', 'important'); why.push('transform ' + cs.transform); }
      if (false) { e.style.setProperty('clip-path', 'none', 'important'); why.push('clip-path'); }
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
    var Z = phoneZoom();
    // v23b: con la vista de celular apagada, sin zoom al tener sesión (diseño original que sí funcionaba).
    var want = logged ? (chatsDisabled ? 1 : Z) : (LOGIN_RX.test(txt) ? Math.min(LOGIN_ZOOM, Z) : 1);
    if (zoomNow() !== want) {
      if (want === 1) document.documentElement.style.removeProperty('zoom');
      else document.documentElement.style.setProperty('zoom', String(want));
      force();
      console.log('[kruzly] zoom ' + want + (logged ? ' (sesión iniciada)' : ''));
    }
    if (want !== 1 && !logged) {
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
    if (zoomNow() === 1 || document.getElementById('pane-side')) return;
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
  // v14: vista de celular con la sesión iniciada.
  // - Zoom según el ancho real del teléfono (1024 / ancho de pantalla), sirve en cualquier modelo.
  // - Si el ancho que queda es de teléfono (< 700 px): una sola columna. Lista de chats a todo
  //   el ancho; al abrir un chat, solo el chat, con un botón ‹ para volver a la lista.
  // - En pantallas anchas (Fold abierto, tablet) se deja el diseño de dos columnas.
  function phoneZoom() {
    var sw = Math.min(screen.width || 412, screen.height || 9999);
    if (window.innerWidth && screen.width && screen.width > screen.height) sw = screen.width; // horizontal
    return Math.max(1, Math.min(3, 1024 / Math.max(320, sw)));
  }
  var forcedListFor = null;
  function chatTitle() { var hd = document.querySelector('#main header'); return hd ? (hd.textContent || '').trim().slice(0, 80) : null; }
  function show(e, on) { if (on) { e.style.removeProperty('display'); e.removeAttribute('data-kz-hidden'); } else { e.style.setProperty('display', 'none', 'important'); e.setAttribute('data-kz-hidden', '1'); } }
  function full(e) {
    e.style.setProperty('flex', '1 1 100%', 'important');
    e.style.setProperty('max-width', 'none', 'important');
    e.style.setProperty('min-width', '0', 'important');
    e.style.setProperty('width', '100%', 'important');
  }
  function backButton(on) {
    var b = document.getElementById('kruzly-back');
    if (!on) { if (b) b.remove(); return; }
    if (b) return;
    var z = zoomNow();
    b = document.createElement('div');
    b.id = 'kruzly-back';
    b.textContent = '‹';
    b.style.cssText = 'position:fixed!important;left:4px!important;top:12px!important;z-index:2147483646!important;width:34px!important;height:34px!important;border-radius:50%!important;background:#25D366!important;color:#fff!important;font:bold 28px/34px sans-serif!important;text-align:center!important;box-shadow:0 2px 8px rgba(0,0,0,.3)!important;cursor:pointer!important';
    b.addEventListener('click', function () {
      var t = chatTitle();
      var ev = { key: 'Escape', code: 'Escape', keyCode: 27, which: 27, bubbles: true, cancelable: true };
      (document.activeElement || document.body).dispatchEvent(new KeyboardEvent('keydown', ev));
      document.dispatchEvent(new KeyboardEvent('keydown', ev));
      setTimeout(function () { if (document.querySelector('#main')) forcedListFor = t; mobileChats(); }, 400);
    });
    document.documentElement.appendChild(b);
  }
  var lastLayoutLog = '';
  var lastStruct = '';
  function describeEl(e) {
    var r = e.getBoundingClientRect();
    return e.tagName + (e.id ? '#' + e.id : '') + '.' + String(e.className || '').split(' ').slice(0, 2).join('.') +
      (e.getAttribute('role') ? '[' + e.getAttribute('role') + ']' : '') + ' ' + Math.round(r.left) + ',' + Math.round(r.top) + ' ' + Math.round(r.width) + 'x' + Math.round(r.height);
  }
  // v15: solo diagnóstico de columnas; no cambia nada en pantalla.
  function logStructure() {
    var side = document.getElementById('side');
    if (!side) return;
    var main = document.querySelector('#main');
    var key = (main ? 'chat' : 'lista');
    if (key === lastStruct) return;
    lastStruct = key;
    console.log('[kruzly] estructura (' + key + ')');
    var e = side, n = 0;
    while (e && e !== document.body && n++ < 10) {
      var kids = Array.prototype.map.call(e.parentElement ? e.parentElement.children : [], function (c) {
        return (c === e ? '*' : '') + describeEl(c) + (main && c.contains(main) ? ' [main]' : '');
      });
      console.log('[kruzly] n' + n + ' ' + describeEl(e) + ' hermanos: ' + kids.join(' | '));
      e = e.parentElement;
    }
  }
  // v16: vista de celular sobre la estructura real de WhatsApp Web (diagnóstico de Fede):
  //   DIV.two > [ HEADER (barra de iconos, 64 px) | paneles absolutos vacíos | panel de la lista (contiene #side) | panel del chat (contiene #main) ]
  // Solo se tocan 3 piezas: la barra HEADER, el panel de la lista y el panel del chat.
  // Cada una se pone a pantalla completa (position:fixed) o se oculta; nada más se modifica.
  // v23: la vista de celular del chat se desactiva: causaba temblor y ocultaba la caja de texto.
  // v25: con el build 17 la web ya se ajusta al teclado; se reactiva la vista de celular.
  var chatsDisabled = false, touched = [];
  function kzSet(e, props) {
    if (!e) return;
    for (var k in props) e.style.setProperty(k, props[k], 'important');
    if (touched.indexOf(e) < 0) touched.push(e);
    e.__kz = (e.__kz || []).concat(Object.keys(props));
  }
  function kzClearAll() {
    touched.forEach(function (e) { (e.__kz || []).forEach(function (k) { e.style.removeProperty(k); }); e.__kz = []; });
    touched = [];
  }
  // Medidas exactas en px (con zoom en <html>, "100%" de un elemento fixed salía mal en el WebView).
  // z-index 200: el panel vacío de la derecha tiene z-index 100 y tapaba la lista; los cajones de WhatsApp (300) quedan encima.
  function fullBox() {
    var Z = zoomNow();
    // v18: altura de lo visible (sin teclado); el teclado no empuja la página.
    var vh = Math.min(window.innerHeight, (window.visualViewport && window.visualViewport.height) || window.innerHeight);
    return { position: 'fixed', left: '0', top: '0', width: Math.floor(window.innerWidth / Z) + 'px', height: Math.floor(vh / Z) + 'px',
      'max-width': 'none', 'min-width': '0', margin: '0', 'z-index': '200', background: '#fff', border: '0', 'box-shadow': 'none', overflow: 'hidden' };
  }
  var lastMode = '', lastEls = {};
  function noPinch(on) {
    var m = document.querySelector('meta[name=viewport]');
    if (!m) return;
    var want = on ? 'width=1024, user-scalable=no' : 'width=1024';
    if (m.content !== want) m.content = want;
  }
  function mobileChats() {
    try { logStructure(); } catch (err) { console.log('[kruzly] estructura: ' + err); }
    if (chatsDisabled) return;
    var side = document.getElementById('side');
    var two = side && side.closest('.two');
    if (!two) { backButton(false); return; }
    var Z = zoomNow();
    var narrow = Z > 1 && (window.innerWidth / Z) < 700;
    var kids = Array.prototype.slice.call(two.children);
    var listCol = kids.filter(function (c) { return c.contains(side); })[0];
    var main = document.querySelector('#main');
    var chatCol = main ? kids.filter(function (c) { return c.contains(main); })[0] : null;
    var rail = kids.filter(function (c) { return c.tagName === 'HEADER'; })[0];
    var t = chatTitle();
    if (forcedListFor && t !== forcedListFor) forcedListFor = null;
    var chatOpen = !!chatCol && !forcedListFor && chatCol !== listCol;
    var mode = !narrow ? 'ancho' : (chatOpen ? 'chat' : 'lista');
    var sig = mode + '|' + (listCol ? 'L' : '-') + (chatCol ? 'C' : '-');
    if (sig === lastMode && lastEls.l === listCol && lastEls.c === chatCol && lastEls.z === Z) return;
    kzClearAll();
    lastMode = sig; lastEls = { l: listCol, c: chatCol, z: Z };
    noPinch(mode !== 'ancho');
    if (mode === 'ancho') { backButton(false); return; }
    if (!listCol) return;
    kzSet(rail, { display: 'none' });
    if (mode === 'lista') {
      kzSet(listCol, fullBox());
      // v26: tampoco se desplaza la página detrás de la lista (el diagnóstico la mostraba movida -858 px).
      kzSet(document.documentElement, { overflow: 'hidden' });
      window.scrollTo(0, 0);
      backButton(false);
    } else {
      kzSet(listCol, { display: 'none' });
      kzSet(chatCol, fullBox());
      // v18: la página no se desplaza (el teclado la subía y ocultaba el campo de texto).
      kzSet(document.documentElement, { overflow: 'hidden' });
      // v20: ocultar capas absolutas vacías del panel (una de ellas dibuja la línea vertical).
      kids.forEach(function (c) {
        if (c === listCol || c === chatCol || c === rail) return;
        if (c.contains(side) || (main && c.contains(main))) return;
        if (getComputedStyle(c).position !== 'absolute') return;
        if ((c.textContent || '').trim().length > 0) return;
        kzSet(c, { display: 'none' });
      });
      window.scrollTo(0, 0);
      var hd = document.querySelector('#main header');
      kzSet(hd, { 'padding-left': '52px' });
      if (hd && hd.firstElementChild) kzSet(hd.firstElementChild, { 'margin-left': '44px' });
      backButton(true);
    }
    // Red de seguridad: si lo que debería verse no mide nada, se deshace todo y no se vuelve a intentar.
    var vis = mode === 'lista' ? listCol : chatCol, r = vis.getBoundingClientRect();
    if (r.width < 50 || r.height < 50) {
      console.log('[kruzly] vista móvil: sin tamaño visible (' + Math.round(r.width) + 'x' + Math.round(r.height) + '), se desactiva');
      kzClearAll(); backButton(false); chatsDisabled = true; return;
    }
    console.log('[kruzly] vista móvil ' + mode + ' zoom=' + Z + ' visible=' + Math.round(r.width) + 'x' + Math.round(r.height));
  }
  // v22: al cambiar el tamaño (teclado, barra) solo se reajusta la altura de los paneles.
  // Antes se volvía a escribir la página entera y a desplazarla: eso hacía temblar la pantalla.
  function resizeBoxes() {
    if (!lastEls.l && !lastEls.c) return;
    if (lastMode.indexOf('chat') >= 0 && lastEls.c) kzSet(lastEls.c, fullBox());
    if (lastMode.indexOf('lista') >= 0 && lastEls.l) kzSet(lastEls.l, fullBox());
  }
  // v24: el build 17 achica la web cuando sale el teclado; las alturas forzadas se ajustan al nuevo tamaño
  // (solo escribe si cambia, sin bucles).
  // v26: el reacomodo al cambiar el tamaño entraba en bucle (cada reacomodo cambiaba el tamaño
  // otra vez) y todo temblaba. Ahora se espera a que el tamaño se quede quieto 400 ms, y si
  // aun así cambia más de 4 veces en 5 s, se deja de reacomodar hasta recargar.
  var rzTimer = null, rzCount = 0, rzStart = 0, rzFrozen = false, rzLog = [];
  window.addEventListener('resize', function () {
    rzLog.push(window.innerWidth + 'x' + window.innerHeight);
    if (rzLog.length > 8) rzLog.shift();
    if (rzFrozen) return;
    clearTimeout(rzTimer);
    rzTimer = setTimeout(function () {
      var now = Date.now();
      if (now - rzStart > 5000) { rzStart = now; rzCount = 0; }
      if (++rzCount > 4) {
        rzFrozen = true;
        console.log('[kruzly] tamaño en bucle, se deja de reacomodar: ' + rzLog.join(' '));
        return;
      }
      try { force(); resizeBoxes(); } catch (err) {}
      console.log('[kruzly] reacomodo ' + window.innerWidth + 'x' + window.innerHeight);
    }, 400);
  });
  var _ml = mobileLogin;
  mobileLogin = function () { _ml(); liftCard(); mobileChats(); };
  try { mobileLogin(); } catch (err) { console.log('[kruzly] zoom: ' + err); }
  setInterval(function () { try { mobileLogin(); } catch (err) {} }, 1000);
  setInterval(function () { try { mobileChats(); } catch (err) {} }, 300);

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
