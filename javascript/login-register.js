// login-register.js

const loginForm = document.getElementById('login-form');
const registerForm = document.getElementById('register-form');
const formTitle = document.getElementById('form-title');
const toggleTextContainer = document.getElementById('toggle-text');
const pageContainer = document.getElementById('page-container');

let isRegistering = false;

window.addEventListener('DOMContentLoaded', () => {
    loginForm.closest('.form-page').classList.add('active');
    loginForm.style.display = 'block';

    // Aquí llamás a la función
    ajustarAlturaContenedor();

    requestAnimationFrame(() => {
        loginForm.classList.add('visible');
        document.getElementById('email').focus();
    });

    // Listener delegado para toggle
    toggleTextContainer.addEventListener('click', function (e) {
        if (e.target && e.target.id === 'toggle-link') {
            e.preventDefault();
            toggleForms(e);
        }
    });

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const submitBtn = loginForm.querySelector('button[type="submit"]');
        submitBtn.disabled = true;

        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value;

        if (!email || !password) {
            Swal.fire({
                icon: 'warning',
                title: 'Campos incompletos',
                text: 'Por favor ingresa correo y contraseña.',
                customClass: {
                    popup: 'swal-custom'
                }
            });

            // Limpiar el formulario
            limpiarFormularioRegistro();

            submitBtn.disabled = false;
            return;
        }

        try {
            const data = await login(email, password);
            Swal.fire({
                icon: 'success',
                title: 'Inicio de sesión exitoso',
                customClass: {
                    popup: 'swal-custom'
                }
            });

            // Limpiar el formulario
            limpiarFormularioRegistro();

            console.log('Usuario logueado:', data);
        } catch (error) {
            console.error(error);
        } finally {
            submitBtn.disabled = false;
        }
    });

    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const submitBtn = registerForm.querySelector('button[type="submit"]');
        submitBtn.disabled = true;

        const full_name = document.getElementById('full-name').value.trim();
        const username = document.getElementById('username').value.trim();
        const email = document.getElementById('email-register').value.trim();
        const password = document.getElementById('password-register').value;
        const confirmPassword = document.getElementById('confirm-password').value;

        if (!full_name || !username || !email || !password || !confirmPassword) {
            Swal.fire({
                icon: 'warning',
                title: 'Campos incompletos',
                text: 'Por favor completa todos los campos.',
                customClass: {
                    popup: 'swal-custom'
                }
            });

            limpiarFormularioRegistro();
            submitBtn.disabled = false;
            return;
        }

        try {
            const registrado = await register(full_name, username, email, password, confirmPassword);
            if (registrado) {
                toggleForms(new Event('click'));
                setTimeout(() => {
                    document.getElementById('email').focus();
                }, 500);
            }
        } catch (err) {
            console.error(err);
        } finally {
            submitBtn.disabled = false;
        }
    });

    // -------------- Confirmación de activación de correo con verificación real --------------
    const urlParams = new URLSearchParams(window.location.search);
    const confirmed = urlParams.get('confirmed');
    const email = urlParams.get('email');

    if (confirmed === 'true' && email) {
        fetch('https://tesgrczidahfjwrniijv.supabase.co/functions/v1/check-email-verification-ts', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRlc2dyY3ppZGFoZmp3cm5paWp2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE1MDU0NjYsImV4cCI6MjA2NzA4MTQ2Nn0.5kvXrymn7ahLu01E0hL0GTwD1LFyC5aCMMbSvecqnrA' // ¡IMPORTANTE!
            },
            body: JSON.stringify({ email })
        })
            .then(response => response.json())
            .then(data => {
                if (!data.success) {
                    Swal.fire({
                        icon: 'error',
                        title: 'Error',
                        text: data.message || 'No se pudo verificar el correo.',
                        customClass: {
                            popup: 'swal-custom'
                        }
                    });
                    return;
                }

                if (data.confirmado) {
                    Swal.fire({
                        icon: 'info',
                        title: 'Cuenta ya confirmada',
                        text: 'Este correo ya había sido verificado anteriormente.',
                        customClass: {
                            popup: 'swal-custom'
                        }
                    });
                } else {
                    Swal.fire({
                        icon: 'success',
                        title: 'Cuenta confirmada',
                        text: 'Tu cuenta ha sido confirmada correctamente. Ya puedes iniciar sesión.',
                        customClass: {
                            popup: 'swal-custom'
                        }
                    });
                }

                // Limpiar URL
                const url = new URL(window.location);
                url.searchParams.delete('confirmed');
                url.searchParams.delete('email');
                window.history.replaceState({}, document.title, url.toString());
            })
            .catch(error => {
                console.error('Error verificando correo:', error);
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: 'Ocurrió un problema al verificar el correo.',
                    customClass: {
                        popup: 'swal-custom'
                    }
                });
            });
    }
});

function toggleForms(e) {
    e.preventDefault();
    isRegistering = !isRegistering;

    const loginPage = document.querySelector('.form-page.front');
    const registerPage = document.querySelector('.form-page.back');

    // 👉 Alterna animación visual
    pageContainer.classList.toggle('flipped');

    // Actualiza título y texto
    if (isRegistering) {
        formTitle.textContent = 'Crea tu cuenta';
        toggleTextContainer.innerHTML = '¿Ya tienes cuenta? <a href="#" id="toggle-link">Inicia sesión</a>';

        loginPage.classList.remove('active');
        registerPage.classList.add('active');
    } else {
        formTitle.textContent = 'Inicia sesión para continuar';
        toggleTextContainer.innerHTML = '¿No tienes cuenta? <a href="#" id="toggle-link">Regístrate</a>';

        registerPage.classList.remove('active');
        loginPage.classList.add('active');
    }

    // 👉 Ajusta altura después de la animación
    setTimeout(ajustarAlturaContenedor, 50); // espera a que termine el flip
}

function limpiarFormularios() {
    // Registro
    document.getElementById("full-name").value = '';
    document.getElementById("username").value = '';
    document.getElementById("email-register").value = '';
    document.getElementById("password-register").value = '';
    document.getElementById("confirm-password").value = '';

    // Login
    document.getElementById("email").value = '';
    document.getElementById("password").value = '';
}

function ajustarAlturaContenedor() {
    const activeFormPage = document.querySelector('.form-page.active');
    if (!activeFormPage || !pageContainer) return;

    // Obtener altura del formulario activo
    const altura = activeFormPage.offsetHeight;

    // Asignarla al contenedor
    pageContainer.style.height = `${altura}px`;
}
