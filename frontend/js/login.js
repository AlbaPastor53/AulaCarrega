const loginForm = document.getElementById('loginForm');
const loginMessage = document.getElementById('loginMessage');

if (loginForm) {
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    loginMessage.textContent = '';
    loginMessage.style.color = '';

    const identity = document.getElementById('identity').value.trim();
    const car = document.getElementById('car').value.trim();
    const password = document.getElementById('password').value;

    if (!identity || !car || !password) {
      loginMessage.textContent = 'Introdueix el NIA, la matrícula i la contrasenya';
      loginMessage.style.color = '#f87171';
      return;
    }

    try {
      const res = await fetch('http://localhost:3000/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ identity, car, password })
      });

      const data = await res.json();

      if (!res.ok) {
        loginMessage.textContent = data.message || 'Error d\'inici de sessió';
        loginMessage.style.color = '#f87171';
        return;
      }

      loginMessage.textContent = 'Inici de sessió correcte';
      loginMessage.style.color = '#34d399';

      // Guardamos el token y el usuario para poder usar las rutas protegidas.
      if (data.token) {
        localStorage.setItem('token', data.token);
      }

      if (data.user) {
        localStorage.setItem('aulacarregaUser', JSON.stringify(data.user));
      }

      // Los administradores entran directamente al panel.
      if (data.user.role === 'Admin') {
        window.location.href = 'dash_admin.html';
      } else {
        // Los usuarios normales entran al dashboard.
        window.location.href = 'dash_user.html';
      }
    } catch (error) {
      console.error(error);
      loginMessage.textContent = 'Error de connexió amb el servidor';
      loginMessage.style.color = '#f87171';
    }
  });
}
