const amqp = require('amqplib');

async function consumeMessage() {
  const connection = await amqp.connect('amqp://localhost');
  const channel = await connection.createChannel();

  const queue = 'send_message';

  await channel.assertQueue(queue);
  channel.consume(queue, (message) => {
    console.log('Received message:', message.content.toString());

    // Acknowledge the message
    channel.ack(message);
  });

  console.log('Consumer is listening for messages...');

  // Wait for the consumer to be interrupted (e.g., manually stop the program)
  await new Promise(() => {});
}

consumeMessage().catch((error) => {
  console.error('Error consuming message:', error);
});
