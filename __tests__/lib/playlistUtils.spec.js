const audioFeatures = require('../../__mocks__/audioFeatures.json');
const playlist = require('../../__mocks__/playlist.json');
const playlistUtils = require('../../lib/playlistUtils');

describe('getMatchingTrackIds', () => {
  it('should produce the same results as the original function', () => {
    const result = playlistUtils.getMatchingTrackIds(audioFeatures, playlist);
    const expected = originalMatchFunction(audioFeatures, playlist);
    expect(result).toEqual(expected);
  });
});

function originalMatchFunction(features, source) {
  return features
    .filter(el => {
      if (source.dance) {
        return el.danceability >= Number(source.dance);
      } else {
        return true;
      }
    })
    .filter(el => {
      if (source.energy) {
        return el.energy >= Number(source.energy);
      } else {
        return true;
      }
    })
    .filter(el => {
      if (source.loud) {
        return el.loudness <= Number(source.loud);
      } else {
        return true;
      }
    })
    .filter(el => {
      if (source.instrumental) {
        return el.instrumentalness >= Number(source.instrumental);
      } else {
        return true;
      }
    })
    .filter(el => {
      if (source.live) {
        return el.liveness >= Number(source.live);
      } else {
        return true;
      }
    })
    .filter(el => {
      if (Number(source.mood)) {
        return el.valence >= 0.5;
      } else if (Number(source.mood) === 0) {
        return el.valence <= 0.5;
      } else {
        return true;
      }
    })
    .filter(el => {
      if (Number(source.major) && Number(source.minor)) {
        return true;
      } else if (Number(source.major)) {
        return Number(el.mode);
      } else if (Number(source.minor)) {
        return Number(el.mode) === 0;
      } else {
        return true;
      }
    })
    .filter(el => {
      if (source.tempo) {
        return el.tempo >= source.tempo - 15 || el.tempo <= source.tempo + 15;
      } else {
        return true;
      }
    })
    .map(el => el.id);
}
