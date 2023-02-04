const {
    Client,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    EmbedBuilder
} = require('discord.js');
const ee = require('../../botconfig/embed.json');

module.exports = {
    name: 'addfunds',
    description: 'Add funds to your wallet balance!',

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
                name: '💰'
            })
            .setLabel('Donate')
            .setCustomId('openDonation')
            .setStyle(ButtonStyle.Success)
        ])

        return await interaction.reply({
            embeds: [
                new EmbedBuilder()
                .setColor(ee.color)
                .setAuthor({name: interaction.user.username, iconURL: interaction.user.displayAvatarURL()})
                .setDescription('**Thank you for using our Server**\n*After the purchase is finalized the funds will be automatically inserted into your Balance!*\n\n**__Accepted Payment Methods__**\n*Please have all payments go through our official Sellix and ONLY our Sellix, link found from clicking button below.*')
                .setThumbnail('https://upload.wikimedia.org/wikipedia/commons/thumb/c/c9/-Insert_image_here-.svg/800px--Insert_image_here-.svg.png')
                .setFooter({text: 'Do not feel like donating is required, it is 100% optional', iconURL: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c9/-Insert_image_here-.svg/800px--Insert_image_here-.svg.png'})
            ],
            components: [row],
            ephemeral: true
        });
    }
}