const spotifyService = require('../services/spotify');

async function initializeAuthorization(ctx) {
  const url = spotifyService.createAuthorizeUrl();
  ctx.redirect(url);
}

async function registerUser(ctx) {
  const user = await spotifyService.registerNewUser(ctx.request.body.code);
  ctx.response.body = {
    name: user.name,
    username: user.spotifyId,
    picture: user.picture,
    playlists: user.adminOf
  };
  ctx.status = 200;
}

exports.auth = initializeAuthorization;
exports.register = registerUser;
