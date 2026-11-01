// Ajuste remoto para WhatsApp Web dentro de Kruzly (builds de prueba).
// La app baja este archivo y lo ejecuta en la página. Después de editarlo,
// en la app basta con tocar Recargar.
//
// v2: el diagnóstico mostró que <body> y sus dos primeros <div> miden 0 px de
// alto (overflow hidden), así que el login queda recortado. Forzamos la
// cadena de alturas al alto de la ventana.
(function () {
  var V = 'v2';
  if (window.__kruzlyFixVersion === V) return;
  window.__kruzlyFixVersion = V;

  var css = [
    'html { height: 100% !important; }',
    'body { height: 100vh !important; min-height: 100vh !important; margin: 0 !important; }',
    'body > div, body > div > div { height: 100% !important; min-height: 100% !important; }',
  ].join('\n');
  var st = document.getElementById('kruzly-fix') || document.createElement('style');
  st.id = 'kruzly-fix';
  st.textContent = css;
  (document.head || document.documentElement).appendChild(st);

  function rect(e) {
    if (!e) return 'null';
    var r = e.getBoundingClientRect();
    return e.tagName + ' ' + Math.round(r.width) + 'x' + Math.round(r.height);
  }
  setTimeout(function () {
    var first = document.body && document.body.querySelector(':scope > div');
    console.log('[kruzly] whatsapp.js ' + V + ' body=' + rect(document.body) + ' div1=' + rect(first) +
      ' div2=' + rect(first && first.querySelector(':scope > div')));
  }, 1500);
})();
