const mongo = require('./mongo.js');

async function modifyUserInfo(userId, object) {
  const db = await mongo;
  await db.collection('users').update(
    { username: userId },
    {
      $set: { ...object }
    }
  );
  return 200;
}

module.exports = modifyUserInfo;
