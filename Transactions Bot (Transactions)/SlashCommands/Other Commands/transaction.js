const {
    Client,
    EmbedBuilder,
    ApplicationCommandOptionType,
    ButtonBuilder,
    ButtonStyle,
    ActionRowBuilder
} = require("discord.js");
const ee = require("../../botconfig/embed.json");
const axios = require("axios");
const userData = require("../../schemas/userData");
const config = require("../../botconfig/config.json");
const {
    dateNow,
    writeTransaction
} = require("../../handler/functions");
const {
    google
} = require('googleapis');
require('dotenv').config();

module.exports = {
    name: 'transaction',
    description: 'Enter a new transactions log',
    options: [{
        name: 'user',
        description: 'The user this transaction involves',
        type: ApplicationCommandOptionType.User,
        required: true
    }, {
        name: 'method',
        description: 'The method this transaction used',
        type: ApplicationCommandOptionType.String,
        choices: [{
            name: 'GP',
            value: 'GP'
        }, {
            name: 'Money',
            value: 'Money'
        }],
        required: true
    }, {
        name: 'amount',
        description: 'The amount this transaction used',
        type: ApplicationCommandOptionType.Integer,
        required: true
    }],
    /** 
     * @param {Client} client 
     * @param {Message} message 
     * @param {String[]} args 
     */
    run: async (client, interaction, args) => {
        const user = interaction.options.getUser('user');
        const method = interaction.options.getString('method');
        const amount = interaction.options.getInteger('amount');

        await writeTransaction('transactions', 'A', 'K', [[interaction.user.id, interaction.user.username, user.id, user.username, method, amount, dateNow()]]);

        await interaction.reply({
            content: ':white_check_mark: Successfully added transactions data!',
            ephemeral: true
        });
    }
}

/*

Code used in this script has been written by PGTechnologies™
This project has been licensed through PGTechnologies™, you are NOT permitted to take credit for this project.
Require assistance with scripts? Join the discord and get help right away! - https://discord.gg/xQFFRzhJu2
Original Developer - PGamingHD#0666

*/