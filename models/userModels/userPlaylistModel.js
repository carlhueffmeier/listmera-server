const mongo = require('./mongo.js');

async function setPlaylistAdmin(object) {
  const db = await mongo;
  await db
    .collection('users')
    .update({ username: object.username }, { $push: { adminOf: object.id } });
  return 201;
}

module.exports = setPlaylistAdmin;
