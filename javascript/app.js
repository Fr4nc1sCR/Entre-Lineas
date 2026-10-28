// app.js
// Lógica compartida por las páginas con sesión iniciada: verificación de sesión,
// barra superior (usuario, menú, carrito) y cierre de sesión.

// Devuelve la sesión activa o redirige al login si no hay una
async function iniciarApp() {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    window.location.href = '/index.html';
    return null;
  }

  const user = session.user;
  const nombre = user.user_metadata?.full_name || user.email || 'Lector';
  mostrarUsuario(nombre, user.email);

  configurarMenuUsuario();

  document.getElementById('logout-btn').addEventListener('click', async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      Alerta.fire({ icon: 'error', title: 'No se pudo cerrar sesión', text: error.message });
      return;
    }
    window.location.href = '/index.html';
  });

  await actualizarContadorCarrito(user.id);
  return session;
}

function mostrarUsuario(nombre, email) {
  document.getElementById('user-name').textContent = nombre;
  document.getElementById('user-initials').textContent = obtenerIniciales(nombre);
  if (email) document.getElementById('user-email').textContent = email;
}

function configurarMenuUsuario() {
  const boton = document.getElementById('user-menu-btn');
  const menu = document.getElementById('user-menu');

  const cerrar = () => {
    menu.hidden = true;
    boton.setAttribute('aria-expanded', 'false');
  };

  boton.addEventListener('click', (e) => {
    e.stopPropagation();
    menu.hidden = !menu.hidden;
    boton.setAttribute('aria-expanded', String(!menu.hidden));
  });

  document.addEventListener('click', (e) => {
    if (!menu.contains(e.target)) cerrar();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') cerrar();
  });
}

async function actualizarContadorCarrito(userId) {
  const contador = document.getElementById('contador-carrito');

  const { data: carrito, error } = await supabase
    .from('carrito')
    .select('cantidad')
    .eq('user_id', userId);

  if (error) {
    console.error('Error al obtener el carrito:', error.message);
    return;
  }

  const total = carrito.reduce((sum, item) => sum + (item.cantidad || 0), 0);
  const anterior = Number(contador.textContent);

  contador.textContent = total;
  contador.hidden = total === 0;

  // Pequeña animación cuando aumenta la cantidad
  if (total > anterior) {
    contador.classList.remove('pop');
    void contador.offsetWidth;
    contador.classList.add('pop');
  }
}
