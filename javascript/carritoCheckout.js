// carritoCheckout.js

const supabase = window.supabase;

document.addEventListener("DOMContentLoaded", async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
        window.location.href = "/index.html";
        return;
    }

    const userId = session.user.id;
    await cargarCarrito(userId);

    document.getElementById('btn-volver').addEventListener("click", () => {
        window.location.href = '/paginas/principal.html';
    })

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
            await cargarCarrito(userId);
        }
    });

    // Aquí podrías manejar el botón de pago más adelante
    document.getElementById("btn-comprar").addEventListener("click", () => {
        Swal.fire("¡Gracias!", "Redirigiendo a método de pago...", "info");
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
        lista.innerHTML = "<p>Error al cargar el carrito.</p>";
        return;
    }

    if (!data || data.length === 0) {
        lista.innerHTML = "<p style='text-align: center;'>Tu carrito está vacío.</p>";
        totalTexto.textContent = "0";
        return;
    }

    let total = 0;

    for (const item of data) {
        const subtotal = item.cantidad * item.libro.precio;
        total += subtotal;

        const div = document.createElement("div");
        div.className = "carrito-item";

        div.innerHTML = `
      <img src="${item.libro.portada_url || '/img/portada-generica.jpg'}" alt="${item.libro.titulo}" />
      <div class="carrito-info">
        <h4>${item.libro.titulo}</h4>
        <p>${item.libro.autor}</p>
        <p>₡${item.libro.precio.toFixed(2)} x ${item.cantidad} = <strong>₡${subtotal.toFixed(2)}</strong></p>
      </div>
      <div class="carrito-controles">
        <button class="btn-menos">-</button>
        <span>${item.cantidad}</span>
        <button class="btn-mas">+</button>
        <button class="btn-eliminar">🗑️</button>
      </div>
    `;

        // Seleccionar botones para agregar event listeners
        const btnMenos = div.querySelector(".btn-menos");
        const btnMas = div.querySelector(".btn-mas");
        const btnEliminar = div.querySelector(".btn-eliminar");

        btnMenos.addEventListener("click", () => modificarCantidad(item.id, item.cantidad - 1));
        btnMas.addEventListener("click", () => modificarCantidad(item.id, item.cantidad + 1));
        btnEliminar.addEventListener("click", () => eliminarItem(item.id));

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
        const { data: { session } } = await supabase.auth.getSession();
        await cargarCarrito(session.user.id);
    }
}

async function eliminarItem(id) {
    const { error } = await supabase
        .from("carrito")
        .delete()
        .eq("id", id);

    if (!error) {
        const { data: { session } } = await supabase.auth.getSession();
        await cargarCarrito(session.user.id);
    }
}