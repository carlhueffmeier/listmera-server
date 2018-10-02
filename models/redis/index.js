const client = require('redis').createClient(process.env.REDIS_URL);

client.on('error', err => {
  console.error(err);
});

client.on('connect', () => {
  console.log('REDIS LIVE');
});

module.exports = client;
