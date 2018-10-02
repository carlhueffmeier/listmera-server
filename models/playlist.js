const uuid = require('shortid');
const redis = require('./redis');
const engine = require('../lib/engine');
const mongoose = require('mongoose');
const User = mongoose.model('User');
const Track = mongoose.model('Track');
const Spotify = require('./spotify');

const playlistModel = {
  // create a playlist on Redis. Returns playlist id in Redis.
  create,
  // grab a simplified version of a playlist (for display purposes only). Returns a promise that resolves to an object containing details.
  display,
  // get all details and tracks for a specific playlist. Returns a promise that resolves to an object containing details.
  get,
  // creates a short-lived (10 secs) cache of the collaborating users tracks and returns that cache's id.
  set,
  // creates intersection between collaborating users tracks and playlist's tracks.
  intersect,
  // retrieves all track ids for the specified playlist.
  getTracks,
  // get all recently created playlists
  recent,
  // deletes a playlist
  remove,
  // set time at which playlist is removed
  expire
};

module.exports = playlistModel;

async function create(newPlaylist, values) {
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
    ...values
  };
  await redis.hmset(`playlist:${playlistId}`, playlist);
  await redis.sadd(`tracks:${bankId}`, newPlaylist.tracks);
  await redis.sadd(`collabs:${collabId}`, newPlaylist.admin);
  await redis.sadd('recent', playlistId);
  return playlistId;
}

async function display(id) {
  return new Promise((resolve, reject) => {
    const playlist = {};
    playlist.id = id;
    redis.hgetall(`playlist:${id}`, async (err, details) => {
      if (err) {
        reject(err);
      }
      if (!details) {
        resolve(null);
      }
      playlist.adminId = details.admin;
      const user = await User.findOne({ spotifyId: playlist.adminId });
      playlist.admin = user.name;
      playlist.name = details.name;
      if (details.dance) {
        playlist.dance = 'Dance';
      }
      if (details.energy) {
        playlist.energy = 'Energetic';
      }
      if (details.loud) {
        playlist.loud = 'Loud';
      }
      if (details.instrumental) {
        playlist.instrumental = 'Instrumental';
      }
      if (details.live) {
        playlist.live = 'Live';
      }
      if (details.mood === '1') {
        playlist.mood = 'Happy';
      }
      if (details.mood === '0') {
        playlist.mood = 'Sad';
      }
      if (details.major) {
        playlist.major = 'Major';
      }
      if (details.minor) {
        playlist.minor = 'Minor';
      }
      if (details.done) {
        playlist.done = true;
      }
      redis.smembers(`tracks:${details.tracks}`, async (err, tracks) => {
        if (err) {
          reject(err);
        }
        playlist.length = tracks.length;
        playlist.tracks = await Promise.all(tracks.map(trackId => Track.findOne({ trackId })));
        playlist.tracks = playlist.tracks.length
          ? playlist.tracks.reduce((prev, curr) => prev.concat(curr))
          : [];
        playlist.cover = playlist.tracks.length
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
        redis.smembers(`collabs:${details.collabs}`, async (err, users) => {
          if (err) {
            reject(err);
          }
          const collabers = await Promise.all(users.map(spotifyId => User.findOne({ spotifyId })));
          playlist.collabers = collabers.map(user => user.name);
          resolve(playlist);
        });
      });
    });
  });
}

async function get(id) {
  return new Promise((resolve, reject) => {
    const playlist = {};
    redis.hgetall(`playlist:${id}`, async (err, details) => {
      playlist.adminId = details.admin;
      const user = await User.findOne({ spotifyId: playlist.adminId });
      playlist.collabs = details.collabs;
      playlist.bank = details.bank;
      playlist.admin = user.name;
      playlist.name = details.name;
      playlist.trackId = details.tracks;
      playlist.strict = Number(details.strict);
      if (details.dance) {
        playlist.dance = details.dance;
      }
      if (details.energy) {
        playlist.energy = details.energy;
      }
      if (details.loud) {
        playlist.loud = details.loud;
      }
      if (details.instrumental) {
        playlist.instrumental = details.instrumental;
      }
      if (details.live) {
        playlist.live = details.live;
      }
      if (Number(details.mood)) {
        playlist.mood = Number(details.mood);
      }
      if (Number(details.mood) === 0) {
        playlist.mood = Number(details.mood);
      }
      if (details.major) {
        playlist.major = details.major;
      }
      if (details.minor) {
        playlist.minor = details.minor;
      }
      if (err) {
        reject(err);
      }
      redis.smembers(`tracks:${details.tracks}`, async (err, reply) => {
        playlist.tracks = reply;
        resolve(playlist);
        if (err) {
          reject(err);
        }
      });
    });
  });
}

async function set(tracks) {
  const trackId = uuid.generate();
  await redis.sadd(`tracks:${trackId}`, tracks);
  await redis.expireat(`tracks:${trackId}`, parseInt(+new Date() / 1000) + 10);
  return trackId;
}

async function intersect(playlist, collab, collaborator, refresh) {
  return new Promise(async (resolve, reject) => {
    redis.sismember(`collabs:${playlist.collabs}`, collaborator, (err, results) => {
      if (err) {
        reject(500);
      }
      if (!results) {
        redis.SINTER(`tracks:${playlist.bank}`, `tracks:${collab}`, async (err, intersect) => {
          if (intersect.length) {
            const filtered = await Spotify.getFeatures(intersect, refresh);
            const matched = engine.match(filtered.body.audio_features, playlist);
            redis.sadd(`tracks:${playlist.tracks}`, matched);
          }
          if (err) {
            reject(500);
          }
          redis.sdiff(`tracks:${collab}`, `tracks:${playlist.bank}`, (err, diff) => {
            if (diff.length) {
              redis.sadd(`tracks:${playlist.bank}`, diff);
            }
            redis.sadd(`collabs:${playlist.collabs}`, collaborator);
            if (err) {
              reject(500);
            }
            resolve(200);
          });
        });
      }
    });
  });
}

async function getTracks(id) {
  return new Promise((resolve, reject) => {
    redis.hgetall(`playlist:${id}`, async (err, reply) => {
      resolve(reply);
      if (err) {
        reject(err);
      }
    });
  });
}

async function recent() {
  return new Promise((resolve, reject) => {
    redis.smembers('recent', async (err, reply) => {
      if (err) {
        reject(err);
      }
      if (!reply.length) {
        resolve({ playlists: [] });
      }
      let playlists = await Promise.all(reply.map(el => display(el)));
      playlists = playlists.map(el => {
        if (el.tracks.length) {
          const coverImg = el.tracks
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
            .map(el => el.image);
          return {
            ...el,
            cover: coverImg
          };
        } else {
          return el;
        }
      });
      resolve({ playlists });
    });
  });
}

async function remove(object) {
  await redis.del(`playlist:${object.playlist}`);
  await redis.del(`tracks:${object.bank}`);
  await redis.del(`tracks:${object.tracks}`);
  await redis.del(`collabs:${object.collabs}`);
  await redis.srem('recent', object.playlist);
  return 'done';
}

async function expire(object) {
  await redis.hmset(`playlist:${object.playlist}`, { done: 1 });
  await redis.expireat(`playlist:${object.playlist}`, parseInt(+new Date() / 1000) + 3600);
  await redis.expireat(`tracks:${object.bank}`, parseInt(+new Date() / 1000) + 3600);
  await redis.expireat(`tracks:${object.tracks}`, parseInt(+new Date() / 1000) + 3600);
  await redis.expireat(`collabs:${object.collabs}`, parseInt(+new Date() / 1000) + 3600);
  await redis.srem('recent', object.playlist, parseInt(+new Date() / 1000) + 3600);
}
