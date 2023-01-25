const {
    Client,
    EmbedBuilder,
    ApplicationCommandOptionType
} = require("discord.js");
const ee = require("../../botconfig/embed.json");
const axios = require("axios");
require('dotenv').config();

module.exports = {
    name: 'checkinvoice',
    description: 'Get the current bot, api & database ping!',
    IsDevOnly: true,
    options: [{
        name: 'invoiceid',
        description: 'The ID of the invoice you wish to validate!',
        type: ApplicationCommandOptionType.String,
        required: true
    }],

    /** 
     * @param {Client} client 
     * @param {Message} message 
     * @param {String[]} args 
     */
    run: async (client, interaction, args) => {
        const invoiceId = interaction.options.getString('invoiceid');

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

        if (invoiceIsValid(invoiceStatus, products.data.data.order.status)) {
            return await interaction.reply({
                embeds: [
                    new EmbedBuilder()
                    .setColor(ee.successColor)
                    .setDescription('Invoice is valid!')
                ]
            });
        } else {
            return await interaction.reply({
                embeds: [
                    new EmbedBuilder()
                    .setColor(ee.errorColor)
                    .setDescription('Invoice is NOT valid, or is not yet at paid status!')
                ]
            });
        }
    }
}

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