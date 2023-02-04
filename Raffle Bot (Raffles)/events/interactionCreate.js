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
const donationInvoice = require("../schemas/donationInvoices");
const userData = require("../schemas/userWallets");
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
        if (interaction?.customId === "openDonation") {
            const modal = new ModalBuilder()
                .setCustomId('donationModal')
                .setTitle('Donation Amount');

            const firstActionRow = new ActionRowBuilder()
                .addComponents([
                    new TextInputBuilder()
                        .setCustomId('paymentAmount')
                        .setLabel('Enter amount to Donate')
                        .setStyle(TextInputStyle.Short)
                        .setMinLength(1)
                        .setMaxLength(10)
                        .setPlaceholder('Amount Here')
                        .setRequired(true),
            ]);

            modal.addComponents([firstActionRow]);

            await interaction.showModal(modal);
        }
    }

    if (interaction.isModalSubmit()) {
        if (interaction.customId === "donationModal") {
            const paymentAmount = interaction.fields.getTextInputValue('paymentAmount');
            const user = interaction.user;

            if (isNaN(paymentAmount)) {
                return interaction.reply({
                    content: ':x: Amount is not a valid number, only enter numbers! :x:',
                    ephemeral: true
                });
            }

            const paymentAmountN = parseInt(paymentAmount);
            const createPaymentGateway = await axios({
                url: '/payments',
                method: 'post',
                baseURL: 'https://dev.sellix.io/v1',
                headers: {
                    'Authorization': 'Bearer ' + process.env.SELLIX_API,
                    'X-Sellix-Merchant': process.env.SELLIX_MERCHANT,
                    'Content-Type': 'application/json'
                },
                data: {
                    title: 'Donation User: ' + user.id,
                    currency: config.Donation_System.PAYMENT_CURRENCY,
                    email: 'addfunds.' + user.id + '@gmail.com',
                    white_label: true,
                    value: paymentAmountN,
                    gateways: config.Donation_System.PAYMENT_GATEWAYS
                }
            });
            const createdPayment = createPaymentGateway.data;

            if (createdPayment.status === 200) {
                const invoiceData = createdPayment.data.invoice;

                const donationButton = new ActionRowBuilder()
                .addComponents([
                    new ButtonBuilder()
                    .setURL('https://checkout.sellix.io/payment/' + invoiceData.uniqid)
                    .setLabel('Click to Pay')
                    .setStyle(ButtonStyle.Link)
                ])

                await interaction.reply({
                    embeds: [
                        new EmbedBuilder()
                        .setColor(ee.maintenanceColor)
                        .setTitle('Invoice #' + invoiceData.uniqid)
                        .addFields([{
                            name: '💰 Donation',
                            value: '$' + invoiceData.total,
                            inline: true
                        }, {
                            name: '⏳ Status',
                            value: '⌚ Pending',
                            inline: true
                        }])
                    ],
                    components: [donationButton],
                    ephemeral: true
                });

                const checkerInterval = 0;
                const paymentChecker = setInterval(async () => {
                    checkerInterval++;

                    if (checkerInterval >= 240) return clearInterval(paymentChecker);

                    const products = await axios({
                        url: '/orders/' + invoiceData.uniqid,
                        method: 'get',
                        baseURL: 'https://dev.sellix.io/v1',
                        headers: {
                            'Authorization': 'Bearer ' + process.env.SELLIX_API,
                            'X-Sellix-Merchant': process.env.SELLIX_MERCHANT
                        }
                    });
                    const invoiceStatus = products.data.status;
                    const paymentStatus = products.data.data.order.status;

                    if (invoiceIsValid(invoiceStatus, paymentStatus)) {
                        clearInterval(paymentChecker);
                        const order = products.data.data.order;

                        const hasPayment = await donationInvoice.findOne({
                            invoiceId: order.uniqid
                        });
        
                        const hasUserD = await userData.findOne({
                            userId: interaction.user.id
                        })
        
                        if (hasPayment) {
                            await interaction.message.edit({
                                embeds: [
                                    new EmbedBuilder()
                                    .setColor(ee.maintenanceColor)
                                    .setDescription('Invoice has already been claimed!')
                                ],
                                components: []
                            });
        
                            return interaction.deferUpdate();
                        } else {
                            await donationInvoice.create({
                                invoiceId: order.uniqid,
                                invoiceInfo: {
                                    invoiceOwner: interaction.user.id,
                                    invoiceDonated: order.total,
                                }
                            });
        
                            if (hasUserD) {
                                await userData.findOneAndUpdate({
                                    userId: interaction.user.id
                                }, {
                                    $inc: {
                                        "wallet.Balance": order.total
                                    }
                                })
                            } else {
                                await userData.create({
                                    userId: interaction.user.id,
                                    wallet: {
                                        oBalance: 0,
                                        oSpent: 0,
                                        Balance: order.total,
                                        Spent: 0
                                    }
                                });
                            }
                        }

                        try {
                            await interaction.user.send({
                                embeds: [
                                    new EmbedBuilder()
                                    .setColor(config.Donation_System.ANNOUNCE_EMBED.color)
                                    .setTitle(config.Donation_System.ANNOUNCE_EMBED.title)
                                    .setDescription(stringTemplateParser(config.Donation_System.ANNOUNCE_EMBED.description, {
                                        user: interaction.user.tag,
                                        userid: interaction.user.id,
                                        amount: products.data.data.order.total.toLocaleString('en-US')
                                    }))
                                    .setTimestamp()
                                ]
                            })
                            /*const announceChannel = await interaction.guild.channels.fetch(config.Donation_System.ANNOUNCE_NEW_DONATIONS);

                            await announceChannel.send({
                                embeds: [
                                    new EmbedBuilder()
                                    .setColor(config.Donation_System.ANNOUNCE_EMBED.color)
                                    .setTitle(config.Donation_System.ANNOUNCE_EMBED.title)
                                    .setDescription(stringTemplateParser(config.Donation_System.ANNOUNCE_EMBED.description, {
                                        user: interaction.user.tag,
                                        userid: interaction.user.id,
                                        amount: products.data.data.order.total.toLocaleString('en-US')
                                    }))
                                    .setTimestamp()
                                ]
                            });*/
                        } catch {}

                        return interaction.editReply({
                            embeds: [
                                new EmbedBuilder()
                                .setColor(ee.successColor)
                                .setTitle('Invoice #' + invoiceData.uniqid)
                                .addFields([{
                                    name: '💰 Donation',
                                    value: '$' + invoiceData.total,
                                    inline: true
                                }, {
                                    name: '⏳ Status',
                                    value: '✅ Paid',
                                    inline: true
                                }])
                            ],
                            components: []
                        });
                    } else {
                        return;
                    }
                }, 1000 * 60);
            } else {
                console.log("Payment not created, responded with error code: " + createdPayment.status);
            }
        }
    }
});

function invoiceIsValid(status, paymentStatus) {
    if (status === 200 && paymentStatus === "COMPLETED") {
        return true;
    } else {
        return false;
    }
}

/*

Code used in this script has been written by PGTechnologies™
This project has been licensed through PGTechnologies™, you are NOT permitted to take credit for this project.
Require assistance with scripts? Join the discord and get help right away! - https://discord.gg/xQFFRzhJu2
Original Developer - PGamingHD#0666

*/