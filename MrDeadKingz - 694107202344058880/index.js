//           --------------------<CONSTRUCTORS>--------------------

const {
    Client,
    Collection,
} = require("discord.js");
require('dotenv').config();

//           --------------------<CONSTRUCTORS>--------------------


//           --------------------<CONSTRUCTING CLIENT>--------------------
const client = new Client({
    allowedMentions: {
        parse: ["users", "roles", "everyone"], // "everyone", "roles", "users"
        repliedUser: false,
    },

    intents: [
        "Guilds",
        "GuildMembers",
        "GuildBans",
        "GuildMessages",
        "DirectMessages",
        "GuildPresences"
    ],
});
//           --------------------<CONSTRUCTING CLIENT>--------------------


//           --------------------<MODULE EXPORTS>--------------------

module.exports = client;

//           --------------------<MODULE EXPORTS>--------------------


//           --------------------<GLOBAL VARIABLES CONSTRUCTION>--------------------
client.slashCommands = new Collection();
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