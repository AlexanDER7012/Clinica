const loginForm = document.getElementById('loginForm');

if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;

        try{

            const response = await fetch('http://localhost:3000/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({email,password })
            });

            const data = await response.json();

            if (response.ok) {

                localStorage.setItem('token', data.token);
                localStorage.setItem('usuario', JSON.stringify(data.usuario));
                
                alert("¡Bienvenido al sistema!");
                window.location.href = 'dashboard.html';
            } else {
                alert("Error: " + (data.mensaje || "Credenciales incorrectas"));
            }
        }catch(error){
            console.error("Error en la conexión:", error);
            alert("No se pudo conectar con el servidor.");
        }
    });
}