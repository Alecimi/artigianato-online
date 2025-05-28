$(function () {
  $('#login-form').submit(function (e) {
    e.preventDefault();

    const email = $('#email').val().trim();
    const password = $('#password').val();

    $.ajax({
      url: 'http://localhost:3000/api/auth/login',
      method: 'POST',
      contentType: 'application/json',
      data: JSON.stringify({ email, password }),
      success: function (res) {
        localStorage.setItem('token', res.token);
        const role = parseJwt(res.token).role;
        if (role === 'cliente') {
          window.location.href = 'cliente_home.html';
        } else if (role === 'artigiano') {
          window.location.href = 'artigiano_dashboard.html';
        } else {
          window.location.href = 'index.html';
        }
      },
      error: function (xhr) {
        $('#error-message').text(xhr.responseJSON?.error || 'Errore durante login');
      },
    });
  });

  $('#register-form').submit(function (e) {
    e.preventDefault();

    const nome = $('#nome').val().trim();
    const email = $('#email').val().trim();
    const password = $('#password').val();
    const role = $('#role').val();

    $.ajax({
      url: 'http://localhost:3000/api/auth/register',
      method: 'POST',
      contentType: 'application/json',
      data: JSON.stringify({ nome, email, password, role }),
      success: function (res) {
        $('#success-message').text(res.message);
        $('#error-message').text('');
        $('#register-form')[0].reset();
      },
      error: function (xhr) {
        $('#error-message').text(xhr.responseJSON?.error || 'Errore durante registrazione');
        $('#success-message').text('');
      },
    });
  });
});
