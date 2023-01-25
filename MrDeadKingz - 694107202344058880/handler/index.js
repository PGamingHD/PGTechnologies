const {
    glob
} = require("glob");
const {
    promisify
} = require("util");
const {
    Client
} = require("discord.js");
const mongoose = require("mongoose");

const globPromise = promisify(glob);

/**
 * @param {Client} client
 */
module.exports = async (client) => {
    
    const eventFiles = await globPromise(`${process.cwd()}/events/*.js`);
    eventFiles.map((value) => require(value));

    const slashCommands = await globPromise(
        `${process.cwd()}/SlashCommands/**/*.js`
    );

    const arrayOfSlashCommands = [];
    slashCommands.map((value) => {
        const file = require(value);
        if (!file?.name) return;
        client.slashCommands.set(file.name, file);

        if (["MESSAGE", "USER"].includes(file.type)) delete file.description;
        arrayOfSlashCommands.push(file);
    });

    await mongoose.connect(process.env.MONGODB_CONNECT || '', {
        keepAlive: true,
        dbName: 'OSRS_Services',
    }).then(() => console.log("[DATABASE] <==> || Successfully connected to the MongoDB database! || <==> [DATABASE]"));

    client.on("ready", async () => {
        await client.application.commands.set(arrayOfSlashCommands).then(console.log("[SLASHCOMMANDS] <==> || Successfully loaded all slash commands globally! || <==> [SLASHCOMMANDS]"))
    });
};

/*

Code used in this script has been written by PGTechnologies™
This project has been licensed through PGTechnologies™, you are NOT permitted to take credit for this project.
Require assistance with scripts? Join the discord and get help right away! - https://discord.gg/xQFFRzhJu2
Original Developer - PGamingHD#0666

*/