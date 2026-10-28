// auth.js
// Llamadas a Supabase Auth. Los mensajes de error se traducen aquí para mostrarlos tal cual en la interfaz.

async function login(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    let mensaje = error.message;

    if (mensaje.includes('Email not confirmed')) {
      mensaje = 'Debes confirmar tu correo antes de iniciar sesión.';
    } else if (mensaje.includes('Invalid login credentials')) {
      mensaje = 'Correo no registrado o contraseña incorrecta.';
    }

    const err = new Error(mensaje);
    err.noConfirmado = error.message.includes('Email not confirmed');
    throw err;
  }

  return data;
}

// Devuelve true si la cuenta se creó (queda pendiente de confirmar por correo)
async function register(full_name, username, email, password) {
  // Paso 1: Verificar que el username no esté en uso
  const { data: disponible, error: rpcError } = await supabase.rpc('username_disponible', {
    p_username: username
  });

  if (rpcError) {
    console.error('Error verificando username:', rpcError);
  }

  if (disponible === false) {
    throw new Error('Ya existe un usuario con ese nombre de usuario, elige otro para continuar.');
  }

  // Paso 2: Crear usuario en Supabase Auth
  // (el trigger handle_new_user de la base de datos crea su fila en la tabla users)
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name, username }, // Se guarda en user_metadata (y queda disponible en el correo como {{ .Data.full_name }})
      emailRedirectTo: `${SITE_URL}/index.html?confirmed=true`
    }
  });

  if (error) {
    let mensaje = error.message;

    if (mensaje.startsWith('Password should')) {
      mensaje = 'La contraseña debe tener al menos 12 caracteres y contener mayúsculas, minúsculas, números y símbolos.';
    } else if (mensaje.includes('Database error saving new user')) {
      mensaje = 'No se pudo guardar el usuario. Verifica que el nombre de usuario y el correo no estén en uso.';
    } else if (mensaje.toLowerCase().includes('rate limit')) {
      mensaje = 'Se enviaron demasiados correos en poco tiempo. Intenta de nuevo en unos minutos.';
    } else if (mensaje.includes('Error sending confirmation email')) {
      mensaje = 'La cuenta no se pudo crear porque falló el envío del correo de confirmación. Intenta más tarde.';
    }

    throw new Error(mensaje);
  }

  // Paso 3: Si el correo ya estaba registrado, Supabase devuelve un usuario sin identidades
  if (data.user && data.user.identities?.length === 0) {
    throw new Error('Ya existe una cuenta con este correo. Inicia sesión o recupera tu contraseña.');
  }

  return true;
}

async function reenviarConfirmacion(email) {
  const { error } = await supabase.auth.resend({
    type: 'signup',
    email,
    options: { emailRedirectTo: `${SITE_URL}/index.html?confirmed=true` }
  });

  if (error) throw error;
}

async function enviarRecuperacion(email) {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${SITE_URL}/paginas/cambiar-contrase%C3%B1a.html`
  });

  if (error) throw error;
}
