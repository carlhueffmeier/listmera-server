const client = require('./redis.js');

async function createPlaylist(object) {
  await client.del(`playlist:${object.playlist}`);
  await client.del(`tracks:${object.bank}`);
  await client.del(`tracks:${object.tracks}`);
  await client.del(`collabs:${object.collabs}`);
  await client.srem('recent', object.playlist);
  return 'done';
}

module.exports = createPlaylist;
