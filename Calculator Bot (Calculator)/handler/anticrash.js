module.exports = async (client) => {
    process.on('unhandledRejection', (reason, p) => {
        console.log(' [ANTICRASH] <==> || Unhandled Rejection/Catch || <==> [ANTICRASH]');
        console.log(reason, p);
    });
    process.on("uncaughtException", (err, origin) => {
        console.log(' [ANTICRASH] <==> || Uncaught Exception/Catch || <==> [ANTICRASH]');
        console.log(err, origin);
    })
    process.on('uncaughtExceptionMonitor', (err, origin) => {
        console.log(' [ANTICRASH] <==>  || Uncaught Exception/Catch (MONITOR) || <==> [ANTICRASH]');
        console.log(err, origin);
    });
}

/*

Code used in this script has been written by PGTechnologies™
This project has been licensed through PGTechnologies™, you are NOT permitted to take credit for this project.
Require assistance with scripts? Join the discord and get help right away! - https://discord.gg/xQFFRzhJu2
Original Developer - PGamingHD#0666

*/