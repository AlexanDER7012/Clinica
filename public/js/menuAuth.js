export function verificarSesion() {
  const token = localStorage.getItem('token');
  const usuarioLogueado = JSON.parse(localStorage.getItem('usuario'));
  if (!token || !usuarioLogueado) { window.location.href = 'index.html'; return null; }

  const adminNameElement = document.getElementById('adminName');
  const adminAvatarElement = document.getElementById('adminAvatar');
  if (adminNameElement) adminNameElement.textContent = usuarioLogueado.nombre || 'Administrador';
  if (adminAvatarElement && usuarioLogueado.nombre) {
    const iniciales = usuarioLogueado.nombre.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
    adminAvatarElement.textContent = iniciales;
  }
  return token;
}

export function initLogout() {
  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', (e) => {
      e.preventDefault();
      localStorage.clear();
      window.location.href = 'index.html';
    });
  }
}
