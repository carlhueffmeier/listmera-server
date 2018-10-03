const getAudioFeatures = require('./getAudioFeatures');
const createPlaylist = require('./createPlaylist');
const registerNewUser = require('./registerNewUser');
const createAuthorizeUrl = require('./createAuthorizeUrl');

const spotifyService = {
  getAudioFeatures,
  // push a playlist in Redis to a users spotify account.
  createPlaylist,
  // Initialize spotify authentication flow and register user
  registerNewUser,
  // Returns URL for the first step of the authentication flow
  createAuthorizeUrl
};

module.exports = spotifyService;
