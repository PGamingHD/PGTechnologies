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

const fs = require('fs').promises;
const path = require('path');
const process = require('process');
const {
    authenticate
} = require('@google-cloud/local-auth');
const {
    google
} = require('googleapis');

const globPromise = promisify(glob);

/**
 * @param {Client} client
 */
module.exports = async (client) => {

    const commandFiles = await globPromise(`${process.cwd()}/commands/**/*.js`);
    commandFiles.map((value) => {
        const file = require(value);
        const splitted = value.split("/");
        const directory = splitted[splitted.length - 2];

        if (file.name) {
            const properties = {
                directory,
                ...file
            };
            client.commands.set(file.name, properties);
        }
    });

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

    const CREDENTIALS_PATH = path.join(process.cwd(), 'credentials.json');
    const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];
    const TOKEN_PATH = path.join(process.cwd(), 'token.json');

    async function loadSavedCredentialsIfExist() {
        try {
            const content = await fs.readFile(TOKEN_PATH);
            const credentials = JSON.parse(content);
            return google.auth.fromJSON(credentials);
        } catch (err) {
            return null;
        }
    }

    async function saveCredentials(client) {
        const content = await fs.readFile(CREDENTIALS_PATH);
        const keys = JSON.parse(content);
        const key = keys.installed || keys.web;
        const payload = JSON.stringify({
            type: 'authorized_user',
            client_id: key.client_id,
            client_secret: key.client_secret,
            refresh_token: client.credentials.refresh_token,
        });

        await fs.writeFile(TOKEN_PATH, payload);
    }

    async function authorize() {
        let client = await loadSavedCredentialsIfExist();
        if (client) {
            return client;
        }
        client = await authenticate({
            scopes: SCOPES,
            keyfilePath: CREDENTIALS_PATH,
        });
        if (client.credentials) {
            await saveCredentials(client);
        }
        return client;
    };

    client.authSheets = await authorize();
};

/*

Code used in this script has been written by PGTechnologies™
This project has been licensed through PGTechnologies™, you are NOT permitted to take credit for this project.
Require assistance with scripts? Join the discord and get help right away! - https://discord.gg/xQFFRzhJu2
Original Developer - PGamingHD#0666

*/