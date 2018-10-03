const spotifyApi = require('./spotifyApi');

const scopes = [
  'user-read-private',
  'user-read-email',
  'playlist-read-private',
  'playlist-read-collaborative',
  'playlist-modify-public',
  'playlist-modify-private'
];
const state = 'prov-state';

function createAuthorizeUrl() {
  return spotifyApi.createAuthorizeURL(scopes, state);
}

module.exports = createAuthorizeUrl;
