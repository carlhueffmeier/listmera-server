const Router = require('koa-router');
const router = new Router();
const authController = require('./controllers/authController');
const playlistController = require('./controllers/playlistController');
const userController = require('./controllers/userController');

// Sign-up/log-in methods
router.get('/api/access', authController.auth);
router.post('/api/register', authController.register);

// Playlist methods
router.post('/api/playlist', playlistController.create);
router.get('/api/playlist/:id', playlistController.get);
router.put('/api/playlist/:id', playlistController.collab);
router.post('/api/playlist/:id', playlistController.generate);
router.delete('/api/playlist/:id', playlistController.delete);
router.get('/api/playlists/recent', playlistController.recent);

// User methods
router.get('/api/me', userController.get);
router.put('/api/me', userController.modify);

module.exports = router;
