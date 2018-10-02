// 👺 === Initialize Redis ===
require('./redis');

// 🐉 === Initialize Mongoose ===
const mongoose = require('mongoose');

// Establish connection
mongoose.connect(
  process.env.MONGODB_URI,
  { useNewUrlParser: true }
);
mongoose.Promise = global.Promise; // use ES6 promises
mongoose.connection.on('error', error => {
  console.error(`Can't connect to database → ${error.message}`);
});

// Load models
require('./mongoose/track');
require('./mongoose/user');
