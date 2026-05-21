const API_BASE_URL = 'http://localhost:3000'; 

document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');

    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault(); 

            const email    = document.getElementById('loginEmail').value.trim();
            const password = document.getElementById('loginPassword').value;

            try {
                const respuesta = await fetch(`${API_BASE_URL}/auth/login`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password })
                });

                const data = await respuesta.json();

                if (!respuesta.ok) {
                    throw new Error(data.mensaje || 'Credenciales incorrectas. Inténtalo de nuevo.');
                }

                localStorage.setItem('token', data.token);
                localStorage.setItem('usuario', JSON.stringify({
                    nombre: data.usuario.nombres,
                    email:  email,
                    rol:    data.usuario.rol
                }));

                // ── Redirigir según rol ───────────────────────────────
                if (data.usuario.rol === 'ADMIN') {
                    window.location.href = 'admin.html';
                } else if (data.usuario.rol === 'SECRETARIA') {
                    window.location.href = 'secretaria.html';
                } else {
                    throw new Error('Rol no reconocido en el sistema.');
                }

            } catch (error) {
                console.error('Error durante el login:', error);
                alert(`Error de Acceso: ${error.message}`);
            }
        });
    }
});
