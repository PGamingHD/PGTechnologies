const mongoose = require('mongoose');

const userDonated = new mongoose.Schema({
    userId: {
        type: String,
        required: true
    },
    totalDonated: {
        type: Number,
        required: true
    }
});

module.exports = mongoose.model("userDonated", userDonated);

/*

Code used in this script has been written by PGTechnologies™
This project has been licensed through PGTechnologies™, you are NOT permitted to take credit for this project.
Require assistance with scripts? Join the discord and get help right away! - https://discord.gg/xQFFRzhJu2
Original Developer - PGamingHD#0666

*/