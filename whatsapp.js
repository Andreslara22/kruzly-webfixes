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
// v7: v6 tocó un contenedor de toda la página; ahora toca el elemento más pequeño.
(function () {
  var V = 'v7';
  if (window.__kruzlyFixVersion === V) return;
  window.__kruzlyFixVersion = V;

  function h() { return Math.max(window.innerHeight || 0, (window.visualViewport && window.visualViewport.height) || 0, document.documentElement.clientHeight || 0) || 2000; }

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

  setTimeout(function () {
    var t = force();
    console.log('[kruzly] whatsapp.js ' + V + ' innerH=' + window.innerHeight + ' vvH=' + (window.visualViewport ? window.visualViewport.height : '-') +
      ' clientH=' + document.documentElement.clientHeight + ' screenH=' + screen.height);
    t.forEach(function (e, i) { console.log('[kruzly] nivel' + i + ' ' + rect(e)); });
  }, 2000);
})();
