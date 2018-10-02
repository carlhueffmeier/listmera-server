const spotify = require('../../secrets/spotifyConf.js');
const { chunk, concatAll } = require('../../lib/utils.js');

async function getFeatures(tracks, refresh) {
  await spotify.setRefreshToken(refresh);
  await spotify
    .refreshAccessToken()
    .then(async data => {
      await spotify.setAccessToken(data.body['access_token']);
    })
    .catch(e => console.error(e));

  // Get audio features in groups of 40 to make sure we are below the maximum
  // URL length of 2083 characters
  const chunkedResponse = await Promise.all(
    chunk(tracks, 40).map(spotify.getAudioFeaturesForTracks)
  );
  return concatAll(chunkedResponse);
}

module.exports = getFeatures;
