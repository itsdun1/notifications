const amqp = require('amqplib');
let channel;


async function getRabbitMqChannel() {
  // const ip = rabbitMqConfig.whatsappMaster;
  // const username = rabbitMqConfig.username;
  // const password = rabbitMqConfig.password;
  // const uri = 'amqp://' + username + ':' + password + '@' + ip;

  const conn = await amqp.connect('amqp://localhost');
  process.once('SIGINT', function() {
      conn.close();
  });
  return await conn.createChannel();
}

async function sendMessage(message) {
  // const connection = await amqp.connect('amqp://localhost');
  // const channel = await connection.createChannel();
  // console.log(message)
  if (!channel) {
    channel = await getRabbitMqChannel();
} 
  const queue = 'send_message';
//   const message = 'Hello, RabbitMQ!';
  console.log('Message before sent:', message);

  await channel.assertQueue(queue);
  channel.sendToQueue(queue, Buffer.from(JSON.stringify(message)), {persistent: true});
  console.log('Message sent:', message);

  // await channel.close();
  // await connection.close();
}

sendMessage().catch((error) => {
  console.error('Error sending message:', error);
});


module.exports = sendMessage;