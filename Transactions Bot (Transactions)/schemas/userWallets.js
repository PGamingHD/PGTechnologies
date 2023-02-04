const mongoose = require('mongoose');
require('mongoose-long')(mongoose);
const {Types: {Long}} = mongoose;
const Double = require('@mongoosejs/double');

const userWallets = new mongoose.Schema({
    userId: {
        type: Double,
        required: true
    },
    wallet: {
        oBalance: {
            type: Long,
            required: true
        },
        oSpent: {
            type: Long,
            required: true
        },
        Balance: {
            type: Double,
            required: true
        },
        Spent: {
            type: Double,
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