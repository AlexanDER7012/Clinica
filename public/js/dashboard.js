document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('token');
    const usuarioJson = localStorage.getItem('usuario');

    if(usuarioJson){
        const usuario = JSON.parse(usuarioJson);
        
        const nameElement = document.getElementById('userName');
        const emailElement = document.getElementById('userEmail');

        if (nameElement) nameElement.textContent = usuario.nombres;
        if (emailElement) emailElement.textContent = usuario.email;
    }


    const logoutBtn = document.getElementById('logoutBtn');
    if(logoutBtn){
        logoutBtn.addEventListener('click', () => {
            localStorage.clear();
            window.location.href = 'index.html';
        });
    }
});