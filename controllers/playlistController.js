const spotifyService = require('../services/spotify');
const User = require('../models/user');
const Playlist = require('../models/playlist');
const playlistUtils = require('../lib/playlistUtils');

async function createNewPlaylist(ctx) {
  const body = ctx.request.body;
  const user = ctx.user;
  const parsedFeatures = playlistUtils.parseFeatureSpecs(body.values, body.tempo);
  const trackList = playlistUtils.getAllTracks(user.playlists);
  const newPlaylistId = await Playlist.create(
    {
      admin: body.username,
      name: body.name,
      tracks: trackList
    },
    parsedFeatures
  );
  await User.addAdmin({ id: newPlaylistId, username: body.username });
  ctx.status = 201;
  ctx.response.body = { id: newPlaylistId };
}

async function getPlaylist(ctx) {
  const content = await Playlist.display(ctx.params.id).catch(e => e);
  if (!content) {
    ctx.response.body = { status: null };
    ctx.status = 404;
  } else {
    ctx.response.body = content;
    ctx.status = 200;
  }
}

async function collaborateOnPlaylist(ctx) {
  const user = ctx.user;
  const userTracks = playlistUtils.getAllTracks(user.playlists);
  // Creating a short lived cache of user track ids
  const cacheId = await Playlist.set(userTracks);
  // Getting all tracks from playlist user wants to collaborate with
  const playlist = await Playlist.getTracks(ctx.params.id);
  await Playlist.intersect(playlist, cacheId, user.username, user.refresh);
  ctx.status = 200;
}

async function generatePlaylist(ctx) {
  const user = ctx.user;
  const playlist = await Playlist.get(ctx.params.id);
  const copy = ctx.request.body.copy;
  if (user.length && user.username === playlist.adminId) {
    await spotifyService.createPlaylist({ playlist, refresh: user.refresh, id: ctx.params.id });
    ctx.status = 201;
  } else if (!playlist.adminId) {
    ctx.status = 400;
  } else if (copy) {
    await spotifyService.createPlaylist({ playlist, refresh: user.refresh, copier: user });
  } else {
    ctx.status = 401;
  }
}

async function deletePlaylist(ctx) {
  const user = ctx.user;
  const playlistId = ctx.params.id;
  const playlist = await Playlist.get(playlistId);
  if (user.length && user.username === playlist.adminId) {
    await Playlist.remove({
      playlist: playlistId,
      collabs: playlist.collabs,
      bank: playlist.bank,
      tracks: playlist.trackId
    });
    await User.removeAdmin({
      username: user.username,
      id: playlistId
    });
    ctx.status = 202;
  } else if (!playlist.adminId) {
    ctx.status = 400;
  } else {
    ctx.status = 401;
  }
}

async function getRecentPlaylists(ctx) {
  ctx.response.body = await Playlist.recent();
  ctx.status = 200;
}

exports.create = createNewPlaylist;
exports.get = getPlaylist;
exports.collab = collaborateOnPlaylist;
exports.generate = generatePlaylist;
exports.delete = deletePlaylist;
exports.recent = getRecentPlaylists;
