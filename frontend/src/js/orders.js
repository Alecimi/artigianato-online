function loadOrders(role, token) {
  $.ajax({
    url: 'http://localhost:3000/api/orders',
    method: 'GET',
    headers: { Authorization: 'Bearer ' + token },
    success: function (orders) {
      renderOrders(orders, role);
    },
    error: function () {
      $('#orders-list').html('<p>Errore nel caricamento degli ordini.</p>');
    },
  });
}

function renderOrders(orders, role) {
  const container = $('#orders-list');
  container.empty();

  if (orders.length === 0) {
    container.html('<p>Nessun ordine trovato.</p>');
    return;
  }

  const grouped = {};
  orders.forEach((item) => {
    if (!grouped[item.ordine_id]) grouped[item.ordine_id] = [];
    grouped[item.ordine_id].push(item);
  });

  for (const ordine_id in grouped) {
    const prodotti = grouped[ordine_id];
    const data = prodotti[0].data;

    let orderHtml = `<div class="card mb-3"><div class="card-body">`;
    orderHtml += `<h5>Ordine #${ordine_id} - ${new Date(data).toLocaleString()}</h5>`;
    orderHtml += `<ul class="list-group">`;

    prodotti.forEach((p) => {
      let otherName = role === 'cliente' ? p.artigiano_nome : p.cliente_nome;
      orderHtml += `<li class="list-group-item">${escapeHtml(p.prodotto_nome)} x${p.quantita} - €${(p.prezzo * p.quantita).toFixed(2)} <br><small>Con: ${escapeHtml(otherName)}</small></li>`;
    });

    orderHtml += `</ul></div></div>`;
    container.append(orderHtml);
  }
}

function escapeHtml(text) {
  return $('<div>').text(text).html();
}
