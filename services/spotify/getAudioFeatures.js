const spotifyApi = require('./spotifyApi');
const { chunk, concatAll } = require('../../lib/utils');

async function getAudioFeatures(tracks, refresh) {
  await spotifyApi.setRefreshToken(refresh);
  await spotifyApi
    .refreshAccessToken()
    .then(async data => {
      await spotifyApi.setAccessToken(data.body['access_token']);
    })
    .catch(e => console.error(e));

  // Get audio features in groups of 40 to make sure we are below the maximum
  // URL length of 2083 characters
  const chunkedResponse = await Promise.all(
    chunk(tracks, 40).map(chunkOfTracks => spotifyApi.getAudioFeaturesForTracks(chunkOfTracks))
  );
  const chunkedAudioFeatures = chunkedResponse.map(response => response.body.audio_features);
  return concatAll(chunkedAudioFeatures);
}

module.exports = getAudioFeatures;
