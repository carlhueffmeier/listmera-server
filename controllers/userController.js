const User = require('../models/user');
const Playlist = require('../models/playlist');

async function getUser(ctx) {
  const username = ctx.headers.user;
  const user = await User.findById(username);

  if (!user) {
    ctx.status = 401;
  } else {
    const userPlaylists = await Promise.all(
      user.adminOf.map(playlistId => Playlist.display(playlistId))
    );
    const userResponse = {
      ...user.toObject(),
      adminOf: userPlaylists
    };
    ctx.response.body = userResponse;
    ctx.status = 200;
  }
}

async function modifyUser(ctx) {
  const { username, ...update } = ctx.request.body;
  await User.update(username, update);
  ctx.status = 200;
}

exports.get = getUser;
exports.modify = modifyUser;
