// Principal.js

document.addEventListener("DOMContentLoaded", async () => {
  // Usar el cliente Supabase creado en supabaseClient.js
  const supabase = window.supabase;

  // Verifica si hay usuario logueado
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    // No hay sesión activa, redirige a login
    window.location.href = '/index.html';
    return;
  }

  // Usuario activo
  const user = session.user;
  const fullName = user.user_metadata?.full_name || user.email || "Lector";

  // Muestra nombre
  document.getElementById("user-name").textContent = fullName;

  // Manejo Logout
  const logoutBtn = document.getElementById("logout-btn");
  logoutBtn.addEventListener("click", async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      alert("Error al cerrar sesión: " + error.message);
    } else {
      window.location.href = '/index.html';
    }
  });

  // Efecto 3D hover en tarjetas
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

  // Toggle sidebar
  const themeToggle = document.getElementById("theme-toggle");

  // Cargar preferencia almacenada
  if (localStorage.getItem("theme") === "dark") {
    document.body.classList.add("dark-theme");
    themeToggle.checked = true;
  }

  themeToggle.addEventListener("change", () => {
    document.body.classList.toggle("dark-theme");

    // Guardar preferencia
    if (document.body.classList.contains("dark-theme")) {
      localStorage.setItem("theme", "dark");
    } else {
      localStorage.setItem("theme", "light");
    }
  });
});