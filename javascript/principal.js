// Principal.js

document.addEventListener("DOMContentLoaded", async () => {
  const supabase = window.supabase;

  // Verificar sesión
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    window.location.href = '/index.html';
    return;
  }

  // Mostrar nombre
  const user = session.user;
  const fullName = user.user_metadata?.full_name || user.email || "Lector";
  document.getElementById("user-name").textContent = fullName;

  // Mostrar contador de carrito al cargar
  await actualizarContadorCarrito();

  // Logout
  const logoutBtn = document.getElementById("logout-btn");
  logoutBtn.addEventListener("click", async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      alert("Error al cerrar sesión: " + error.message);
    } else {
      window.location.href = '/index.html';
    }
  });

  // Modo oscuro
  const themeToggle = document.getElementById("theme-toggle");
  if (localStorage.getItem("theme") === "dark") {
    document.body.classList.add("dark-theme");
    themeToggle.checked = true;
  }

  themeToggle.addEventListener("change", () => {
    document.body.classList.toggle("dark-theme");
    localStorage.setItem("theme", document.body.classList.contains("dark-theme") ? "dark" : "light");
  });

  // Cargar libros desde Supabase
  await cargarLibros();
});

async function cargarLibros() {
  const supabase = window.supabase;
  const { data: libros, error } = await supabase
    .from('libros')
    .select('*')
    .order('titulo', { ascending: true });

  const contenedor = document.getElementById("libros-grid");

  if (error) {
    console.error("Error al cargar libros:", error.message);
    contenedor.innerHTML = "<p>Error al cargar libros</p>";
    return;
  }

  if (!libros || libros.length === 0) {
    contenedor.innerHTML = "<p>No hay libros disponibles en este momento.</p>";
    return;
  }

  libros.forEach(libro => {
    const tarjeta = document.createElement("article");
    tarjeta.classList.add("libro-card");

    tarjeta.innerHTML = `
      <img src="${libro.portada_url || '/img/portada-generica.jpg'}" alt="${libro.titulo}" />
      <div class="info">
        <h4>${libro.titulo}</h4>
        <p>${libro.autor}</p>
      </div>
    `;

    tarjeta.addEventListener("click", () => {
      document.getElementById("modal-portada").src = libro.portada_url || '/img/portada-generica.jpg';
      document.getElementById("modal-titulo").textContent = libro.titulo;
      document.getElementById("modal-autor").textContent = libro.autor;
      document.getElementById("modal-editorial").textContent = libro.editorial || "Desconocida";
      document.getElementById("modal-isbn").textContent = libro.isbn || "No disponible";
      document.getElementById("modal-idioma").textContent = libro.idioma;
      document.getElementById("modal-fecha").textContent = libro.fecha_publicacion || "No disponible";
      document.getElementById("modal-descripcion").textContent = libro.descripcion || "Sin descripción";
      document.getElementById("modal-precio").textContent = libro.precio.toFixed(2);
      document.getElementById("modal-stock").textContent = libro.stock;

      document.getElementById("modal-libro").style.display = "block";
      document.body.classList.add("no-scroll");

      const botonCarrito = document.getElementById("btn-agregar-carrito");
      botonCarrito.dataset.libroId = libro.id; // esto agrega el ID real
    });

    contenedor.appendChild(tarjeta);
  });

  aplicarEfectoHover();
}

async function actualizarContadorCarrito() {
  const supabase = window.supabase;
  const contador = document.getElementById("contador-carrito");

  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      contador.textContent = "0";
      return;
    }

    const userId = session.user.id;

    // Obtener todos los libros en el carrito del usuario
    const { data: carrito, error } = await supabase
      .from("carrito")
      .select("cantidad")
      .eq("user_id", userId);

    if (error) {
      console.error("Error al obtener el carrito:", error.message);
      contador.textContent = "0";
      return;
    }

    // Sumar cantidades de todos los libros
    const total = carrito.reduce((sum, item) => sum + (item.cantidad || 0), 0);
    contador.textContent = total;
  } catch (err) {
    console.error("Error general al contar el carrito:", err.message);
    document.getElementById("contador-carrito").textContent = "0";
  }
}

function aplicarEfectoHover() {
  const cards = document.querySelectorAll(".libro-card");

  cards.forEach((card) => {
    card.addEventListener("mousemove", (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const rotateX = (y - rect.height / 2) / -20;
      const rotateY = (x - rect.width / 2) / 20;
      card.style.transform = `perspective(600px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
    });

    card.addEventListener("mouseleave", () => {
      card.style.transform = "perspective(600px) rotateX(0deg) rotateY(0deg)";
    });
  });
}

// Botón para cerrar el modal
document.getElementById("cerrar-modal").addEventListener("click", () => {
  document.getElementById("modal-libro").style.display = "none";
  document.body.classList.remove("no-scroll");
});

// Cerrar modal al hacer clic fuera del contenido
const modal = document.getElementById("modal-libro");
modal.addEventListener("click", (e) => {
  if (e.target === modal) {
    modal.style.display = "none";
    document.body.classList.remove("no-scroll");
  }
});

// Botón "Agregar al carrito" en el modal
document.addEventListener("click", async (e) => {
  if (e.target.id === "btn-agregar-carrito") {
    const supabase = window.supabase;
    const { data: { session } } = await supabase.auth.getSession();
    const userId = session.user.id;

    const libroId = e.target.dataset.libroId;

    // Verificar si el libro ya está en el carrito
    const { data: existente, error: fetchError } = await supabase
      .from("carrito")
      .select("*")
      .eq("user_id", userId)
      .eq("libro_id", libroId)
      .single();

    if (fetchError && fetchError.code !== "PGRST116") {
      console.error("Error al consultar el carrito:", fetchError.message);
      return;
    }

    if (existente) {
      // Ya existe: actualizar cantidad
      const { error: updateError } = await supabase
        .from("carrito")
        .update({ cantidad: existente.cantidad + 1 })
        .eq("id", existente.id);

      if (updateError) {
        console.error("Error al actualizar carrito:", updateError.message);
        return;
      }
    } else {
      // No existe: agregar nuevo
      const { error: insertError } = await supabase
        .from("carrito")
        .insert({
          user_id: userId,
          libro_id: libroId,
          cantidad: 1
        });

      if (insertError) {
        console.error("Error al insertar en carrito:", insertError.message);
        return;
      }
    }

    // Mostrar alerta de éxito
    Swal.fire({
      icon: 'success',
      title: '¡Agregado!',
      text: 'El libro fue agregado al carrito.',
      confirmButtonText: 'Aceptar',
      customClass: {
        popup: 'swal-custom'
      }
    });

    document.getElementById("modal-libro").style.display = "none";
    document.body.classList.remove("no-scroll");

    // Actualiza el contador del carrito
    await actualizarContadorCarrito();
  }
});