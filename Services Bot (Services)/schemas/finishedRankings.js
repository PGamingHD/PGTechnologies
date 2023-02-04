const mongoose = require('mongoose');

const finishedRanking = new mongoose.Schema({
    userId: {
        type: String,
        required: true
    },
    ratedPost: {
        type: String,
        required: true
    }
});

module.exports = mongoose.model("finishedRanking", finishedRanking);