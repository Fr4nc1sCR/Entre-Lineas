// login-register.js
// Interfaz de la pantalla de acceso: pestañas, formularios y confirmación de cuenta.

const loginForm = document.getElementById('login-form');
const registerForm = document.getElementById('register-form');
const forgotForm = document.getElementById('forgot-password-form');
const tabs = document.getElementById('tabs');
const formTitle = document.getElementById('form-title');
const formSubtitle = document.getElementById('form-subtitle');

const MODOS = {
  login: {
    form: loginForm,
    titulo: 'Bienvenido de vuelta',
    subtitulo: 'Inicia sesión para continuar leyendo.',
    foco: 'email'
  },
  register: {
    form: registerForm,
    titulo: 'Crea tu cuenta',
    subtitulo: 'Únete y empieza a armar tu biblioteca.',
    foco: 'full-name'
  },
  forgot: {
    form: forgotForm,
    titulo: 'Recupera tu contraseña',
    subtitulo: 'Te enviaremos un enlace para crear una nueva.',
    foco: 'email-reset'
  }
};

// Los errores de los enlaces de correo (por ejemplo, enlace vencido) llegan en el hash de la URL.
// Se leen antes de que Supabase limpie la URL.
const errorEnlace = new URLSearchParams(window.location.hash.slice(1));

function mostrarModo(modo) {
  const config = MODOS[modo];

  for (const { form } of Object.values(MODOS)) {
    form.hidden = form !== config.form;
  }

  tabs.hidden = modo === 'forgot';
  tabs.dataset.activo = modo;
  tabs.querySelectorAll('[role="tab"]').forEach(tab => {
    tab.setAttribute('aria-selected', String(tab.dataset.mode === modo));
  });

  formTitle.textContent = config.titulo;
  formSubtitle.textContent = config.subtitulo;
  document.getElementById(config.foco).focus();
}

window.addEventListener('DOMContentLoaded', async () => {
  tabs.addEventListener('click', (e) => {
    const tab = e.target.closest('[role="tab"]');
    if (tab) mostrarModo(tab.dataset.mode);
  });

  document.getElementById('forgot-password-link').addEventListener('click', (e) => {
    e.preventDefault();
    // Si ya escribió su correo en el login, se reutiliza
    document.getElementById('email-reset').value = document.getElementById('email').value.trim();
    mostrarModo('forgot');
  });

  document.getElementById('back-to-login').addEventListener('click', (e) => {
    e.preventDefault();
    mostrarModo('login');
  });

  // ---------- Login ----------
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const submitBtn = loginForm.querySelector('button[type="submit"]');
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('login-password').value;

    if (!email || !password) {
      Alerta.fire({ icon: 'warning', title: 'Campos incompletos', text: 'Por favor ingresa tu correo y contraseña.' });
      return;
    }

    setCargando(submitBtn, true);

    try {
      await login(email, password);
      window.location.href = '/paginas/principal.html';
    } catch (error) {
      setCargando(submitBtn, false);

      if (error.noConfirmado) {
        const respuesta = await Alerta.fire({
          icon: 'info',
          title: 'Confirma tu correo',
          text: `${error.message} ¿Quieres que te enviemos el enlace de nuevo a ${email}?`,
          showCancelButton: true,
          confirmButtonText: 'Reenviar correo',
          cancelButtonText: 'Ahora no'
        });

        if (respuesta.isConfirmed) {
          try {
            await reenviarConfirmacion(email);
            Toast.fire({ icon: 'success', title: 'Te enviamos un nuevo enlace de confirmación' });
          } catch (err) {
            Alerta.fire({ icon: 'error', title: 'No se pudo reenviar', text: err.message });
          }
        }
        return;
      }

      Alerta.fire({ icon: 'error', title: 'Error al iniciar sesión', text: error.message });
    }
  });

  // ---------- Registro ----------
  registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const submitBtn = registerForm.querySelector('button[type="submit"]');
    const full_name = document.getElementById('full-name').value.trim();
    const username = document.getElementById('username').value.trim().replace(/^@/, '');
    const email = document.getElementById('email-register').value.trim();
    const password = document.getElementById('password-register').value;
    const confirmPassword = document.getElementById('confirm-password').value;

    if (!full_name || !username || !email || !password || !confirmPassword) {
      Alerta.fire({ icon: 'warning', title: 'Campos incompletos', text: 'Por favor completa todos los campos.' });
      return;
    }

    if (!/^[a-zA-Z0-9._]{3,20}$/.test(username)) {
      Alerta.fire({
        icon: 'warning',
        title: 'Usuario no válido',
        text: 'El nombre de usuario debe tener entre 3 y 20 caracteres: letras, números, punto o guion bajo.'
      });
      return;
    }

    if (!contrasenaValida(password)) {
      Alerta.fire({
        icon: 'warning',
        title: 'Contraseña muy débil',
        text: 'Debe tener al menos 12 caracteres e incluir mayúsculas, minúsculas, números y símbolos.'
      });
      return;
    }

    if (password !== confirmPassword) {
      Alerta.fire({ icon: 'warning', title: 'Las contraseñas no coinciden', text: 'Por favor verifica ambas contraseñas.' });
      return;
    }

    setCargando(submitBtn, true);

    try {
      await register(full_name, username, email, password);

      registerForm.reset();
      registerForm.querySelectorAll('.requisitos li').forEach(li => li.classList.remove('ok'));

      await Alerta.fire({
        icon: 'success',
        title: '¡Ya casi!',
        html: `Te enviamos un correo a <strong>${escapeHTML(email)}</strong>.<br>Abre el enlace para activar tu cuenta.`,
        confirmButtonText: 'Entendido'
      });

      document.getElementById('email').value = email;
      mostrarModo('login');
    } catch (error) {
      Alerta.fire({ icon: 'error', title: 'Error al registrarse', text: error.message });
    } finally {
      setCargando(submitBtn, false);
    }
  });

  // ---------- Recuperar contraseña ----------
  forgotForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const submitBtn = document.getElementById('send-reset');
    const email = document.getElementById('email-reset').value.trim();

    if (!email) {
      Alerta.fire({ icon: 'warning', title: 'Correo requerido', text: 'Por favor ingresa tu correo para recuperar tu contraseña.' });
      return;
    }

    setCargando(submitBtn, true);

    try {
      await enviarRecuperacion(email);
      forgotForm.reset();

      await Alerta.fire({
        icon: 'success',
        title: 'Revisa tu correo',
        html: `Si <strong>${escapeHTML(email)}</strong> tiene una cuenta, recibirás un enlace para crear una nueva contraseña.`
      });

      mostrarModo('login');
    } catch (err) {
      console.error(err);
      Alerta.fire({ icon: 'error', title: 'No se pudo enviar el enlace', text: err.message || 'Intenta más tarde.' });
    } finally {
      setCargando(submitBtn, false);
    }
  });

  // ---------- Regreso desde el correo de confirmación ----------
  if (errorEnlace.get('error')) {
    const vencido = errorEnlace.get('error_code') === 'otp_expired';
    history.replaceState({}, document.title, window.location.pathname);

    Alerta.fire({
      icon: 'warning',
      title: vencido ? 'El enlace venció' : 'No pudimos validar el enlace',
      text: vencido
        ? 'Los enlaces de confirmación duran poco tiempo. Inicia sesión con tu correo y te ofreceremos enviarte uno nuevo.'
        : (errorEnlace.get('error_description') || 'Intenta de nuevo.')
    });
    return;
  }

  const confirmado = new URLSearchParams(window.location.search).get('confirmed') === 'true';

  if (confirmado) {
    // getUser espera a que Supabase procese el token del enlace; recién después se limpia la URL
    const { data } = await supabase.auth.getUser();
    history.replaceState({}, document.title, window.location.pathname);

    if (data?.user?.email_confirmed_at) {
      await Alerta.fire({
        icon: 'success',
        title: '¡Cuenta confirmada!',
        text: 'Tu correo quedó verificado. Ya puedes explorar el catálogo.',
        confirmButtonText: 'Ir al catálogo'
      });
      window.location.href = '/paginas/principal.html';
    } else {
      Alerta.fire({
        icon: 'info',
        title: 'Cuenta confirmada',
        text: 'Tu cuenta ya está verificada. Inicia sesión para continuar.'
      });
    }
    return;
  }

  // Si ya hay una sesión abierta, no tiene sentido mostrar el login
  const { data: { session } } = await supabase.auth.getSession();
  if (session) {
    window.location.replace('/paginas/principal.html');
    return;
  }

  document.getElementById('email').focus();
});
