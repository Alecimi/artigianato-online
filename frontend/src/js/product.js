$(function () {
  if (!requireLogin()) return;

  const token = localStorage.getItem('token');
  const role = parseJwt(token).role;

  function loadProducts() {
    $.ajax({
      url: 'http://localhost:3000/api/products',
      method: 'GET',
      headers: { Authorization: 'Bearer ' + token },
      success: function (products) {
        renderProducts(products);
      },
      error: function () {
        $('#product-list').html('<p>Errore nel caricamento dei prodotti.</p>');
      },
    });
  }

  function renderProducts(products) {
    const container = $('#product-list');
    container.empty();

    if (products.length === 0) {
      container.html('<p>Nessun prodotto disponibile.</p>');
      return;
    }

    products.forEach((p) => {
      let card = `<div class="card">
        <div class="card-body">
          <h5 class="card-title">${escapeHtml(p.nome)}</h5>
          <h6 class="card-subtitle mb-2 text-muted">Artigiano: ${escapeHtml(p.artigiano_nome)}</h6>
          <p class="card-text">${escapeHtml(p.descrizione)}</p>
          <p class="card-text"><strong>Prezzo:</strong> €${p.prezzo.toFixed(2)}</p>`;

      if (role === 'cliente') {
        card += `<button class="btn btn-primary add-to-cart" data-id="${p.id}">Aggiungi al carrello</button>`;
      }

      if (role === 'artigiano') {
        card += `<small class="text-muted">Prodotto gestito da te.</small>`;
      }

      card += '</div></div>';

      container.append(card);
    });
  }

  // Escape HTML per sicurezza (evita XSS)
  function escapeHtml(text) {
    return $('<div>').text(text).html();
  }

  // Event handler aggiungi al carrello (da implementare)
  $(document).on('click', '.add-to-cart', function () {
    alert('Funzione carrello da implementare');
  });

  loadProducts();
});
