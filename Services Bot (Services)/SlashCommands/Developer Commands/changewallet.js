const {
    Client,
    EmbedBuilder,
    ApplicationCommandOptionType
} = require("discord.js");
const ee = require("../../botconfig/embed.json");
const axios = require("axios");
const userWallet = require("../../schemas/userWallets");
require('dotenv').config();

module.exports = {
    name: 'changewallet',
    description: 'Change the wallet of a specific user!',
    IsDevOnly: true,
    options: [{
        name: 'set',
        description: 'Update the wallet and set a new value',
        type: ApplicationCommandOptionType.Subcommand,
        options: [{
            name: 'user',
            description: 'The user to change the wallet values of',
            type: ApplicationCommandOptionType.User,
            required: true
        }, {
            name: 'type',
            description: 'The type of wallet amount to change',
            type: ApplicationCommandOptionType.String,
            required: true,
            choices: [{
                name: '07 Balance',
                value: '07bal'
            }, {
                name: '07 Spent',
                value: '07spent'
            }, {
                name: 'Money Balance',
                value: 'moneybal'
            }, {
                name: 'Money Spent',
                value: 'moneyspent'
            }]
        }, {
            name: 'amount',
            description: 'The amount of money to set wallet type to',
            type: ApplicationCommandOptionType.Integer,
            required: true
        }]
    }, {
        name: 'add',
        description: 'Update the wallet and add a new value',
        type: ApplicationCommandOptionType.Subcommand,
        options: [{
            name: 'user',
            description: 'The user to change the wallet values of',
            type: ApplicationCommandOptionType.User,
            required: true
        }, {
            name: 'type',
            description: 'The type of wallet amount to change',
            type: ApplicationCommandOptionType.String,
            required: true,
            choices: [{
                name: '07 Balance',
                value: '07bal'
            }, {
                name: '07 Spent',
                value: '07spent'
            }, {
                name: 'Money Balance',
                value: 'moneybal'
            }, {
                name: 'Money Spent',
                value: 'moneyspent'
            }]
        }, {
            name: 'amount',
            description: 'The amount of money to set wallet type to',
            type: ApplicationCommandOptionType.Integer,
            required: true
        }]
    }],

    /** 
     * @param {Client} client 
     * @param {Message} message 
     * @param {String[]} args 
     */
    run: async (client, interaction, args) => {
        if (interaction.options.getSubcommand() === "set") {
            const type = interaction.options.getString('type');
            const amount = interaction.options.getInteger('amount');
            const user = interaction.options.getUser('user');

            if (type === "07bal") {
                let wallet = await userWallet.findOne({
                    userId: user.id
                });
        
                if (!wallet) {
                    await userWallet.create({
                        userId: user.id,
                        wallet: {
                            oBalance: 0,
                            oSpent: 0,
                            Balance: 0,
                            Spent: 0
                        }
                    })
        
                    wallet = await userWallet.findOne({
                        userId: user.id
                    });
                }

                await wallet.updateOne({
                    "wallet.oBalance": amount
                })
            } else if (type === "07spent") {
                let wallet = await userWallet.findOne({
                    userId: user.id
                });
        
                if (!wallet) {
                    await userWallet.create({
                        userId: user.id,
                        wallet: {
                            oBalance: 0,
                            oSpent: 0,
                            Balance: 0,
                            Spent: 0
                        }
                    })
        
                    wallet = await userWallet.findOne({
                        userId: user.id
                    });
                }
                
                await wallet.updateOne({
                    "wallet.oSpent": amount
                })
            } else if (type === "moneybal") {
                let wallet = await userWallet.findOne({
                    userId: user.id
                });
        
                if (!wallet) {
                    await userWallet.create({
                        userId: user.id,
                        wallet: {
                            oBalance: 0,
                            oSpent: 0,
                            Balance: 0,
                            Spent: 0
                        }
                    })
        
                    wallet = await userWallet.findOne({
                        userId: user.id
                    });
                }
                
                await wallet.updateOne({
                    "wallet.Balance": amount
                })
            } else if (type === "moneyspent") {
                let wallet = await userWallet.findOne({
                    userId: user.id
                });
        
                if (!wallet) {
                    await userWallet.create({
                        userId: user.id,
                        wallet: {
                            oBalance: 0,
                            oSpent: 0,
                            Balance: 0,
                            Spent: 0
                        }
                    })
        
                    wallet = await userWallet.findOne({
                        userId: user.id
                    });
                }
                
                await wallet.updateOne({
                    "wallet.Spent": amount
                })
            }

            return await interaction.reply({
                content: ':white_check_mark: Users wallet type has been updated successfully!',
                ephemeral: true
            })
        }

        if (interaction.options.getSubcommand() === "add") {
            const type = interaction.options.getString('type');
            const amount = interaction.options.getInteger('amount');
            const user = interaction.options.getUser('user');

            if (type === "07bal") {
                let wallet = await userWallet.findOne({
                    userId: user.id
                });
        
                if (!wallet) {
                    await userWallet.create({
                        userId: user.id,
                        wallet: {
                            oBalance: 0,
                            oSpent: 0,
                            Balance: 0,
                            Spent: 0
                        }
                    })
        
                    wallet = await userWallet.findOne({
                        userId: user.id
                    });
                }

                await wallet.updateOne({
                    $inc: {
                        "wallet.oBalance": amount
                    }
                })
            } else if (type === "07spent") {
                let wallet = await userWallet.findOne({
                    userId: user.id
                });
        
                if (!wallet) {
                    await userWallet.create({
                        userId: user.id,
                        wallet: {
                            oBalance: 0,
                            oSpent: 0,
                            Balance: 0,
                            Spent: 0
                        }
                    })
        
                    wallet = await userWallet.findOne({
                        userId: user.id
                    });
                }
                
                await wallet.updateOne({
                    $inc: {
                        "wallet.oSpent": amount
                    }
                })
            } else if (type === "moneybal") {
                let wallet = await userWallet.findOne({
                    userId: user.id
                });
        
                if (!wallet) {
                    await userWallet.create({
                        userId: user.id,
                        wallet: {
                            oBalance: 0,
                            oSpent: 0,
                            Balance: 0,
                            Spent: 0
                        }
                    })
        
                    wallet = await userWallet.findOne({
                        userId: user.id
                    });
                }
                
                await wallet.updateOne({
                    $inc: {
                        "wallet.Balance": amount
                    }
                })
            } else if (type === "moneyspent") {
                let wallet = await userWallet.findOne({
                    userId: user.id
                });
        
                if (!wallet) {
                    await userWallet.create({
                        userId: user.id,
                        wallet: {
                            oBalance: 0,
                            oSpent: 0,
                            Balance: 0,
                            Spent: 0
                        }
                    })
        
                    wallet = await userWallet.findOne({
                        userId: user.id
                    });
                }
                
                await wallet.updateOne({
                    $inc: {
                        "wallet.Spent": amount
                    }
                })
            }

            return await interaction.reply({
                content: ':white_check_mark: Users wallet type has been updated successfully!',
                ephemeral: true
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