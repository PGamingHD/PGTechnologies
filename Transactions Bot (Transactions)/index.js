//           --------------------<CONSTRUCTORS>--------------------

const {
    Client,
    Collection,
    GatewayIntentBits,
    Partials
} = require("discord.js");
const userWallet = require("./schemas/userWallets");
const config = require("./botconfig/config.json");
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


//           --------------------<STARTER>--------------------

client.login(process.env.LOGIN_TOKEN);

//           --------------------<STARTER>--------------------

/*

Code used in this script has been written by PGTechnologies™
This project has been licensed through PGTechnologies™, you are NOT permitted to take credit for this project.
Require assistance with scripts? Join the discord and get help right away! - https://discord.gg/xQFFRzhJu2
Original Developer - PGamingHD#0666

*/