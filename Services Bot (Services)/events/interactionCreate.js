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
const serverData = require("../schemas/userData");
const userData = require("../schemas/userData");
const donationInvoice = require("../schemas/donationInvoices");
const shopPost = require("../schemas/shopPost");
const dealRanking = require("../schemas/dealRankings");
const finishedRanking = require("../schemas/finishedRankings");
const {generateSnowflake, stringTemplateParser, confirmWallet} = require("../handler/functions");
const {createCanvas, loadImage} = require("@napi-rs/canvas");
const axios = require("axios");
require('dotenv').config();

client.on("interactionCreate", async (interaction) => {

    await confirmWallet(interaction.user);

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

        const staffRoleId = config.Ticket_System.staffRoleId;
        const ticketOpenedCategory = config.Ticket_System.ticketOpenedCategory;
        const ticketClosedCategory = config.Ticket_System.ticketClosedCategory;

        //#region TICKETSYSTEM

        if (interaction?.customId === "buy1Open") {

            const data = await serverData.findOne();

            const findPost = await shopPost.findOne({
                postId: interaction.message.id
            });

            if (!findPost) return interaction.reply({content: ':x: Data not available in database? Please repost if this is yours!', ephemeral: true});

            if (findPost.ownerId === interaction.user.id) {
                return interaction.reply({content: ':x: You may not accept your own shop post! :x:', ephemeral: true});
            }

            if (findPost.ticketId !== "0") {
                return interaction.reply({content: ':x: A deal is already in progress? :x:', ephemeral: true});
            }

            const ticketId = generateSnowflake();

            const guild = interaction.guild;
            const ticketname = `trade-${ticketId}`;
            const staffRole = await interaction.guild.roles.fetch(staffRoleId);
            const ticket = await guild.channels.create({
                name: ticketname,
                type: ChannelType.GuildText,
                reason: `Trade accepted by: ${interaction.user.tag}`,
                parent: ticketOpenedCategory,
                permissionOverwrites: [{
                        id: interaction.guild.roles.everyone,
                        deny: ['ViewChannel']
                    },
                    {
                        id: interaction.member,
                        allow: ['SendMessages', 'ViewChannel', 'ReadMessageHistory']
                    },
                    {
                        id: findPost.ownerId,
                        allow: ['SendMessages', 'ViewChannel', 'ReadMessageHistory']
                    },
                    {
                        id: staffRole,
                        allow: ['SendMessages', 'ViewChannel', 'ReadMessageHistory']
                    }
                ]
            });

            await findPost.updateOne({
                ticketId: ticket.id,
                traderId: interaction.user.id
            });

            const row = new ActionRowBuilder()
                .addComponents([
                    new ButtonBuilder()
                    .setEmoji({
                        name: "❌"
                    })
                    .setLabel('Delete listing')
                    .setCustomId('deleteListing')
                    .setStyle(ButtonStyle.Secondary)
                ])
                .addComponents([
                    new ButtonBuilder()
                    .setEmoji({
                        name: "✅"
                    })
                    .setLabel('Close Trade')
                    .setCustomId('closeTrade')
                    .setStyle(ButtonStyle.Secondary)
                ])

            await ticket.send({
                content: `<@${findPost.ownerId}> | ${interaction.member}`,
                embeds: [
                    new EmbedBuilder()
                    .setColor(config.Ticket_System.TICKET_EMBED_BUY1.color)
                    .setDescription(stringTemplateParser(config.Ticket_System.TICKET_EMBED_BUY1.description, {
                        amount: findPost.postDeal.postAmount,
                        rate: findPost.postDeal.postRate,
                        method: findPost.postDeal.postMethod
                    }))
                    .setThumbnail(config.Ticket_System.TICKET_EMBED_BUY1.thumbnail)
                    .setFooter({
                        text: config.Ticket_System.TICKET_EMBED_BUY1.footer.text
                    })
                ],
                components: [row]
            })

            const buy1Row = new ActionRowBuilder()
            .addComponents([
                new ButtonBuilder()
                .setEmoji({
                    name: '💰'
                })
                .setLabel('Pending')
                .setCustomId('buy1Open')
                .setStyle(ButtonStyle.Danger)
                .setDisabled(true)
            ])
            .addComponents([
                new ButtonBuilder()
                .setEmoji({
                    name: '❌'
                })
                .setLabel('Remove')
                .setCustomId('buy1Close')
                .setStyle(ButtonStyle.Primary)
            ])
            .addComponents([
                new ButtonBuilder()
                .setEmoji({
                    name: '🪪'
                })
                .setLabel('Rate Merchant')
                .setCustomId('rateMerchant')
                .setStyle(ButtonStyle.Secondary)
            ])

            await interaction.message.edit({
                components: [buy1Row]
            })

            return interaction.reply({
                content: `✅ Trade initiated in <#${ticket.id}> ✅`,
                ephemeral: true
            })
        }

        if (interaction?.customId === "buy2Open") {

            const data = await serverData.findOne();

            const findPost = await shopPost.findOne({
                postId: interaction.message.id
            });

            if (!findPost) return interaction.reply({content: ':x: Data not available in database? Please repost if this is yours!', ephemeral: true});

            if (findPost.ownerId === interaction.user.id) {
                return interaction.reply({content: ':x: You may not accept your own shop post! :x:', ephemeral: true});
            }

            if (findPost.ticketId !== "0") {
                return interaction.reply({content: ':x: A deal is already in progress? :x:', ephemeral: true});
            }

            const ticketId = generateSnowflake();

            const guild = interaction.guild;
            const ticketname = `trade-${ticketId}`;
            const staffRole = await interaction.guild.roles.fetch(staffRoleId);
            const ticket = await guild.channels.create({
                name: ticketname,
                type: ChannelType.GuildText,
                reason: `Trade accepted by: ${interaction.user.tag}`,
                parent: ticketOpenedCategory,
                permissionOverwrites: [{
                        id: interaction.guild.roles.everyone,
                        deny: ['ViewChannel']
                    },
                    {
                        id: interaction.member,
                        allow: ['SendMessages', 'ViewChannel', 'ReadMessageHistory']
                    },
                    {
                        id: findPost.ownerId,
                        allow: ['SendMessages', 'ViewChannel', 'ReadMessageHistory']
                    },
                    {
                        id: staffRole,
                        allow: ['SendMessages', 'ViewChannel', 'ReadMessageHistory']
                    }
                ]
            });

            await findPost.updateOne({
                ticketId: ticket.id,
                traderId: interaction.user.id
            });

            const row = new ActionRowBuilder()
                .addComponents([
                    new ButtonBuilder()
                    .setEmoji({
                        name: "❌"
                    })
                    .setLabel('Delete listing')
                    .setCustomId('deleteListing')
                    .setStyle(ButtonStyle.Secondary)
                ])
                .addComponents([
                    new ButtonBuilder()
                    .setEmoji({
                        name: "✅"
                    })
                    .setLabel('Close Trade')
                    .setCustomId('closeTrade')
                    .setStyle(ButtonStyle.Secondary)
                ])

            await ticket.send({
                content: `<@${findPost.ownerId}> | ${interaction.member}`,
                embeds: [
                    new EmbedBuilder()
                    .setColor(config.Ticket_System.TICKET_EMBED_BUY2.color)
                    .setDescription(stringTemplateParser(config.Ticket_System.TICKET_EMBED_BUY2.description, {
                        amount: findPost.postDeal.postAmount,
                        rate: findPost.postDeal.postRate,
                        method: findPost.postDeal.postMethod
                    }))
                    .setThumbnail(config.Ticket_System.TICKET_EMBED_BUY2.thumbnail)
                    .setFooter({
                        text: config.Ticket_System.TICKET_EMBED_BUY2.footer.text
                    })
                ],
                components: [row]
            })

            const buy1Row = new ActionRowBuilder()
            .addComponents([
                new ButtonBuilder()
                .setEmoji({
                    name: '💰'
                })
                .setLabel('Pending')
                .setCustomId('buy2Open')
                .setStyle(ButtonStyle.Danger)
                .setDisabled(true)
            ])
            .addComponents([
                new ButtonBuilder()
                .setEmoji({
                    name: '❌'
                })
                .setLabel('Remove')
                .setCustomId('buy2Close')
                .setStyle(ButtonStyle.Primary)
            ])
            .addComponents([
                new ButtonBuilder()
                .setEmoji({
                    name: '🪪'
                })
                .setLabel('Rate Merchant')
                .setCustomId('rateMerchant')
                .setStyle(ButtonStyle.Secondary)
            ])

            await interaction.message.edit({
                components: [buy1Row]
            })

            return interaction.reply({
                content: `✅ Trade initiated in <#${ticket.id}> ✅`,
                ephemeral: true
            })
        }

        if (interaction?.customId === "sell1Open") {

            const data = await serverData.findOne();

            const findPost = await shopPost.findOne({
                postId: interaction.message.id
            });

            if (!findPost) return interaction.reply({content: ':x: Data not available in database? Please repost if this is yours!', ephemeral: true});

            if (findPost.ownerId === interaction.user.id) {
                return interaction.reply({content: ':x: You may not accept your own shop post! :x:', ephemeral: true});
            }

            if (findPost.ticketId !== "0") {
                return interaction.reply({content: ':x: A deal is already in progress? :x:', ephemeral: true});
            }

            const ticketId = generateSnowflake();

            const guild = interaction.guild;
            const ticketname = `trade-${ticketId}`;
            const staffRole = await interaction.guild.roles.fetch(staffRoleId);
            const ticket = await guild.channels.create({
                name: ticketname,
                type: ChannelType.GuildText,
                reason: `Trade accepted by: ${interaction.user.tag}`,
                parent: ticketOpenedCategory,
                permissionOverwrites: [{
                        id: interaction.guild.roles.everyone,
                        deny: ['ViewChannel']
                    },
                    {
                        id: interaction.member,
                        allow: ['SendMessages', 'ViewChannel', 'ReadMessageHistory']
                    },
                    {
                        id: findPost.ownerId,
                        allow: ['SendMessages', 'ViewChannel', 'ReadMessageHistory']
                    },
                    {
                        id: staffRole,
                        allow: ['SendMessages', 'ViewChannel', 'ReadMessageHistory']
                    }
                ]
            });

            await findPost.updateOne({
                ticketId: ticket.id,
                traderId: interaction.user.id
            });

            const row = new ActionRowBuilder()
                .addComponents([
                    new ButtonBuilder()
                    .setEmoji({
                        name: "❌"
                    })
                    .setLabel('Delete listing')
                    .setCustomId('deleteListing')
                    .setStyle(ButtonStyle.Secondary)
                ])
                .addComponents([
                    new ButtonBuilder()
                    .setEmoji({
                        name: "✅"
                    })
                    .setLabel('Close Trade')
                    .setCustomId('closeTrade')
                    .setStyle(ButtonStyle.Secondary)
                ])

            await ticket.send({
                content: `<@${findPost.ownerId}> | ${interaction.member}`,
                embeds: [
                    new EmbedBuilder()
                    .setColor(config.Ticket_System.TICKET_EMBED_SELL1.color)
                    .setDescription(stringTemplateParser(config.Ticket_System.TICKET_EMBED_SELL1.description, {
                        amount: findPost.postDeal.postAmount,
                        rate: findPost.postDeal.postRate,
                        method: findPost.postDeal.postMethod
                    }))
                    .setThumbnail(config.Ticket_System.TICKET_EMBED_SELL1.thumbnail)
                    .setFooter({
                        text: config.Ticket_System.TICKET_EMBED_SELL1.footer.text
                    })
                ],
                components: [row]
            })

            const buy1Row = new ActionRowBuilder()
            .addComponents([
                new ButtonBuilder()
                .setEmoji({
                    name: '💰'
                })
                .setLabel('Pending')
                .setCustomId('sell1Open')
                .setStyle(ButtonStyle.Danger)
                .setDisabled(true)
            ])
            .addComponents([
                new ButtonBuilder()
                .setEmoji({
                    name: '❌'
                })
                .setLabel('Remove')
                .setCustomId('sell1Close')
                .setStyle(ButtonStyle.Primary)
            ])
            .addComponents([
                new ButtonBuilder()
                .setEmoji({
                    name: '🪪'
                })
                .setLabel('Rate Merchant')
                .setCustomId('rateMerchant')
                .setStyle(ButtonStyle.Secondary)
            ])

            await interaction.message.edit({
                components: [buy1Row]
            })

            return interaction.reply({
                content: `✅ Trade initiated in <#${ticket.id}> ✅`,
                ephemeral: true
            })
        }

        if (interaction?.customId === "sell2Open") {

            const data = await serverData.findOne();

            const findPost = await shopPost.findOne({
                postId: interaction.message.id
            });

            if (!findPost) return interaction.reply({content: ':x: Data not available in database? Please repost if this is yours!', ephemeral: true});

            if (findPost.ownerId === interaction.user.id) {
                return interaction.reply({content: ':x: You may not accept your own shop post! :x:', ephemeral: true});
            }

            if (findPost.ticketId !== "0") {
                return interaction.reply({content: ':x: A deal is already in progress? :x:', ephemeral: true});
            }

            const ticketId = generateSnowflake();

            const guild = interaction.guild;
            const ticketname = `trade-${ticketId}`;
            const staffRole = await interaction.guild.roles.fetch(staffRoleId);
            const ticket = await guild.channels.create({
                name: ticketname,
                type: ChannelType.GuildText,
                reason: `Trade accepted by: ${interaction.user.tag}`,
                parent: ticketOpenedCategory,
                permissionOverwrites: [{
                        id: interaction.guild.roles.everyone,
                        deny: ['ViewChannel']
                    },
                    {
                        id: interaction.member,
                        allow: ['SendMessages', 'ViewChannel', 'ReadMessageHistory']
                    },
                    {
                        id: findPost.ownerId,
                        allow: ['SendMessages', 'ViewChannel', 'ReadMessageHistory']
                    },
                    {
                        id: staffRole,
                        allow: ['SendMessages', 'ViewChannel', 'ReadMessageHistory']
                    }
                ]
            });

            await findPost.updateOne({
                ticketId: ticket.id,
                traderId: interaction.user.id
            });

            const row = new ActionRowBuilder()
                .addComponents([
                    new ButtonBuilder()
                    .setEmoji({
                        name: "❌"
                    })
                    .setLabel('Delete listing')
                    .setCustomId('deleteListing')
                    .setStyle(ButtonStyle.Secondary)
                ])
                .addComponents([
                    new ButtonBuilder()
                    .setEmoji({
                        name: "✅"
                    })
                    .setLabel('Close Trade')
                    .setCustomId('closeTrade')
                    .setStyle(ButtonStyle.Secondary)
                ])

            await ticket.send({
                content: `<@${findPost.ownerId}> | ${interaction.member}`,
                embeds: [
                    new EmbedBuilder()
                    .setColor(config.Ticket_System.TICKET_EMBED_SELL2.color)
                    .setDescription(stringTemplateParser(config.Ticket_System.TICKET_EMBED_SELL2.description, {
                        amount: findPost.postDeal.postAmount,
                        rate: findPost.postDeal.postRate,
                        method: findPost.postDeal.postMethod
                    }))
                    .setThumbnail(config.Ticket_System.TICKET_EMBED_SELL2.thumbnail)
                    .setFooter({
                        text: config.Ticket_System.TICKET_EMBED_SELL2.footer.text
                    })
                ],
                components: [row]
            })

            const buy1Row = new ActionRowBuilder()
            .addComponents([
                new ButtonBuilder()
                .setEmoji({
                    name: '💰'
                })
                .setLabel('Pending')
                .setCustomId('sell2Open')
                .setStyle(ButtonStyle.Danger)
                .setDisabled(true)
            ])
            .addComponents([
                new ButtonBuilder()
                .setEmoji({
                    name: '❌'
                })
                .setLabel('Remove')
                .setCustomId('sell2Close')
                .setStyle(ButtonStyle.Primary)
            ])
            .addComponents([
                new ButtonBuilder()
                .setEmoji({
                    name: '🪪'
                })
                .setLabel('Rate Merchant')
                .setCustomId('rateMerchant')
                .setStyle(ButtonStyle.Secondary)
            ])

            await interaction.message.edit({
                components: [buy1Row]
            })

            return interaction.reply({
                content: `✅ Trade initiated in <#${ticket.id}> ✅`,
                ephemeral: true
            })
        }

        if (interaction?.customId === "rateMerchant") {
            const modal = new ModalBuilder()
            .setCustomId('rateModal')
            .setTitle('Rate Merchant')

        const firstActionRow = new ActionRowBuilder().addComponents([
            new TextInputBuilder()
                .setCustomId('rating')
                .setLabel(`Please enter a rating below`)
                .setStyle(TextInputStyle.Short)
                .setMinLength(1)
                .setMaxLength(1)
                .setPlaceholder(`Enter a Rating`)
                .setRequired(true)
        ]);

        modal.addComponents([firstActionRow]);

        await interaction.showModal(modal);
        }

        if (interaction?.customId === "closeTrade") {
            const channel = interaction.channel;
            const msg = await channel.messages.fetch(interaction.message.id);
            const channelname = interaction.channel.name;

            const staffRole = await interaction.guild.roles.fetch(staffRoleId);
            const ticket = await shopPost.findOne({
                ticketId: interaction.channel.id
            });

            if (!ticket) {
                return interaction.reply({
                    content: ':x: No database data for this found, error? :x:',
                    ephemeral: true
                })
            }

            const user = await client.users.fetch(ticket.ownerId);

            if (interaction.user.id !== ticket.ownerId && !ticket.ticketDone) {
                if (ticket.shopType === "buy1") {

                    const buy1Row = new ActionRowBuilder()
                    .addComponents([
                        new ButtonBuilder()
                        .setEmoji({
                            name: '💰'
                        })
                        .setLabel('Accept')
                        .setCustomId('buy1Open')
                        .setStyle(ButtonStyle.Success)
                    ])
                    .addComponents([
                        new ButtonBuilder()
                        .setEmoji({
                            name: '❌'
                        })
                        .setLabel('Remove')
                        .setCustomId('buy1Close')
                        .setStyle(ButtonStyle.Primary)
                    ])
                    .addComponents([
                        new ButtonBuilder()
                        .setEmoji({
                            name: '🪪'
                        })
                        .setLabel('Rate Merchant')
                        .setCustomId('rateMerchant')
                        .setStyle(ButtonStyle.Secondary)
                    ])

                    const postChannel = await interaction.guild.channels.fetch(ticket.postChannel);
                    const postMessage = await postChannel.messages.fetch(ticket.postId);

                    await ticket.updateOne({
                        traderId: '0',
                        ticketId: '0'
                    })

                    await postMessage.edit({
                        components: [buy1Row]
                    })
                } else if (ticket.shopType === "buy2") {
                    const buy1Row = new ActionRowBuilder()
                    .addComponents([
                        new ButtonBuilder()
                        .setEmoji({
                            name: '💰'
                        })
                        .setLabel('Accept')
                        .setCustomId('buy2Open')
                        .setStyle(ButtonStyle.Success)
                    ])
                    .addComponents([
                        new ButtonBuilder()
                        .setEmoji({
                            name: '❌'
                        })
                        .setLabel('Remove')
                        .setCustomId('buy2Close')
                        .setStyle(ButtonStyle.Primary)
                    ])
                    .addComponents([
                        new ButtonBuilder()
                        .setEmoji({
                            name: '🪪'
                        })
                        .setLabel('Rate Merchant')
                        .setCustomId('rateMerchant')
                        .setStyle(ButtonStyle.Secondary)
                    ])

                    const postChannel = await interaction.guild.channels.fetch(ticket.postChannel);
                    const postMessage = await postChannel.messages.fetch(ticket.postId);

                    global.oldTicketIdentifier = ticket.postId;
                    await ticket.updateOne({
                        traderId: '0',
                        ticketId: '0'
                    })

                    await postMessage.edit({
                        components: [buy1Row]
                    })
                } else if (ticket.shopType === "sell1") {
                    const buy1Row = new ActionRowBuilder()
                    .addComponents([
                        new ButtonBuilder()
                        .setEmoji({
                            name: '💰'
                        })
                        .setLabel('Accept')
                        .setCustomId('sell1Open')
                        .setStyle(ButtonStyle.Success)
                    ])
                    .addComponents([
                        new ButtonBuilder()
                        .setEmoji({
                            name: '❌'
                        })
                        .setLabel('Remove')
                        .setCustomId('sell1Close')
                        .setStyle(ButtonStyle.Primary)
                    ])
                    .addComponents([
                        new ButtonBuilder()
                        .setEmoji({
                            name: '🪪'
                        })
                        .setLabel('Rate Merchant')
                        .setCustomId('rateMerchant')
                        .setStyle(ButtonStyle.Secondary)
                    ])

                    const postChannel = await interaction.guild.channels.fetch(ticket.postChannel);
                    const postMessage = await postChannel.messages.fetch(ticket.postId);

                    global.oldTicketIdentifier = ticket.postId;
                    await ticket.updateOne({
                        traderId: '0',
                        ticketId: '0'
                    })

                    await postMessage.edit({
                        components: [buy1Row]
                    })
                } else if (ticket.shopType === "sell2") {
                    const buy1Row = new ActionRowBuilder()
                    .addComponents([
                        new ButtonBuilder()
                        .setEmoji({
                            name: '💰'
                        })
                        .setLabel('Accept')
                        .setCustomId('sell2Open')
                        .setStyle(ButtonStyle.Success)
                    ])
                    .addComponents([
                        new ButtonBuilder()
                        .setEmoji({
                            name: '❌'
                        })
                        .setLabel('Remove')
                        .setCustomId('sell2Close')
                        .setStyle(ButtonStyle.Primary)
                    ])
                    .addComponents([
                        new ButtonBuilder()
                        .setEmoji({
                            name: '🪪'
                        })
                        .setLabel('Rate Merchant')
                        .setCustomId('rateMerchant')
                        .setStyle(ButtonStyle.Secondary)
                    ])

                    const postChannel = await interaction.guild.channels.fetch(ticket.postChannel);
                    const postMessage = await postChannel.messages.fetch(ticket.postId);

                    global.oldTicketIdentifier = ticket.postId;
                    await ticket.updateOne({
                        traderId: '0',
                        ticketId: '0'
                    })

                    await postMessage.edit({
                        components: [buy1Row]
                    })
                }
            } else {
                await ticket.updateOne({
                    ticketDone: true
                });

                const postChannel = await interaction.guild.channels.fetch(ticket.postChannel);
                const postMessage = await postChannel.messages.fetch(ticket.postId);

                await postMessage.delete();

                return await channel.delete();
            }

            const trader = await client.users.fetch(ticket.traderId);

            await channel.setParent(ticketClosedCategory)
            await channel.permissionOverwrites.create(interaction.guild.roles.everyone, {
                ViewChannel: false,
            });
            
            await channel.permissionOverwrites.create(staffRole, {
                ViewChannel: true,
                SendMessages: true,
                ReadMessageHistory: true,
            })

            await channel.permissionOverwrites.create(trader, {
                ViewChannel: false,
                SendMessages: true,
                ReadMessageHistory: true,
            })

            await channel.permissionOverwrites.create(user, {
                ViewChannel: true,
                SendMessages: true,
                ReadMessageHistory: true,
            })

            const newRow = new ActionRowBuilder()
            .addComponents([
                new ButtonBuilder()
                .setEmoji({
                    name: '❌'
                })
                .setLabel('Delete Listing')
                .setCustomId('deleteListing')
                .setStyle(ButtonStyle.Danger)
            ])
            .addComponents([
                new ButtonBuilder()
                .setEmoji({
                    name: '❌'
                })
                .setLabel('Delete Channel')
                .setCustomId('deleteChannel')
                .setStyle(ButtonStyle.Primary)
            ])

            await msg.edit({components: [newRow]})

            await channel.send({
                content: `${user}, I assume since the trader closed the channel it is not finished, please close your listing if this trade is INDEED done!`,
            });
        }

        if (interaction?.customId === "deleteChannel") {
            await interaction.channel.delete();
        }

        if (interaction?.customId === "sell1Close" || interaction?.customId === "sell2Close" || interaction?.customId === "buy1Close" || interaction?.customId === "buy2Close") {
            const findPost = await shopPost.findOne({
                postId: interaction.message.id
            });

            if (!findPost) return interaction.reply({content: ':x: Data not available in database? Please repost if this is yours!', ephemeral: true});

            
            if (findPost.ownerId !== interaction.user.id) {
                try {
                    const actualOwner = await interaction.guild.members.fetch(findPost.ownerId);

                    return await interaction.reply({content: `:x: You may not remove the post owned by ${actualOwner}! :x:`, ephemeral: true})
                } catch {}
            } else {
                try {
                    const postMessage = await interaction.channel.messages.fetch(findPost.postId);

                    await postMessage.delete();

                    if (findPost.ticketId !== "0") {
                        try {
                            const ticket = await interaction.guild.channels.fetch(findPost.ticketId);
                            await ticket.delete();
                        } catch {}
                    }

                    await shopPost.findOneAndDelete({
                        postId: findPost.postId
                    });

                    return await interaction.reply({content: `:white_check_mark: You successfully removed your shop post! :white_check_mark:`, ephemeral: true})
                } catch {}
            }
        }

        if (interaction?.customId === "deleteListing") {
            const findPost = await shopPost.findOne({
                ticketId: interaction.channel.id
            });

            if (!findPost) return interaction.reply({content: ':x: Data not available in database? Please repost if this is yours!', ephemeral: true});

            
            if (findPost.ownerId !== interaction.user.id) {
                try {
                    const actualOwner = await interaction.guild.members.fetch(findPost.ownerId);

                    return await interaction.reply({content: `:x: You may not remove the post owned by ${actualOwner}! :x:`, ephemeral: true})
                } catch {}
            } else {
                try {
                    const postMessage = await interaction.channel.messages.fetch(findPost.postId);

                    await postMessage.delete();

                    await shopPost.findOneAndDelete({
                        postId: findPost.postId
                    });

                    //return await interaction.reply({content: `:white_check_mark: You successfully removed your shop post! :white_check_mark:`, ephemeral: true})

                    return await interaction.channel.delete();
                } catch {}
            }
        }

        if (interaction?.customId === "agreeTos") {
            await interaction.deferUpdate();

            await interaction.editReply({
                embeds: [
                    new EmbedBuilder()
                    .setColor(config.Donation_System.TOS_EMBED.DISAGREEMENT_EMBED.color)
                    .setTitle(config.Donation_System.TOS_EMBED.DISAGREEMENT_EMBED.title)
                    .setDescription(config.Donation_System.TOS_EMBED.DISAGREEMENT_EMBED.description)
                    .setFooter({text: config.Donation_System.TOS_EMBED.DISAGREEMENT_EMBED.footer.text})
                ],
                components: []
            });

            let buyRating = "Unrated";
            let sellRating = "Unrated";
            let donated = 0;
            const userDonated = await userData.findOne({
                userId: interaction.user.id,
            })

            const userRating = await dealRanking.findOne({
                userId: interaction.user.id
            });

            if (userRating && userRating.saleRated !== 0) sellRating = userRating.saleRank / userRating.saleRated;

            if (userRating && userRating.buyRated !== 0) buyRating = userRating.buyRank / userRating.buyRated;

            if (userDonated) {
                donated = userDonated.totalDonated;
            }

            if (global.type === "sell1") {
                const sell1Channel = await interaction.guild.channels.fetch(config.Donation_System["07GP_SALE_CHANNEL"]);

                const sell1Row = new ActionRowBuilder()
                .addComponents([
                    new ButtonBuilder()
                    .setEmoji({
                        name: '💰'
                    })
                    .setLabel('Accept')
                    .setCustomId('sell1Open')
                    .setStyle(ButtonStyle.Success)
                ])
                .addComponents([
                    new ButtonBuilder()
                    .setEmoji({
                        name: '❌'
                    })
                    .setLabel('Remove')
                    .setCustomId('sell1Close')
                    .setStyle(ButtonStyle.Primary)
                ])
                .addComponents([
                    new ButtonBuilder()
                    .setEmoji({
                        name: '🪪'
                    })
                    .setLabel('Rate Merchant')
                    .setCustomId('rateMerchant')
                    .setStyle(ButtonStyle.Secondary)
                ])

                /*const canvas = createCanvas(1024, 450);
                const ctx = canvas.getContext('2d');

                ctx.fillStyle = "#FFFFFF";
                ctx.fillRect(0,0, canvas.width, canvas.height);
                let img = await loadImage("https://wallpaperaccess.com/full/86407.jpg");
                ctx.drawImage(img, canvas.width / 2 - img.width / 2, canvas.height / 2 - img.height / 2);

                ctx.fillStyle = "#000000";
                ctx.globalAlpha = 0.5;
                ctx.fillRect(0,0,25, canvas.height);
                ctx.fillRect(canvas.width - 25, 0, 25, canvas.height);
                ctx.fillRect(25, 0, canvas.width - 50, 25);
                ctx.fillRect(25, canvas.height - 25, canvas.width - 50, 25);
                ctx.globalAlpha = 1;

                ctx.font = "bold 40px Sans";
                ctx.strokeStyle = "#000000";
                ctx.lineWidth = 12;
                ctx.strokeText("Username: " + interaction.user.username, 50, 75);
                ctx.fillStyle = "#FFFFFF";
                ctx.fillText("Username: " + interaction.user.username, 50, 75);

                ctx.font = "bold 40px Sans";
                ctx.strokeStyle = "#000000";
                ctx.lineWidth = 12;
                ctx.strokeText("Donated: $" + donated.toLocaleString('en-US'), 625, 400);
                ctx.fillStyle = "#FFFFFF";
                ctx.fillText("Donated: $" + donated.toLocaleString('en-US'), 625, 400);

                ctx.font = "bold 40px Sans";
                ctx.strokeStyle = "#000000";
                ctx.lineWidth = 12;
                ctx.strokeText("Amount: " + global.amount, 350, 200);
                ctx.fillStyle = "#FFFFFF";
                ctx.fillText("Amount: " + global.amount, 350, 200);

                ctx.font = "bold 40px Sans";
                ctx.strokeStyle = "#000000";
                ctx.lineWidth = 12;
                ctx.strokeText("Rate: " + global.rate, 350, 250);
                ctx.fillStyle = "#FFFFFF";
                ctx.fillText("Rate: " + global.rate, 350, 250);

                ctx.font = "bold 40px Sans";
                ctx.strokeStyle = "#000000";
                ctx.lineWidth = 12;
                ctx.strokeText("Method: " + global.method, 350, 300);
                ctx.fillStyle = "#FFFFFF";
                ctx.fillText("Method: " + global.method, 350, 300);

                ctx.font = "bold 50px Sans";
                ctx.strokeStyle = "#000000";
                ctx.lineWidth = 12;
                ctx.strokeText("SELLING", 50, 400);
                ctx.fillStyle = "#ff0000";
                ctx.fillText("SELLING", 50, 400);

                const attachment = new AttachmentBuilder(await canvas.encode("png"), {name: `shopPost.png`});*/

                const msg = await sell1Channel.send({
                    //files: [attachment],
                    embeds: [
                        new EmbedBuilder()
                        .setColor(ee.errorColor)
                        .setTitle('🎫 Selling 07 GP 🎫')
                        .setDescription(`*The merchant on this post is in no way linked to the owners, please be cautious when dealing!*\n\n**Merchant Username:** \`${interaction.user.tag}\`\n**Merchant Rating:** \`${sellRating === "Unrated" ? "Unrated" : Math.ceil(sellRating.toFixed(2)) + '/5'}\`\n\n**Deal Amount:** \`${global.amount}\`\n**Deal Rate** \`${global.rate}\`\n**Deal Method** \`${global.method}\`\n\n**Donated:** \`$${donated.toLocaleString('en-US')}\``)
                        .setThumbnail('https://upload.wikimedia.org/wikipedia/commons/thumb/c/c9/-Insert_image_here-.svg/800px--Insert_image_here-.svg.png')
                        .setTimestamp()
                    ],
                    components: [sell1Row]
                })

                return await shopPost.create({
                    ownerId: interaction.user.id,
                    postId: msg.id,
                    postChannel: msg.channel.id,
                    postDeal: {
                        postAmount: global.amount,
                        postRate: global.rate,
                        postMethod: global.method,
                        postDonated: donated
                    },
                    shopType: 'sell1',
                    ticketId: '0',
                    traderId: '0',
                    ticketDone: false
                });
            } else if (global.type === "sell2") {
                const sell2Channel = await interaction.guild.channels.fetch(config.Donation_System["RS3GP_SALE_CHANNEL"]);

                const sell2Row = new ActionRowBuilder()
                .addComponents([
                    new ButtonBuilder()
                    .setEmoji({
                        name: '💰'
                    })
                    .setLabel('Accept')
                    .setCustomId('sell2Open')
                    .setStyle(ButtonStyle.Success)
                ])
                .addComponents([
                    new ButtonBuilder()
                    .setEmoji({
                        name: '❌'
                    })
                    .setLabel('Remove')
                    .setCustomId('sell2Close')
                    .setStyle(ButtonStyle.Primary)
                ])
                .addComponents([
                    new ButtonBuilder()
                    .setEmoji({
                        name: '🪪'
                    })
                    .setLabel('Rate Merchant')
                    .setCustomId('rateMerchant')
                    .setStyle(ButtonStyle.Secondary)
                ])

                /*const canvas = createCanvas(1024, 450);
                const ctx = canvas.getContext('2d');

                ctx.fillStyle = "#FFFFFF";
                ctx.fillRect(0,0, canvas.width, canvas.height);
                let img = await loadImage("https://wallpaperaccess.com/full/86407.jpg");
                ctx.drawImage(img, canvas.width / 2 - img.width / 2, canvas.height / 2 - img.height / 2);

                ctx.fillStyle = "#000000";
                ctx.globalAlpha = 0.5;
                ctx.fillRect(0,0,25, canvas.height);
                ctx.fillRect(canvas.width - 25, 0, 25, canvas.height);
                ctx.fillRect(25, 0, canvas.width - 50, 25);
                ctx.fillRect(25, canvas.height - 25, canvas.width - 50, 25);
                ctx.globalAlpha = 1;

                ctx.font = "bold 40px Sans";
                ctx.strokeStyle = "#000000";
                ctx.lineWidth = 12;
                ctx.strokeText("Username: " + interaction.user.username, 50, 75);
                ctx.fillStyle = "#FFFFFF";
                ctx.fillText("Username: " + interaction.user.username, 50, 75);

                ctx.font = "bold 40px Sans";
                ctx.strokeStyle = "#000000";
                ctx.lineWidth = 12;
                ctx.strokeText("Donated: $" + donated.toLocaleString('en-US'), 625, 400);
                ctx.fillStyle = "#FFFFFF";
                ctx.fillText("Donated: $" + donated.toLocaleString('en-US'), 625, 400);

                ctx.font = "bold 40px Sans";
                ctx.strokeStyle = "#000000";
                ctx.lineWidth = 12;
                ctx.strokeText("Amount: " + global.amount, 350, 200);
                ctx.fillStyle = "#FFFFFF";
                ctx.fillText("Amount: " + global.amount, 350, 200);

                ctx.font = "bold 40px Sans";
                ctx.strokeStyle = "#000000";
                ctx.lineWidth = 12;
                ctx.strokeText("Rate: " + global.rate, 350, 250);
                ctx.fillStyle = "#FFFFFF";
                ctx.fillText("Rate: " + global.rate, 350, 250);

                ctx.font = "bold 40px Sans";
                ctx.strokeStyle = "#000000";
                ctx.lineWidth = 12;
                ctx.strokeText("Method: " + global.method, 350, 300);
                ctx.fillStyle = "#FFFFFF";
                ctx.fillText("Method: " + global.method, 350, 300);

                ctx.font = "bold 50px Sans";
                ctx.strokeStyle = "#000000";
                ctx.lineWidth = 12;
                ctx.strokeText("SELLING", 50, 400);
                ctx.fillStyle = "#ff0000";
                ctx.fillText("SELLING", 50, 400);

                const attachment = new AttachmentBuilder(await canvas.encode("png"), {name: `shopPost.png`});*/

                const msg = await sell2Channel.send({
                    //files: [attachment],
                    embeds: [
                        new EmbedBuilder()
                        .setColor(ee.errorColor)
                        .setTitle('🎫 Selling RS3 GP 🎫')
                        .setDescription(`*The merchant on this post is in no way linked to the owners, please be cautious when dealing!*\n\n**Merchant Username:** \`${interaction.user.tag}\`\n**Merchant Rating:** \`${sellRating === "Unrated" ? "Unrated" : Math.ceil(sellRating.toFixed(2)) + '/5'}\`\n\n**Deal Amount:** \`${global.amount}\`\n**Deal Rate** \`${global.rate}\`\n**Deal Method** \`${global.method}\`\n\n**Donated:** \`$${donated.toLocaleString('en-US')}\``)
                        .setThumbnail('https://upload.wikimedia.org/wikipedia/commons/thumb/c/c9/-Insert_image_here-.svg/800px--Insert_image_here-.svg.png')
                        .setTimestamp()
                    ],
                    components: [sell2Row]
                })

                return await shopPost.create({
                    ownerId: interaction.user.id,
                    postId: msg.id,
                    postChannel: msg.channel.id,
                    postDeal: {
                        postAmount: global.amount,
                        postRate: global.rate,
                        postMethod: global.method,
                        postDonated: donated
                    },
                    shopType: 'sell2',
                    ticketId: '0',
                    traderId: '0',
                    ticketDone: false
                });
            } else if (global.type === "buy1") {
                const buy1Channel = await interaction.guild.channels.fetch(config.Donation_System["07GP_BUY_CHANNEL"]);

                const buy1Row = new ActionRowBuilder()
                .addComponents([
                    new ButtonBuilder()
                    .setEmoji({
                        name: '💰'
                    })
                    .setLabel('Accept')
                    .setCustomId('buy1Open')
                    .setStyle(ButtonStyle.Success)
                ])
                .addComponents([
                    new ButtonBuilder()
                    .setEmoji({
                        name: '❌'
                    })
                    .setLabel('Remove')
                    .setCustomId('buy1Close')
                    .setStyle(ButtonStyle.Primary)
                ])
                .addComponents([
                    new ButtonBuilder()
                    .setEmoji({
                        name: '🪪'
                    })
                    .setLabel('Rate Merchant')
                    .setCustomId('rateMerchant')
                    .setStyle(ButtonStyle.Secondary)
                ])

                /*const canvas = createCanvas(1024, 450);
                const ctx = canvas.getContext('2d');

                ctx.fillStyle = "#FFFFFF";
                ctx.fillRect(0,0, canvas.width, canvas.height);
                let img = await loadImage("https://wallpaperaccess.com/full/86407.jpg");
                ctx.drawImage(img, canvas.width / 2 - img.width / 2, canvas.height / 2 - img.height / 2);

                ctx.fillStyle = "#000000";
                ctx.globalAlpha = 0.5;
                ctx.fillRect(0,0,25, canvas.height);
                ctx.fillRect(canvas.width - 25, 0, 25, canvas.height);
                ctx.fillRect(25, 0, canvas.width - 50, 25);
                ctx.fillRect(25, canvas.height - 25, canvas.width - 50, 25);
                ctx.globalAlpha = 1;

                ctx.font = "bold 40px Sans";
                ctx.strokeStyle = "#000000";
                ctx.lineWidth = 12;
                ctx.strokeText("Username: " + interaction.user.username, 50, 75);
                ctx.fillStyle = "#FFFFFF";
                ctx.fillText("Username: " + interaction.user.username, 50, 75);

                ctx.font = "bold 40px Sans";
                ctx.strokeStyle = "#000000";
                ctx.lineWidth = 12;
                ctx.strokeText("Donated: $" + donated.toLocaleString('en-US'), 625, 400);
                ctx.fillStyle = "#FFFFFF";
                ctx.fillText("Donated: $" + donated.toLocaleString('en-US'), 625, 400);

                ctx.font = "bold 40px Sans";
                ctx.strokeStyle = "#000000";
                ctx.lineWidth = 12;
                ctx.strokeText("Amount: " + global.amount, 350, 200);
                ctx.fillStyle = "#FFFFFF";
                ctx.fillText("Amount: " + global.amount, 350, 200);

                ctx.font = "bold 40px Sans";
                ctx.strokeStyle = "#000000";
                ctx.lineWidth = 12;
                ctx.strokeText("Rate: " + global.rate, 350, 250);
                ctx.fillStyle = "#FFFFFF";
                ctx.fillText("Rate: " + global.rate, 350, 250);

                ctx.font = "bold 40px Sans";
                ctx.strokeStyle = "#000000";
                ctx.lineWidth = 12;
                ctx.strokeText("Method: " + global.method, 350, 300);
                ctx.fillStyle = "#FFFFFF";
                ctx.fillText("Method: " + global.method, 350, 300);

                ctx.font = "bold 50px Sans";
                ctx.strokeStyle = "#000000";
                ctx.lineWidth = 12;
                ctx.strokeText("BUYING", 50, 400);
                ctx.fillStyle = "#00FF00";
                ctx.fillText("BUYING", 50, 400);

                const attachment = new AttachmentBuilder(await canvas.encode("png"), {name: `shopPost.png`});*/

                const msg = await buy1Channel.send({
                    //files: [attachment],
                    embeds: [
                        new EmbedBuilder()
                        .setColor(ee.successColor)
                        .setTitle('🎫 Buying 07 GP 🎫')
                        .setDescription(`*The merchant on this post is in no way linked to the owners, please be cautious when dealing!*\n\n**Merchant Username:** \`${interaction.user.tag}\`\n**Merchant Rating:** \`${buyRating === "Unrated" ? "Unrated" : Math.ceil(buyRating.toFixed(2)) + '/5'}\`\n\n**Deal Amount:** \`${global.amount}\`\n**Deal Rate** \`${global.rate}\`\n**Deal Method** \`${global.method}\`\n\n**Donated:** \`$${donated.toLocaleString('en-US')}\``)
                        .setThumbnail('https://upload.wikimedia.org/wikipedia/commons/thumb/c/c9/-Insert_image_here-.svg/800px--Insert_image_here-.svg.png')
                        .setTimestamp()
                    ],
                    components: [buy1Row]
                })

                return await shopPost.create({
                    ownerId: interaction.user.id,
                    postId: msg.id,
                    postChannel: msg.channel.id,
                    postDeal: {
                        postAmount: global.amount,
                        postRate: global.rate,
                        postMethod: global.method,
                        postDonated: donated
                    },
                    shopType: 'buy1',
                    ticketId: '0',
                    traderId: '0',
                    ticketDone: false
                });
            } else if (global.type === "buy2") {
                 const buy2Channel = await interaction.guild.channels.fetch(config.Donation_System["RS3GP_BUY_CHANNEL"]);

                 const buy2Row = new ActionRowBuilder()
                 .addComponents([
                     new ButtonBuilder()
                     .setEmoji({
                         name: '💰'
                     })
                     .setLabel('Accept')
                     .setCustomId('buy2Open')
                     .setStyle(ButtonStyle.Success)
                 ])
                 .addComponents([
                     new ButtonBuilder()
                     .setEmoji({
                         name: '❌'
                     })
                     .setLabel('Remove')
                     .setCustomId('buy2Close')
                     .setStyle(ButtonStyle.Primary)
                ])
                .addComponents([
                    new ButtonBuilder()
                    .setEmoji({
                        name: '🪪'
                    })
                    .setLabel('Rate Merchant')
                    .setCustomId('rateMerchant')
                    .setStyle(ButtonStyle.Secondary)
                ])

                /*const canvas = createCanvas(1024, 450);
                const ctx = canvas.getContext('2d');

                ctx.fillStyle = "#FFFFFF";
                ctx.fillRect(0,0, canvas.width, canvas.height);
                let img = await loadImage("https://wallpaperaccess.com/full/86407.jpg");
                ctx.drawImage(img, canvas.width / 2 - img.width / 2, canvas.height / 2 - img.height / 2);

                ctx.fillStyle = "#000000";
                ctx.globalAlpha = 0.5;
                ctx.fillRect(0,0,25, canvas.height);
                ctx.fillRect(canvas.width - 25, 0, 25, canvas.height);
                ctx.fillRect(25, 0, canvas.width - 50, 25);
                ctx.fillRect(25, canvas.height - 25, canvas.width - 50, 25);
                ctx.globalAlpha = 1;

                ctx.font = "bold 40px Sans";
                ctx.strokeStyle = "#000000";
                ctx.lineWidth = 12;
                ctx.strokeText("Username: " + interaction.user.username, 50, 75);
                ctx.fillStyle = "#FFFFFF";
                ctx.fillText("Username: " + interaction.user.username, 50, 75);

                ctx.font = "bold 40px Sans";
                ctx.strokeStyle = "#000000";
                ctx.lineWidth = 12;
                ctx.strokeText("Donated: $" + donated.toLocaleString('en-US'), 625, 400);
                ctx.fillStyle = "#FFFFFF";
                ctx.fillText("Donated: $" + donated.toLocaleString('en-US'), 625, 400);

                ctx.font = "bold 40px Sans";
                ctx.strokeStyle = "#000000";
                ctx.lineWidth = 12;
                ctx.strokeText("Amount: " + global.amount, 350, 200);
                ctx.fillStyle = "#FFFFFF";
                ctx.fillText("Amount: " + global.amount, 350, 200);

                ctx.font = "bold 40px Sans";
                ctx.strokeStyle = "#000000";
                ctx.lineWidth = 12;
                ctx.strokeText("Rate: " + global.rate, 350, 250);
                ctx.fillStyle = "#FFFFFF";
                ctx.fillText("Rate: " + global.rate, 350, 250);

                ctx.font = "bold 40px Sans";
                ctx.strokeStyle = "#000000";
                ctx.lineWidth = 12;
                ctx.strokeText("Method: " + global.method, 350, 300);
                ctx.fillStyle = "#FFFFFF";
                ctx.fillText("Method: " + global.method, 350, 300);

                ctx.font = "bold 50px Sans";
                ctx.strokeStyle = "#000000";
                ctx.lineWidth = 12;
                ctx.strokeText("BUYING", 50, 400);
                ctx.fillStyle = "#00FF00";
                ctx.fillText("BUYING", 50, 400);

                const attachment = new AttachmentBuilder(await canvas.encode("png"), {name: `shopPost.png`});*/

                const msg = await buy2Channel.send({
                    //files: [attachment],
                    embeds: [
                        new EmbedBuilder()
                        .setColor(ee.successColor)
                        .setTitle('🎫 Buying RS3 GP 🎫')
                        .setDescription(`*The merchant on this post is in no way linked to the owners, please be cautious when dealing!*\n\n**Merchant Username:** \`${interaction.user.tag}\`\n**Merchant Rating:** \`${buyRating === "Unrated" ? "Unrated" : Math.ceil(buyRating.toFixed(2)) + '/5'}\`\n\n**Deal Amount:** \`${global.amount}\`\n**Deal Rate** \`${global.rate}\`\n**Deal Method** \`${global.method}\`\n\n**Donated:** \`$${donated.toLocaleString('en-US')}\``)
                        .setThumbnail('https://upload.wikimedia.org/wikipedia/commons/thumb/c/c9/-Insert_image_here-.svg/800px--Insert_image_here-.svg.png')
                        .setTimestamp()
                    ],
                    components: [buy2Row]
                })

                return await shopPost.create({
                    ownerId: interaction.user.id,
                    postId: msg.id,
                    postChannel: msg.channel.id,
                    postDeal: {
                        postAmount: global.amount,
                        postRate: global.rate,
                        postMethod: global.method,
                        postDonated: donated
                    },
                    shopType: 'buy2',
                    ticketId: '0',
                    traderId: '0',
                    ticketDone: false
                });
            } else {
                console.log("No global type!?")
            }
        }

        if (interaction?.customId === "disagreeTos") {
            await interaction.deferUpdate();

            return await interaction.editReply({
                embeds: [
                    new EmbedBuilder()
                    .setColor(config.Donation_System.TOS_EMBED.AGREEMENT_EMBED.color)
                    .setTitle(config.Donation_System.TOS_EMBED.AGREEMENT_EMBED.title)
                    .setDescription(config.Donation_System.TOS_EMBED.AGREEMENT_EMBED.description)
                    .setFooter({text: config.Donation_System.TOS_EMBED.AGREEMENT_EMBED.footer.text})
                ],
                components: []
            });
        }

        if (interaction?.customId === "return") {
            await interaction.deferUpdate();
        }

        if (interaction?.customId === "confirmDonationButton") {
            const modal = new ModalBuilder()
                .setCustomId('donationModal')
                .setTitle('Donation Confirmation');

            const firstActionRow = new ActionRowBuilder().addComponents([
                new TextInputBuilder()
                    .setCustomId('invoiceId')
                    .setLabel(`Please insert your invoice-id below`)
                    .setStyle(TextInputStyle.Short)
                    .setMinLength(15)
                    .setMaxLength(30)
                    .setPlaceholder(`Insert our invoice-id here`)
                    .setRequired(true)
            ]);

            modal.addComponents([firstActionRow]);

            await interaction.showModal(modal);
        }

        if (interaction?.customId === "buy1") {
            const modal = new ModalBuilder()
                .setCustomId('buy1Modal')
                .setTitle(config.Modal_System.buy1.title);

            const firstActionRow = new ActionRowBuilder()
            .addComponents([
                new TextInputBuilder()
                    .setCustomId('buy1Amount')
                    .setLabel(config.Modal_System.buy1.textcomponent1.label)
                    .setStyle(TextInputStyle.Short)
                    .setMinLength(config.Modal_System.buy1.textcomponent1.minLength)
                    .setMaxLength(config.Modal_System.buy1.textcomponent1.maxLength)
                    .setPlaceholder(config.Modal_System.buy1.textcomponent1.placeholder)
                    .setRequired(config.Modal_System.buy1.textcomponent1.required),
            ]);

            const secondActionRow = new ActionRowBuilder()
            .addComponents([
                new TextInputBuilder()
                .setCustomId('buy1Rate')
                .setLabel(config.Modal_System.buy1.textcomponent2.label)
                .setStyle(TextInputStyle.Short)
                .setMinLength(config.Modal_System.buy1.textcomponent2.minLength)
                .setMaxLength(config.Modal_System.buy1.textcomponent2.maxLength)
                .setPlaceholder(config.Modal_System.buy1.textcomponent2.placeholder)
                .setRequired(config.Modal_System.buy1.textcomponent2.required),
            ]);

            const thirdActionRow = new ActionRowBuilder()
            .addComponents([
                new TextInputBuilder()
                .setCustomId('buy1Method')
                .setLabel(config.Modal_System.buy1.textcomponent3.label)
                .setStyle(TextInputStyle.Short)
                .setMinLength(config.Modal_System.buy1.textcomponent3.minLength)
                .setMaxLength(config.Modal_System.buy1.textcomponent3.maxLength)
                .setPlaceholder(config.Modal_System.buy1.textcomponent3.placeholder)
                .setRequired(config.Modal_System.buy1.textcomponent3.required),
            ]);

            modal.addComponents([firstActionRow, secondActionRow, thirdActionRow]);

            await interaction.showModal(modal);
        }

        if (interaction?.customId === "buy2") {
            const modal = new ModalBuilder()
                .setCustomId('buy2Modal')
                .setTitle(config.Modal_System.buy2.title);

            const firstActionRow = new ActionRowBuilder()
            .addComponents([
                new TextInputBuilder()
                    .setCustomId('buy2Amount')
                    .setLabel(config.Modal_System.buy2.textcomponent1.label)
                    .setStyle(TextInputStyle.Short)
                    .setMinLength(config.Modal_System.buy2.textcomponent1.minLength)
                    .setMaxLength(config.Modal_System.buy2.textcomponent1.maxLength)
                    .setPlaceholder(config.Modal_System.buy2.textcomponent1.placeholder)
                    .setRequired(config.Modal_System.buy2.textcomponent1.required),
            ]);

            const secondActionRow = new ActionRowBuilder()
            .addComponents([
                new TextInputBuilder()
                .setCustomId('buy2Rate')
                .setLabel(config.Modal_System.buy2.textcomponent2.label)
                .setStyle(TextInputStyle.Short)
                .setMinLength(config.Modal_System.buy2.textcomponent2.minLength)
                .setMaxLength(config.Modal_System.buy2.textcomponent2.maxLength)
                .setPlaceholder(config.Modal_System.buy2.textcomponent2.placeholder)
                .setRequired(config.Modal_System.buy2.textcomponent2.required),
            ]);

            const thirdActionRow = new ActionRowBuilder()
            .addComponents([
                new TextInputBuilder()
                .setCustomId('buy2Method')
                .setLabel(config.Modal_System.buy2.textcomponent3.label)
                .setStyle(TextInputStyle.Short)
                .setMinLength(config.Modal_System.buy2.textcomponent3.minLength)
                .setMaxLength(config.Modal_System.buy2.textcomponent3.maxLength)
                .setPlaceholder(config.Modal_System.buy2.textcomponent3.placeholder)
                .setRequired(config.Modal_System.buy2.textcomponent3.required),
            ]);

            modal.addComponents([firstActionRow, secondActionRow, thirdActionRow]);

            await interaction.showModal(modal);
        }

        if (interaction?.customId === "sell1") {
            const modal = new ModalBuilder()
                .setCustomId('sell1Modal')
                .setTitle(config.Modal_System.sell1.title);

            const firstActionRow = new ActionRowBuilder()
                .addComponents([
                    new TextInputBuilder()
                        .setCustomId('sell1Amount')
                        .setLabel(config.Modal_System.sell1.textcomponent1.label)
                        .setStyle(TextInputStyle.Short)
                        .setMinLength(config.Modal_System.sell1.textcomponent1.minLength)
                        .setMaxLength(config.Modal_System.sell1.textcomponent1.maxLength)
                        .setPlaceholder(config.Modal_System.sell1.textcomponent1.placeholder)
                        .setRequired(config.Modal_System.sell1.textcomponent1.required),
            ]);

            const secondActionRow = new ActionRowBuilder()
                .addComponents([
                    new TextInputBuilder()
                        .setCustomId('sell1Rate')
                        .setLabel(config.Modal_System.sell1.textcomponent2.label)
                        .setStyle(TextInputStyle.Short)
                        .setMinLength(config.Modal_System.sell1.textcomponent2.minLength)
                        .setMaxLength(config.Modal_System.sell1.textcomponent2.maxLength)
                        .setPlaceholder(config.Modal_System.sell1.textcomponent2.placeholder)
                        .setRequired(config.Modal_System.sell1.textcomponent2.required),
            ]);

            const thirdActionRow = new ActionRowBuilder()
                .addComponents([
                    new TextInputBuilder()
                        .setCustomId('sell1Method')
                        .setLabel(config.Modal_System.sell1.textcomponent3.label)
                        .setStyle(TextInputStyle.Short)
                        .setMinLength(config.Modal_System.sell1.textcomponent3.minLength)
                        .setMaxLength(config.Modal_System.sell1.textcomponent3.maxLength)
                        .setPlaceholder(config.Modal_System.sell1.textcomponent3.placeholder)
                        .setRequired(config.Modal_System.sell1.textcomponent3.required),
            ]);

            modal.addComponents([firstActionRow, secondActionRow, thirdActionRow]);

            await interaction.showModal(modal);
        }

        if (interaction?.customId === "sell2") {
            const modal = new ModalBuilder()
                .setCustomId('sell2Modal')
                .setTitle(config.Modal_System.sell2.title);

            const firstActionRow = new ActionRowBuilder()
                .addComponents([
                    new TextInputBuilder()
                        .setCustomId('sell2Amount')
                        .setLabel(config.Modal_System.sell2.textcomponent1.label)
                        .setStyle(TextInputStyle.Short)
                        .setMinLength(config.Modal_System.sell2.textcomponent1.minLength)
                        .setMaxLength(config.Modal_System.sell2.textcomponent1.maxLength)
                        .setPlaceholder(config.Modal_System.sell2.textcomponent1.placeholder)
                        .setRequired(config.Modal_System.sell2.textcomponent1.required),
            ]);

            const secondActionRow = new ActionRowBuilder()
                .addComponents([
                    new TextInputBuilder()
                        .setCustomId('sell2Rate')
                        .setLabel(config.Modal_System.sell2.textcomponent2.label)
                        .setStyle(TextInputStyle.Short)
                        .setMinLength(config.Modal_System.sell2.textcomponent2.minLength)
                        .setMaxLength(config.Modal_System.sell2.textcomponent2.maxLength)
                        .setPlaceholder(config.Modal_System.sell2.textcomponent2.placeholder)
                        .setRequired(config.Modal_System.sell2.textcomponent2.required),
            ]);

            const thirdActionRow = new ActionRowBuilder()
                .addComponents([
                    new TextInputBuilder()
                        .setCustomId('sell2Method')
                        .setLabel(config.Modal_System.sell2.textcomponent3.label)
                        .setStyle(TextInputStyle.Short)
                        .setMinLength(config.Modal_System.sell2.textcomponent3.minLength)
                        .setMaxLength(config.Modal_System.sell2.textcomponent3.maxLength)
                        .setPlaceholder(config.Modal_System.sell2.textcomponent3.placeholder)
                        .setRequired(config.Modal_System.sell2.textcomponent3.required),
            ]);

            modal.addComponents([firstActionRow, secondActionRow, thirdActionRow]);

            await interaction.showModal(modal);
        }

        //#endregion TICKETSYSTEM

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

        if (interaction.customId === "rateModal") {
            const rating = interaction.fields.getTextInputValue('rating');

            if (isNaN(rating)) {
                return interaction.reply({
                    content: ':x: Rating is not a valid number, only enter numbers! :x:',
                    ephemeral: true
                });
            }

            if (parseInt(rating) > 5 || parseInt(rating) <= 0) {
                return interaction.reply({
                    content: ':x: Rating must be a 1-5 number! :x:',
                    ephemeral: true
                });
            }

            const findShop = await shopPost.findOne({
                postId: interaction.message.id
            });

            if (!findShop) return interaction.reply({content: ':x: Data not available in database? Please repost if this is yours!', ephemeral: true});

            if (findShop.ownerId === interaction.user.id) return interaction.reply({content: ':x: You may not rate your own posting!', ephemeral: true});

            const findAlreadyRated = await finishedRanking.findOne({
                userId: interaction.user.id,
                ratedPost: findShop.postId
            })

            if (findAlreadyRated) return interaction.reply({content: ':x: You have already rated this post!', ephemeral: true});

            const dealRating = await dealRanking.findOne({
                userId: findShop.ownerId
            });

            if (dealRating) {
                if (findShop.shopType === "sell1" || findShop.shopType === "sell2") {
                    await dealRating.updateOne({
                        $inc: {
                            saleRank: parseInt(rating),
                            saleRated: 1
                        }
                    })

                    await finishedRanking.create({
                        userId: interaction.user.id,
                        ratedPost: findShop.postId
                    });

                    return await interaction.reply({
                        content: ':white_check_mark: You successfully rated the merchant!',
                        ephemeral: true
                    })
                } else {
                    await dealRating.updateOne({
                        $inc: {
                            buyRank: parseInt(rating),
                            buyRated: 1
                        }
                    })

                    await finishedRanking.create({
                        userId: interaction.user.id,
                        ratedPost: findShop.postId
                    })

                    return await interaction.reply({
                        content: ':white_check_mark: You successfully rated the merchant!',
                        ephemeral: true
                    })
                }
            } else {
                if (findShop.shopType === "sell1" || findShop.shopType === "sell2") {
                    await dealRanking.create({
                        userId: findShop.ownerId,
                        saleRank: rating,
                        buyRank: 0,
                        saleRated: 1,
                        buyRated: 0
                    })
    
                    await finishedRanking.create({
                        userId: interaction.user.id,
                        ratedPost: findShop.postId
                    })
    
                    return await interaction.reply({
                        content: ':white_check_mark: You successfully rated the merchant!',
                        ephemeral: true
                    })
                } else {
                    await dealRanking.create({
                        userId: findShop.ownerId,
                        saleRank: 0,
                        buyRank: 1,
                        saleRated: 0,
                        buyRated: 1
                    })
    
                    await finishedRanking.create({
                        userId: interaction.user.id,
                        ratedPost: findShop.postId
                    })
    
                    return await interaction.reply({
                        content: ':white_check_mark: You successfully rated the merchant!',
                        ephemeral: true
                    })
                }
            }
        }

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
                    email: 'donation.' + user.id + '@gmail.com',
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
                                        totalDonated: order.total
                                    }
                                })
                            } else {
                                await userData.create({
                                    userId: interaction.user.id,
                                    totalDonated: order.total
                                });
                            }
                        }

                        try {
                            const announceChannel = await interaction.guild.channels.fetch(config.Donation_System.ANNOUNCE_NEW_DONATIONS);

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
                            });
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

        /*if (interaction.customId === 'donationModal') {
            const invoiceId = interaction.fields.getTextInputValue('invoiceId');

            const products = await axios({
                url: '/orders/' + invoiceId,
                method: 'get',
                baseURL: 'https://dev.sellix.io/v1',
                headers: {
                    'Authorization': 'Bearer ' + process.env.SELLIX_API,
                    'X-Sellix-Merchant': process.env.SELLIX_MERCHANT
                }
            });

            const invoiceStatus = products.data.status;
    
            if (invoiceIsValid(invoiceStatus)) {
                const invoice  = products.data.data.order;
                const invoiceOwner = interaction.user.id;

                try {
                const hasPayment = await donationInvoice.findOne({
                    invoiceId: invoiceId
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
                    })

                    return interaction.deferUpdate();
                } else {
                    await donationInvoice.create({
                        invoiceId: invoiceId,
                        invoiceInfo: {
                            invoiceOwner: invoiceOwner,
                            invoiceDonated: invoice.total,
                        }
                    })

                    if (hasUserD) {
                        await userData.findOneAndUpdate({
                            userId: interaction.user.id
                        }, {
                            $inc: {
                                totalDonated: invoice.total
                            }
                        })
                    } else {
                        await userData.create({
                            userId: interaction.user.id,
                            totalDonated: invoice.total
                        });
                    }
                }
                    await interaction.message.edit({
                        embeds: [
                            new EmbedBuilder()
                            .setColor(ee.successColor)
                            .setDescription('Invoice is valid!')
                        ],
                        components: []
                    })

                    return interaction.deferUpdate();
                } catch(e) {console.log(e)}
            } else {
                try {
                    await interaction.message.edit({
                        embeds: [
                            new EmbedBuilder()
                            .setColor(ee.errorColor)
                            .setDescription('Invoice is NOT valid!')
                        ],
                        components: []
                    })

                    return interaction.deferUpdate();
                } catch {}
            }
        }*/

        if (interaction?.customId === "buy1Modal") {
            global.amount = interaction.fields.getTextInputValue('buy1Amount');
            global.rate = interaction.fields.getTextInputValue('buy1Rate');
            global.method = interaction.fields.getTextInputValue('buy1Method');
            global.type = "buy1";

            const tosRow = new ActionRowBuilder()
            .addComponents([
                new ButtonBuilder()
                .setEmoji({
                    name: config.Donation_System.TOS_EMBED.components.agreeTos.emoji
                })
                .setLabel(config.Donation_System.TOS_EMBED.components.agreeTos.label)
                .setCustomId('agreeTos')
                .setStyle(ButtonStyle.Success)
            ])
            .addComponents([
                new ButtonBuilder()
                .setEmoji({
                    name: config.Donation_System.TOS_EMBED.components.disagreeTos.emoji
                })
                .setLabel(config.Donation_System.TOS_EMBED.components.disagreeTos.label)
                .setCustomId('disagreeTos')
                .setStyle(ButtonStyle.Danger)
            ])

            return interaction.reply({
                embeds: [
                    new EmbedBuilder()
                    .setColor(ee.color)
                    .setTitle(config.Donation_System.TOS_EMBED.title)
                    .setDescription(config.Donation_System.TOS_EMBED.description)
                    .setFooter({text: config.Donation_System.TOS_EMBED.footer.text})
                ],
                components: [tosRow],
                ephemeral: true
            })
        }

        if (interaction?.customId === "buy2Modal") {
            global.amount = interaction.fields.getTextInputValue('buy2Amount');
            global.rate = interaction.fields.getTextInputValue('buy2Rate');
            global.method = interaction.fields.getTextInputValue('buy2Method');
            global.type = "buy2";

            const tosRow = new ActionRowBuilder()
            .addComponents([
                new ButtonBuilder()
                .setEmoji({
                    name: config.Donation_System.TOS_EMBED.components.agreeTos.emoji
                })
                .setLabel(config.Donation_System.TOS_EMBED.components.agreeTos.label)
                .setCustomId('agreeTos')
                .setStyle(ButtonStyle.Success)
            ])
            .addComponents([
                new ButtonBuilder()
                .setEmoji({
                    name: config.Donation_System.TOS_EMBED.components.disagreeTos.emoji
                })
                .setLabel(config.Donation_System.TOS_EMBED.components.disagreeTos.label)
                .setCustomId('disagreeTos')
                .setStyle(ButtonStyle.Danger)
            ])

            return interaction.reply({
                embeds: [
                    new EmbedBuilder()
                    .setColor(ee.color)
                    .setTitle(config.Donation_System.TOS_EMBED.title)
                    .setDescription(config.Donation_System.TOS_EMBED.description)
                    .setFooter({text: config.Donation_System.TOS_EMBED.footer.text})
                ],
                components: [tosRow],
                ephemeral: true
            })
        }

        if (interaction?.customId === "sell1Modal") {
            global.amount = interaction.fields.getTextInputValue('sell1Amount');
            global.rate = interaction.fields.getTextInputValue('sell1Rate');
            global.method = interaction.fields.getTextInputValue('sell1Method');
            global.type = "sell1";

            const tosRow = new ActionRowBuilder()
            .addComponents([
                new ButtonBuilder()
                .setEmoji({
                    name: config.Donation_System.TOS_EMBED.components.agreeTos.emoji
                })
                .setLabel(config.Donation_System.TOS_EMBED.components.agreeTos.label)
                .setCustomId('agreeTos')
                .setStyle(ButtonStyle.Success)
            ])
            .addComponents([
                new ButtonBuilder()
                .setEmoji({
                    name: config.Donation_System.TOS_EMBED.components.disagreeTos.emoji
                })
                .setLabel(config.Donation_System.TOS_EMBED.components.disagreeTos.label)
                .setCustomId('disagreeTos')
                .setStyle(ButtonStyle.Danger)
            ])

            return interaction.reply({
                embeds: [
                    new EmbedBuilder()
                    .setColor(ee.color)
                    .setTitle(config.Donation_System.TOS_EMBED.title)
                    .setDescription(config.Donation_System.TOS_EMBED.description)
                    .setFooter({text: config.Donation_System.TOS_EMBED.footer.text})
                ],
                components: [tosRow],
                ephemeral: true
            })
        }

        if (interaction?.customId === "sell2Modal") {
            global.amount = interaction.fields.getTextInputValue('sell2Amount');
            global.rate = interaction.fields.getTextInputValue('sell2Rate');
            global.method = interaction.fields.getTextInputValue('sell2Method');
            global.type = "sell2";

            const tosRow = new ActionRowBuilder()
            .addComponents([
                new ButtonBuilder()
                .setEmoji({
                    name: config.Donation_System.TOS_EMBED.components.agreeTos.emoji
                })
                .setLabel(config.Donation_System.TOS_EMBED.components.agreeTos.label)
                .setCustomId('agreeTos')
                .setStyle(ButtonStyle.Success)
            ])
            .addComponents([
                new ButtonBuilder()
                .setEmoji({
                    name: config.Donation_System.TOS_EMBED.components.disagreeTos.emoji
                })
                .setLabel(config.Donation_System.TOS_EMBED.components.disagreeTos.label)
                .setCustomId('disagreeTos')
                .setStyle(ButtonStyle.Danger)
            ])

            return interaction.reply({
                embeds: [
                    new EmbedBuilder()
                    .setColor(ee.color)
                    .setTitle(config.Donation_System.TOS_EMBED.title)
                    .setDescription(config.Donation_System.TOS_EMBED.description)
                    .setFooter({text: config.Donation_System.TOS_EMBED.footer.text})
                ],
                components: [tosRow],
                ephemeral: true
            })
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