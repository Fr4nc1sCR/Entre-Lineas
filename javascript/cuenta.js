document.addEventListener("DOMContentLoaded", async () => {
    const supabase = window.supabase;

    // Verificar sesión
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
        window.location.href = '/index.html';
        return;
    }

    const user = session.user;
    const userId = session.user.id;

    // Mostrar nombre en saludo
    const fullName = user.user_metadata?.full_name || user.email || "Lector";
    document.getElementById("user-name").textContent = fullName;

    // Obtener y mostrar username desde la tabla personalizada
    try {
        const { data: userData, error: userError } = await supabase
            .from("users")
            .select("username")
            .eq("id", userId)
            .single();

        if (userError) {
            console.error("Error al obtener username:", userError.message);
        } else {
            document.getElementById("username").value = userData.username || "";
        }
    } catch (e) {
        console.error("Excepción al buscar username:", e.message);
    }


    // Prellenar campos
    document.getElementById("nombre").value = user.user_metadata?.full_name || "";
    document.getElementById("email").value = user.email;

    // G

    // Guardar cambios
    document.getElementById("form-perfil").addEventListener("submit", async (e) => {
        e.preventDefault();

        const nuevoNombre = document.getElementById("nombre").value.trim();
        const nuevoUsername = document.getElementById("username").value.trim();

        // Actualizar metadatos en Supabase Auth
        const { error: authError } = await supabase.auth.updateUser({
            data: {
                full_name: nuevoNombre,
                username: nuevoUsername
            }
        });

        if (authError) {
            Swal.fire("Error", authError.message, "error");
            return;
        }

        // ✅ También actualizar la tabla personalizada "users"
        const { error: dbError } = await supabase
            .from("users")
            .update({
                username: nuevoUsername,
                updated_at: new Date().toISOString()
            })
            .eq("id", userId);

        if (dbError) {
            Swal.fire("Error", dbError.message, "error");
            return;
        }

        // Mostrar nombre actualizado en el saludo
        document.getElementById("user-name").textContent = nuevoNombre;

        Swal.fire({
            icon: 'success',
            title: 'Actualizado!',
            text: 'Tu información personal ha sido actualizada correctamente!',
            confirmButtonText: 'Aceptar',
            customClass: {
                popup: 'swal-custom'
            }
        }).then(() => {
            window.location.href = '/paginas/cuenta.html';
        });
    });


    // Cargar pedidos
    await cargarPedidos(user.id);

    // Eliminar cuenta
    document.getElementById("btn-eliminar-cuenta").addEventListener("click", async () => {
        const confirmacion = await Swal.fire({
            title: "¿Estás seguro?",
            text: "Esta acción eliminará tu cuenta y todos tus datos.",
            icon: "warning",
            showCancelButton: true,
            confirmButtonText: "Sí, eliminar",
            cancelButtonText: "Cancelar",
            customClass: {
                popup: 'swal-custom'
            }
        });

        if (!confirmacion.isConfirmed) return;

        const { data: { session } } = await supabase.auth.getSession();

        const user = session?.user;

        if (!user) {
            Swal.fire({
                title: "Error",
                text: "No se pudo obtener el usuario",
                icon: "error",
                customClass: {
                    popup: 'swal-custom'
                }
            });
            return;
        }

        // Llamada a la función de Netlify
        const response = await fetch("/.netlify/functions/eliminar-cuenta", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ user_id: user.id })
        });

        const result = await response.json();

        if (result.success) {
            Swal.fire({
                title: "Cuenta eliminada", 
                text: "Tu cuenta ha sido eliminada.", 
                icon: "success",
                customClass: {
                    popup: 'swal-custom'
                }
            }).then(() => {
                window.location.href = "/index.html";
            });
        } else {
            Swal.fire("Error", result.error || "Ocurrió un error", "error");
        }
    });



    // Logout
    document.getElementById("logout-btn").addEventListener("click", async () => {
        const { error } = await supabase.auth.signOut();
        if (!error) {
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

    // Sidebar responsive
    document.getElementById("abrir-menu").addEventListener("click", () => {
        document.getElementById("sidebar").classList.add("open");
    });

    document.addEventListener("click", (e) => {
        const sidebar = document.getElementById("sidebar");
        const abrirBtn = document.getElementById("abrir-menu");
        if (!sidebar.contains(e.target) && !abrirBtn.contains(e.target)) {
            sidebar.classList.remove("open");
        }
    });

    // Contador de carrito
    await actualizarContadorCarrito();
});

async function cargarPedidos(userId) {
    const supabase = window.supabase;
    const lista = document.getElementById("lista-pedidos");

    const { data: pedidos, error } = await supabase
        .from("pedidos")
        .select("*")
        .eq("user_id", userId)
        .order("fecha", { ascending: false });

    if (error || !pedidos || pedidos.length === 0) {
        lista.innerHTML = "<p>No tienes pedidos registrados.</p>";
        return;
    }

    lista.innerHTML = pedidos.map(pedido => `
    <div class="pedido">
      <p><strong>ID:</strong> ${pedido.id}</p>
      <p><strong>Fecha:</strong> ${new Date(pedido.fecha).toLocaleDateString()}</p>
      <p><strong>Total:</strong> ₡${pedido.total?.toLocaleString() || '0'}</p>
    </div>
  `).join("");
}

async function actualizarContadorCarrito() {
    const supabase = window.supabase;
    const contador = document.getElementById("contador-carrito");

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
        contador.textContent = "0";
        return;
    }

    const userId = session.user.id;
    const { data: carrito, error } = await supabase
        .from("carrito")
        .select("cantidad")
        .eq("user_id", userId);

    if (error) {
        console.error("Error al obtener el carrito:", error.message);
        contador.textContent = "0";
        return;
    }

    const total = carrito.reduce((sum, item) => sum + (item.cantidad || 0), 0);
    contador.textContent = total;
}