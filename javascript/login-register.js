const loginForm = document.getElementById('login-form');
const registerForm = document.getElementById('register-form');
const formTitle = document.getElementById('form-title');
const toggleTextContainer = document.getElementById('toggle-text');

let isRegistering = false;

window.addEventListener('DOMContentLoaded', () => {
    loginForm.style.display = 'block';
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

            // Limpiar el formulario
            limpiarFormularioRegistro();

            submitBtn.disabled = false;
            return;
        }

        try {
            await register(full_name, username, email, password, confirmPassword);
            toggleForms(new Event('click')); // Cambia al formulario de login
        } catch (err) {
            console.error(err);
        } finally {
            submitBtn.disabled = false;
        }
    });
});

function toggleForms(e) {
    e.preventDefault();
    isRegistering = !isRegistering;

    if (isRegistering) {
        loginForm.classList.remove('visible');
        
        setTimeout(() => {
            loginForm.style.display = 'none';
            loginForm.setAttribute('aria-hidden', 'true');

            registerForm.style.display = 'block';
            registerForm.setAttribute('aria-hidden', 'false');

            // Forzar reflujo antes de añadir la clase para activar animación
            void registerForm.offsetWidth;
            registerForm.classList.add('visible');

            document.getElementById('full-name').focus();
        }, 400);

        formTitle.textContent = 'Crea tu cuenta';

        toggleTextContainer.textContent = '¿Ya tienes cuenta? ';
        const a = document.createElement('a');
        a.href = '#';
        a.id = 'toggle-link';
        a.textContent = 'Inicia sesión';
        toggleTextContainer.appendChild(a);

    } else {
        registerForm.classList.remove('visible');
        
        setTimeout(() => {
            registerForm.style.display = 'none';
            registerForm.setAttribute('aria-hidden', 'true');

            loginForm.style.display = 'block';
            loginForm.setAttribute('aria-hidden', 'false');

            void loginForm.offsetWidth;
            loginForm.classList.add('visible');

            document.getElementById('email').focus();
        }, 400);

        formTitle.textContent = 'Inicia sesión para continuar';

        toggleTextContainer.textContent = '¿No tienes cuenta? ';
        const a = document.createElement('a');
        a.href = '#';
        a.id = 'toggle-link';
        a.textContent = 'Regístrate';
        toggleTextContainer.appendChild(a);
    }
}

function limpiarFormularioRegistro() {
    document.getElementById("full-name").value = '';
    document.getElementById("username").value = '';
    document.getElementById("email-register").value = '';
    document.getElementById("password-register").value = '';
    document.getElementById("confirm-password").value = '';
}