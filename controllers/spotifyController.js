// contains basic spotify setup
const spotify = require('../secrets/spotifyConf.js');
const Spotify = require('../models/spotify');

const scopes = [
  'user-read-private',
  'user-read-email',
  'playlist-read-private',
  'playlist-read-collaborative',
  'playlist-modify-public',
  'playlist-modify-private'
];
const state = 'prov-state';

module.exports = {
  auth: async function(ctx) {
    const redirectUri = spotify.createAuthorizeURL(scopes, state);
    ctx.redirect(redirectUri);
  },

  register: async function(ctx) {
    const body = JSON.parse(ctx.request.body);
    const user = await Spotify.authenticate(body.code);
    ctx.response.body = {
      name: user.name,
      username: user.spotifyId,
      picture: user.picture,
      playlists: user.adminOf
    };
    ctx.status = 200;
  }
};
