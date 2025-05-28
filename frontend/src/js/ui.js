// UI helper functions

function setupNavbar() {
  const token = localStorage.getItem('token');
  const navLinks = $('#nav-links');
  navLinks.empty();

  if (!token) {
    // Utente non loggato
    navLinks.append('<li class="nav-item"><a class="nav-link" href="index.html">Home</a></li>');
    navLinks.append('<li class="nav-item"><a class="nav-link" href="login.html">Login</a></li>');
    navLinks.append('<li class="nav-item"><a class="nav-link" href="registrazione.html">Registrazione</a></li>');
    $('#logout-btn').addClass('d-none');
  } else {
    // Utente loggato: leggi ruolo da token
    const payload = parseJwt(token);
    if (!payload) {
      // token non valido
      localStorage.removeItem('token');
      window.location.href = 'login.html';
      return;
    }

    const role = payload.role;
    if (role === 'cliente') {
      navLinks.append('<li class="nav-item"><a class="nav-link" href="cliente_home.html">Home Cliente</a></li>');
      navLinks.append('<li class="nav-item"><a class="nav-link" href="catalogo.html">Catalogo</a></li>');
      navLinks.append('<li class="nav-item"><a class="nav-link" href="carrello.html">Carrello</a></li>');
      navLinks.append('<li class="nav-item"><a class="nav-link" href="profilo.html">Profilo</a></li>');
    } else if (role === 'artigiano') {
      navLinks.append('<li class="nav-item"><a class="nav-link" href="artigiano_dashboard.html">Dashboard Artigiano</a></li>');
      navLinks.append('<li class="nav-item"><a class="nav-link" href="catalogo.html">Catalogo</a></li>');
      navLinks.append('<li class="nav-item"><a class="nav-link" href="profilo.html">Profilo</a></li>');
    }
    $('#logout-btn').removeClass('d-none');
  }

  $('#logout-btn').off('click').on('click', function (e) {
    e.preventDefault();
    logout();
  });
}

function logout() {
  localStorage.removeItem('token');
  window.location.href = 'login.html';
}

function parseJwt(token) {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(function (c) {
          return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        })
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (e) {
    return null;
  }
}

function requireLogin(redirectPage = 'login.html') {
  const token = localStorage.getItem('token');
  if (!token) {
    window.location.href = redirectPage;
    return false;
  }
  return true;
}
