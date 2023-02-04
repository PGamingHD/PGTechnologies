const userWallet = require("../schemas/userWallets");
const {
    WebhookClient
} = require("discord.js")
const FlakeId = require("flakeid");
const flake = new FlakeId({
    mid: 45, //optional, define machine id
    timeOffset: (2023 - 1970) * 31536000 * 1000 //optional, define a offset time
});

module.exports.generateSnowflake = generateSnowflake;
module.exports.stringTemplateParser = stringTemplateParser;
module.exports.escapeRegex = escapeRegex;
module.exports.specialParamsSplitter = specialParamsSplitter;
module.exports.confirmWallet = confirmWallet;
module.exports.sendWebhook = sendWebhook;

function stringTemplateParser(expression, valueObj) {
    const templateMatcher = /{\s?([^{}\s]*)\s?}/g;
    let text = expression.replace(templateMatcher, (substring, value, index) => {
        value = valueObj[value];
        return value;
    });
    return text
}

function escapeRegex(str) {
    try {
        return str.replace(/[.*+?^${}()|[\]\\]/g, `\\$&`);
    } catch (e) {
        console.log(String(e.stack).bgRed)
    }
}

function generateSnowflake() {
    return flake.gen();
}

function specialParamsSplitter(str, splitter, argumentName) {
    const string = str.split(splitter);
    console.log(string)

    if (string[0] === argumentName) {
        return string[1]
    }

    return undefined;
}

async function confirmWallet(user) {
    const usersWallet = await userWallet.findOne({
        userId: user.id
    });

    if (!usersWallet) {
        await userWallet.create({
            userId: user.id,
            wallet: {
               oBalance: 0,
               oSpent: 0,
               Balance: 0,
               Spent: 0 
            }
        })
    }
}

async function sendWebhook(webhookLink, webhookTitle, webhookDesc, webhookColor) {
    const webhook = new WebhookClient({
        url: webhookLink
    });

    await webhook.send({
        embeds: [
            new EmbedBuilder()
            .setColor(webhookColor)
            .setTitle(webhookTitle)
            .setDescription(webhookDesc)
            .setTimestamp()
        ]
    });
}

/*

Code used in this script has been written by PGTechnologies™
This project has been licensed through PGTechnologies™, you are NOT permitted to take credit for this project.
Require assistance with scripts? Join the discord and get help right away! - https://discord.gg/xQFFRzhJu2
Original Developer - PGamingHD#0666

*/