const mongoose = require('mongoose');
mongoose.Promise = global.Promise;

const trackSchema = new mongoose.Schema({
  trackId: {
    type: String,
    required: 'Track needs a valid trackID'
  },
  name: {
    type: String,
    required: 'Track needs a name'
  },
  album: String,
  artists: String,
  image: String,
  popularity: Number,
  mature: Boolean
});

module.exports = mongoose.model('Track', trackSchema);
