(function () {
    const token = localStorage.getItem('token');
    
    if (!token) {
        console.warn("Acceso no autorizado. Redirigiendo al login...");
        window.location.href = 'index.html';
    }
})();