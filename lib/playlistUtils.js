const { both } = require('../lib/utils');

// Returns an array of tracks contained in all playlists
function getAllTracks(playlists) {
  return playlists
    .filter(Boolean)
    .map(playlist => playlist.tracks)
    .reduce((allTracks, currentTrack) => allTracks.concat(currentTrack));
}

// features: array of audio features
// (https://developer.spotify.com/documentation/web-api/reference/tracks/get-several-audio-features/)
function getMatchingTrackIds(features, playlist) {
  // Map of filter factories for all playlist properties
  const filters = {
    dance: playlist => feature => feature.danceability >= playlist.dance,
    energy: playlist => feature => feature.energy >= playlist.energy,
    loud: playlist => feature => feature.loudness <= playlist.loud,
    instrumental: playlist => feature => feature.instrumentalness <= playlist.instrumental,
    live: playlist => feature => feature.liveness <= playlist.live,
    mood: playlist => feature =>
      playlist.mood == 0 ? feature.valence <= 0.5 : feature.valence >= 0.5,
    minor: playlist => feature => playlist.major || feature.mode == 0,
    major: playlist => feature => playlist.minor || feature.mode > 0,
    tempo: playlist => feature =>
      feature.tempo >= playlist.tempo - 15 || feature.tempo <= playlist.tempo + 15
  };
  // Creates a filter function specific to the playlist
  // If the playlist has information on a specific audio feature,
  // the reducer will return a new function that only returns true
  // if _both_ all previous filters as well as the new filters evaluate to true
  const playlistFilter = Object.keys(filters).reduce(
    (featureFilter, featureName) =>
      playlist[featureName] ? both(featureFilter, filters[featureName](playlist)) : featureFilter,
    () => true
  );
  const matchingFeatures = features.filter(playlistFilter);
  // Return list of ids
  return matchingFeatures.map(feature => feature.id);
}

function parseFeatureSpecs(values, tempo) {
  const res = {};
  if (values.includes('Strict')) {
    res.strict = 1;
  } else {
    res.strict = 0;
  }
  if (values.includes('Dance')) {
    res.dance = 0.7;
  } else {
    res.dance = '';
  }
  if (values.includes('Energy')) {
    res.energy = 0.7;
  } else {
    res.energy = '';
  }
  if (values.includes('Loud')) {
    res.loud = -30;
  } else {
    res.loud = '';
  }
  if (values.includes('Instrument')) {
    res.instrumental = 0.7;
  } else {
    res.instrumental = '';
  }
  if (values.includes('Live')) {
    res.live = 0.7;
  } else {
    res.live = '';
  }
  if (values.includes('Happy') && values.includes('Sad')) {
    res.mood = '';
  } else if (values.includes('Happy')) {
    res.mood = 1;
  } else if (values.includes('Sad')) {
    res.mood = 0;
  } else {
    res.mood = '';
  }
  if (values.includes('Major')) {
    res.major = 1;
  } else {
    res.major = '';
  }
  if (values.includes('Minor')) {
    res.minor = 1;
  } else {
    res.minor = '';
  }
  if (Number(tempo) === 50) {
    res.tempo = '';
  } else {
    res.tempo = (1 + (tempo - 50) / 100) * 120;
  }
  return res;
}

exports.getAllTracks = getAllTracks;
exports.getMatchingTrackIds = getMatchingTrackIds;
exports.parseFeatureSpecs = parseFeatureSpecs;
