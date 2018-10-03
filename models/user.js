const mongoose = require('mongoose');
const User = mongoose.model('User');
const Track = mongoose.model('Track');

const userModel = {
  findById,
  update,
  register,
  addAdmin,
  removeAdmin
};

module.exports = userModel;

function findById(spotifyId) {
  return User.findOne({ spotifyId });
}

function update(spotifyId, changes) {
  return User.findOneAndUpdate({ spotifyId }, changes, { new: true });
}

// Create a new user and add all his/her songs to the database
async function register(user) {
  await Promise.all(user.playlists.map(addMissingTracksToDatabase));
  const playlists = user.playlists.map(replaceTracksWithTrackIds);
  return new User({ ...user, spotifyId: user.username, playlists }).save();
}

function addMissingTracksToDatabase(playlist) {
  // Returns a Promise that resolves when all missing tracks are successfully added
  return Promise.all(
    playlist.tracks.map(async track => {
      // Check whether track exists
      const exists = await Track.findOne({ trackId: track.id });
      // If not, add it
      if (!exists) {
        return new Track({ ...track, trackId: track.id }).save();
      }
    })
  );
}

// We only want to store the ids
function replaceTracksWithTrackIds(playlist) {
  return {
    ...playlist,
    tracks: playlist.tracks.map(track => track.id)
  };
}

// Add admin rights for a specific playlist
function addAdmin({ username: spotifyId, id: playlistId } = {}) {
  return User.updateOne({ spotifyId }, { $push: { adminOf: playlistId } });
}

// Remove admin rights for a specific playlist
function removeAdmin({ username: spotifyId, id: playlistId } = {}) {
  return User.updateOne({ spotifyId }, { $pull: { adminOf: playlistId } });
}
