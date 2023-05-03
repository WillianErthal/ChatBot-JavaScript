let pedidos = {};
let proximoPedidoId = 1;

function create(dados) {
  const pedidoId = proximoPedidoId++;
  pedidos[pedidoId] = { id: pedidoId, ...dados };
  return pedidoId;
}

function update(pedidoId, dados) {
  if (!pedidos[pedidoId]) {
    throw new Error('Pedido não encontrado');
  }
  pedidos[pedidoId] = { ...pedidos[pedidoId], ...dados };
  return pedidoId;
}

function get(pedidoId) {
  return pedidos[pedidoId];
}

module.exports = {
  create,
  update,
  get,
};