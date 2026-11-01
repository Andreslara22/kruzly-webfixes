// Ajuste remoto para WhatsApp Web dentro de Kruzly (builds de prueba).
// La app baja este archivo desde el repo público kruzly-webfixes y lo ejecuta
// en la página. Edítalo ahí; en la app basta con tocar Recargar.
//
// v1: el login existe en el DOM pero su contenedor mide 0x0. Forzamos la
// cadena de alturas y reportamos las medidas en consola (salen en el diagnóstico).
(function () {
  var V = 'v1';
  if (window.__kruzlyFixVersion === V) return;
  window.__kruzlyFixVersion = V;

  var css = [
    'html, body { height: 100% !important; min-height: 100% !important; margin: 0 !important; }',
    '#app, #app > div, #app > div > div { height: 100% !important; min-height: 100vh !important; width: 100% !important; }',
  ].join('\n');
  var st = document.getElementById('kruzly-fix') || document.createElement('style');
  st.id = 'kruzly-fix';
  st.textContent = css;
  (document.head || document.documentElement).appendChild(st);

  function rect(e) {
    if (!e) return 'null';
    var r = e.getBoundingClientRect();
    return e.tagName + (e.id ? '#' + e.id : '') + ' ' + Math.round(r.width) + 'x' + Math.round(r.height);
  }
  setTimeout(function () {
    console.log('[kruzly] whatsapp.js ' + V + ' body=' + rect(document.body) + ' app=' + rect(document.getElementById('app')) +
      ' hijos=' + (document.getElementById('app') ? document.getElementById('app').children.length : '-'));
  }, 1500);
})();
