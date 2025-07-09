// login-register.js

const loginForm = document.getElementById('login-form');
const registerForm = document.getElementById('register-form');
const formTitle = document.getElementById('form-title');
const toggleTextContainer = document.getElementById('toggle-text');
const pageContainer = document.getElementById('page-container');

window.addEventListener('DOMContentLoaded', () => {
    loginForm.closest('.form-page').classList.add('active');
    loginForm.style.display = 'block';

    ajustarAlturaContenedor();

    requestAnimationFrame(() => {
        loginForm.classList.add('visible');
        document.getElementById('email').focus();
    });

    // Listener para los links de login/register (delegado)
    toggleTextContainer.addEventListener('click', function (e) {
        if (e.target && e.target.id === 'toggle-link') {
            e.preventDefault();
            const mode = e.target.dataset.mode; // 'login' o 'register'
            toggleForms(mode);
        }
    });

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const submitBtn = loginForm.querySelector('button[type="submit"]');
        submitBtn.disabled = true;

        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('login-password').value;

        if (!email || !password) {
            Swal.fire({
                icon: 'warning',
                title: 'Campos incompletos',
                text: 'Por favor ingresa correo y contraseña.',
                customClass: { popup: 'swal-custom' }
            });

            limpiarFormularios();

            submitBtn.disabled = false;
            return;
        }

        try {
            const data = await login(email, password);
            Swal.fire({
                icon: 'success',
                title: 'Inicio de sesión exitoso',
                customClass: { popup: 'swal-custom' }
            }).then(() => {
                // Redirige cuando el usuario cierra el alert
                window.location.href = 'paginas/principal.html';
            });
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
                customClass: { popup: 'swal-custom' }
            });

            limpiarFormularios();
            submitBtn.disabled = false;
            return;
        }

        try {
            const registrado = await register(full_name, username, email, password, confirmPassword);
            if (registrado) {
                toggleForms('login');
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

    // Confirmación de activación de correo
    const urlParams = new URLSearchParams(window.location.search);
    const confirmed = urlParams.get('confirmed');

    if (confirmed === 'true') {
        const checkUserConfirmation = async () => {
            const { data, error } = await supabase.auth.getUser();

            if (error || !data?.user) {
                Swal.fire({
                    icon: 'info',
                    title: 'Cuenta ya confirmada',
                    text: 'Tu cuenta ya había sido verificada anteriormente. Puedes iniciar sesión.',
                    customClass: { popup: 'swal-custom' }
                });
            } else if (data.user.email_confirmed_at) {
                Swal.fire({
                    icon: 'success',
                    title: 'Cuenta confirmada',
                    text: 'Tu cuenta ha sido confirmada correctamente. Ya puedes iniciar sesión.',
                    customClass: { popup: 'swal-custom' }
                });
            } else {
                Swal.fire({
                    icon: 'warning',
                    title: 'Confirmación incompleta',
                    text: 'Hubo un problema confirmando tu cuenta. Intenta nuevamente.',
                    customClass: { popup: 'swal-custom' }
                });
            }

            const url = new URL(window.location);
            url.searchParams.delete('confirmed');
            window.history.replaceState({}, document.title, url.toString());
        };

        checkUserConfirmation();
    }

    // Link "¿Olvidaste tu contraseña?"
    document.getElementById('forgot-password-link').addEventListener('click', function (e) {
        e.preventDefault();
        toggleForms('forgot');
    });

    // Enviar enlace de recuperación
    document.getElementById('send-reset').addEventListener('click', async function () {
        const emailInput = document.getElementById('email-reset');
        const email = emailInput.value.trim();

        if (!email) {
            Swal.fire({
                icon: 'warning',
                title: 'Correo requerido',
                text: 'Por favor ingresa tu correo para recuperar tu contraseña.',
                customClass: { popup: 'swal-custom' }
            });
            return;
        }

        try {
            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: 'https://entrelineaslib.netlify.app/paginas/cambiar-contrase%C3%B1a.html'
            });

            if (error) {
                if (error.message.includes("User not found")) {
                    Swal.fire({
                        icon: 'warning',
                        title: 'Correo no encontrado',
                        text: 'El correo ingresado no está registrado.',
                        customClass: { popup: 'swal-custom' }
                    });
                } else if (error.message.includes("Email not confirmed")) {
                    Swal.fire({
                        icon: 'info',
                        title: 'Correo no confirmado',
                        text: 'Debes confirmar tu correo desde el enlace que se envió al registrarte.',
                        customClass: { popup: 'swal-custom' }
                    });
                } else {
                    throw error;
                }
                return;
            }

            Swal.fire({
                icon: 'success',
                title: 'Enlace enviado',
                text: 'Revisa tu correo electrónico para restablecer tu contraseña.',
                customClass: { popup: 'swal-custom' }
            }).then(() => {
                window.location.href = '/index.html';
            });

            emailInput.value = '';

        } catch (err) {
            console.error(err);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: err.message || 'No se pudo enviar el enlace. Intenta más tarde.',
                customClass: { popup: 'swal-custom' }
            });
        }
    });


    // Link "¿Recordaste tu contraseña?"
    document.getElementById('back-to-login').addEventListener('click', function (e) {
        e.preventDefault();
        toggleForms('login');
    });
});

function toggleForms(mode) {
    const loginPage = document.querySelector('.form-page.front');
    const registerPage = document.querySelector('.form-page.back');
    const forgotForm = document.getElementById('forgot-password-form');

    // Ocultar todos
    loginPage.style.display = 'none';
    registerPage.style.display = 'none';
    forgotForm.style.display = 'none';

    loginPage.classList.remove('active');
    registerPage.classList.remove('active');
    pageContainer.classList.remove('flipped');

    if (mode === 'login') {
        loginPage.style.display = 'block';
        loginPage.classList.add('active');
        formTitle.textContent = 'Inicia sesión para continuar';
        toggleTextContainer.innerHTML = '¿No tienes cuenta? <a href="#" id="toggle-link" data-mode="register">Regístrate</a>';
        document.querySelector('.register-link').style.display = 'block';
        document.querySelector('.forgot-password-link').style.display = 'block';
        document.getElementById('email')
    } else if (mode === 'register') {
        registerPage.style.display = 'block';
        registerPage.classList.add('active');
        pageContainer.classList.add('flipped');
        formTitle.textContent = 'Crea tu cuenta';
        toggleTextContainer.innerHTML = '¿Ya tienes cuenta? <a href="#" id="toggle-link" data-mode="login">Inicia sesión</a>';
        document.querySelector('.register-link').style.display = 'block';
        document.querySelector('.forgot-password-link').style.display = 'block';
        document.getElementById('full-name')
    } else if (mode === 'forgot') {
        forgotForm.style.display = 'block';
        formTitle.textContent = 'Recuperar contraseña';
        document.querySelector('.register-link').style.display = 'none';
        document.querySelector('.forgot-password-link').style.display = 'none';
        document.getElementById('email-reset')
    }

    setTimeout(ajustarAlturaContenedor, 50);
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
    let altura = 0;

    const pageContainer = document.getElementById('page-container');
    const activeFormPage = document.querySelector('.form-page.active');
    const forgotForm = document.getElementById('forgot-password-form');

    function getVisibleHeight(element) {
        if (!element) return 0;

        // Si el elemento está oculto con display:none, lo mostramos temporalmente para medir
        const estiloOriginal = element.style.display;
        if (estiloOriginal === 'none' || window.getComputedStyle(element).display === 'none') {
            element.style.display = 'block';
            const height = element.offsetHeight;
            element.style.display = estiloOriginal;
            return height;
        } else {
            return element.offsetHeight;
        }
    }

    if (activeFormPage && window.getComputedStyle(activeFormPage).display !== 'none') {
        altura = getVisibleHeight(activeFormPage);
    } else if (forgotForm && window.getComputedStyle(forgotForm).display !== 'none') {
        altura = getVisibleHeight(forgotForm);
    }

    if (pageContainer) {
        pageContainer.style.height = `${altura}px`;
    }
}