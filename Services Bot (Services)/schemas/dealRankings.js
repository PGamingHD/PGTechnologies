const mongoose = require('mongoose');

const dealRanking = new mongoose.Schema({
    userId: {
        type: String,
        required: true
    },
    saleRank: {
        type: Number,
        required: true
    },
    saleRated: {
        type: Number,
        required: true
    },
    buyRank: {
        type: Number,
        required: true
    },
    buyRated: {
        type: Number,
        required: true
    }
});

module.exports = mongoose.model("dealRanking", dealRanking);