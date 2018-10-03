const uuid = require('shortid');
const redis = require('./redis');
const playlistUtils = require('../lib/playlistUtils');
const mongoose = require('mongoose');
const User = mongoose.model('User');
const Track = mongoose.model('Track');
const spotifyService = require('../services/spotify');
const { pick } = require('../lib/utils');

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
async function create(newPlaylist, features) {
  const playlistId = uuid.generate();
  const trackId = uuid.generate();
  const bankId = uuid.generate();
  const collabId = uuid.generate();
  let playlist = {
    admin: newPlaylist.admin,
    name: newPlaylist.name,
    tracks: trackId,
    bank: bankId,
    collabs: collabId,
    ...features
  };
  await redis.hmset(`playlist:${playlistId}`, playlist);
  await redis.sadd(`tracks:${bankId}`, newPlaylist.tracks);
  await redis.sadd(`collabs:${collabId}`, newPlaylist.admin);
  await redis.sadd('recent', playlistId);
  return playlistId;
}

// Grab a simplified version of a playlist (for display purposes)
async function display(id) {
  let playlist = {};
  playlist.id = id;

  const details = await redis.hgetallAsync(`playlist:${id}`);
  if (!details) {
    return;
  }

  playlist.adminId = details.admin;
  const user = await User.findOne({ username: playlist.adminId });
  playlist.admin = user.name;
  playlist.name = details.name;
  playlist = {
    ...playlist,
    ...parsePlaylistDetails(details)
  };
  const tracks = await redis.smembersAsync(`tracks:${details.tracks}`);
  playlist.length = tracks.length;
  playlist.tracks = await Promise.all(tracks.map(trackId => Track.findOne({ trackId })));
  if (!playlist.tracks) {
    playlist.tracks = [];
  }
  playlist.cover = extractTrackCovers(playlist);
  const users = await redis.smembersAsync(`collabs:${details.collabs}`);
  const collabers = await Promise.all(users.map(username => User.findOne({ username })));
  playlist.collabers = collabers.map(user => user.name);
  return playlist;
}

function parsePlaylistDetails(details) {
  const dict = {
    dance: 'Dance',
    energy: 'Energetic',
    loud: 'Loud',
    instrumental: 'Instrumental',
    live: 'Live',
    major: 'Major',
    minor: 'Minor'
  };
  return Object.keys(details).reduce((playlistDetails, [key, value]) => {
    if (dict.hasOwnProperty(key)) {
      playlistDetails[key] = dict[key];
    } else if (key === 'mood') {
      playlistDetails.mood = value === 0 ? 'Sad' : 'Happy';
    } else if (key === 'done') {
      playlistDetails.done = true;
    }
    return playlistDetails;
  }, {});
}

function extractTrackCovers(playlist) {
  return playlist.tracks.length
    ? playlist.tracks
        .reduce((acc, el) => {
          if (acc.length < 4) {
            acc.push({ image: el.image, popularity: el.popularity });
            return acc.sort((a, b) => b.popularity - a.popularity);
          } else if (el.popularity > acc[3].popularity) {
            acc = [...acc.slice(0, 3), { image: el.image, popularity: el.popularity }];
            return acc.sort((a, b) => b.popularity - a.popularity);
          } else {
            return acc;
          }
        }, [])
        .map(el => el.image)
    : undefined;
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
  const results = await redis.sismemberAsync(`collabs:${playlist.collabs}`, collaborator);
  if (!results) {
    const intersect = await redis.SINTERAsync(`tracks:${playlist.bank}`, `tracks:${collab}`);
    if (intersect.length) {
      const filtered = await spotifyService.getAudioFeatures(intersect, refresh);
      const matched = playlistUtils.getMatchingTrackIds(filtered.body.audio_features, playlist);
      redis.sadd(`tracks:${playlist.tracks}`, matched);
    }
    const diff = await redis.sdiffAsync(`tracks:${collab}`, `tracks:${playlist.bank}`);
    if (diff.length) {
      redis.sadd(`tracks:${playlist.bank}`, diff);
    }
    redis.sadd(`collabs:${playlist.collabs}`, collaborator);
  }
}

// Retrieves all track ids for the specified playlist
async function getTracks(id) {
  return redis.hgetallAsync(`playlist:${id}`);
}

// Get all recently created playlists
async function recent() {
  const reply = await redis.smembersAsync('recent');
  if (!reply.length) {
    return { playlists: [] };
  }
  let playlists = await Promise.all(reply.map(el => display(el)));
  playlists = playlists.map(
    playlist =>
      playlist.tracks.length > 0
        ? {
            ...playlist,
            cover: extractTrackCovers(playlist)
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
async function expire(playlist) {
  redis.hmset(`playlist:${playlist.playlist}`, { done: 1 });
  redis.expireat(`playlist:${playlist.playlist}`, parseInt(+new Date() / 1000) + 3600);
  redis.expireat(`tracks:${playlist.bank}`, parseInt(+new Date() / 1000) + 3600);
  redis.expireat(`tracks:${playlist.tracks}`, parseInt(+new Date() / 1000) + 3600);
  redis.expireat(`collabs:${playlist.collabs}`, parseInt(+new Date() / 1000) + 3600);
  redis.srem('recent', playlist.playlist, parseInt(+new Date() / 1000) + 3600);
}
