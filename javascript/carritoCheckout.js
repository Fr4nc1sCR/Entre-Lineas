const supabase = window.supabase;
let userId = null;

document.addEventListener("DOMContentLoaded", async () => {
  // Validar sesión
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    window.location.href = "/index.html";
    return;
  }

  userId = session.user.id;
  await cargarCarrito(userId);

  // Botón para volver a la página principal
  document.getElementById('btn-volver').addEventListener("click", () => {
    window.location.href = '/paginas/principal.html';
  });

  // Botón para vaciar el carrito
  document.getElementById("btn-vaciar").addEventListener("click", async () => {
    const { error } = await supabase
      .from("carrito")
      .delete()
      .eq("user_id", userId);

    if (!error) {
      Swal.fire({
        icon: 'success',
        title: 'Listo',
        text: 'Tu carrito ha sido vaciado!',
        customClass: { popup: 'swal-custom' }
      }).then(() => {
        window.location.href = '/paginas/principal.html';
      });
    }
  });

  // Renderizar botón PayPal directamente al cargar la página
  paypal.Buttons({
    createOrder: (data, actions) => {
      const totalColones = parseFloat(document.getElementById("total-carrito").textContent);
      const tipoCambio = 504.56; // Actualiza con el tipo de cambio real
      const totalUSD = totalColones / tipoCambio;

      if (totalUSD <= 0 || isNaN(totalUSD)) {
        Swal.fire({
          icon: 'warning',
          title: 'Carrito vacío',
          text: 'No hay productos en el carrito para pagar.',
          customClass: { popup: 'swal-custom' }
        });
        // Rechazar la creación del pedido para evitar error en PayPal
        return Promise.reject("Carrito vacío");
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
      const order = await actions.order.capture();

      // Obtener carrito para guardar la compra
      const { data: carrito, error: carritoError } = await supabase
        .from("carrito")
        .select("libro_id, cantidad")
        .eq("user_id", userId);

      if (carritoError) {
        console.error("Error al obtener carrito:", carritoError);
        return;
      }

      if (!carrito || carrito.length === 0) {
        Swal.fire({
          icon: 'warning',
          title: 'Carrito vacío',
          text: 'No hay productos para registrar en el pedido.'
        });
        return;
      }

      // Calcular total de la compra
      const { data: librosData, error: librosError } = await supabase
        .from("libros")
        .select("id, precio")
        .in("id", carrito.map(item => item.libro_id));

      if (librosError) {
        console.error("Error al obtener precios de libros:", librosError);
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

      // Insertar pedido completo en la tabla pedidos
      const { error: pedidoError } = await supabase.from("pedidos").insert([{
        user_id: userId,
        total,
        estado: "Pagado", // o el estado que manejes
        detalle: detalle, // guarda el arreglo JSON con detalle
        fecha: new Date().toISOString()
      }]);

      if (pedidoError) {
        console.error("Error al insertar pedido:", pedidoError);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'No se pudo guardar el pedido.'
        });
        return;
      }

      // Opcional: también insertar en "compras" si quieres detalle individual para otras funcionalidades
      for (const item of carrito) {
        await supabase.from("compras").insert({
          user_id: userId,
          libro_id: item.libro_id,
          cantidad: item.cantidad,
          fecha: new Date().toISOString()
        });
      }

      // Vaciar carrito
      await supabase.from("carrito").delete().eq("user_id", userId);

      Swal.fire({
        icon: 'success',
        title: '¡Pago exitoso!',
        text: 'Tu compra se ha realizado correctamente.',
        customClass: { popup: 'swal-custom' }
      }).then(() => {
        window.location.href = '/paginas/principal.html';
      });
    },

    onCancel: () => {
      Swal.fire({
        icon: 'info',
        title: 'Pago cancelado',
        text: 'No se realizó el pago.',
        customClass: { popup: 'swal-custom' }
      });
    },
    onError: (err) => {
      console.error("PayPal error:", err);
      Swal.fire({
        icon: 'error',
        title: 'Error en el pago',
        text: 'Ocurrió un error al procesar el pago.',
        customClass: { popup: 'swal-custom' }
      });
    }
  }).render('#paypal-button-container');

});

// Función para cargar el carrito y mostrar los productos
async function cargarCarrito(userId) {
  const lista = document.getElementById("carrito-lista");
  const totalTexto = document.getElementById("total-carrito");
  lista.innerHTML = "";

  const { data, error } = await supabase
    .from("carrito")
    .select("id, cantidad, libro:libro_id (titulo, autor, portada_url, precio)")
    .eq("user_id", userId);

  if (error) {
    console.error("Error al cargar el carrito:", error.message);
    lista.innerHTML = "<p class='carrito-vacio'>Error al cargar el carrito.</p>";
    return;
  }

  if (!data || data.length === 0) {
    lista.innerHTML = "<p class='carrito-vacio' style='text-align: center; margin-bottom: 0;'>🛒 Tu carrito está vacío. ¡Agregá algunos libros!</p>";
    totalTexto.textContent = "0";
    return;
  }

  let total = 0;

  for (const item of data) {
    const subtotal = item.cantidad * item.libro.precio;
    total += subtotal;

    const div = document.createElement("div");
    div.className = "carrito-item";
    div.setAttribute("data-id", item.id);

    div.innerHTML = `
      <img src="${item.libro.portada_url || '/img/portada-generica.jpg'}" alt="${item.libro.titulo}" />
      <div class="carrito-info">
        <h4>${item.libro.titulo}</h4>
        <p>${item.libro.autor}</p>
        <p class="precio">₡${item.libro.precio.toFixed(2)} x ${item.cantidad} = <strong>₡${subtotal.toFixed(2)}</strong></p>
      </div>
      <div class="carrito-controles">
        <button class="btn-menos"><i class="fas fa-minus"></i></button>
        <span>${item.cantidad}</span>
        <button class="btn-mas"><i class="fas fa-plus"></i></button>
        <button class="btn-eliminar"><i class="fas fa-trash"></i></button>
      </div>
    `;

    div.querySelector(".btn-menos").addEventListener("click", () => modificarCantidad(item.id, item.cantidad - 1));
    div.querySelector(".btn-mas").addEventListener("click", () => modificarCantidad(item.id, item.cantidad + 1));
    div.querySelector(".btn-eliminar").addEventListener("click", () => eliminarItem(item.id));

    lista.appendChild(div);
  }

  totalTexto.textContent = total.toFixed(2);
}

// Modificar cantidad de un ítem en el carrito
async function modificarCantidad(id, nuevaCantidad) {
  if (nuevaCantidad < 1) {
    await eliminarItem(id);
    return;
  }

  const { error } = await supabase
    .from("carrito")
    .update({ cantidad: nuevaCantidad })
    .eq("id", id);

  if (!error) {
    await cargarCarrito(userId);
  }
}

// Eliminar ítem del carrito
async function eliminarItem(id) {
  const itemDiv = document.querySelector(`[data-id="${id}"]`);
  if (itemDiv) {
    itemDiv.classList.add("fade-out");
    setTimeout(async () => {
      const { error } = await supabase
        .from("carrito")
        .delete()
        .eq("id", id);

      if (!error) {
        await cargarCarrito(userId);
      }
    }, 300); // espera la animación para que se vea el fade-out
  }
}