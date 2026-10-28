// tema.js
// Se carga en el <head> (sin defer) para aplicar el tema antes de pintar la página y evitar el parpadeo.
// Si el usuario nunca eligió un tema, se respeta la preferencia del sistema operativo.

(function () {
  let tema = 'light';
  try {
    tema = localStorage.getItem('theme') ||
      (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  } catch (e) { }
  document.documentElement.dataset.theme = tema;
})();

function alternarTema() {
  const nuevo = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
  document.documentElement.dataset.theme = nuevo;
  try {
    localStorage.setItem('theme', nuevo);
  } catch (e) { }
}
