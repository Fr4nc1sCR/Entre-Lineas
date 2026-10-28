// recuperar.js
// Restablecer la contraseña desde el enlace que llega por correo.
// Supabase convierte ese enlace en una sesión temporal de recuperación al cargar la página.

const form = document.getElementById('reset-password-form');
const errorEnlace = new URLSearchParams(window.location.hash.slice(1)).get('error_code');

document.addEventListener('DOMContentLoaded', async () => {
  const { data: { session } } = await supabase.auth.getSession();

  if (errorEnlace || !session) {
    await Alerta.fire({
      icon: 'warning',
      title: errorEnlace === 'otp_expired' ? 'El enlace venció' : 'Enlace no válido',
      text: 'Solicita un nuevo enlace de recuperación desde la pantalla de inicio de sesión.',
      confirmButtonText: 'Ir al inicio de sesión',
      allowOutsideClick: false
    });
    window.location.href = '/index.html';
  }
});

form.addEventListener('submit', async (e) => {
  e.preventDefault();

  const submitBtn = form.querySelector('button[type="submit"]');
  const newPassword = document.getElementById('new-password').value;
  const confirmPassword = document.getElementById('confirm-password').value;

  if (!newPassword || !confirmPassword) {
    return Alerta.fire({ icon: 'warning', title: 'Campos requeridos', text: 'Por favor completa ambos campos.' });
  }

  if (!contrasenaValida(newPassword)) {
    return Alerta.fire({
      icon: 'warning',
      title: 'Contraseña muy débil',
      text: 'Debe tener al menos 12 caracteres e incluir mayúsculas, minúsculas, números y símbolos.'
    });
  }

  if (newPassword !== confirmPassword) {
    return Alerta.fire({ icon: 'error', title: 'Las contraseñas no coinciden', text: 'Asegúrate de que ambas contraseñas sean iguales.' });
  }

  setCargando(submitBtn, true);

  try {
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) throw error;

    // Se cierra la sesión de recuperación para que vuelva a entrar con la contraseña nueva
    await supabase.auth.signOut();

    await Alerta.fire({
      icon: 'success',
      title: 'Contraseña actualizada',
      text: 'Ya puedes iniciar sesión con tu nueva contraseña.',
      confirmButtonText: 'Iniciar sesión'
    });
    window.location.href = '/index.html';
  } catch (err) {
    console.error(err);

    const mensaje = err.message?.includes('different from the old password')
      ? 'La nueva contraseña debe ser distinta a la anterior.'
      : (err.message || 'No se pudo actualizar la contraseña.');

    Alerta.fire({ icon: 'error', title: 'Error', text: mensaje });
    setCargando(submitBtn, false);
  }
});
