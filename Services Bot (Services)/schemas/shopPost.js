const mongoose = require('mongoose');

const shopPost = new mongoose.Schema({
    postId: {
        type: String,
        unique: true,
        required: true
    },
    postChannel: {
        type: String,
        required: true
    },
    postDeal: {
        postAmount: {
            type: String,
            required: true
        },
        postRate: {
            type: String,
            required: true
        },
        postMethod: {
            type: String,
            required: true
        },
        postDonated: {
            type: Number,
            required: true
        }
    },
    ownerId: {
        type: String,
        required: true
    },
    traderId: {
        type: String,
        required: true
    },
    shopType: {
        type: String,
        required: true
    },
    ticketDone: {
        type: Boolean,
        required: true
    },
    ticketId: {
        type: String,
        required: true
    }
});

module.exports = mongoose.model("shopPost", shopPost);

/*

Code used in this script has been written by PGTechnologies™
This project has been licensed through PGTechnologies™, you are NOT permitted to take credit for this project.
Require assistance with scripts? Join the discord and get help right away! - https://discord.gg/xQFFRzhJu2
Original Developer - PGamingHD#0666

*/