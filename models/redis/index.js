const { promisify } = require('util');
const client = require('redis').createClient(process.env.REDIS_URL);

client.on('error', err => {
  console.error(err);
});

client.on('connect', () => {
  console.log('REDIS LIVE');
});

const asyncMethods = {
  hgetallAsync: promisify(client.hgetall).bind(client),
  smembersAsync: promisify(client.smembers).bind(client),
  sismemberAsync: promisify(client.sismember).bind(client),
  SINTERAsync: promisify(client.SINTER).bind(client),
  sdiffAsync: promisify(client.sdiff).bind(client)
};

Object.assign(client, asyncMethods);
module.exports = client;
