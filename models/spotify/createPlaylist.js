const spotify = require('../../secrets/spotifyConf.js');
const User = require('../user');
const Playlist = require('../playlist');

// Converts a Spotify Track ID to a Spotify Track URI
function createTrackUri(trackId) {
  return 'spotify:track:' + trackId;
}

async function resetSpotifyAccessToken(refresh) {
  await spotify.setRefreshToken(refresh);
  const data = await spotify.refreshAccessToken();
  spotify.setAccessToken(data.body['access_token']);
}

async function generatePlaylistCopy({ playlist, refresh, copier }) {
  let trackUris = playlist.tracks.map(createTrackUri);
  await resetSpotifyAccessToken(refresh);

  if (!playlist.strict) {
    trackUris = [...trackUris, await getTrackRecommendations(playlist, playlist.tracks)];
  }
  const createPlaylistOptions = [
    copier.username,
    playlist.name,
    { description: 'powered by listmera' }
  ];
  const result = await spotify.createPlaylist(...createPlaylistOptions);
  const copiedPlaylistId = result.body.id;
  await spotify.addTracksToPlaylist(copier.username, copiedPlaylistId, trackUris);
}

async function generatePlaylist({ playlist, refresh, id }) {
  let trackUris = playlist.tracks.map(createTrackUri);
  await resetSpotifyAccessToken(refresh);

  if (!playlist.strict) {
    trackUris = [...trackUris, await getTrackRecommendations(playlist, playlist.tracks)];
  }
  const createPlaylistOptions = [
    playlist.adminId,
    playlist.name,
    { description: 'powered by listmera' }
  ];
  const result = await spotify.createPlaylist(...createPlaylistOptions);
  const newPlaylistId = result.body.id;
  await spotify.addTracksToPlaylist(playlist.adminId, newPlaylistId, trackUris);
  await User.removeAdmin({
    username: playlist.adminId,
    id
  });
  await Playlist.expire({
    playlist: id,
    bank: playlist.bank,
    tracks: playlist.trackId,
    collabs: playlist.collabs
  });
}

async function getTrackRecommendations(playlist, seedTracks) {
  if (!seedTracks || seedTracks.length === 0) {
    throw new Error('You need to specify at least one track to generate recommendations');
  }
  if (seedTracks.length >= 5) {
    seedTracks = seedTracks.slice(0, 5);
  }
  const attributes = generateAttributes(playlist, seedTracks);
  const response = await spotify.getRecommendations(attributes);
  const recommendedTracks = response.body.tracks.map(track => createTrackUri(track.id));
  return recommendedTracks;
}

function generateAttributes(playlist, seedTracks) {
  const validAttributes = [
    'dance',
    'energy',
    'loud',
    'instrumental',
    'live',
    'mood',
    'major',
    'minor',
    'tempo'
  ];
  const attributeDictionary = {
    dance: 'min_danceability',
    energy: 'min_energy',
    instrumental: 'min_instrumentalness',
    live: 'min_liveness',
    loud: 'max_loudness',
    tempo: 'target_tempo'
  };
  const initialAttributes = {
    limit: 50 - seedTracks.length,
    seed_tracks: seedTracks
  };

  return Object.entries(playlist)
    .filter(attribute => validAttributes.includes(attribute))
    .reduce(attributeReducer, initialAttributes);

  function attributeReducer(attributes, [currentAttribute, value]) {
    if (attributeDictionary.includes(currentAttribute)) {
      let key = attributeDictionary[currentAttribute];
      attributes[key] = value;
    } else if (currentAttribute === 'mood' && value === 0) {
      attributes.max_valence = 0.5;
    } else if (currentAttribute === 'mood' && value === 1) {
      attributes.min_valence = 0.5;
    } else if (currentAttribute === 'minor') {
      attributes.target_mode = 0;
    } else if (currentAttribute === 'major') {
      attributes.target_mode = 1;
    }
    return attributes;
  }
}

function compatGeneratePlaylist(playlist, refresh, id, copy, copier) {
  if (copy) {
    return generatePlaylistCopy({ playlist, refresh, copier });
  } else {
    return generatePlaylist({ playlist, refresh, id });
  }
}

module.exports = compatGeneratePlaylist;
