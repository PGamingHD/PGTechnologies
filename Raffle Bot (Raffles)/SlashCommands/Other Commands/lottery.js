const {
    Client,
    CommandInteraction,
    MessageEmbed,
    MessageActionRow,
    MessageButton,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    EmbedBuilder
} = require('discord.js');
const ee = require('../../botconfig/embed.json');
const userData = require("../../schemas/userWallets");
const lotteryData = require("../../schemas/lotteryData");


module.exports = {
    name: 'lottery',
    description: 'View current lottery state, possibly purchase a ticket of your own?',

    /** 
     * @param {Client} client 
     * @param {Message} message 
     * @param {String[]} args 
     */
    run: async (client, interaction, args) => {

        const mainRow = new ActionRowBuilder()
        mainRow.addComponents([
            new ButtonBuilder()
            .setLabel('BUY TICKET')
            .setCustomId('buy')
            .setStyle(ButtonStyle.Success)
        ]);
        mainRow.addComponents([
            new ButtonBuilder()
            .setLabel('VIEW CHANCES')
            .setCustomId('chances')
            .setStyle(ButtonStyle.Primary)
        ]);

        const purchaseRow = new ActionRowBuilder()
        purchaseRow.addComponents([
            new ButtonBuilder()
            .setEmoji('✅')
            .setCustomId('confirm')
            .setStyle(ButtonStyle.Success)
        ]);
        purchaseRow.addComponents([
            new ButtonBuilder()
            .setLabel('❌')
            .setCustomId('decline')
            .setStyle(ButtonStyle.Danger)
        ]);

        let ownedAmount = 0;
        const getOwnedAmount = await lotteryData.findOne({
            "OwnedTickets.TicketOwner": interaction.user.id
        }, {
            "OwnedTickets.$": 1
        });

        if (getOwnedAmount) {
            ownedAmount = getOwnedAmount.OwnedTickets[0].TicketsOwned;
        }

        const lottery = await lotteryData.findOne();

        const date = new Date();

        const currentMin = date.getMinutes();

        const minutesTillNextHour = 60 - currentMin;

        const newMsg = await interaction.reply({
            embeds: [
                new EmbedBuilder()
                .setColor(ee.color)
                .setTitle(`Raffles - Buy Tickets`)
                .setDescription(`**Current Price Pot:** *${lottery.LotteryPricePot.toLocaleString('en-US')}$*\n**Total Tickets Sold:** *${lottery.LotterySoldTickets.toLocaleString('en-US')}x*\n**Previous Lottery Winner:** *${lottery.LotteryLastWinner === "none" ? 'No previous winner' : lottery.LotteryLastWinner}*\n\n**Total Owned Tickets:** *${ownedAmount}x*\n\n**Drawing in ${minutesTillNextHour} minute(s)!**`)
                .setFooter({
                    text: 'The lottery winners are drawn once every hour, buy a ticket for a chance to win'
                })
                .setAuthor({
                    iconURL: client.user.displayAvatarURL(),
                    name: client.user.username
                })
                .setThumbnail(client.user.displayAvatarURL())
            ],
            components: [mainRow]
        });

        const filter = m => m.user.id === interaction.user.id;
        const collector = newMsg.createMessageComponentCollector({
            filter,
            idle: 1000 * 60,
            time: 1000 * 120
        });

        collector.on('collect', async (interactionCollector) => {
            if (interactionCollector.customId === "buy") {
                await interactionCollector.deferUpdate();

                const userInfo = await userData.findOne({
                    userId: interactionCollector.user.id
                });

                const amountmsg = await interactionCollector.channel.send({
                    content: `${interactionCollector.user}, Please enter a valid amount of lottery tickets to purchase.`
                });

                const filter1 = m => m.author.id === interaction.user.id;

                const chosenAmount = await interaction.channel.awaitMessages({
                    filter1,
                    max: 1,
                    time: 1000 * 60,
                    errors: ['time']
                });

                const reply = chosenAmount.first();
                await amountmsg.delete();
                await reply.delete();

                if (isNaN(reply.content)) {
                    const invalidamount = await interactionCollector.channel.send({
                        content: `${interactionCollector.user}, Please enter a valid **number** as lottery tickets to purchase.`
                    });

                    setTimeout(async () => {
                        await invalidamount.delete();
                    }, 1000 * 5);
                    return;
                }

                const totalCost = 1 * parseInt(reply.content); //LOTTERY TICKETS FOR 5k/each!

                if (totalCost > userInfo.wallet.Balance) {
                    const invalidamount = await interactionCollector.channel.send({
                        content: `${interactionCollector.user}, Looks like you cannot afford that amount, please try another amount.`
                    });

                    setTimeout(async () => {
                        await invalidamount.delete();
                    }, 1000 * 5);
                    return;
                }

                await interactionCollector.editReply({
                    embeds: [
                        new EmbedBuilder()
                        .setTitle(`Casino Online - Lottery`)
                        .setColor(ee.color)
                        .setDescription(`**Ticket Amount:** *${parseInt(reply.content).toLocaleString('en-US')}*\n**Total Cost:** *${totalCost.toLocaleString('en-US')}$*`)
                        .setFooter({
                            text: 'The lottery winners are drawn once every hour, buy a ticket for a chance to win'
                        })
                        .setAuthor({
                            iconURL: client.user.displayAvatarURL(),
                            name: client.user.username
                        })
                        .setThumbnail(client.user.displayAvatarURL())
                    ],
                    components: [purchaseRow]
                });

                const newInteraction = await interaction.fetchReply()

                const filter = m => m.user.id === interaction.user.id;
                const collector = newInteraction.createMessageComponentCollector({
                    filter,
                    idle: 1000 * 60,
                    time: 1000 * 120
                });

                collector.on('collect', async (interactionCollector) => {
                    if (interactionCollector.customId === "confirm") {
                        await interactionCollector.deferUpdate();

                        const findOlderTickets = await lotteryData.findOne({
                            "OwnedTickets.TicketOwner": interactionCollector.user.id,
                        }, {
                            "OwnedTickets.$": 1
                        });

                        const findOlderTotal = await lotteryData.findOne();

                        let IDarray = [];
                        const startID = findOlderTotal.LotterySoldTickets + 1;
                        for (let i = 0; i < parseInt(reply.content); i++) {
                            IDarray.push({
                                TicketID: startID + i
                            });
                        }

                        const newSoldTickets = findOlderTotal.LotterySoldTickets + parseInt(reply.content);
                        const newPricePot = findOlderTotal.LotteryPricePot + totalCost;

                        await findOlderTotal.updateOne({
                            LotterySoldTickets: newSoldTickets,
                            LotteryPricePot: newPricePot
                        });

                        await userData.findOneAndUpdate({
                            userId: interactionCollector.user.id,
                        }, {
                            $set: {
                                "wallet.Balance": userInfo.wallet.Balance - totalCost
                            }
                        });

                        if (findOlderTickets) {
                            await lotteryData.findOneAndUpdate({
                                "OwnedTickets.TicketOwner": interactionCollector.user.id,
                                "OwnedTickets.$": 1
                            }, {
                                $push: {
                                    'OwnedTickets.$.TicketsOwnedIDs': IDarray
                                }
                            });
                        } else {
                            await lotteryData.findOneAndUpdate({}, {
                                $push: {
                                    OwnedTickets: {
                                        TicketOwner: interactionCollector.user.id,
                                        TicketsOwned: parseInt(reply.content),
                                        TicketsOwnedIDs: IDarray
                                    }
                                }
                            });
                        }

                        await interactionCollector.editReply({
                            content: `${interactionCollector.user}, You successfully just purchased \`${reply.content}x\` lottery tickets, you will be DMed if you win with one of the tickets!`,
                            embeds: [],
                            components: []
                        });
                    }

                    if (interactionCollector.customId === "decline") {
                        await interactionCollector.deferUpdate();
                        await newInteraction.delete();
                        await collector.stop();
                    }
                });

                collector.on('end', async (collected) => {
                    try {
                        if (collected.size === 0) {
                            for (let i = 0; i < purchaseRow.components.length; i++) {
                                purchaseRow.components[i].setDisabled(true);
                            }
        
                            await interaction.editReply({
                                components: [purchaseRow]
                            });
                        }
                    } catch (error) {
                        if (error.message === "Unknown Message") {
                            return;
                        } else {
                            console.log(error)
                        }
                    }
                });
            }

            if (interactionCollector.customId === "chances") {
                await interactionCollector.deferUpdate();

                const percentageChance = (ownedAmount / lottery.LotterySoldTickets) * 100;
                const ownedAmountTernary = ownedAmount === 0 ? '**You do not currently have any lottery tickets.**' : `**Personal Win Chance:** *${percentageChance}%*`;

                await interactionCollector.editReply({
                    embeds: [
                        new EmbedBuilder()
                        .setTitle(`Casino Online - Lottery`)
                        .setColor(ee.color)
                        .setDescription(`${ownedAmountTernary}\n**Personal Ticket Owned:** *${ownedAmount}x*\n\n*Your chance to win is calculated by total sold tickets and your own, each ticket is given their own ID!*`)
                        .setFooter({
                            text: 'The lottery winners are drawn once every hour, buy a ticket for a chance to win'
                        })
                        .setAuthor({
                            iconURL: client.user.displayAvatarURL(),
                            name: client.user.username
                        })
                        .setThumbnail(client.user.displayAvatarURL())
                    ],
                    components: []
                });
            }
        });

        collector.on('end', async (collected) => {
            try {
                if (collected.size === 0) {
                    for (let i = 0; i < mainRow.components.length; i++) {
                        mainRow.components[i].setDisabled(true);
                    }

                    await interaction.editReply({
                        components: [mainRow]
                    });
                }
            } catch (error) {
                if (error.message === "Unknown Message") {
                    return;
                } else {
                    console.log(error)
                }
            }
        });
    }
}