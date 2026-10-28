// carritoCheckout.js
// Carrito de compras y pago con PayPal.

const TIPO_CAMBIO = 504.56; // Colones por dólar. Actualizar con el tipo de cambio real.

let userId = null;
let totalColones = 0;
let paypalRenderizado = false;

document.addEventListener('DOMContentLoaded', async () => {
  const session = await iniciarApp();
  if (!session) return;

  userId = session.user.id;
  await cargarCarrito();

  document.getElementById('btn-vaciar').addEventListener('click', async () => {
    const respuesta = await Alerta.fire({
      icon: 'warning',
      title: '¿Vaciar el carrito?',
      text: 'Se quitarán todos los libros de tu carrito.',
      showCancelButton: true,
      confirmButtonText: 'Sí, vaciar'
    });

    if (!respuesta.isConfirmed) return;

    const { error } = await supabase
      .from('carrito')
      .delete()
      .eq('user_id', userId);

    if (error) {
      Alerta.fire({ icon: 'error', title: 'Error', text: 'No se pudo vaciar el carrito.' });
      return;
    }

    Toast.fire({ icon: 'success', title: 'Tu carrito quedó vacío' });
    await cargarCarrito();
  });
});

// Carga el carrito y muestra los productos
async function cargarCarrito() {
  const lista = document.getElementById('carrito-lista');
  const resumen = document.getElementById('resumen');
  const subtitulo = document.getElementById('carrito-subtitulo');

  const { data, error } = await supabase
    .from('carrito')
    .select('id, cantidad, libro:libro_id (titulo, autor, portada_url, precio, stock)')
    .eq('user_id', userId)
    .order('created_at', { ascending: true });

  await actualizarContadorCarrito(userId);

  if (error) {
    console.error('Error al cargar el carrito:', error.message);
    subtitulo.textContent = '';
    lista.innerHTML = estadoCarrito('fa-triangle-exclamation', 'No pudimos cargar tu carrito', 'Revisa tu conexión e intenta de nuevo.');
    resumen.hidden = true;
    return;
  }

  if (!data || data.length === 0) {
    totalColones = 0;
    subtitulo.textContent = 'Todavía no has agregado libros.';
    lista.innerHTML = estadoCarrito('fa-bag-shopping', 'Tu carrito está vacío', 'Explora el catálogo y encuentra tu próxima lectura.', true);
    resumen.hidden = true;
    return;
  }

  let total = 0;
  let articulos = 0;
  lista.innerHTML = '';

  for (const item of data) {
    const subtotal = item.cantidad * item.libro.precio;
    total += subtotal;
    articulos += item.cantidad;

    const div = document.createElement('article');
    div.className = 'cart-item card';
    div.dataset.id = item.id;

    div.innerHTML = `
      <img src="${escapeHTML(item.libro.portada_url || PORTADA_GENERICA)}" alt="Portada de ${escapeHTML(item.libro.titulo)}" />
      <div class="cart-item-info">
        <h3>${escapeHTML(item.libro.titulo)}</h3>
        <p class="autor">${escapeHTML(item.libro.autor)}</p>
        <p class="unitario">${formatearColones(item.libro.precio)} c/u</p>
      </div>
      <div class="qty" role="group" aria-label="Cantidad">
        <button class="btn-menos" aria-label="Quitar uno"><i class="fa-solid fa-minus"></i></button>
        <span>${item.cantidad}</span>
        <button class="btn-mas" aria-label="Agregar uno" ${item.cantidad >= item.libro.stock ? 'disabled' : ''}><i class="fa-solid fa-plus"></i></button>
      </div>
      <div class="cart-item-fin">
        <strong class="price subtotal">${formatearColones(subtotal)}</strong>
        <button class="btn-quitar">Quitar</button>
      </div>
    `;

    div.querySelector('img').addEventListener('error', (e) => {
      e.target.src = PORTADA_GENERICA;
    }, { once: true });

    div.querySelector('.btn-menos').addEventListener('click', () => modificarCantidad(item.id, item.cantidad - 1));
    div.querySelector('.btn-mas').addEventListener('click', () => modificarCantidad(item.id, item.cantidad + 1));
    div.querySelector('.btn-quitar').addEventListener('click', () => eliminarItem(item.id));

    lista.appendChild(div);
  }

  totalColones = total;
  const textoArticulos = `${articulos} ${articulos === 1 ? 'artículo' : 'artículos'}`;

  subtitulo.textContent = `Tienes ${textoArticulos} en tu carrito.`;
  document.getElementById('cantidad-articulos').textContent = textoArticulos;
  document.getElementById('subtotal-carrito').textContent = formatearColones(total);
  document.getElementById('total-carrito').textContent = formatearColones(total);
  document.getElementById('monto-usd').textContent = `≈ US$${(total / TIPO_CAMBIO).toFixed(2)} al pagar con PayPal`;
  resumen.hidden = false;

  renderizarPayPal();
}

function estadoCarrito(icono, titulo, texto, conBoton = false) {
  return `
    <div class="vacio">
      <span class="vacio-icono"><i class="fa-solid ${icono}"></i></span>
      <h3>${titulo}</h3>
      <p>${texto}</p>
      ${conBoton ? '<a href="/paginas/principal.html" class="btn btn-primary">Explorar catálogo</a>' : ''}
    </div>
  `;
}

// Modificar cantidad de un ítem en el carrito
async function modificarCantidad(id, nuevaCantidad) {
  if (nuevaCantidad < 1) {
    await eliminarItem(id);
    return;
  }

  const { error } = await supabase
    .from('carrito')
    .update({ cantidad: nuevaCantidad })
    .eq('id', id);

  if (!error) {
    await cargarCarrito();
  }
}

// Eliminar ítem del carrito (espera la animación de salida antes de recargar)
async function eliminarItem(id) {
  const itemDiv = document.querySelector(`[data-id="${id}"]`);
  itemDiv?.classList.add('saliendo');

  const [{ error }] = await Promise.all([
    supabase.from('carrito').delete().eq('id', id),
    new Promise(resolve => setTimeout(resolve, 300))
  ]);

  if (error) {
    itemDiv?.classList.remove('saliendo');
    Alerta.fire({ icon: 'error', title: 'Error', text: 'No se pudo quitar el libro del carrito.' });
    return;
  }

  await cargarCarrito();
}

// ---------- PayPal ----------

function renderizarPayPal() {
  if (paypalRenderizado) return;

  if (!window.paypal) {
    document.getElementById('paypal-button-container').innerHTML =
      '<p class="hint" style="text-align:center; padding-bottom:.65rem;">No se pudo cargar PayPal. Desactiva el bloqueador de anuncios y recarga la página.</p>';
    return;
  }

  paypalRenderizado = true;

  paypal.Buttons({
    style: { shape: 'pill', label: 'pay', height: 45 },

    createOrder: (data, actions) => {
      const totalUSD = totalColones / TIPO_CAMBIO;

      if (totalUSD <= 0 || isNaN(totalUSD)) {
        Alerta.fire({ icon: 'warning', title: 'Carrito vacío', text: 'No hay productos en el carrito para pagar.' });
        // Rechazar la creación del pedido para evitar error en PayPal
        return Promise.reject(new Error('Carrito vacío'));
      }

      return actions.order.create({
        purchase_units: [{
          amount: {
            value: totalUSD.toFixed(2),
            currency_code: 'USD'
          },
          description: 'Compra de libros - Entre Líneas'
        }]
      });
    },

    onApprove: async (data, actions) => {
      await actions.order.capture();

      // Se vuelve a leer el carrito y los precios desde la base de datos para guardar el pedido
      const { data: carrito, error: carritoError } = await supabase
        .from('carrito')
        .select('libro_id, cantidad')
        .eq('user_id', userId);

      if (carritoError || !carrito || carrito.length === 0) {
        console.error('Error al obtener carrito:', carritoError);
        Alerta.fire({ icon: 'warning', title: 'Carrito vacío', text: 'No hay productos para registrar en el pedido.' });
        return;
      }

      const { data: librosData, error: librosError } = await supabase
        .from('libros')
        .select('id, precio')
        .in('id', carrito.map(item => item.libro_id));

      if (librosError) {
        console.error('Error al obtener precios de libros:', librosError);
        return;
      }

      let total = 0;
      const detalle = carrito.map(item => {
        const libro = librosData.find(l => l.id === item.libro_id);
        const precio = libro ? libro.precio : 0;
        const subtotal = precio * item.cantidad;
        total += subtotal;
        return {
          libro_id: item.libro_id,
          cantidad: item.cantidad,
          precio_unitario: precio,
          subtotal
        };
      });

      // Pedido completo (con el detalle en JSON)
      const { error: pedidoError } = await supabase.from('pedidos').insert({
        user_id: userId,
        total,
        estado: 'Pagado',
        detalle
      });

      if (pedidoError) {
        console.error('Error al insertar pedido:', pedidoError);
        Alerta.fire({ icon: 'error', title: 'Error', text: 'El pago se realizó, pero no se pudo guardar el pedido. Contáctanos.' });
        return;
      }

      // Registro individual de cada libro comprado
      await supabase.from('compras').insert(
        carrito.map(item => ({ user_id: userId, libro_id: item.libro_id, cantidad: item.cantidad }))
      );

      await supabase.from('carrito').delete().eq('user_id', userId);

      await Alerta.fire({
        icon: 'success',
        title: '¡Pago exitoso!',
        text: 'Tu compra se realizó correctamente. Puedes ver el pedido en tu cuenta.',
        confirmButtonText: 'Ver mis pedidos'
      });
      window.location.href = '/paginas/cuenta.html#pedidos';
    },

    onCancel: () => {
      Alerta.fire({ icon: 'info', title: 'Pago cancelado', text: 'No se realizó ningún cobro.' });
    },

    onError: (err) => {
      console.error('PayPal error:', err);
      Alerta.fire({ icon: 'error', title: 'Error en el pago', text: 'Ocurrió un error al procesar el pago.' });
    }
  }).render('#paypal-button-container');
}
