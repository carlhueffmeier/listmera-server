const spotifyApi = require('./spotifyApi');

// For details on the available scopes,
// see https://developer.spotify.com/documentation/general/guides/scopes/
const scopes = [
  'user-read-private',
  'user-read-email',
  'playlist-read-private',
  'playlist-read-collaborative',
  'playlist-modify-public',
  'playlist-modify-private'
];
// Optional value, see https://tools.ietf.org/html/rfc6749#section-4.1
const state = 'prov-state';

function createAuthorizeUrl() {
  return spotifyApi.createAuthorizeURL(scopes, state);
}

module.exports = createAuthorizeUrl;
