const {
    Client,
    EmbedBuilder,
    ApplicationCommandOptionType
} = require("discord.js");
const ee = require("../../botconfig/embed.json");
const userWallet = require("../../schemas/userWallets");
const config = require("../../botconfig/config.json");
require('dotenv').config();

module.exports = {
    name: 'wallet',
    description: 'Get the wallet of yourself/someone else!',
    options: [{
        name: 'user',
        description: 'The specific user you want to get the wallet of',
        type: ApplicationCommandOptionType.User
    }],

    /** 
     * @param {Client} client 
     * @param {Message} message 
     * @param {String[]} args 
     */
    run: async (client, interaction, args) => {
        let user = interaction.options.getUser('user')

        if (!user) user = interaction.user;

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

        return await interaction.reply({
            embeds: [
                new EmbedBuilder()
                .setColor(ee.color)
                .setTitle(`${user.username}'s Wallet`)
                .addFields([{
                    name: '07 Balance',
                    value: `\`\`\`${wallet.wallet.oBalance.toLocaleString('en-US')}\`\`\``,
                    inline: true
                }, {
                    name: '07 Spent',
                    value: `\`\`\`${wallet.wallet.oSpent.toLocaleString('en-US')}\`\`\``,
                    inline: true
                }, {
                    name: 'ㅤ',
                    value: 'ㅤ',
                    inline: true
                }, {
                    name: 'Money Balance',
                    value: `\`\`\`$${wallet.wallet.Balance.toLocaleString('en-US')}\`\`\``,
                    inline: true
                }, {
                    name: 'Money Spent',
                    value: `\`\`\`$${wallet.wallet.Spent.toLocaleString('en-US')}\`\`\``,
                    inline: true
                }])
            ]
        })
    }
}

/*

Code used in this script has been written by PGTechnologies™
This project has been licensed through PGTechnologies™, you are NOT permitted to take credit for this project.
Require assistance with scripts? Join the discord and get help right away! - https://discord.gg/xQFFRzhJu2
Original Developer - PGamingHD#0666

*/