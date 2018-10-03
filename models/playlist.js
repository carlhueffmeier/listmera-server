const uuid = require('shortid');
const redis = require('./redis');
const playlistUtils = require('../lib/playlistUtils');
const mongoose = require('mongoose');
const User = mongoose.model('User');
const Track = mongoose.model('Track');
const getAudioFeatures = require('../services/spotify/getAudioFeatures');
const { pick, defaults } = require('../lib/utils');

const playlistModel = {
  create,
  display,
  get,
  set,
  intersect,
  getTracks,
  recent,
  remove,
  expire
};

module.exports = playlistModel;

// Create a playlist on Redis. Returns new playlist id
function create(playlistInfo, features) {
  const playlistId = uuid.generate();
  const trackId = uuid.generate();
  const bankId = uuid.generate();
  const collabId = uuid.generate();
  const newPlaylist = {
    admin: playlistInfo.admin,
    name: playlistInfo.name,
    tracks: trackId,
    bank: bankId,
    collabs: collabId,
    ...features
  };
  redis.hmset(`playlist:${playlistId}`, newPlaylist);
  redis.sadd(`tracks:${bankId}`, playlistInfo.tracks);
  redis.sadd(`collabs:${collabId}`, playlistInfo.admin);
  redis.sadd('recent', playlistId);
  return playlistId;
}

// Grab a simplified version of a playlist (for display purposes)
async function display(id) {
  const details = await redis.hgetallAsync(`playlist:${id}`);
  if (!details) {
    return;
  }
  const adminUser = await User.findOne({ username: details.admin });
  const tracks = await redis.smembersAsync(`tracks:${details.tracks}`);
  const fullTrackInfo = await Promise.all(tracks.map(trackId => Track.findOne({ trackId })));
  const collabers = await redis.smembersAsync(`collabs:${details.collabs}`);
  const fullCollabersInfo = await Promise.all(
    collabers.map(username => User.findOne({ username }))
  );
  const playlist = {
    id,
    name: details.name,
    adminId: details.admin,
    admin: adminUser.name,
    length: tracks.length,
    tracks: defaults(fullTrackInfo, []),
    cover: getPopularTrackCovers(fullTrackInfo),
    collabers: fullCollabersInfo.map(user => user.name),
    ...parsePlaylistDetails(details)
  };
  return playlist;
}

function parsePlaylistDetails(details) {
  const displayValues = {
    dance: 'Dance',
    energy: 'Energetic',
    loud: 'Loud',
    instrumental: 'Instrumental',
    live: 'Live',
    major: 'Major',
    minor: 'Minor'
  };
  return Object.entries(details).reduce((playlistDetails, [key, value]) => {
    if (Boolean(value) && displayValues.hasOwnProperty(key)) {
      playlistDetails[key] = displayValues[key];
    } else if (key === 'mood') {
      playlistDetails.mood = value === 0 ? 'Sad' : 'Happy';
    } else if (key === 'done') {
      playlistDetails.done = true;
    }
    return playlistDetails;
  }, {});
}

// Returns the album covers of the 4 most popular tracks
function getPopularTrackCovers(tracks, limit = 4) {
  if (tracks.length > 0) {
    return [...tracks]
      .sort((a, b) => b.popularity - a.popularity)
      .slice(0, limit)
      .map(track => track.image);
  }
}

// Get all details and tracks for a specific playlist
async function get(id) {
  const details = await redis.hgetallAsync(`playlist:${id}`);
  const user = await User.findOne({ username: details.admin });
  const keysToCopy = [
    'name',
    'banks',
    'collabs',
    'strict',
    'dance',
    'energy',
    'loud',
    'instrumental',
    'live',
    'mood',
    'major',
    'minor'
  ];
  const playlist = {
    adminId: details.admin,
    admin: user.name,
    trackId: details.tracks,
    tracks: await redis.smembersAsync(`tracks:${details.tracks}`),
    ...pick(keysToCopy, details)
  };
  return playlist;
}

// creates a short-lived (10 secs) cache of the collaborating users tracks and
// returns that cache's id.
async function set(trackIds) {
  const cacheId = uuid.generate();
  redis.sadd(`tracks:${cacheId}`, trackIds);
  redis.expireat(`tracks:${cacheId}`, parseInt(+new Date() / 1000) + 10);
  return cacheId;
}

// Creates intersection between collaborating users tracks and playlist's tracks
async function intersect(playlist, collab, collaborator, refresh) {
  if (await isCollaborating(collaborator, playlist)) {
    return;
  }
  const intersect = await redis.SINTERAsync(`tracks:${playlist.bank}`, `tracks:${collab}`);
  if (intersect.length) {
    const audioFeatures = await getAudioFeatures(intersect, refresh);
    const matched = playlistUtils.getMatchingTrackIds(audioFeatures, playlist);
    redis.sadd(`tracks:${playlist.tracks}`, matched);
  }
  const diff = await redis.sdiffAsync(`tracks:${collab}`, `tracks:${playlist.bank}`);
  if (diff.length > 0) {
    redis.sadd(`tracks:${playlist.bank}`, diff);
  }
  redis.sadd(`collabs:${playlist.collabs}`, collaborator);
}

function isCollaborating(collaborator, playlist) {
  return redis.sismemberAsync(`collabs:${playlist.collabs}`, collaborator);
}

// Retrieves all track ids for the specified playlist
async function getTracks(id) {
  return redis.hgetallAsync(`playlist:${id}`);
}

// Get all recently created playlists
async function recent() {
  const result = await redis.smembersAsync('recent');
  if (!result.length) {
    return { playlists: [] };
  }
  let playlists = await Promise.all(result.map(el => display(el)));
  playlists = playlists.map(
    playlist =>
      playlist.tracks.length > 0
        ? {
            ...playlist,
            cover: getPopularTrackCovers(playlist.tracks)
          }
        : playlist
  );
  return { playlists };
}

// Deletes a playlist and all related data
async function remove(playlist) {
  redis.del(`playlist:${playlist.playlist}`);
  redis.del(`tracks:${playlist.bank}`);
  redis.del(`tracks:${playlist.tracks}`);
  redis.del(`collabs:${playlist.collabs}`);
  redis.srem('recent', playlist.playlist);
  return 'done';
}

// Set time at which playlist is removed
function expire(playlist) {
  redis.hmset(`playlist:${playlist.playlist}`, { done: 1 });
  redis.expireat(`playlist:${playlist.playlist}`, parseInt(+new Date() / 1000) + 3600);
  redis.expireat(`tracks:${playlist.bank}`, parseInt(+new Date() / 1000) + 3600);
  redis.expireat(`tracks:${playlist.tracks}`, parseInt(+new Date() / 1000) + 3600);
  redis.expireat(`collabs:${playlist.collabs}`, parseInt(+new Date() / 1000) + 3600);
  redis.srem('recent', playlist.playlist, parseInt(+new Date() / 1000) + 3600);
}
