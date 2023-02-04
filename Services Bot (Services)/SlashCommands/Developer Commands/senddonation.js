const {
    Client,
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle
} = require("discord.js");
const config = require("../../botconfig/config.json");
require('dotenv').config();

module.exports = {
    name: 'senddonation',
    description: 'Get the current bot, api & database ping!',
    IsDevOnly: true,
    /** 
     * @param {Client} client 
     * @param {Message} message 
     * @param {String[]} args 
     */
    run: async (client, interaction, args) => {
        const row = new ActionRowBuilder()
        .addComponents([
            new ButtonBuilder()
            .setEmoji({
                name: config.Donation_System.MAIN_EMBED.components.openDonation.emoji
            })
            .setLabel(config.Donation_System.MAIN_EMBED.components.openDonation.label)
            .setCustomId('openDonation')
            .setStyle(ButtonStyle.Success)
        ])

        return await interaction.channel.send({
            embeds: [
                new EmbedBuilder()
                .setColor(config.Donation_System.MAIN_EMBED.color)
                .setAuthor({name: config.Donation_System.MAIN_EMBED.author.name, iconURL: config.Donation_System.MAIN_EMBED.author.iconURL})
                .setDescription(config.Donation_System.MAIN_EMBED.description)
                .setThumbnail(config.Donation_System.MAIN_EMBED.thumbnail)
                .setFooter({text: config.Donation_System.MAIN_EMBED.footer.text, iconURL: config.Donation_System.MAIN_EMBED.footer.iconURL})
            ],
            components: [row]
        });
    }
}

/*

Code used in this script has been written by PGTechnologies™
This project has been licensed through PGTechnologies™, you are NOT permitted to take credit for this project.
Require assistance with scripts? Join the discord and get help right away! - https://discord.gg/xQFFRzhJu2
Original Developer - PGamingHD#0666

*/