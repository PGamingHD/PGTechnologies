const client = require("../index");
const userWallet = require("../schemas/userWallets");
const {
    WebhookClient
} = require("discord.js");
const {
    google
} = require('googleapis');
require('dotenv').config();
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
module.exports.dateNow = dateNow;
module.exports.writeTransaction = writeTransaction;
module.exports.readSheets = readSheets;
module.exports.getAuthedSheet = getAuthedSheet;

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

function dateNow() {
    const AD = new Date;
    const ADY = AD.getFullYear();
    let ADM = AD.getMonth() + 1;
    let ADD = AD.getDate();
    let ADH = AD.getHours();
    let ADMI = AD.getMinutes();
    let ADS = AD.getSeconds();

    if (ADD < 10) {
        ADD = '0' + AD.getDate();
    }
    if (ADM < 10) {
        ADM = '0' + ADM;
    }
    if (ADH < 10) {
        ADH = '0' + AD.getHours();
    }
    if (ADMI < 10) {
        ADMI = '0' + AD.getMinutes();
    }
    if (ADS < 10) {
        ADS = '0' + AD.getSeconds();
    }

    return `${ADY}-${ADM}-${ADD} ${ADH}:${ADMI}:${ADS}`;
}

async function getAuthedSheet() {
    const auth = client.authSheets;

    const sheets = google.sheets({
        version: 'v4',
        auth
    });

    return sheets;
}

async function writeTransaction(rowType, rowFrom, rowTo, TransactionRow) {
    const rows = await readSheets(rowType, rowFrom, rowTo);

    const nextRead = rows.length + 1;

    const sheets = await getAuthedSheet();

    await sheets.spreadsheets.values.update({
        spreadsheetId: process.env.SPREADSHEET_ID,
        range: rowType + '!' + rowFrom + nextRead + ':' + rowTo + nextRead,
        valueInputOption: 'RAW',
        resource: {
            values: TransactionRow
        }
    });
}

async function readSheets(rowType, rowFrom, rowTo) {
    const sheets = await getAuthedSheet();

    const res = await sheets.spreadsheets.values.get({
        spreadsheetId: process.env.SPREADSHEET_ID,
        range: rowType + '!' + rowFrom + ':' + rowTo,
    });

    return res.data.values;
}

/*

Code used in this script has been written by PGTechnologies™
This project has been licensed through PGTechnologies™, you are NOT permitted to take credit for this project.
Require assistance with scripts? Join the discord and get help right away! - https://discord.gg/xQFFRzhJu2
Original Developer - PGamingHD#0666

*/