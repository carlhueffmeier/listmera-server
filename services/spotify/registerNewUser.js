const spotifyApi = require('./spotifyApi');
const { defaults } = require('../../lib/utils');
const User = require('../../models/user');

async function registerNewUser(code) {
  // Refresh tokens
  const authResponse = await spotifyApi.authorizationCodeGrant(code);
  const { access_token, refresh_token } = authResponse.body;
  await spotifyApi.setAccessToken(access_token);
  await spotifyApi.setRefreshToken(refresh_token);
  // Get user details from spotify
  const { body: userDetails } = await spotifyApi.getMe();
  // Check whether we already have a record of the user
  const userExists = await User.findById(userDetails.id);
  // Gather user information
  const newUser = {
    token: access_token,
    refresh: refresh_token,
    picture: getUserImage(userDetails),
    email: userDetails.email,
    username: userDetails.id,
    name: defaults(userDetails.display_name, userDetails.id)
  };
  if (userExists) {
    // Return exisiting user
    return User.findById(userDetails.id);
  } else {
    // Grab user playlists from spotify and return the newly created user
    // `register` will also add user playlists and tracks to our database
    newUser.playlists = await getUserPlaylists(userDetails.id);
    return User.register(newUser);
  }
}

function getUserImage(userDetails) {
  if (userDetails.images[0]) {
    return userDetails.images[0].url;
  }
}
async function getUserPlaylists(spotifyUserId) {
  const userPlaylistResult = await spotifyApi.getUserPlaylists(spotifyUserId, { limit: 50 });
  const partialPlaylists = userPlaylistResult.body.items;
  // We want to retrieve playlists containing all track information
  return Promise.all(
    partialPlaylists.map(playlist => populatePlaylistWithTracks(spotifyUserId, playlist))
  );
}

async function populatePlaylistWithTracks(spotifyUserId, playlist) {
  const playlistTracksResult = await spotifyApi.getPlaylistTracks(spotifyUserId, playlist.id);
  const tracks = playlistTracksResult.body.items.map(formatPlaylistTrack);
  return { id: playlist.id, name: playlist.name, tracks };
}

function formatPlaylistTrack(playlistTrack) {
  // The playlist tracks store all detailed track info on `track` object
  const { track } = playlistTrack;
  return {
    id: track.id,
    name: defaults(track.name, 'Unknown'),
    mature: defaults(track.explicit, false),
    popularity: defaults(track.popularity, 0),
    artists: getArtistName(track),
    album: defaults(track.album.name, 'Unknown'),
    image: getTrackImage(track)
  };

  function getTrackImage(track) {
    if (track.album.images && track.album.images.length > 0) {
      return track.album.images[0].url;
    }
  }

  function getArtistName(track) {
    if (track.artists.length > 1) {
      return 'Various Artists';
    }
    return defaults(track.artists[0].name, 'Unknown');
  }
}

module.exports = registerNewUser;
