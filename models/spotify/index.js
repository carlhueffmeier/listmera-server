const getFeatures = require('./getFeatures');
const createPlaylist = require('./createPlaylist');
const authenticate = require('./authenticate');

const spotifyModel = {
  getFeatures,
  // push a playlist in Redis to a users spotify account.
  createPlaylist,
  // pushes user through authentication and login process via spotify and returns all the users details.
  authenticate
};

module.exports = spotifyModel;
