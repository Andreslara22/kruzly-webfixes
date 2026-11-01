// Ajuste remoto para WhatsApp Web dentro de Kruzly (builds de prueba).
// La app baja este archivo y lo ejecuta en la página. Después de editarlo,
// en la app basta con tocar Recargar.
//
// v4: v3 sí dio altura a body y al primer div, pero el login vive en OTRO
// hijo de body cuyos contenedores siguen en 0 px.
// v5: v4 estiraba de más (forzaba cajas de 43 px). Ahora solo se fuerzan
// las que miden 0, y como el QR no sirve en el mismo teléfono, se toca solo
// "Link with phone number instead" para ir directo al código.
(function () {
  var V = 'v5';
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
  var clicked = false;
  var clickTimer = setInterval(function () {
    if (clicked) { clearInterval(clickTimer); return; }
    var nodes = document.querySelectorAll('span, div, a, button');
    for (var i = 0; i < nodes.length; i++) {
      var n = nodes[i];
      if (n.children.length === 0 && /^(Link with phone number( instead)?\.?|Vincular con (el )?n[uú]mero de tel[eé]fono( en su lugar)?\.?)$/i.test((n.textContent || '').trim())) {
        var target = n.closest('[role="button"], button, a') || n;
        target.click();
        clicked = true;
        console.log('[kruzly] toque automático en "' + n.textContent.trim() + '"');
        break;
      }
    }
  }, 800);
  setTimeout(function () { clearInterval(clickTimer); }, 20000);

  setTimeout(function () {
    var t = force();
    console.log('[kruzly] whatsapp.js ' + V + ' innerH=' + window.innerHeight + ' vvH=' + (window.visualViewport ? window.visualViewport.height : '-') +
      ' clientH=' + document.documentElement.clientHeight + ' screenH=' + screen.height);
    t.forEach(function (e, i) { console.log('[kruzly] nivel' + i + ' ' + rect(e)); });
  }, 2000);
})();
