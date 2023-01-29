const {
    Message,
    Client,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    EmbedBuilder
} = require("discord.js");
const ee = require("../../botconfig/embed.json");
const prettyMilliseconds = require('pretty-ms');
const config = require('../../botconfig/config.json');
const userData = require("../../schemas/userData");

module.exports = {
    name: "leaderboard",
    aliases: ['lb', 'leaderstats', 'leader'],
    /**
     *
     * @param {Client} client
     * @param {Message} message
     * @param {String[]} args
     */
    run: async (client, message, args, prefix) => {
        const userDonated = await userData.find().sort({
            totalDonated: -1
        }).limit(10);
        const newConstructor = [];

        if (userDonated.length !== 0) {
            let index = 1;
            userDonated.forEach(async (user) => {
                const userData = await client.users.fetch(user.userId);
                newConstructor.push({
                    name: `**${index}. ${userData.username}**`,
                    value: `\`\`${user.totalDonated.toLocaleString('en-US')}$\`\``,
                    inline: true
                });
                index++;
            });
    
    
            return await message.reply({
                embeds: [
                    new EmbedBuilder()
                    .setColor(config.Leaderboard_System.Leaderboard_Embed.color)
                    .setTitle(config.Leaderboard_System.Leaderboard_Embed.title)
                    .addFields(newConstructor)
                    .setFooter({text: config.Leaderboard_System.Leaderboard_Embed.footer.text, iconURL: config.Leaderboard_System.Leaderboard_Embed.footer.iconURL})
                    .setTimestamp()
                ]
            })
        } else {
            return await message.reply({
                embeds: [
                    new EmbedBuilder()
                    .setColor(config.Leaderboard_System.Leaderboard_Embed_NOTFOUND.color)
                    .setTitle(config.Leaderboard_System.Leaderboard_Embed_NOTFOUND.title)
                    .setDescription(config.Leaderboard_System.Leaderboard_Embed_NOTFOUND.description)
                    .setTimestamp()
                ]
            })
        }
    },
};

/*

Code used in this script has been written by original PizzaParadise developer - PGamingHD#0666
Require assistance with scripts? Join the discord and get help right away! - https://discord.gg/pxySje4GPC
Other than that, please do note that it is required if you are using this to mention the original developer
Original Developer - PGamingHD#0666

*/