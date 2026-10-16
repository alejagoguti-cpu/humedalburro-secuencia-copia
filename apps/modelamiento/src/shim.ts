// Solo para pruebas: ?rafshim=1 sustituye requestAnimationFrame por un temporizador (paneles ocultos pausan los fotogramas).
if (location.search.indexOf('rafshim') >= 0) {
  window.requestAnimationFrame = (cb: FrameRequestCallback) => window.setTimeout(() => cb(performance.now()), 16);
  window.cancelAnimationFrame = (id: number) => window.clearTimeout(id);
}
export {};
