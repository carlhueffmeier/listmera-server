const mongoose = require('mongoose');
mongoose.Promise = global.Promise;

const playlistSchema = new mongoose.Schema({
  id: {
    type: String,
    required: 'Playlist needs a valid ID'
  },
  name: {
    type: String,
    default: 'Unnamed Playlist'
  },
  tracks: [String]
});

const userSchema = new mongoose.Schema({
  spotifyId: {
    type: String,
    required: 'User needs an associated spotifyId'
  },
  name: {
    type: String,
    trim: true,
    required: 'User needs a name'
  },
  email: {
    type: String,
    trim: true,
    required: 'User needs an email address'
  },
  playlists: [playlistSchema],
  picture: String,
  refresh: String,
  token: String,
  adminOf: {
    type: [String],
    default: []
  }
});

module.exports = mongoose.model('User', userSchema);
