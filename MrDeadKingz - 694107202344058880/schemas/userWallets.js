const mongoose = require('mongoose');

const userWallets = new mongoose.Schema({
    userId: {
        type: String,
        required: true
    },
    wallet: {
        oBalance: {
            type: Number,
            required: true
        },
        oSpent: {
            type: Number,
            required: true
        },
        Balance: {
            type: Number,
            required: true
        },
        Spent: {
            type: Number,
            required: true
        }
    }
});

module.exports = mongoose.model("userWallet", userWallets);

/*

Code used in this script has been written by PGTechnologies™
This project has been licensed through PGTechnologies™, you are NOT permitted to take credit for this project.
Require assistance with scripts? Join the discord and get help right away! - https://discord.gg/xQFFRzhJu2
Original Developer - PGamingHD#0666

*/