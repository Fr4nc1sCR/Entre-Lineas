// vista-contra.js
// Mostrar / ocultar contraseñas y validar sus requisitos en vivo.

const ICONO_OJO = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>';
const ICONO_OJO_TACHADO = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.94 10.94 0 0 1 12 20c-7 0-11-8-11-8a18.5 18.5 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19M14.12 14.12a3 3 0 1 1-4.24-4.24"/><path d="M1 1l22 22"/></svg>';

// Los mismos requisitos que exige Supabase (Authentication > Policies > Password)
const REQUISITOS_CONTRASENA = {
  largo: c => c.length >= 12,
  minuscula: c => /[a-z]/.test(c),
  mayuscula: c => /[A-Z]/.test(c),
  numero: c => /[0-9]/.test(c),
  simbolo: c => /[^A-Za-z0-9]/.test(c)
};

function contrasenaValida(contrasena) {
  return Object.values(REQUISITOS_CONTRASENA).every(cumple => cumple(contrasena));
}

// Marca en verde cada requisito de la lista <ul class="requisitos"> a medida que se cumple
function vincularRequisitos(input, lista) {
  input.addEventListener('input', () => {
    for (const [clave, cumple] of Object.entries(REQUISITOS_CONTRASENA)) {
      lista.querySelector(`[data-req="${clave}"]`)?.classList.toggle('ok', cumple(input.value));
    }
  });
}

document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.toggle-password').forEach(boton => {
    const input = document.querySelector(boton.dataset.target);
    if (!input) return;

    boton.innerHTML = ICONO_OJO;

    boton.addEventListener('click', () => {
      const oculta = input.type === 'password';
      input.type = oculta ? 'text' : 'password';
      boton.innerHTML = oculta ? ICONO_OJO_TACHADO : ICONO_OJO;
      boton.setAttribute('aria-label', oculta ? 'Ocultar contraseña' : 'Mostrar contraseña');
    });
  });

  document.querySelectorAll('[data-requisitos]').forEach(input => {
    const lista = document.querySelector(input.dataset.requisitos);
    if (lista) vincularRequisitos(input, lista);
  });
});
