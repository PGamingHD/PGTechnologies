const {
    Client,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
} = require('discord.js');
const config = require('../../botconfig/config.json');
const {
    EmbedBuilder
} = require('@discordjs/builders');

module.exports = {
    name: 'sendticket',
    description: 'Send out the ticket button!',
    IsDevOnly: true,
    /** 
     * @param {Client} client 
     * @param {Message} message 
     * @param {String[]} args 
     */
    run: async (client, interaction, con, args) => {
        const channel = interaction.guild.channels.cache.get(interaction.channel.id);
        const row = new ActionRowBuilder()
            .addComponents([
                new ButtonBuilder()
                .setEmoji({
                    name: config.Ticket_System.MAIN_EMBED.components.buy1.emoji
                })
                .setLabel(config.Ticket_System.MAIN_EMBED.components.buy1.label)
                .setCustomId('buy1')
                .setStyle(ButtonStyle.Success)
            ])
            .addComponents([
                new ButtonBuilder()
                .setEmoji({
                    name: config.Ticket_System.MAIN_EMBED.components.sell1.emoji
                })
                .setLabel(config.Ticket_System.MAIN_EMBED.components.sell1.label)
                .setCustomId('sell1')
                .setStyle(ButtonStyle.Danger)
            ])
            .addComponents([
                new ButtonBuilder()
                .setLabel('ㅤ')
                .setCustomId('return')
                .setStyle(ButtonStyle.Secondary)
            ])
            .addComponents([
                new ButtonBuilder()
                .setEmoji({
                    name: config.Ticket_System.MAIN_EMBED.components.buy2.emoji
                })
                .setLabel(config.Ticket_System.MAIN_EMBED.components.buy2.label)
                .setCustomId('buy2')
                .setStyle(ButtonStyle.Success)
            ])
            .addComponents([
                new ButtonBuilder()
                .setEmoji({
                    name: config.Ticket_System.MAIN_EMBED.components.sell2.emoji
                })
                .setLabel(config.Ticket_System.MAIN_EMBED.components.sell2.label)
                .setCustomId('sell2')
                .setStyle(ButtonStyle.Danger)
            ])

        return await channel.send({
            embeds: [
                new EmbedBuilder()
                .setThumbnail(config.Ticket_System.MAIN_EMBED.thumbnail)
                .setColor(config.Ticket_System.MAIN_EMBED.color)
                .setTitle(config.Ticket_System.MAIN_EMBED.title)
                .setDescription(config.Ticket_System.MAIN_EMBED.description)
                .setFooter({
                    text: config.Ticket_System.MAIN_EMBED.footer.text
                })
                .setAuthor({
                    name: config.Ticket_System.MAIN_EMBED.author.name,
                    iconURL: config.Ticket_System.MAIN_EMBED.author.iconURL
                })
            ],
            components: [row]
        })
    }
}

/*

Code used in this script has been written by PGTechnologies™
This project has been licensed through PGTechnologies™, you are NOT permitted to take credit for this project.
Require assistance with scripts? Join the discord and get help right away! - https://discord.gg/xQFFRzhJu2
Original Developer - PGamingHD#0666

*/