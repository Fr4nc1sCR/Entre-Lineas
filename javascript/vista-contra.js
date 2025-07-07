document.querySelectorAll('.toggle-password').forEach(toggle => {
    toggle.addEventListener('click', () => {
        const input = document.querySelector(toggle.getAttribute('toggle'));
        const eyeOpen = toggle.querySelector('.eye-open');
        const eyeClosed = toggle.querySelector('.eye-closed');

        if (input.type === 'password') {
            input.type = 'text';
            toggle.classList.add('show');
            eyeOpen.style.display = 'none';
            eyeClosed.style.display = 'block';
        } else {
            input.type = 'password';
            toggle.classList.remove('show');
            eyeOpen.style.display = 'block';
            eyeClosed.style.display = 'none';
        }
    });

    toggle.addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            toggle.click();
        }
    });
});