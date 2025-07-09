document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.toggle-password').forEach(toggle => {
        const targetSelector = toggle.getAttribute('toggle');
        const input = document.querySelector(targetSelector);

        if (!input) return; // Por si el selector no encuentra nada

        const eyeOpen = toggle.querySelector('.eye-open');
        const eyeClosed = toggle.querySelector('.eye-closed');

        const toggleVisibility = () => {
            const isHidden = input.type === 'password';
            input.type = isHidden ? 'text' : 'password';
            eyeOpen.style.display = isHidden ? 'none' : 'inline';
            eyeClosed.style.display = isHidden ? 'inline' : 'none';

            // Agrega o quita la clase "show" para aplicar el estilo CSS
            toggle.classList.toggle('show', !isHidden);
        };
        
        // Clic con mouse
        toggle.addEventListener('click', toggleVisibility);

        // Soporte accesible: teclado (Enter o Espacio)
        toggle.addEventListener('keydown', e => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                toggleVisibility();
            }
        });
    });
});