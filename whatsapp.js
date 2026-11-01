// Ajuste remoto para WhatsApp Web dentro de Kruzly (builds de prueba).
// La app baja este archivo y lo ejecuta en la página. Después de editarlo,
// en la app basta con tocar Recargar.
//
// v3: la hoja de estilos de v2 no cambió nada (body siguió en 0 px), así que
// ahora ponemos la altura como estilo en línea con !important sobre body y
// sus primeros contenedores, lo repetimos si WhatsApp lo vuelve a tocar, y
// reportamos qué hay en el atributo style y cuánto mide la ventana.
(function () {
  var V = 'v3';
  if (window.__kruzlyFixVersion === V) return;
  window.__kruzlyFixVersion = V;

  function h() { return Math.max(window.innerHeight || 0, (window.visualViewport && window.visualViewport.height) || 0, document.documentElement.clientHeight || 0) || 2000; }

  function force() {
    var px = h() + 'px';
    var targets = [document.documentElement, document.body];
    var d1 = document.body && document.body.querySelector(':scope > div');
    var d2 = d1 && d1.querySelector(':scope > div');
    if (d1) targets.push(d1);
    if (d2) targets.push(d2);
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
  setTimeout(function () {
    var t = force();
    console.log('[kruzly] whatsapp.js ' + V + ' innerH=' + window.innerHeight + ' vvH=' + (window.visualViewport ? window.visualViewport.height : '-') +
      ' clientH=' + document.documentElement.clientHeight + ' screenH=' + screen.height);
    t.forEach(function (e, i) { console.log('[kruzly] nivel' + i + ' ' + rect(e)); });
  }, 2000);
})();
