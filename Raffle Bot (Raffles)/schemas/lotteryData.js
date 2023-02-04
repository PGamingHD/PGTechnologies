const mongoose = require('mongoose');
require('mongoose-long')(mongoose);
const Double = require('@mongoosejs/double');

const lotteryData = new mongoose.Schema({
    LotterySoldTickets: {
        type: Number,
        required: true,
        default: 0
    },
    LotteryPricePot: {
        type: Double,
        required: true,
        default: 0
    },
    LotteryLastWinner: {
        type: String,
        required: true
    },
    OwnedTickets: [{
        TicketOwner: {
            type: String,
            required: true,
            unique: true
        },
        TicketsOwned: {
            type: Number,
            required: true
        },
        TicketsOwnedIDs: [{
            TicketID: {
                type: Number,
                required: true
            }
        }]
    }],
});

module.exports = mongoose.model("lotteryData", lotteryData)