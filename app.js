const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const pedidos = require('./pedidos');

const pizzaSizes = {
  1: 'Pequena',
  2: 'Média',
  3: 'Grande'
};

const pizzaFlavors = {
  1: 'Marguerita',
  2: 'Peperoni',
  3: 'Calabresa',
  4: 'Frango com Catupiry',
  5: 'Portuguesa',
  6: 'Quatro Queijos',
  7: 'Chocolate',
  8: 'Romeu e Julieta',
  9: 'Banana com Canela',
  10: 'Prestígio'
};

app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

io.on('connection', (socket) => {
  console.log(`Usuário conectado: ${socket.id}`);

  let userState = 'awaiting_size';
  let currentOrder = {};

  const sizesList = Object.entries(pizzaSizes)
    .map(([key, value]) => `${key} - ${value}`)
    .join('<br/>');
  socket.emit('resposta', `Pizzaria: Olá! Bem-vindo à pizzaria!<br/><br/>Aqui estão as nossas opções de tamanhos de pizza:<br/>${sizesList}<br/><br/>Por favor, escolha o tamanho da pizza digitando o número correspondente.`);

  socket.on('mensagem', (mensagem) => {
    console.log(`Usuário: ${mensagem}`);
    socket.emit('userMessage', `Usuário: ${mensagem}`);

    if (userState === 'awaiting_size' && pizzaSizes[mensagem]) {
      currentOrder.tamanho = pizzaSizes[mensagem];
      userState = 'awaiting_flavor';
      const flavorsList = Object.entries(pizzaFlavors)
        .map(([key, value]) => `${key} - ${value}`)
        .join('<br/>');
      socket.emit('resposta', `Você escolheu a pizza ${currentOrder.tamanho}.<br/><br/>Agora, escolha o sabor da pizza digitando o número correspondente:<br/>${flavorsList}`);
    } else if (userState === 'awaiting_flavor' && pizzaFlavors[mensagem]) {
      currentOrder.sabor = pizzaFlavors[mensagem];
      userState = 'awaiting_observation';
      socket.emit('resposta', 'Por favor, informe alguma observação adicional para o seu pedido (opcional).');
    } else if (userState === 'awaiting_observation') {
      currentOrder.observacao = mensagem;
      userState = 'awaiting_confirmation';
      socket.emit('resposta', 'Sua observação foi registrada.<br/>Deseja encerrar o pedido ou refazê-lo?<br/>Responda com "encerrar" ou "refazer".');
    } else if (userState === 'awaiting_confirmation' && mensagem === 'encerrar') {
      const pedidoId = pedidos.create(currentOrder);
      socket.emit('resposta', `Pedido encerrado. O número do seu pedido é ${pedidoId}. Obrigado por comprar na pizzaria!<br/>Se quiser verificar o status do seu pedido, digite o número do pedido.`);
      userState = 'awaiting_status_check';
    } else if (userState === 'awaiting_confirmation' && mensagem === 'refazer') {
      userState = 'awaiting_size';
      currentOrder = {};
      socket.emit('resposta', `Vamos começar um novo pedido.<br/><br/>Aqui estão as nossas opções de tamanhos de pizza:<br/>${sizesList}<br/><br/>Por favor, escolha o tamanho da pizza digitando o número correspondente.`);
    } else if (userState === 'awaiting_status_check') {
      const pedidoId = Number(mensagem);
      const pedido = pedidos.get(pedidoId);
      if (pedido) {
        socket.emit('resposta', `O status do seu pedido de número ${pedidoId} é: ${pedido.status}.<br/>Se quiser verificar o status de outro pedido, digite o número do pedido ou digite "novo" para fazer um novo pedido.`);
      } else {
        socket.emit('resposta', 'Desculpe, não foi possível encontrar um pedido com esse código. Digite o número do pedido corretamente ou digite "novo" para fazer um novo pedido.');
      }
    } else if (userState === 'awaiting_status_check' && mensagem === 'novo') {
      userState = 'awaiting_size';
      currentOrder = {};
      socket.emit('resposta', `Vamos começar um novo pedido.<br/><br/>Aqui estão as nossas opções de tamanhos de pizza:<br/>${sizesList}<br/><br/>Por favor, escolha o tamanho da pizza digitando o número correspondente.`);
    } else {
      socket.emit('resposta', 'Desculpe, não entendi sua resposta. Por favor, tente novamente.');
    }
  });
});

app.get('/', function (req, res) {
  res.sendFile(__dirname + '/index.html');
});

const port = 3000;
http.listen(port, () => {
  console.log(`Servidor rodando na porta ${port}`);
});

