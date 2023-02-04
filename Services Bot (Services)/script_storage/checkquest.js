const {
    Client,
    EmbedBuilder,
    ApplicationCommandOptionType
} = require("discord.js");
const ee = require("../botconfig/embed.json");
const axios = require("axios");
const userData = require("../schemas/userData");
const config = require("../botconfig/config.json");
const authorize = require("../handler/authenticate");
const {
    google
} = require('googleapis');
require('dotenv').config();

module.exports = {
    name: 'calculate_quest',
    description: 'Check how much the quest would cost in $$!',
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
            spreadsheetId: process.env.SPREADSHEET_ID,
            range: 'Config!A2:B',
        });
        const rows = res.data.values;

        let BTCrate = null;
        rows.forEach((row) => {
            if (row[0] !== "btc") return;
            BTCrate = parseFloat(row[1])
        });

        const res2 = await sheets.spreadsheets.values.get({
            spreadsheetId: process.env.SPREADSHEET_ID,
            range: 'Sheet15!A2:C',
        });

        const rows2 = res2.data.values;

                let discountPrice = 0.0;
        let discount = 0;
        if (interaction.member.roles.cache.has(config.Discount_System["discount_15%"])) {
            discountPrice = 0.15;
            discount = 15;
        } else if (interaction.member.roles.cache.has(config.Discount_System["discount_10%"])) {
            discountPrice = 0.10;
            discount = 10;
        } else if (interaction.member.roles.cache.has(config.Discount_System["discount_6%"])) {
            discountPrice = 0.06;
            discount = 6;
        } else if (interaction.member.roles.cache.has(config.Discount_System["discount_4%"])) {
            discountPrice = 0.04;
            discount = 4;
        } else if (interaction.member.roles.cache.has(config.Discount_System["discount_2%"])) {
            discountPrice = 0.02;
            discount = 2;
        }


        let totalGoldCost = null;
        let fullQuestName = [];
        let questCost = null;
        rows2.forEach((row) => {
            if (row[0] === undefined || row[1] === undefined || row[2] === undefined) return;
            if (!allQuests.includes(row[0]) && !allQuests.includes(row[2])) return;
            questCost += parseFloat(((((parseInt(row[1]) / 1000) * BTCrate) - ((parseInt(row[1]) / 1000) * BTCrate) * discountPrice)).toFixed(2));
            fullQuestName.push(`• ${row[0]}`)
            totalGoldCost += (parseInt(row[1]) / 1000);
        })

        if (totalGoldCost === null || fullQuestName === [] || questCost === null) {
            return interaction.reply({
                content: 'No quests found with input quest names! (Or your input or not formatted correctly)',
                ephemeral: true
            });
        }

        return await interaction.reply({
            embeds: [
                new EmbedBuilder()
                .setTitle(config.Quest_System.Quest_Embed.title)
                .setThumbnail(config.Quest_System.Quest_Embed.thumbnail)
                .setColor(config.Quest_System.Quest_Embed.color)
                .setDescription(`\`\`\`${discount === 0 ? "No Discount" : discount + "% Applied"}\`\`\`\n**Quests:**\n${fullQuestName.join('\n').replace(/(^\w{1})|(\s+\w{1})/g, letter => letter.toUpperCase())}\n\n${config.Quest_System.Quest_Embed.gold_icon} **${totalGoldCost}M**ㅤㅤ${config.Quest_System.Quest_Embed.money_icon} **${questCost.toFixed(2)}$**`)
                .setFooter({text: config.Quest_System.Quest_Embed.footer.text, iconURL: config.Quest_System.Quest_Embed.footer.iconURL})
                .setTimestamp()
            ]
        });
    }
}

/*

Code used in this script has been written by PGTechnologies™
This project has been licensed through PGTechnologies™, you are NOT permitted to take credit for this project.
Require assistance with scripts? Join the discord and get help right away! - https://discord.gg/xQFFRzhJu2
Original Developer - PGamingHD#0666

*/