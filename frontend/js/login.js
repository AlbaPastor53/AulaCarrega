const loginForm = document.getElementById('loginForm');
const loginMessage = document.getElementById('loginMessage');

const showMessage = (text, color = '#f87171') => {
  loginMessage.textContent = text;
  loginMessage.style.color = text ? color : '';
};

if (loginForm) {
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    showMessage('');

    const identity = document.getElementById('identity').value.trim();
    const car = document.getElementById('car').value.trim();
    const password = document.getElementById('password').value;

    if (!identity || !car || !password) {
      showMessage('Introdueix el NIA, la matrícula i la contrasenya');
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
        showMessage(data.message || 'Error d\'inici de sessió');
        return;
      }

      showMessage('Inici de sessió correcte', '#34d399');

      // Guardamos el token y el usuario para poder usar las rutas protegidas.
      if (data.token) {
        localStorage.setItem('token', data.token);
      }

      if (data.user) {
        localStorage.setItem('aulacarregaUser', JSON.stringify(data.user));
      }

     
      if (data.user.role === 'Admin') {
        window.location.href = 'dash_admin.html';
      } else {
        window.location.href = 'dash_user.html';
      }
    } catch (error) {
      console.error(error);
      showMessage('Error de connexió amb el servidor');
    }
  });
}
