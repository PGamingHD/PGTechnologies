const {
    Client,
    EmbedBuilder,
    ApplicationCommandOptionType,
} = require("discord.js");
const ee = require("../../../Services Bot (Services)/botconfig/embed.json");
const config = require("../../../Services Bot (Services)/botconfig/config.json");

module.exports = {
    name: 'announce',
    description: 'Announce something through embeds',
    IsDevOnly: true,
    options: [{
        name: 'description',
        description: 'The description of the embed',
        type: ApplicationCommandOptionType.String,
        required: true
    }, {
        name: 'channel',
        description: 'The channel to send the embed to',
        type: ApplicationCommandOptionType.Channel,
        required: true
    }, {
        name: 'title',
        description: 'If you want to change the embed title',
        type: ApplicationCommandOptionType.String,
    }, {
        name: 'color',
        description: 'If you want to change the embed color',
        type: ApplicationCommandOptionType.String,
        choices: [{
            name: 'Warning',
            value: 'warning'
        }, {
            name: 'Error',
            value: 'error'
        }, {
            name: 'Success',
            value: 'success'
        }, {
            name: 'Normal',
            value: 'normal'
        }]
    }, {
        name: 'image',
        description: 'The image to display below',
        type: ApplicationCommandOptionType.String
    }, {
        name: 'thumbnail',
        description: 'The image to display besides text',
        type: ApplicationCommandOptionType.String
    }, {
        name: 'content',
        description: 'The content to add to the message',
        type: ApplicationCommandOptionType.String
    }],
    /** 
     * @param {Client} client 
     * @param {Message} message 
     * @param {String[]} args 
     */
    run: async (client, interaction, args) => {
        const embedDescription = interaction.options.getString('description');
        const embedChannel = interaction.options.getChannel('channel');
        const embedTitle = interaction.options.getString('title');
        const thumbnail = interaction.options.getString('thumbnail');
        const image = interaction.options.getString('image');
        const embedColor = interaction.options.getString('color');
        let messageContent = interaction.options.getString('content');
        let color = ee.maintenanceColor;

        if (embedColor === "warning") color = ee.maintenanceColor;
        if (embedColor === "error") color = ee.errorColor;
        if (embedColor === "success") color = ee.successColor;
        if (embedColor === "normal") color = ee.color;

        if (messageContent === config.Announce_System.content_ping_everyone) messageContent = `${interaction.guild.roles.everyone}`;
        if (messageContent === config.Announce_System.content_ping_here) messageContent = `${interaction.guild.roles.here}`;

        const remadeDescription = embedDescription.replaceAll(config.Announce_System.breakline_char, '\n');
        const remadeDescription2 = remadeDescription.replaceAll(config.Announce_System.makespace_char, 'ㅤ');

        const embed = new EmbedBuilder()
        .setColor(color)
        .setDescription(remadeDescription2)
        .setAuthor({
            name: `${config.Announce_System.announced_by} ${interaction.user.tag}`,
            iconURL: config.Announce_System.announced_by_icon
        })
        .setFooter({text: config.Announce_System.footer.text, iconURL: config.Announce_System.footer.iconURL})
        .setTimestamp()

        if (thumbnail) {
            try {
                embed.setThumbnail(thumbnail);
            } catch {}
        }

        if (image) {
            try {
                embed.setImage(image);
            } catch {}
        }

        if(embedTitle) {
            try {
                embed.setTitle(embedTitle);
            } catch {}
        }

        return await embedChannel.send({
            content: messageContent,
            embeds: [embed]
        });
    }
}

/*

Code used in this script has been written by PGTechnologies™
This project has been licensed through PGTechnologies™, you are NOT permitted to take credit for this project.
Require assistance with scripts? Join the discord and get help right away! - https://discord.gg/xQFFRzhJu2
Original Developer - PGamingHD#0666

*/