// Auth.js

async function login(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (error) {

    let mensaje = error.message

    if (mensaje.includes('Email not confirmed')) {
      mensaje = 'Debes confirmar tu correo antes de iniciar sesión';
    } else if (mensaje.includes('Invalid login credentials')) {
      mensaje = 'Correo no registrado o contraseña incorrecta';
    }

    Swal.fire({
      icon: 'error',
      title: 'Error al iniciar sesión',
      text: mensaje,
      customClass: {
        popup: 'swal-custom'
      }
    }).then(() => {
      // Redirige cuando el usuario cierra el alert
      window.location.href = '/index.html';
    });

    throw error;
  }

  return data;
}

// Variable para bloquear registro mientras se procesa
let registeringInProgress = false;

async function register(full_name, username, email, password, confirmPassword) {
  if (registeringInProgress) {
    console.log('Registro ya en proceso, ignorando llamada duplicada.');
    return;
  }
  registeringInProgress = true;

  if (password !== confirmPassword) {
    Swal.fire({
      icon: 'warning',
      title: 'Las contraseñas no coinciden',
      text: 'Por favor verifica ambas contraseñas',
      customClass: {
        popup: 'swal-custom'
      }
    });

    registeringInProgress = false;
    return;
  }

  try {
    // Paso 1: Verificar que el username no esté en uso
    const { data: disponible, error: rpcError } = await supabase.rpc('username_disponible', {
      p_username: username
    });

    if (rpcError) {
      console.error('Error verificando username:', rpcError);
    }

    if (disponible === false) {
      Swal.fire({
        icon: 'error',
        title: 'Error al registrarse',
        text: 'Ya existe un usuario con este username, cámbialo para continuar',
        customClass: {
          popup: 'swal-custom'
        }
      });

      return;
    }

    // Paso 2: Crear usuario en Supabase Auth
    // (el trigger handle_new_user de la base de datos crea su fila en la tabla users)
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name, username }, // Se guarda en user_metadata
        emailRedirectTo: `https://entrelineaslib.netlify.app/index.html?confirmed=true`
      }
    });

    if (error) {

      let mensaje = error.message;

      if (mensaje.includes(`Password should be at least 12 characters. Password should contain at least one character of each: abcdefghijklmnopqrstuvwxyz, ABCDEFGHIJKLMNOPQRSTUVWXYZ, 0123456789, !@#$%^&*()_+-=[]{};':"|<>?,./\`~.`)) {
        mensaje = 'La contraseña debe tener al menos 12 caracteres y contener letras mayúsculas, minúsculas, números y símbolos.';
      } else if (mensaje.includes('Database error saving new user')) {
        mensaje = 'No se pudo guardar el usuario. Verifica que el username y el correo no estén en uso.';
      }


      Swal.fire({
        icon: 'error',
        title: 'Error al registrarse',
        text: mensaje,
        customClass: {
          popup: 'swal-custom'
        }
      });

      return;
    }

    // Paso 3: Si el correo ya estaba registrado, Supabase devuelve un usuario sin identidades
    if (data.user && data.user.identities?.length === 0) {
      Swal.fire({
        icon: 'error',
        title: 'Error al registrarse',
        text: 'Ya existe un usuario con este correo registrado, cámbialo para continuar',
        customClass: {
          popup: 'swal-custom'
        }
      });

      return;
    }

    Swal.fire({
      icon: 'success',
      title: 'Registro exitoso',
      text: 'Revisa tu correo para confirmar tu cuenta.',
      customClass: {
        popup: 'swal-custom'
      }
    }).then(() => {
      window.location.href = '/index.html';
    });

    // Limpiar el formulario
    limpiarFormularioRegistro();

  } finally {
    // Siempre desbloquea para que se pueda registrar de nuevo después
    registeringInProgress = false;
  }
}

document.getElementById("register-form").addEventListener("submit", async function (e) {
  e.preventDefault();

  const submitButton = this.querySelector('button[type="submit"]');
  submitButton.disabled = true;  // Deshabilita el botón para evitar doble submit

  const full_name = document.getElementById("full-name").value.trim();
  const username = document.getElementById("username").value.trim();
  const email = document.getElementById("email-register").value.trim();
  const password = document.getElementById("password-register").value;
  const confirmPassword = document.getElementById("confirm-password").value;

  try {
    await register(full_name, username, email, password, confirmPassword);
  } catch (err) {
    console.error(err);
  } finally {
    submitButton.disabled = false;  // Reactiva el botón cuando termine
  }
});

function limpiarFormularioRegistro() {
  document.getElementById("full-name").value = '';
  document.getElementById("username").value = '';
  document.getElementById("email-register").value = '';
  document.getElementById("password-register").value = '';
  document.getElementById("confirm-password").value = '';
}