const API_BASE_URL = 'http://localhost:3000';

document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const email    = document.getElementById('loginEmail').value.trim();
            const password = document.getElementById('loginPassword').value;
            const btn      = loginForm.querySelector('.btn-login');

            // Estado cargando
            btn.textContent = 'Verificando...';
            btn.disabled    = true;
            ocultarError();

            try {
                const respuesta = await fetch(`${API_BASE_URL}/auth/login`, {
                    method:  'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body:    JSON.stringify({ email, password })
                });

                const data = await respuesta.json();

                if (!respuesta.ok) {
                    throw new Error(data.mensaje || 'Credenciales incorrectas.');
                }

                localStorage.setItem('token', data.token);
                localStorage.setItem('usuario', JSON.stringify({
                    nombre: data.usuario.nombres,
                    email,
                    rol:    data.usuario.rol
                }));

                // Éxito visual
                mostrarExito(`Bienvenido, ${data.usuario.nombres} 👋`);

                setTimeout(() => {
                    if (data.usuario.rol === 'ADMIN') {
                        window.location.href = 'admin.html';
                    } else if (data.usuario.rol === 'SECRETARIA') {
                        window.location.href = 'secretaria.html';
                    } else {
                        throw new Error('Rol no reconocido.');
                    }
                }, 900);

            } catch (error) {
                console.error('Error login:', error);
                mostrarError(error.message);
                btn.textContent = 'Entrar al Sistema';
                btn.disabled    = false;
            }
        });
    }
});

// ── Mensaje de error ──────────────────────────────────────────
function mostrarError(mensaje) {
    ocultarError();

    const wrap = document.getElementById('loginForm');
    if (!wrap) return;

    const div = document.createElement('div');
    div.id = 'login-msg';
    div.style.cssText = `
        display: flex;
        align-items: flex-start;
        gap: 12px;
        background: #fff5f5;
        border: 1.5px solid #fc8181;
        border-radius: 12px;
        padding: 14px 16px;
        margin-bottom: 20px;
        animation: slideDown 0.3s ease;
    `;
    div.innerHTML = `
        <span style="font-size:1.3rem;flex-shrink:0;margin-top:1px;">🔒</span>
        <div style="flex:1;">
            <p style="margin:0 0 2px;font-weight:700;color:#822727;font-size:0.88rem;">Acceso Denegado</p>
            <p style="margin:0;color:#c53030;font-size:0.83rem;line-height:1.4;">${mensaje}</p>
        </div>
        <button onclick="document.getElementById('login-msg').remove()"
            style="background:none;border:none;color:#fc8181;cursor:pointer;font-size:1.1rem;
                   padding:0;line-height:1;flex-shrink:0;">✕</button>
    `;

    // Insertar antes del primer form-group
    const primerGrupo = wrap.querySelector('.form-group');
    wrap.insertBefore(div, primerGrupo);

    // Auto cerrar en 5 segundos
    setTimeout(() => div?.remove(), 5000);
}

// ── Mensaje de éxito ──────────────────────────────────────────
function mostrarExito(mensaje) {
    ocultarError();

    const wrap = document.getElementById('loginForm');
    if (!wrap) return;

    const div = document.createElement('div');
    div.id = 'login-msg';
    div.style.cssText = `
        display: flex;
        align-items: center;
        gap: 12px;
        background: #f0fff4;
        border: 1.5px solid #9ae6b4;
        border-radius: 12px;
        padding: 14px 16px;
        margin-bottom: 20px;
        animation: slideDown 0.3s ease;
    `;
    div.innerHTML = `
        <span style="font-size:1.3rem;flex-shrink:0;">✅</span>
        <div>
            <p style="margin:0 0 2px;font-weight:700;color:#22543d;font-size:0.88rem;">Acceso Verificado</p>
            <p style="margin:0;color:#276749;font-size:0.83rem;">${mensaje} Redirigiendo...</p>
        </div>
    `;

    const primerGrupo = wrap.querySelector('.form-group');
    wrap.insertBefore(div, primerGrupo);
}

function ocultarError() {
    document.getElementById('login-msg')?.remove();
}