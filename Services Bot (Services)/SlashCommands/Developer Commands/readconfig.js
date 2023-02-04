const {
    Client,
    EmbedBuilder,
    ApplicationCommandOptionType,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    TextInputStyle,
    ModalBuilder,
    TextInputBuilder
} = require("discord.js");
const ee = require("../../botconfig/embed.json");
const userWallet = require("../../schemas/userWallets");
const config = require("../../botconfig/config.json");
const lineByLine = require("n-readlines");
const fs = require("fs");
require('dotenv').config();

module.exports = {
    name: 'config',
    description: 'Configure the main config from Discord, awesome right?',

    /** 
     * @param {Client} client 
     * @param {Message} message 
     * @param {String[]} args 
     */
    run: async (client, interaction, args) => { 
        if (interaction.user.id !== "266726434855321600" && interaction.user.id !== "694107202344058880") {
            return interaction.reply({
                content: ':x: Must be guild owner to open this!',
                ephemeral: true
            });
        }

        const liner = new lineByLine('./botconfig/config.json');

        let line;
        let lineNumber = 1;
        let lineStorage = "";

        let linesArray = [];
        while (line = liner.next()) {
            if (lineNumber % 20 === 0) {
                linesArray.push(lineStorage);
                lineStorage = "";
            }

            const remadeLine = line.toString('utf-8').replaceAll('`', "\`") + "\r";
            lineStorage += remadeLine;
            lineNumber++;
        }

        if (lineStorage !== "") {
            linesArray.push(lineStorage)
        }

        if (linesArray.length === 0) {
            return console.log(lineNumber)
        }

        const mainRow = new ActionRowBuilder()
        mainRow.addComponents([
            new ButtonBuilder()
            .setEmoji('⏪')
            .setCustomId('fastbackward')
            .setStyle(ButtonStyle.Primary)
        ])
        mainRow.addComponents([
            new ButtonBuilder()
            .setEmoji('⬅️')
            .setCustomId('backward')
            .setStyle(ButtonStyle.Primary)
        ])
        mainRow.addComponents([
            new ButtonBuilder()
            .setEmoji('⏹️')
            .setCustomId('exit')
            .setStyle(ButtonStyle.Primary)
        ])
        mainRow.addComponents([
            new ButtonBuilder()
            .setEmoji('➡️')
            .setCustomId('forward')
            .setStyle(ButtonStyle.Primary)
        ])
        mainRow.addComponents([
            new ButtonBuilder()
            .setEmoji('⏩')
            .setCustomId('fastforward')
            .setStyle(ButtonStyle.Primary)
        ])

        const secondMainRow = new ActionRowBuilder()
        secondMainRow.addComponents([
            new ButtonBuilder()
            .setLabel('ㅤ')
            .setCustomId('1')
            .setStyle(ButtonStyle.Secondary)
        ])
        secondMainRow.addComponents([
            new ButtonBuilder()
            .setLabel('ㅤ')
            .setCustomId('2')
            .setStyle(ButtonStyle.Secondary)
        ])
        secondMainRow.addComponents([
            new ButtonBuilder()
            .setEmoji('✏️')
            .setCustomId('edit')
            .setStyle(ButtonStyle.Primary)
        ])
        secondMainRow.addComponents([
            new ButtonBuilder()
            .setEmoji('💾')
            .setCustomId('save')
            .setStyle(ButtonStyle.Secondary)
        ])
        secondMainRow.addComponents([
            new ButtonBuilder()
            .setLabel('ㅤ')
            .setCustomId('4')
            .setStyle(ButtonStyle.Secondary)
        ])

        let currentPage = 0;
        const embeds = linesArray;

        await interaction.reply({
            embeds: [
                new EmbedBuilder()
                .setColor(ee.color)
                .setTitle('Configuration File')
                .setDescription(`\`\`\`json\n${embeds[currentPage]}\`\`\``)
                .setFooter({text: `Page ${currentPage+1} of ${embeds.length}`})
                .setTimestamp()
            ],
            components: [mainRow, secondMainRow],
            ephemeral: true,
            fetchReply: true
        })

        const newInteraction = await interaction.fetchReply()

        const filter = m => m.user.id === interaction.user.id;
        const collector = newInteraction.createMessageComponentCollector({
            filter,
            idle: 1000 * 60,
            time: 1000 * 120
        });

        collector.on('collect', async (interactionCollector) => {
            if (interactionCollector.customId === "1" || interactionCollector.customId === "2" || interactionCollector.customId === "3" || interactionCollector.customId === "4") {
                await interactionCollector.deferUpdate();
            }

            if (interactionCollector.customId === "save") {
                const newEmbeds = embeds.join('');

                const isValid = validateJSON(newEmbeds);
                
                if (!isValid) {
                    return interactionCollector.reply({
                        content: `:x: JSON saved is not valid JSON, please make sure **everything** is **valid** before saving`,
                        ephemeral: true
                    })
                } else {
                    const parsedJSON = JSON.parse(newEmbeds);
                    fs.writeFileSync('./botconfig/config.json', JSON.stringify(parsedJSON, null, 2), 'utf8');

                    return interactionCollector.reply({
                        content: `:white_check_mark: Configuration has been successfully saved to the config.json file!`,
                        ephemeral: true
                    })
                }
            }

            if (interactionCollector.customId === "edit") {
                const modal = new ModalBuilder()
                    .setCustomId('editModal')
                    .setTitle('Editing Configuration');

                const firstActionRow = new ActionRowBuilder()
                    .addComponents([
                        new TextInputBuilder()
                        .setCustomId('configValue')
                        .setLabel('Make sure config is VALID JSON!')
                        .setStyle(TextInputStyle.Paragraph)
                        //.setMinLength(1)
                        //.setMaxLength(10)
                        .setValue(embeds[currentPage])
                        .setPlaceholder('JSON Value Here')
                        .setRequired(true),
                    ]);

                modal.addComponents([firstActionRow]);

                await interactionCollector.showModal(modal);

                const modalSubmit = await interactionCollector.awaitModalSubmit({
                    filter: i => i.user.id === interaction.user.id,
                    time: 60000 * 5,
                });

                const newJSON = modalSubmit.fields.getTextInputValue('configValue');
                embeds[currentPage] = newJSON;

                await modalSubmit.reply({content: ':white_check_mark:', ephemeral: true})
            }

            if (interactionCollector.customId === "forward") {
                await interactionCollector.deferUpdate();
                if (currentPage < embeds.length - 1) {
                    currentPage++;
                    interactionCollector.editReply({
                        //content: `\`\`\`json\n${embeds[currentPage]}\`\`\`\nPage ${currentPage+1} of ${embeds.length}`,
                        embeds: [
                            new EmbedBuilder()
                            .setColor(ee.color)
                            .setTitle('Configuration File')
                            .setDescription(`\`\`\`json\n${embeds[currentPage]}\`\`\``)
                            .setFooter({text: `Page ${currentPage+1} of ${embeds.length}`})
                            .setTimestamp()
                        ],
                    })
                } else {
                    --currentPage;
                    interactionCollector.editReply({
                        //content: `\`\`\`json\n${embeds[currentPage]}\`\`\`\nPage ${currentPage+1} of ${embeds.length}`,
                        embeds: [
                            new EmbedBuilder()
                            .setColor(ee.color)
                            .setTitle('Configuration File')
                            .setDescription(`\`\`\`json\n${embeds[currentPage]}\`\`\``)
                            .setFooter({text: `Page ${currentPage+1} of ${embeds.length}`})
                            .setTimestamp()
                        ],
                    })
                }
            }

            if (interactionCollector.customId === "backward") {
                await interactionCollector.deferUpdate();
                if (currentPage !== 0) {
                    --currentPage;
                    interactionCollector.editReply({
                        //content: `\`\`\`json\n${embeds[currentPage]}\`\`\`\nPage ${currentPage+1} of ${embeds.length}`,
                        embeds: [
                            new EmbedBuilder()
                            .setColor(ee.color)
                            .setTitle('Configuration File')
                            .setDescription(`\`\`\`json\n${embeds[currentPage]}\`\`\``)
                            .setFooter({text: `Page ${currentPage+1} of ${embeds.length}`})
                            .setTimestamp()
                        ],
                    })
                } else {
                    currentPage++;
                    interactionCollector.editReply({
                        //content: `\`\`\`json\n${embeds[currentPage]}\`\`\`\nPage ${currentPage+1} of ${embeds.length}`,
                        embeds: [
                            new EmbedBuilder()
                            .setColor(ee.color)
                            .setTitle('Configuration File')
                            .setDescription(`\`\`\`json\n${embeds[currentPage]}\`\`\``)
                            .setFooter({text: `Page ${currentPage+1} of ${embeds.length}`})
                            .setTimestamp()
                        ],
                    })
                }
            }

            if (interactionCollector.customId === "fastforward") {
                await interactionCollector.deferUpdate();
                if (currentPage < embeds.length - 1) {
                    currentPage = embeds.length - 1;
                    interactionCollector.editReply({
                        //content: `\`\`\`json\n${embeds[currentPage]}\`\`\`\nPage ${currentPage+1} of ${embeds.length}`,
                        embeds: [
                            new EmbedBuilder()
                            .setColor(ee.color)
                            .setTitle('Configuration File')
                            .setDescription(`\`\`\`json\n${embeds[currentPage]}\`\`\``)
                            .setFooter({text: `Page ${currentPage+1} of ${embeds.length}`})
                            .setTimestamp()
                        ],
                    })
                }
            }

            if (interactionCollector.customId === "fastbackward") {
                await interactionCollector.deferUpdate();
                currentPage = 0;
                interactionCollector.editReply({
                    //content: `\`\`\`json\n${embeds[currentPage]}\`\`\`\nPage ${currentPage+1} of ${embeds.length}`,
                    embeds: [
                        new EmbedBuilder()
                        .setColor(ee.color)
                        .setTitle('Configuration File')
                        .setDescription(`\`\`\`json\n${embeds[currentPage]}\`\`\``)
                        .setFooter({text: `Page ${currentPage+1} of ${embeds.length}`})
                        .setTimestamp()
                    ],
                })
            }

            if (interactionCollector.customId === "exit") {
                await interactionCollector.deferUpdate();
                collector.stop();
            }
        })

        collector.on('end', async (collected) => {
            if (collected.size > 0) {
                for (let i = 0; i < mainRow.components.length; i++) {
                    mainRow.components[i].setDisabled(true);
                }

                for (let i = 0; i < secondMainRow.components.length; i++) {
                    secondMainRow.components[i].setDisabled(true);
                }

                await interaction.editReply({
                    components: [mainRow, secondMainRow]
                });
            }
        })
    }
}

function validateJSON(str) {
    try {
        JSON.parse(str);
    } catch (e) {
        return false;
    }
    return true;
}

/*

Code used in this script has been written by PGTechnologies™
This project has been licensed through PGTechnologies™, you are NOT permitted to take credit for this project.
Require assistance with scripts? Join the discord and get help right away! - https://discord.gg/xQFFRzhJu2
Original Developer - PGamingHD#0666

*/