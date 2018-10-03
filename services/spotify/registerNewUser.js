const spotifyApi = require('./spotifyApi');
const { defaults } = require('../../lib/utils');
const User = require('../../models/user');

async function registerNewUser(code) {
  const newUser = {};
  const authResponse = await spotifyApi.authorizationCodeGrant(code);
  const { access_token, refresh_token } = authResponse.body;
  await spotifyApi.setAccessToken(access_token);
  await spotifyApi.setRefreshToken(refresh_token);
  newUser.token = access_token;
  newUser.refresh = refresh_token;
  const { body: userDetails } = await spotifyApi.getMe();
  const userExists = await User.findById(userDetails.id);
  if (userDetails.images[0]) {
    newUser.picture = userDetails.images[0].url;
  }
  newUser.email = userDetails.email;
  newUser.username = userDetails.id;
  newUser.name = userDetails.display_name || userDetails.id;

  if (userExists) {
    return User.findById(userDetails.id);
  } else {
    newUser.playlists = await getUserPlaylists(userDetails.id);
    return User.register(newUser);
  }
}

async function getUserPlaylists(spotifyUserId) {
  const userPlaylistResult = await spotifyApi.getUserPlaylists(spotifyUserId, { limit: 50 });
  const partialPlaylists = userPlaylistResult.body.items;
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
  const { track } = playlistTrack;
  let image;
  if (track.album.images && track.album.images.length > 0) {
    image = track.album.images[0].url;
  }
  return {
    id: track.id,
    name: defaults(track.name, 'Unknown'),
    mature: defaults(track.explicit, false),
    popularity: defaults(track.popularity, 0),
    artists: getArtistName(track),
    album: defaults(track.album.name, 'Unknown'),
    image
  };

  function getArtistName(track) {
    if (track.artists.length > 1) {
      return 'Various Artists';
    }
    return defaults(track.artists[0].name, 'Unknown');
  }
}

module.exports = registerNewUser;
