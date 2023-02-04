const {
    MessageEmbed,
    ModalBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    TextInputStyle,
    TextInputBuilder,
    EmbedBuilder,
    ChannelType,
    AttachmentBuilder
} = require("discord.js");
const client = require("../index");
const ee = require("../botconfig/embed.json");
const config = require("../botconfig/config.json");
const axios = require("axios");
require('dotenv').config();

client.on("interactionCreate", async (interaction) => {

    if (interaction.isCommand()) {
        const cmd = client.slashCommands.get(interaction.commandName);
        if (!cmd) {
            let embed = new MessageEmbed()
                .setColor(ee.errorColor)
                .setDescription(`:x: An error has occured, please contact the developer if this is a mistake.`)
            return interaction.reply({
                embeds: [embed],
                epehemeral: true
            });
        }

        let hasAccess = false;
        if (interaction.guild.ownerId === interaction.user.id) hasAccess = true;
        
        config.accessRoles.forEach(role => {
            if (interaction.member.roles.cache.has(role)) hasAccess = true;
        });

        if (cmd.IsDevOnly && !hasAccess) {
            return interaction.reply({
                embeds: [
                    new EmbedBuilder()
                    .setColor(ee.errorColor)
                    .setTitle(`:x: Missing Permissions :x:`)
                    .setDescription(`***It seems like you do not have the required Administrator Role to execute this command.***`)
                ],
                ephemeral: true
            })
        }

        const args = [];
        const con = client.connection;

        for (let option of interaction.options.data) {
            if (option.type === "SUB_COMMAND") {
                if (option.name) args.push(option.name);
                option.options?.forEach((x) => {
                    if (x.value) args.push(x.value);
                });
            } else if (option.value) args.push(option.value);
        }
        interaction.member = interaction.guild.members.cache.get(interaction.user.id);

        if (!interaction.member.permissions.has(cmd.userPermissions || []))
            return interaction.reply({
                content: "You do not have permissions to use this command!",
            });
        await cmd.run(client, interaction, con, args);
    }

    if (interaction.isButton()) {
        const {
            member,
            channel,
            message
        } = interaction;

    }
});

/*

Code used in this script has been written by PGTechnologies™
This project has been licensed through PGTechnologies™, you are NOT permitted to take credit for this project.
Require assistance with scripts? Join the discord and get help right away! - https://discord.gg/xQFFRzhJu2
Original Developer - PGamingHD#0666

*/