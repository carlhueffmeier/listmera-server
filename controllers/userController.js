const User = require('../models/user');
const Playlist = require('../models/playlist');

module.exports = {
  get: async function(ctx) {
    const spotifyId = ctx.headers.user;
    const user = await User.findOne(spotifyId);
    if (!user) {
      ctx.status = 401;
    } else {
      user.adminOf = await Promise.all(user.adminOf.map(playlist => Playlist.display(playlist)));
      ctx.response.body = user;
      ctx.status = 200;
    }
  },

  modify: async function(ctx) {
    const body = JSON.parse(ctx.request.body);
    const { username, ...update } = body;
    await User.update(username, update);
    ctx.status = 200;
  }
};
