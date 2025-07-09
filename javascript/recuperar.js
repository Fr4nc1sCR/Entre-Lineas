const form = document.getElementById('reset-password-form');

form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const newPassword = document.getElementById('new-password').value.trim();
    const confirmPassword = document.getElementById('confirm-password').value.trim();

    if (!newPassword || !confirmPassword) {
        return Swal.fire({
            icon: 'warning',
            title: 'Campos requeridos',
            text: 'Por favor completa ambos campos.',
            customClass: { popup: 'swal-custom' }
        });
    }

    if (newPassword !== confirmPassword) {
        return Swal.fire({
            icon: 'error',
            title: 'Contraseñas no coinciden',
            text: 'Asegúrate de que ambas contraseñas sean iguales.',
            customClass: { popup: 'swal-custom' }
        });
    }

    try {
        const { data, error } = await supabase.auth.updateUser({ password: newPassword });

        if (error) throw error;

        Swal.fire({
            icon: 'success',
            title: 'Contraseña actualizada',
            text: 'Ahora puedes iniciar sesión con tu nueva contraseña.',
            customClass: { popup: 'swal-custom' }
        }).then(() => {
            window.location.href = 'https://entrelineaslib.netlify.app';
        });
    } catch (err) {
        console.error(err);
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: err.message || 'No se pudo actualizar la contraseña.',
            customClass: { popup: 'swal-custom' }
        });
    }
});