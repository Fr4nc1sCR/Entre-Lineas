// cuenta.js
// Perfil del usuario, historial de pedidos y eliminación de la cuenta.

document.addEventListener('DOMContentLoaded', async () => {
    const session = await iniciarApp();
    if (!session) return;

    const user = session.user;
    let nombreActual = user.user_metadata?.full_name || '';
    let usernameActual = user.user_metadata?.username || '';

    // El username guardado en la tabla users es la fuente confiable
    const { data: perfil, error: perfilError } = await supabase
        .from('users')
        .select('full_name, username')
        .eq('id', user.id)
        .maybeSingle();

    if (perfilError) {
        console.error('Error al obtener el perfil:', perfilError.message);
    } else if (perfil) {
        nombreActual = perfil.full_name || nombreActual;
        usernameActual = perfil.username || usernameActual;
    }

    const miembroDesde = new Date(user.created_at).toLocaleDateString('es-CR', { month: 'long', year: 'numeric' });
    document.getElementById('perfil-email').textContent = user.email;
    document.getElementById('perfil-desde').textContent = `Lector desde ${miembroDesde}`;
    document.getElementById('email').value = user.email;
    mostrarPerfil(nombreActual, usernameActual);

    // ---------- Guardar cambios ----------
    const formPerfil = document.getElementById('form-perfil');

    formPerfil.addEventListener('submit', async (e) => {
        e.preventDefault();

        const submitBtn = formPerfil.querySelector('button[type="submit"]');
        const nuevoNombre = document.getElementById('nombre').value.trim();
        const nuevoUsername = document.getElementById('username').value.trim().replace(/^@/, '');

        if (!nuevoNombre || !nuevoUsername) {
            Alerta.fire({ icon: 'warning', title: 'Campos incompletos', text: 'El nombre y el usuario son obligatorios.' });
            return;
        }

        if (!/^[a-zA-Z0-9._]{3,20}$/.test(nuevoUsername)) {
            Alerta.fire({
                icon: 'warning',
                title: 'Usuario no válido',
                text: 'El nombre de usuario debe tener entre 3 y 20 caracteres: letras, números, punto o guion bajo.'
            });
            return;
        }

        if (nuevoNombre === nombreActual && nuevoUsername === usernameActual) {
            Toast.fire({ icon: 'info', title: 'No hay cambios para guardar' });
            return;
        }

        setCargando(submitBtn, true);

        try {
            // Primero la tabla users: si el username ya existe, falla aquí por la restricción unique
            const { error: dbError } = await supabase
                .from('users')
                .update({
                    full_name: nuevoNombre,
                    username: nuevoUsername,
                    updated_at: new Date().toISOString()
                })
                .eq('id', user.id);

            if (dbError) {
                throw new Error(dbError.code === '23505'
                    ? 'Ese nombre de usuario ya está en uso, elige otro.'
                    : dbError.message);
            }

            // Después los metadatos de Supabase Auth (de ahí sale el saludo de la barra superior)
            const { error: authError } = await supabase.auth.updateUser({
                data: { full_name: nuevoNombre, username: nuevoUsername }
            });

            if (authError) throw authError;

            nombreActual = nuevoNombre;
            usernameActual = nuevoUsername;
            mostrarPerfil(nombreActual, usernameActual);
            mostrarUsuario(nombreActual, user.email);

            Toast.fire({ icon: 'success', title: 'Tu información se actualizó' });
        } catch (err) {
            Alerta.fire({ icon: 'error', title: 'No se pudo guardar', text: err.message });
        } finally {
            setCargando(submitBtn, false);
        }
    });

    // ---------- Pedidos ----------
    await cargarPedidos(user.id);

    if (window.location.hash === '#pedidos') {
        document.getElementById('pedidos').scrollIntoView({ behavior: 'smooth' });
    }

    // ---------- Eliminar cuenta ----------
    document.getElementById('btn-eliminar-cuenta').addEventListener('click', async (e) => {
        const boton = e.currentTarget;

        const confirmacion = await Alerta.fire({
            icon: 'warning',
            title: '¿Eliminar tu cuenta?',
            html: 'Se borrarán tu perfil, tu carrito y tus pedidos. <br>Escribe <strong>ELIMINAR</strong> para confirmar.',
            input: 'text',
            inputAttributes: { autocapitalize: 'characters', 'aria-label': 'Escribe ELIMINAR para confirmar' },
            customClass: {
                popup: 'swal-custom',
                actions: 'swal-actions',
                input: 'input',
                confirmButton: 'btn btn-danger',
                cancelButton: 'btn btn-ghost'
            },
            showCancelButton: true,
            confirmButtonText: 'Eliminar definitivamente',
            preConfirm: (valor) => {
                if (valor.trim().toUpperCase() !== 'ELIMINAR') {
                    Swal.showValidationMessage('Escribe ELIMINAR para continuar');
                    return false;
                }
                return true;
            }
        });

        if (!confirmacion.isConfirmed) return;

        setCargando(boton, true);

        const { data: { session } } = await supabase.auth.getSession();

        if (!session) {
            window.location.href = '/index.html';
            return;
        }

        try {
            // Función de Netlify (el token prueba que el usuario es quien dice ser)
            const response = await fetch('/.netlify/functions/eliminar-cuenta', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session.access_token}`
                }
            });

            const result = await response.json();
            if (!result.success) throw new Error(result.error || 'Ocurrió un error');

            // La sesión ya no es válida en el servidor; se limpia la local
            await supabase.auth.signOut({ scope: 'local' });

            await Alerta.fire({ icon: 'success', title: 'Cuenta eliminada', text: 'Gracias por haber leído con nosotros.' });
            window.location.href = '/index.html';
        } catch (err) {
            Alerta.fire({ icon: 'error', title: 'No se pudo eliminar la cuenta', text: err.message });
            setCargando(boton, false);
        }
    });
});

function mostrarPerfil(nombre, username) {
    document.getElementById('perfil-nombre').textContent = nombre || 'Lector';
    document.getElementById('perfil-iniciales').textContent = obtenerIniciales(nombre);
    document.getElementById('perfil-username').textContent = username || '—';
    document.getElementById('nombre').value = nombre;
    document.getElementById('username').value = username;
}

async function cargarPedidos(userId) {
    const lista = document.getElementById('lista-pedidos');
    const contador = document.getElementById('contador-pedidos');

    const { data: pedidos, error } = await supabase
        .from('pedidos')
        .select('*')
        .eq('user_id', userId)
        .order('fecha', { ascending: false });

    if (error) {
        console.error('Error al cargar pedidos:', error.message);
        lista.innerHTML = '<p class="muted">No pudimos cargar tus pedidos.</p>';
        return;
    }

    if (!pedidos || pedidos.length === 0) {
        lista.innerHTML = `
            <div class="vacio">
                <span class="vacio-icono"><i class="fa-solid fa-receipt"></i></span>
                <h3>Aún no tienes pedidos</h3>
                <p>Cuando completes una compra, aparecerá aquí.</p>
                <a href="/paginas/principal.html" class="btn btn-primary btn-sm">Explorar catálogo</a>
            </div>
        `;
        return;
    }

    contador.textContent = `${pedidos.length} ${pedidos.length === 1 ? 'pedido' : 'pedidos'}`;

    // Títulos solo de los libros que aparecen en los pedidos
    const ids = [...new Set(pedidos.flatMap(p => p.detalle.map(item => item.libro_id)))];
    const { data: librosData } = await supabase
        .from('libros')
        .select('id, titulo')
        .in('id', ids);

    const titulos = new Map((librosData || []).map(l => [l.id, l.titulo]));

    lista.innerHTML = pedidos.map(pedido => {
        const fecha = new Date(pedido.fecha).toLocaleDateString('es-CR', { day: 'numeric', month: 'short', year: 'numeric' });

        const items = pedido.detalle.map(item => `
            <li>
                <span>${escapeHTML(titulos.get(item.libro_id) || 'Libro no disponible')} × ${item.cantidad}</span>
                <span>${formatearColones(item.subtotal)}</span>
            </li>
        `).join('');

        return `
            <article class="pedido">
                <div class="pedido-top">
                    <div>
                        <strong>Pedido #${pedido.id}</strong>
                        <div class="pedido-fecha">${fecha}</div>
                    </div>
                    <span class="estado"><i class="fa-solid fa-circle-check"></i> ${escapeHTML(pedido.estado)}</span>
                </div>
                <ul>${items}</ul>
                <div class="pedido-total">
                    <span>Total</span>
                    <span>${formatearColones(pedido.total)}</span>
                </div>
            </article>
        `;
    }).join('');
}
