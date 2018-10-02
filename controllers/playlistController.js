const Spotify = require('../models/spotify');
const User = require('../models/user');
const Playlist = require('../models/playlist');
const playlistUtils = require('../lib/playlistUtils');

module.exports = {
  create: async function(ctx) {
    const body = JSON.parse(ctx.request.body);
    const spotifyId = body.username;
    const user = await User.findOne(spotifyId);

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
  },
  get: async function(ctx) {
    const content = await Playlist.display(ctx.params.id).catch(e => e);
    if (!content) {
      ctx.response.body = { status: null };
      ctx.status = 404;
    } else {
      ctx.response.body = content;
      ctx.status = 200;
    }
  },
  collab: async function(ctx) {
    const body = JSON.parse(ctx.request.body);
    const spotifyId = body.username;
    const user = await User.findOne(spotifyId);

    const tracks = playlistUtils.getAllTracks(user.playlists);
    const trackId = await Playlist.set(tracks);
    const playlist = await Playlist.getTracks(ctx.params.id);
    await Playlist.intersect(playlist, trackId, user.username, user.refresh);
    ctx.status = 200;
  },
  generate: async function(ctx) {
    const body = JSON.parse(ctx.request.body);
    const spotifyId = body.username;
    const user = await User.findOne(spotifyId);

    const playlist = await Playlist.get(ctx.params.id);
    const copy = body.copy;
    if (user.length && user.username === playlist.adminId) {
      await Spotify.create(playlist, user.refresh, ctx.params.id);
      ctx.status = 201;
    } else if (!playlist.adminId) {
      ctx.status = 400;
    } else if (copy) {
      await Spotify.create(playlist, user.refresh, ctx.params.id, copy, user);
    } else {
      ctx.status = 401;
    }
  },
  delete: async function(ctx) {
    const body = JSON.parse(ctx.request.body);
    const spotifyId = body.username;
    const user = await User.findOne(spotifyId);

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
  },
  recent: async function(ctx) {
    ctx.response.body = await Playlist.recent();
    ctx.status = 200;
  }
};
