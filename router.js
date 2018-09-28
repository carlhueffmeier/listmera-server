const Router = require('koa-router');
const router = new Router();

const spotify = require('./controllers/spotifyController.js');
const playlists = require('./controllers/playlistController.js');
const user = require('./controllers/userController.js');

// sign-up/log-in methods
router.get('/api/access', spotify.auth);
router.post('/api/register', spotify.register);

// playlist methods
router.post('/api/playlist', playlists.create);
router.get('/api/playlist/:id', playlists.get);
router.put('/api/playlist/:id', playlists.collab);
router.post('/api/playlist/:id', playlists.generate);
router.delete('/api/playlist/:id', playlists.delete);
router.get('/api/playlists/recent', playlists.recent);

// user methods
router.get('/api/me', user.get);
router.put('/api/me', user.modify);

module.exports = router;
