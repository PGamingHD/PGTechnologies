const {
    Message,
    Client,
    EmbedBuilder
} = require('discord.js');
const config = require('../../botconfig/config.json');
const {
    google
} = require('googleapis');
 
module.exports = {
    name: 'skills',
    aliases: ['s', 'skill', 'calculateskill'],
    /**
     *
     * @param {Client} client
     * @param {Message} message
     * @param {String[]} args
     */
    run: async (client, message, args) => {
        let skill = args[0];
        const levels = args[1];

        if (!skill || !levels) {
            return await message.reply({
                content: ':x: Please enter a valid skill & levels to continue (Levels display: 1-99)',
                ephemeral: true
            });
        }

        skill = args[0].toLowerCase();

        const levelsSplit = levels.split('-');

        const fromLevel = levelsSplit[0];
        const toLevel = levelsSplit[1];

        if (!fromLevel || !toLevel) {
            return await message.reply({
                content: ':x: Please enter valid numbers between 1-99 to display skill calculations!',
                ephemeral: true
            });
        }

        const actualSkill =  skill; //skill.replaceAll(' ', ''); INTERACTION REMAKE

        const XPArray = [
            0,
            83,
            174,
            276,
            388,
            512,
            650,
            801,
            969,
            1154,
            1358,
            1584,
            1833,
            2107,
            2411,
            2746,
            3115,
            3523,
            3973,
            4470,
            5018,
            5624,
            6291,
            7028,
            7842,
            8740,
            9730,
            10824,
            12031,
            13363,
            14833,
            16456,
            18247,
            20224,
            22406,
            24815,
            27473,
            30408,
            33648,
            37224,
            41171,
            45529,
            50339,
            55649,
            61512,
            67983,
            75127,
            83014,
            91721,
            101333,
            111945,
            123660,
            136594,
            150872,
            166636,
            184040,
            203254,
            224466,
            247886,
            273742,
            302288,
            333804,
            368599,
            407015,
            449428,
            496254,
            547953,
            605032,
            668051,
            737627,
            814445,
            899257,
            992895,
            1096278,
            1210421,
            1336443,
            1475581,
            1629200,
            1798808,
            1986068,
            2192818,
            2421087,
            2673114,
            2951373,
            3258594,
            3597792,
            3972294,
            4385776,
            4842295,
            5346332,
            5902831,
            6517253,
            7195629,
            7944614,
            8771558,
            9684577,
            10692629,
            11805606,
            13034431
        ]

        if (isNaN(fromLevel) || isNaN(toLevel)) {
            return await message.reply({
                content: ':x: Values display from level and to level must be valid numbers ONLY!',
                ephemeral: true
            });
        }

        const from_level = parseInt(fromLevel);
        const to_level = parseInt(toLevel);

        if (from_level < 1 || from_level >= 100 || to_level >= 100 || to_level <= 1 || from_level >= to_level) {
            return await message.reply({
                content: ':x: The specific number range is now allowed, from level must be 1-99 and to-level must be 2-99. from_level must also be higher and not equal to to_level!',
                ephemeral: true
            });
        }

        const auth = await authorize();

        const sheets = google.sheets({
            version: 'v4',
            auth
        });

        const res = await sheets.spreadsheets.values.get({
            spreadsheetId: process.env.SPREADSHEET_ID,
            range: 'Skill Calc!A2:L',
        });

        const btcRes = await sheets.spreadsheets.values.get({
            spreadsheetId: process.env.SPREADSHEET_ID,
            range: 'Config!A2:B',
        });

        const btcRows = btcRes.data.values;
        const rows = res.data.values;

        let BTCrate = null;
        btcRows.forEach((row) => {
            if (row[0] !== "btc") return;
            BTCrate = parseFloat(row[1])
        });

        let discountPrice = 0.0;
        let discount = 0;
        config.Discounts.forEach(disc => {
            const remakeDiscount = disc.discount.replace('%', '');
            const actualDiscount = parseInt(remakeDiscount);

            if (disc.type.toLowerCase() === "role") {
                if (message.member.roles.cache.has(disc.discountRole)) {
                    discountPrice = actualDiscount / 100;
                    discount = actualDiscount;
                }
            } else if (disc.type.toLowerCase() === "user") {
                if (disc.discountUser && message.author.id === disc.discountUser) {
                    discountPrice = actualDiscount / 100;
                    discount = actualDiscount;
                }
            }
        });

        let skillRow = undefined;
        let startLevel = undefined;
        let endLevel = undefined;
        let gpxp = undefined;
        let method = undefined;

        let foundNumber = 0;
        for (let i = 0; i < rows.length; i++) {
            const element = rows[i];
            if (element[0] === actualSkill.toLowerCase()) {
                foundNumber = i;

                skillRow = rows[foundNumber];

                if (rows[foundNumber + 1][1] === "startLevel") {
                    startLevel = rows[foundNumber + 1];
                }

                if (rows[foundNumber + 2][1] === "endLevel") {
                    endLevel = rows[foundNumber + 2];
                }

                if (rows[foundNumber + 3][1] === "gp/xp") {
                    gpxp = rows[foundNumber + 3];
                }

                if (rows[foundNumber + 4][1] === "method") {
                    method = rows[foundNumber + 4];
                }
            }
        }

        if (!skillRow || !startLevel || !endLevel || !gpxp || !method) {
            return await message.reply({
                content: ':x: No skill could be found with the inserted arguments!',
                ephemeral: true
            });
        }

        skillRow = skillRow.filter(function (array) {
            if (array !== actualSkill.toLowerCase() && array !== "calculation") return array;
        })
        startLevel = startLevel.filter(function (array) {
            if (array !== "startLevel") return parseInt(array);
        })
        endLevel = endLevel.filter(function (array) {
            if (array !== "endLevel") return parseInt(array);
        })
        gpxp = gpxp.filter(function (array) {
            if (array !== "gp/xp") return parseInt(array);
        })
        method = method.filter(function (array) {
            if (array !== "method") return array;
        })

        const addFields = [{
            name: '__**Start Level**__',
            value: `\`\`\`${from_level}\`\`\``,
            inline: true
        }, {
            name: '__**End Level**__',
            value: `\`\`\`${to_level}\`\`\``,
            inline: true
        }, {
            name: '__**Discount**__',
            value: `\`\`\`${discount === 0 ? "No Discount" : discount + "% Applied"}\`\`\``,
            inline: true
        }];

        for (let i = 0; i < skillRow.length; i++) {
            
            let mainMethod = skillRow[i];
            let methodName = method[i];
            let goldCostXP = gpxp[i];
            let startingLevel = startLevel[i];
            let endingLevel = endLevel[i];

            let secondMainMethod = skillRow[i + 1];
            let secondMethodName = method[i + 1];
            let secondGoldCostXP = gpxp[i + 1];
            let secondStartingLevel = startLevel[i + 1];
            let secondEndingLevel = endLevel[i + 1];

            let thirdMainMethod = skillRow[i + 2];
            let thirdMethodName = method[i + 2];
            let thirdGoldCostXP = gpxp[i + 2];
            let thirdStartingLevel = startLevel[i + 2];
            let thirdEndingLevel = endLevel[i + 2];
            
            if (mainMethod === secondMainMethod && secondMainMethod === thirdMainMethod) {
                let firstOne = "";
                let secondOne = "";
                let thirdOne = "";

                if (endingLevel > to_level) {
                    endingLevel = to_level;
                }

                if (secondEndingLevel > to_level) {
                    secondEndingLevel = to_level;
                }

                if (thirdEndingLevel > to_level) {
                    thirdEndingLevel = to_level;
                }

                let XPCalculation = XPArray[endingLevel - 1] - XPArray[startingLevel - 1];
                let secondXPCalculation = XPArray[secondEndingLevel - 1] - XPArray[secondStartingLevel - 1];
                let thirdXPCalculation = XPArray[thirdEndingLevel - 1] - XPArray[thirdStartingLevel - 1];

                firstOne = `${config.Skill_System.Skill_Embed.calculator_icon} **${startingLevel}-${endingLevel}** - *${methodName === undefined ? "No name" : methodName}*\n\`${goldCostXP}gp/xp\` ${config.Skill_System.Skill_Embed.xp_icon} \`${XPCalculation.toLocaleString('en-US')}\` ${config.Skill_System.Skill_Embed.gold_icon} \`${(goldCostXP * XPCalculation / 1000000).toFixed(2)}M\`\n`;
                secondOne = `${config.Skill_System.Skill_Embed.calculator_icon} **${secondStartingLevel}-${secondEndingLevel}** - *${secondMethodName === undefined ? "No name" : secondMethodName}*\n\`${secondGoldCostXP}gp/xp\` ${config.Skill_System.Skill_Embed.xp_icon} \`${secondXPCalculation.toLocaleString('en-US')}\` ${config.Skill_System.Skill_Embed.gold_icon} \`${(secondGoldCostXP * secondXPCalculation / 1000000).toFixed(2)}M\`\n`;
                thirdOne = `${config.Skill_System.Skill_Embed.calculator_icon} **${thirdStartingLevel}-${thirdEndingLevel}** - *${thirdMethodName === undefined ? "No name" : thirdMethodName}*\n\`${thirdGoldCostXP}gp/xp\` ${config.Skill_System.Skill_Embed.xp_icon} \`${thirdXPCalculation.toLocaleString('en-US')}\` ${config.Skill_System.Skill_Embed.gold_icon} \`${(thirdGoldCostXP * thirdXPCalculation / 1000000).toFixed(2)}M\`\n`;
                let totalMoneyOne = `${config.Skill_System.Skill_Embed.gold_icon} **${((goldCostXP * XPCalculation / 1000000) - (goldCostXP * XPCalculation / 1000000) * discountPrice).toFixed(2)}M**ㅤㅤ${config.Skill_System.Skill_Embed.money_icon} **${((goldCostXP * XPCalculation / 1000000 * BTCrate) - (goldCostXP * XPCalculation / 1000000 * BTCrate) * discountPrice).toFixed(2)}$**`;
                let totalMoneyTwo = `${config.Skill_System.Skill_Embed.gold_icon} **${(((goldCostXP * XPCalculation / 1000000) + (secondGoldCostXP * secondXPCalculation / 1000000)) - ((goldCostXP * XPCalculation / 1000000) + (secondGoldCostXP * secondXPCalculation / 1000000)) * discountPrice).toFixed(2)}M**ㅤㅤ${config.Skill_System.Skill_Embed.money_icon} **${(((goldCostXP * XPCalculation / 1000000 * BTCrate) + (secondGoldCostXP * secondXPCalculation / 1000000 * BTCrate)) - ((goldCostXP * XPCalculation / 1000000 * BTCrate) + (secondGoldCostXP * secondXPCalculation / 1000000 * BTCrate)) * discountPrice).toFixed(2)}$**`;
                let totalMoneyThree = `${config.Skill_System.Skill_Embed.gold_icon} **${(((goldCostXP * XPCalculation / 1000000) + (secondGoldCostXP * secondXPCalculation / 1000000) + (thirdGoldCostXP * thirdXPCalculation / 1000000)) - ((goldCostXP * XPCalculation / 1000000) + (secondGoldCostXP * secondXPCalculation / 1000000) + (thirdGoldCostXP * thirdXPCalculation / 1000000)) * discountPrice).toFixed(2)}M**ㅤㅤ${config.Skill_System.Skill_Embed.money_icon} **${(((goldCostXP * XPCalculation / 1000000 * BTCrate) + (secondGoldCostXP * secondXPCalculation / 1000000 * BTCrate) + (thirdGoldCostXP * thirdXPCalculation / 1000000 * BTCrate)) - ((goldCostXP * XPCalculation / 1000000 * BTCrate) + (secondGoldCostXP * secondXPCalculation / 1000000 * BTCrate) + (thirdGoldCostXP * thirdXPCalculation / 1000000 * BTCrate)) * discountPrice).toFixed(2)}$**`;

                if (startingLevel >= to_level) {
                    firstOne = "";
                }

                if (secondStartingLevel >= to_level) {
                    secondOne = "";
                }

                if (thirdStartingLevel >= to_level) {
                    thirdOne = "";
                }

                if (firstOne === "" && secondOne === "" && thirdOne === "") continue;

                skillRow.splice(i + 1, 2);
                method.splice(i + 1, 2);
                gpxp.splice(i + 1, 2);
                startLevel.splice(i + 1, 2);
                endLevel.splice(i + 1, 2);

                if (firstOne !== "" && secondOne !== "" && thirdOne !== "") {
                    addFields.push({
                        name: `**${mainMethod}**`,
                        value: `${firstOne}${secondOne}${thirdOne}${totalMoneyThree}`
                    });
                    continue;
                }

                if (firstOne !== "" && secondOne !== "" && thirdOne === "") {
                    addFields.push({
                        name: `**${mainMethod}**`,
                        value: `${firstOne}${secondOne}${thirdOne}${totalMoneyTwo}`
                    });
                    continue;
                }

                if (firstOne !== "" && secondOne === "") {
                    addFields.push({
                        name: `**${mainMethod}**`,
                        value: `${firstOne}${secondOne}${thirdOne}${totalMoneyOne}`
                    });
                    continue;
                }
            } else if (mainMethod === secondMainMethod) {
                let firstOne = "";
                let secondOne = "";

                if (endingLevel > to_level) {
                    endingLevel = to_level;
                }

                if (secondEndingLevel > to_level) {
                    secondEndingLevel = to_level;
                }

                let XPCalculation = XPArray[endingLevel - 1] - XPArray[startingLevel - 1];
                let secondXPCalculation = XPArray[secondEndingLevel - 1] - XPArray[secondStartingLevel - 1];

                firstOne = `${config.Skill_System.Skill_Embed.calculator_icon} **${startingLevel}-${endingLevel}** - *${methodName === undefined ? "No name" : methodName}*\n\`${goldCostXP}gp/xp\` ${config.Skill_System.Skill_Embed.xp_icon} \`${XPCalculation.toLocaleString('en-US')}\` ${config.Skill_System.Skill_Embed.gold_icon} \`${(goldCostXP * XPCalculation / 1000000).toFixed(2)}M\`\n`;
                secondOne = `${config.Skill_System.Skill_Embed.calculator_icon} **${secondStartingLevel}-${secondEndingLevel}** - *${secondMethodName === undefined ? "No name" : secondMethodName}*\n\`${secondGoldCostXP}gp/xp\` ${config.Skill_System.Skill_Embed.xp_icon} \`${secondXPCalculation.toLocaleString('en-US')}\` ${config.Skill_System.Skill_Embed.gold_icon} \`${(secondGoldCostXP * secondXPCalculation / 1000000).toFixed(2)}M\`\n`;
                let totalMoneyOne = `${config.Skill_System.Skill_Embed.gold_icon} **${((goldCostXP * XPCalculation / 1000000) - (goldCostXP * XPCalculation / 1000000) * discountPrice).toFixed(2)}M**ㅤㅤ${config.Skill_System.Skill_Embed.money_icon} **${((goldCostXP * XPCalculation / 1000000 * BTCrate) - (goldCostXP * XPCalculation / 1000000 * BTCrate) * discountPrice).toFixed(2)}$**`;
                let totalMoneyTwo = `${config.Skill_System.Skill_Embed.gold_icon} **${(((goldCostXP * XPCalculation / 1000000) + (secondGoldCostXP * secondXPCalculation / 1000000)) - ((goldCostXP * XPCalculation / 1000000) + (secondGoldCostXP * secondXPCalculation / 1000000)) * discountPrice).toFixed(2)}M**ㅤㅤ${config.Skill_System.Skill_Embed.money_icon} **${(((goldCostXP * XPCalculation / 1000000 * BTCrate) + (secondGoldCostXP * secondXPCalculation / 1000000 * BTCrate)) - ((goldCostXP * XPCalculation / 1000000 * BTCrate) + (secondGoldCostXP * secondXPCalculation / 1000000 * BTCrate)) * discountPrice).toFixed(2)}$**`;

                if (startingLevel >= to_level) {
                    firstOne = "";
                }

                if (secondStartingLevel >= to_level) {
                    secondOne = "";
                }

                if (firstOne === "" && secondOne === "") continue;

                skillRow.splice(i + 1, 1);
                method.splice(i + 1, 1);
                gpxp.splice(i + 1, 1);
                startLevel.splice(i + 1, 1);
                endLevel.splice(i + 1, 1);

                if (firstOne !== "" && secondOne !== "") {
                    addFields.push({
                        name: `**${mainMethod}**`,
                        value: `${firstOne}${secondOne}${totalMoneyTwo}`
                    });
                    continue;
                }

                if (firstOne !== "" && secondOne === "") {
                    addFields.push({
                        name: `**${mainMethod}**`,
                        value: `${firstOne}${secondOne}${totalMoneyOne}`
                    });
                    continue;
                }
            } else {
                if (endingLevel > to_level) {
                    endingLevel = to_level;
                }
    
                if (startingLevel >= to_level) {
                    continue;
                }

                if (startingLevel < from_level) {
                    continue;
                }

                let XPCalculation = XPArray[endingLevel - 1] - XPArray[startingLevel - 1];
    
                addFields.push({
                    name: `**${mainMethod}**`,
                    value: `${config.Skill_System.Skill_Embed.calculator_icon} **${startingLevel}-${endingLevel}** - *${methodName === undefined ? "No name" : methodName}*\n\`${goldCostXP}gp/xp\` ${config.Skill_System.Skill_Embed.xp_icon} \`${XPCalculation.toLocaleString('en-US')}\` ${config.Skill_System.Skill_Embed.gold_icon} \`${((goldCostXP * XPCalculation / 1000000)).toFixed(2)}M\`\n${config.Skill_System.Skill_Embed.gold_icon} **${((goldCostXP * XPCalculation / 1000000) - (goldCostXP * XPCalculation / 1000000) * discountPrice).toFixed(2)}M**ㅤㅤ${config.Skill_System.Skill_Embed.money_icon} **${((goldCostXP * XPCalculation / 1000000 * BTCrate) - (goldCostXP * XPCalculation / 1000000 * BTCrate) * discountPrice).toFixed(2)}$**`
                });
                continue;
            }
        }

        return await message.reply({
            embeds: [
                new EmbedBuilder()
                .setColor(config.Skill_System.Skill_Embed.color)
                .setTitle(`${actualSkill.charAt(0).toUpperCase() + actualSkill.slice(1)} Calculator`)
                .setThumbnail(config.Skill_System.Skill_Embed.thumbnail)
                .addFields(addFields.length === 3 ? [{name: 'No methods available', value: 'No methods found!'}] : addFields)
                .setFooter({text: config.Skill_System.Skill_Embed.footer.text, iconURL: config.Skill_System.Skill_Embed.footer.iconURL})
                .setTimestamp()
            ],
        });
    },
};