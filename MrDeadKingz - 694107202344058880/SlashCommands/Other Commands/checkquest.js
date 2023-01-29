const {
    Client,
    EmbedBuilder,
    ApplicationCommandOptionType
} = require("discord.js");
const ee = require("../../botconfig/embed.json");
const axios = require("axios");
const userData = require("../../schemas/userData");
const config = require("../../botconfig/config.json");
const authorize = require("../../handler/authenticate");
const {
    google
} = require('googleapis');
require('dotenv').config();

module.exports = {
    name: 'checkquest',
    description: 'Check how much the quest would be in BTC!',
    options: [{
        name: 'quest',
        description: 'The quest you want to view the price of',
        type: ApplicationCommandOptionType.String,
        required: true
    }],
    /** 
     * @param {Client} client 
     * @param {Message} message 
     * @param {String[]} args 
     */
    run: async (client, interaction, args) => {
        const quest = interaction.options.getString('quest');

        const splitQuest = quest.replaceAll(', ', ',');
        const extraSplit = splitQuest.replaceAll(' , ', ',');
        const allQuests = extraSplit.split(',');
        
        const auth = await authorize();

        const sheets = google.sheets({
            version: 'v4',
            auth
        });
        const res = await sheets.spreadsheets.values.get({
            spreadsheetId: '1H_CDTgFzHx0beK_--St5Q9-bbcly-WSUHil_VJtWi68',
            range: 'Config!A2:B',
        });
        const rows = res.data.values;

        let BTCrate = null;
        rows.forEach((row) => {
            if (row[0] !== "btc") return;
            BTCrate = parseFloat(row[1])
        });

        const res2 = await sheets.spreadsheets.values.get({
            spreadsheetId: '1H_CDTgFzHx0beK_--St5Q9-bbcly-WSUHil_VJtWi68',
            range: 'Sheet15!A2:C',
        });

        const rows2 = res2.data.values;


        let totalGoldCost = null;
        let fullQuestName = [];
        let questCost = null;
        rows2.forEach((row) => {
            if (row[0] === undefined || row[1] === undefined || row[2] === undefined) return;
            if (!allQuests.includes(row[0]) && !allQuests.includes(row[2])) return;
            questCost += parseFloat(((parseInt(row[1]) / 1000) * BTCrate).toFixed(2));
            fullQuestName.push(row[0])
            totalGoldCost += (parseInt(row[1]) / 1000);
        })

        if (totalGoldCost === null || fullQuestName === [] || questCost === null) {
            return interaction.reply({
                content: 'No quests found with input quest names! (Or your input or not formatted correctly)'
            });
        }

        return await interaction.reply({
            content: `The quest(s) \`"${fullQuestName.join(', ')}"\` will cost you \`${questCost.toFixed(2)}$\` **(Total of ${totalGoldCost}m gold)**`,
        })
    }
}

/*

Code used in this script has been written by PGTechnologies™
This project has been licensed through PGTechnologies™, you are NOT permitted to take credit for this project.
Require assistance with scripts? Join the discord and get help right away! - https://discord.gg/xQFFRzhJu2
Original Developer - PGamingHD#0666

*/