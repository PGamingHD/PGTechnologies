const {
    Client,
    EmbedBuilder,
    ApplicationCommandOptionType
} = require("discord.js");
const ee = require("../../botconfig/embed.json");
const axios = require("axios");
const userData = require("../../schemas/userData");
const config = require("../../botconfig/config.json");
require('dotenv').config();

module.exports = {
    name: 'leaderboard',
    description: 'Get the biggest donator, thanks! :D',

    /** 
     * @param {Client} client 
     * @param {Message} message 
     * @param {String[]} args 
     */
    run: async (client, interaction, args) => {
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
    
    
            return await interaction.reply({
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
            return await interaction.reply({
                embeds: [
                    new EmbedBuilder()
                    .setColor(config.Leaderboard_System.Leaderboard_Embed_NOTFOUND.color)
                    .setTitle(config.Leaderboard_System.Leaderboard_Embed_NOTFOUND.title)
                    .setDescription(config.Leaderboard_System.Leaderboard_Embed_NOTFOUND.description)
                    .setTimestamp()
                ]
            })
        }
    }
}

/*

Code used in this script has been written by PGTechnologies™
This project has been licensed through PGTechnologies™, you are NOT permitted to take credit for this project.
Require assistance with scripts? Join the discord and get help right away! - https://discord.gg/xQFFRzhJu2
Original Developer - PGamingHD#0666

*/