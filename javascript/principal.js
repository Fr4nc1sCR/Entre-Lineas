// principal.js
// Catálogo: carga de libros, búsqueda, orden, detalle y agregar al carrito.

let libros = [];
let userId = null;
let libroActual = null;

const grid = document.getElementById('libros-grid');
const modal = document.getElementById('modal-libro');

document.addEventListener('DOMContentLoaded', async () => {
  const session = await iniciarApp();
  if (!session) return;

  userId = session.user.id;

  const nombre = session.user.user_metadata?.full_name || '';
  document.getElementById('saludo-nombre').textContent = nombre.split(' ')[0] || 'lector';

  let espera;
  document.getElementById('buscar').addEventListener('input', () => {
    clearTimeout(espera);
    espera = setTimeout(renderizarLibros, 150);
  });
  document.getElementById('ordenar').addEventListener('change', renderizarLibros);

  await cargarLibros();
});

async function cargarLibros() {
  const { data, error } = await supabase
    .from('libros')
    .select('*')
    .order('titulo', { ascending: true });

  if (error) {
    console.error('Error al cargar libros:', error.message);
    grid.innerHTML = estadoVacio('fa-triangle-exclamation', 'No pudimos cargar el catálogo', 'Revisa tu conexión e intenta de nuevo.');
    return;
  }

  libros = data || [];
  renderizarLibros();
}

function librosFiltrados() {
  const texto = normalizar(document.getElementById('buscar').value);
  const orden = document.getElementById('ordenar').value;

  const resultado = libros.filter(libro =>
    normalizar(libro.titulo).includes(texto) || normalizar(libro.autor).includes(texto)
  );

  const comparadores = {
    'titulo': (a, b) => a.titulo.localeCompare(b.titulo, 'es'),
    'autor': (a, b) => a.autor.localeCompare(b.autor, 'es'),
    'precio-asc': (a, b) => a.precio - b.precio,
    'precio-desc': (a, b) => b.precio - a.precio,
    'fecha': (a, b) => (b.fecha_publicacion || '').localeCompare(a.fecha_publicacion || '')
  };

  return resultado.sort(comparadores[orden]);
}

// Ignora mayúsculas y tildes al buscar ("paramo" encuentra "Páramo")
function normalizar(texto) {
  return String(texto || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
}

function renderizarLibros() {
  const lista = librosFiltrados();
  const conteo = document.getElementById('conteo-libros');

  conteo.textContent = `${lista.length} ${lista.length === 1 ? 'título' : 'títulos'}`;

  if (libros.length === 0) {
    grid.innerHTML = estadoVacio('fa-book-open', 'El catálogo está vacío', 'Pronto agregaremos nuevos libros.');
    return;
  }

  if (lista.length === 0) {
    grid.innerHTML = estadoVacio('fa-magnifying-glass', 'Sin resultados', 'Prueba con otro título o autor.');
    return;
  }

  grid.innerHTML = '';

  lista.forEach((libro, i) => {
    const tarjeta = document.createElement('article');
    tarjeta.className = 'libro-card';
    tarjeta.tabIndex = 0;
    tarjeta.setAttribute('role', 'button');
    tarjeta.setAttribute('aria-label', `${libro.titulo}, de ${libro.autor}`);
    tarjeta.style.animationDelay = `${Math.min(i, 12) * 40}ms`;

    const agotado = libro.stock <= 0;
    const etiqueta = agotado
      ? '<span class="stock-tag agotado">Agotado</span>'
      : (libro.stock <= 3 ? '<span class="stock-tag">Últimas unidades</span>' : '');

    tarjeta.innerHTML = `
      <div class="libro-cover">
        ${etiqueta}
        <img src="${escapeHTML(libro.portada_url || PORTADA_GENERICA)}" alt="Portada de ${escapeHTML(libro.titulo)}" loading="lazy" />
      </div>
      <div class="libro-info">
        <h3>${escapeHTML(libro.titulo)}</h3>
        <p class="autor">${escapeHTML(libro.autor)}</p>
        <div class="libro-meta">
          <span class="price">${formatearColones(libro.precio)}</span>
          <button class="icon-btn btn-rapido" aria-label="Agregar ${escapeHTML(libro.titulo)} al carrito" ${agotado ? 'disabled' : ''}>
            <i class="fa-solid fa-plus"></i>
          </button>
        </div>
      </div>
    `;

    // Si la imagen no carga, se usa la portada genérica
    tarjeta.querySelector('img').addEventListener('error', (e) => {
      e.target.src = PORTADA_GENERICA;
    }, { once: true });

    tarjeta.addEventListener('click', () => abrirModal(libro));
    tarjeta.addEventListener('keydown', (e) => {
      if (e.target === tarjeta && (e.key === 'Enter' || e.key === ' ')) {
        e.preventDefault();
        abrirModal(libro);
      }
    });

    tarjeta.querySelector('.btn-rapido').addEventListener('click', (e) => {
      e.stopPropagation();
      agregarAlCarrito(libro, e.currentTarget);
    });

    aplicarEfectoHover(tarjeta);
    grid.appendChild(tarjeta);
  });
}

function estadoVacio(icono, titulo, texto) {
  return `
    <div class="vacio">
      <span class="vacio-icono"><i class="fa-solid ${icono}"></i></span>
      <h3>${titulo}</h3>
      <p>${texto}</p>
    </div>
  `;
}

// Inclina la portada siguiendo el cursor (solo en dispositivos con mouse)
function aplicarEfectoHover(tarjeta) {
  if (!window.matchMedia('(hover: hover) and (prefers-reduced-motion: no-preference)').matches) return;

  const portada = tarjeta.querySelector('.libro-cover');

  portada.addEventListener('mousemove', (e) => {
    const rect = portada.getBoundingClientRect();
    const rotateX = ((e.clientY - rect.top) / rect.height - 0.5) * -10;
    const rotateY = ((e.clientX - rect.left) / rect.width - 0.5) * 10;
    portada.style.transform = `perspective(700px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-6px)`;
  });

  portada.addEventListener('mouseleave', () => {
    portada.style.transform = '';
  });
}

// ---------- Detalle del libro ----------

function abrirModal(libro) {
  libroActual = libro;

  const portada = document.getElementById('modal-portada');
  portada.src = libro.portada_url || PORTADA_GENERICA;
  portada.alt = `Portada de ${libro.titulo}`;

  document.getElementById('modal-titulo').textContent = libro.titulo;
  document.getElementById('modal-autor').textContent = libro.autor;
  document.getElementById('modal-descripcion').textContent = libro.descripcion || 'Sin descripción.';
  document.getElementById('modal-editorial').textContent = libro.editorial || 'Desconocida';
  document.getElementById('modal-fecha').textContent = libro.fecha_publicacion?.slice(0, 4) || 'No disponible';
  document.getElementById('modal-idioma').textContent = libro.idioma || 'No disponible';
  document.getElementById('modal-isbn').textContent = libro.isbn || 'No disponible';
  document.getElementById('modal-stock').textContent = libro.stock > 0 ? `${libro.stock} unidades` : 'Agotado';
  document.getElementById('modal-precio').textContent = formatearColones(libro.precio);

  document.getElementById('btn-agregar-carrito').disabled = libro.stock <= 0;

  modal.showModal();
}

document.getElementById('cerrar-modal').addEventListener('click', () => modal.close());

// Cerrar al hacer clic fuera del contenido
modal.addEventListener('click', (e) => {
  if (e.target === modal) modal.close();
});

document.getElementById('btn-agregar-carrito').addEventListener('click', async (e) => {
  const agregado = await agregarAlCarrito(libroActual, e.currentTarget);
  if (agregado) modal.close();
});

// ---------- Carrito ----------

async function agregarAlCarrito(libro, boton) {
  setCargando(boton, true);

  try {
    // Verificar si el libro ya está en el carrito
    const { data: existente, error: fetchError } = await supabase
      .from('carrito')
      .select('id, cantidad')
      .eq('user_id', userId)
      .eq('libro_id', libro.id)
      .maybeSingle();

    if (fetchError) throw fetchError;

    const cantidadNueva = (existente?.cantidad || 0) + 1;

    if (cantidadNueva > libro.stock) {
      Alerta.fire({
        icon: 'info',
        title: 'Sin más unidades',
        text: `Ya tienes en tu carrito todas las unidades disponibles de "${libro.titulo}".`
      });
      return false;
    }

    const { error } = existente
      ? await supabase.from('carrito').update({ cantidad: cantidadNueva }).eq('id', existente.id)
      : await supabase.from('carrito').insert({ user_id: userId, libro_id: libro.id, cantidad: 1 });

    if (error) throw error;

    Toast.fire({ icon: 'success', title: `"${libro.titulo}" se agregó al carrito` });
    await actualizarContadorCarrito(userId);
    return true;
  } catch (err) {
    console.error('Error al agregar al carrito:', err.message);
    Alerta.fire({ icon: 'error', title: 'No se pudo agregar', text: 'Intenta de nuevo en un momento.' });
    return false;
  } finally {
    setCargando(boton, false);
  }
}
