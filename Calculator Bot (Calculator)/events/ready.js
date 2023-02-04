const client = require("../index");
const config = require("../botconfig/config.json");
const {
    ActivityType,
} = require("discord.js");

client.on("ready", async (client) => {
    try {
        console.log(`[LOGIN] <==> || I successfully logged into ${client.user.tag} and started ALL services || <==> [LOGIN]`)

        let defaultType = ActivityType.Watching
        if (config.status.type === "WATCHING") defaultType = ActivityType.Watching;
        if (config.status.type === "PLAYING") defaultType = ActivityType.Playing;
        if (config.status.type === "STREAMING") defaultType = ActivityType.Streaming;
        if (config.status.type === "LISTENING") defaultType = ActivityType.Listening;

        client.user.setActivity(config.status.text, {
            type: defaultType,
            url: config.status.url
        })

    } catch (e) {
        console.log(String(e.stack))
    }
});

/*

Code used in this script has been written by PGTechnologies™
This project has been licensed through PGTechnologies™, you are NOT permitted to take credit for this project.
Require assistance with scripts? Join the discord and get help right away! - https://discord.gg/xQFFRzhJu2
Original Developer - PGamingHD#0666

*/