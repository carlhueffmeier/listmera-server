const mongoose = require('mongoose');
const Track = mongoose.model('Track');

const trackModel = {
  findOne(trackId) {
    return Track.findOne({ trackId });
  }
};

module.exports = trackModel;
