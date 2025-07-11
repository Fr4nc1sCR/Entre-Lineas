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
    } else if(mensaje.includes('Invalid login credentials')){
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

    // Limpiar el formulario
    limpiarFormularioRegistro();

    registeringInProgress = false;
    return;
  }

  try {
    // Paso 1: Crear usuario en Supabase Auth
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name }, // Se guarda en user_metadata
        emailRedirectTo: `https://entrelineaslib.netlify.app/index.html?confirmed=true`
      }
    });

    if (error) {
      Swal.fire({
        icon: 'error',
        title: 'Error al registrarse',
        text: error.message,
        customClass: {
          popup: 'swal-custom'
        }
      });

      // Limpiar el formulario
      limpiarFormularioRegistro();

      return;
    }

    const userId = data.user.id;

    // Paso 2: Verificar si ya existe el usuario en la tabla users
    const { data: existingUser, error: existError } = await supabase
      .from('users')
      .select('id')
      .eq('id', userId)
      .single();

    if (existError && !existingUser) {
      console.error('Error buscando usuario en tabla users:', existError);
    }

    if (!existingUser) {
      // Paso 3: Insertar en tabla users sólo si no existe
      const { error: insertError } = await supabase.from('users').insert({
        id: userId,
        full_name,
        username,
        email,
        password_hash: "auth",
        role: 2
      });

      if (insertError) {
        Swal.fire({
          icon: 'error',
          title: 'Error al guardar en la base de datos',
          text: insertError.message,
          customClass: {
            popup: 'swal-custom'
          }
        });

        // Limpiar el formulario
        limpiarFormularioRegistro();

        return;
      }
    } else {
      console.log('Usuario ya existe en la tabla users, no se inserta de nuevo.');
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