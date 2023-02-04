const {
    Message,
    Client,
    EmbedBuilder
} = require('discord.js');
const config = require('../../botconfig/config.json');
const {
    google
} = require('googleapis');
 
module.exports = {
    name: 'quest',
    aliases: ['q', 'quests'],
    /**
     *
     * @param {Client} client
     * @param {Message} message
     * @param {String[]} args
     */
    run: async (client, message, args, con) => {
        const quest = args.join(' ').toLowerCase();

        if (!quest) {
            return await message.reply({
                content: ':x: Please enter a valid quest name as your second argument to search with!',
                ephemeral: true
            });
        }

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
        config.Discounts.forEach(disc => {
            const remakeDiscount = disc.discount.replace('%', '');
            const actualDiscount = parseInt(remakeDiscount);

            if (disc.type.toLowerCase() === "role") {
                if (message.member.roles.cache.has(disc.discountRole)) {
                    discountPrice = actualDiscount / 100;
                    discount = actualDiscount;
                }
            } else if (disc.type.toLowerCase() === "user") {
                if (disc.discountUser && message.author.id === disc.discountUser) {
                    discountPrice = actualDiscount / 100;
                    discount = actualDiscount;
                }
            }
        });

        let totalGoldCost = null;
        let fullQuestName = [];
        let questCost = null;
        rows2.forEach((row) => {
            if (row[0] === undefined || row[1] === undefined || row[2] === undefined) return;
            if (!allQuests.includes(row[0]) && !allQuests.includes(row[2])) return;
            questCost += parseFloat(((((parseInt(row[1]) / 1000) * BTCrate) - ((parseInt(row[1]) / 1000) * BTCrate) * discountPrice)).toFixed(2));
            fullQuestName.push(`• ${row[0]}`)
            totalGoldCost += ((parseInt(row[1]) / 1000) - (parseInt(row[1]) / 1000) * discountPrice);
        })

        if (totalGoldCost === null || fullQuestName === [] || questCost === null) {
            return message.reply({
                content: 'No quests found with input quest names! (Or your input or not formatted correctly)',
                ephemeral: true
            });
        }

        return await message.reply({
            embeds: [
                new EmbedBuilder()
                .setTitle(config.Quest_System.Quest_Embed.title)
                .setThumbnail(config.Quest_System.Quest_Embed.thumbnail)
                .setColor(config.Quest_System.Quest_Embed.color)
                .setDescription(`\`\`\`${discount === 0 ? "No Discount" : discount + "% Applied"}\`\`\`\n**Quests:**\n${fullQuestName.join('\n').replace(/(^\w{1})|(\s+\w{1})/g, letter => letter.toUpperCase())}\n\n${config.Quest_System.Quest_Embed.gold_icon} **${totalGoldCost.toFixed(2)}M**ㅤㅤ${config.Quest_System.Quest_Embed.money_icon} **${questCost.toFixed(2)}$**`)
                .setFooter({text: config.Quest_System.Quest_Embed.footer.text, iconURL: config.Quest_System.Quest_Embed.footer.iconURL})
                .setTimestamp()
            ]
        });
    },
};