//           --------------------<CONSTRUCTORS>--------------------

const {
    Client,
    Collection,
    GatewayIntentBits,
    Partials
} = require("discord.js");
const userWallet = require("./schemas/userWallets");
const config = require("./botconfig/config.json");
const {
    sendWebhook
} = require("./handler/functions");
const {
    Webhook
} = require("@top-gg/sdk");
const express = require('express');
const server = express();
require('dotenv').config();

//           --------------------<CONSTRUCTORS>--------------------


//           --------------------<CONSTRUCTING CLIENT>--------------------

const client = new Client({
    allowedMentions: {
        parse: ["users", "roles", "everyone"], // "everyone", "roles", "users"
        repliedUser: false,
    },
    waitGuildTimeout: 10000,
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildBans,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.DirectMessages,
        GatewayIntentBits.GuildPresences,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMessageReactions,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.GuildEmojisAndStickers
    ],

    partials: [
        Partials.ActivityType,
    ],
});

const webhook = new Webhook(config.Vote_System.webhook_authorize);

//           --------------------<CONSTRUCTING CLIENT>--------------------


//           --------------------<MODULE EXPORTS>--------------------

module.exports = client;

//           --------------------<MODULE EXPORTS>--------------------


//           --------------------<GLOBAL VARIABLES CONSTRUCTION>--------------------
client.commands = new Collection();
client.slashCommands = new Collection();
client.cooldown = new Collection();
client.config = require("./botconfig/config.json");
//           --------------------<GLOBAL VARIABLES CONSTRUCTION>--------------------


//           --------------------<REQUIRES>--------------------

// Initialize the anticrash file
require("./handler/anticrash")(client)
// Initializing the project handler
require("./handler")(client);

//           --------------------<REQUIRES>--------------------


//           --------------------<TOP.GG INTEGRATION>--------------------

server.post("/dblwebhook", webhook.listener(async (vote) => {
    await sendWebhook(config.Vote_System.webhook_link, config.Vote_System.webhook.title, config.Vote_System.webhook.description, config.Vote_System.webhook.color);

    if (config.Vote_System.vote_giveRole) {
        try {
            const rewardsServer = await client.guilds.fetch(config.Vote_System.vote_rewardsServer);
            const rewardsRole = await rewardsServer.roles.fetch(config.Vote_System.vote_rewardsRole);
            const serverMember = await rewardsServer.members.fetch(vote.user);

            await serverMember.roles.add(rewardsRole, '[AUTO] User voted on Top.GG!');

            setTimeout(async () => {
                await serverMember.roles.remove(rewardsRole);
            }, 10 * 60000 * 60);
        } catch {}
    }

    if (config.Vote_System.vote_giveBalance) {
        let wallet = await userWallet.findOne({
            userId: vote.user
        });

        if (!wallet) {
            await userWallet.create({
                userId: vote.user,
                wallet: {
                    oBalance: 0,
                    oSpent: 0,
                    Balance: 0,
                    Spent: 0
                }
            });

            wallet = await userWallet.findOne({
                userId: vote.user
            });
        }

        await wallet.updateOne({
            $inc: {
                "wallet.Balance": config.Vote_System.vote_reward
            }
        })
    }
}));

server.listen(config.Vote_System.webhook_port);

//           --------------------<TOP.GG INTEGRATION>--------------------


//           --------------------<STARTER>--------------------

client.login(process.env.LOGIN_TOKEN);

//           --------------------<STARTER>--------------------

/*

Code used in this script has been written by PGTechnologies™
This project has been licensed through PGTechnologies™, you are NOT permitted to take credit for this project.
Require assistance with scripts? Join the discord and get help right away! - https://discord.gg/xQFFRzhJu2
Original Developer - PGamingHD#0666

*/