const client = require("../index");
const config = require("../botconfig/config.json");
const {
    Cron
} = require("croner");
const {
    ActivityType,
} = require("discord.js");
const lotteryData = require("../schemas/lotteryData");
const userData = require("../schemas/userWallets");

client.on("ready", async (client) => {

    Cron('0 0 */1 * * *', async () => {

        const getTicketsMaxID = await lotteryData.findOne();

        const generateID = Math.floor((Math.random() * getTicketsMaxID.LotterySoldTickets) + 1);

        const findWinner = await lotteryData.findOne({
            "OwnedTickets.TicketsOwnedIDs.TicketID": generateID //INSERT TICKET ID HERE (AND GET WINNER)
        }, {
            "OwnedTickets.$": 1
        });

        if (!findWinner) {
            return;
        }

        const lotteryWinner = await client.users.fetch(`${findWinner.OwnedTickets[0].TicketOwner}`)

        try {
            await lotteryWinner.send({
                content: `:tada: Congratulations, it looks like you have won the ***lottery*** with your lottery ticket: \`[ID: ${generateID}]\`, your price of **${getTicketsMaxID.LotteryPricePot.toLocaleString('en-US')}$** was successfully given!`
            });
        } catch {}

        await userData.findOneAndUpdate({
            userId: lotteryWinner.id
        }, {
            $inc: {
                "wallet.Balance": parseInt(getTicketsMaxID.LotteryPricePot)
            }
        });

        await lotteryData.findOneAndUpdate({}, {
            $set: {
                LotteryPricePot: 0,
                LotterySoldTickets: 0,
                LotteryLastWinner: `${lotteryWinner.username}#${lotteryWinner.discriminator}`,
                OwnedTickets: []
            }
        });
    });

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