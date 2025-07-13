const supabase = window.supabase;
let userId = null;

document.addEventListener("DOMContentLoaded", async () => {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    window.location.href = "/index.html";
    return;
  }

  userId = session.user.id;
  await cargarCarrito(userId);

  document.getElementById('btn-volver').addEventListener("click", () => {
    window.location.href = '/paginas/principal.html';
  });

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

  document.getElementById("btn-comprar").addEventListener("click", () => {
    Swal.fire({
      icon: 'info',
      title: '¡Gracias!',
      text: 'Redirigiendo a método de pago...',
      customClass: { popup: 'swal-custom' }
    });
  });
});

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

    // Agregar eventos
    div.querySelector(".btn-menos").addEventListener("click", () => modificarCantidad(item.id, item.cantidad - 1));
    div.querySelector(".btn-mas").addEventListener("click", () => modificarCantidad(item.id, item.cantidad + 1));
    div.querySelector(".btn-eliminar").addEventListener("click", () => eliminarItem(item.id));

    lista.appendChild(div);
  }

  totalTexto.textContent = total.toFixed(2);
}

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
    }, 300); // espera la animación
  }
}
