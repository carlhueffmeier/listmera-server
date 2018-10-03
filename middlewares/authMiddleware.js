const User = require('../models/user');

function authMiddleware() {
  return async (ctx, next) => {
    if (ctx.request.body && ctx.request.body.username) {
      ctx.user = await User.findById(ctx.request.body.username);
    }
    return next();
  };
}

module.exports = authMiddleware;
