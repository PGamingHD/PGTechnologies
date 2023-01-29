const {
    Client,
    EmbedBuilder,
    ApplicationCommandOptionType
} = require("discord.js");
const ee = require("../../botconfig/embed.json");
const axios = require("axios");
const userData = require("../../schemas/userData");
const config = require("../../botconfig/config.json");
const authorize = require("../../handler/authenticate");
const {
    google
} = require('googleapis');
require('dotenv').config();

module.exports = {
    name: 'calculate',
    description: 'Calculator for different things!',
    options: [{
        name: 'skill',
        description: 'Check how much the skill would cost in $$!',
        type: ApplicationCommandOptionType.Subcommand,
        options: [{
            name: 'skillname',
            description: 'The skill you want to view the price of',
            type: ApplicationCommandOptionType.String,
            required: true
        }, {
            name: 'from_level',
            description: 'From what level you want to check',
            type: ApplicationCommandOptionType.Integer,
            required: true
        }, {
            name: 'to_level',
            description: 'To what level you want to check',
            type: ApplicationCommandOptionType.Integer,
            required: true
        }],
    }, {
        name: 'quest',
        description: 'Check how much the quest would cost in $$!',
        type: ApplicationCommandOptionType.Subcommand,
        options: [{
            name: 'quests',
            description: 'The quest you want to view the price of',
            type: ApplicationCommandOptionType.String,
            required: true
        }],
    }],
    /** 
     * @param {Client} client 
     * @param {Message} message 
     * @param {String[]} args 
     */
    run: async (client, interaction, args) => {
        if (interaction.options.getSubcommand() === "skill") {
            const skill = interaction.options.getString('skillname').toLowerCase();
            const fromLevel = interaction.options.getInteger('from_level');
            const toLevel = interaction.options.getInteger('to_level');
    
            const actualSkill = skill.replaceAll(' ', '');
    
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
                return await interaction.reply({
                    content: ':x: From_level and To_level must be valid numbers!',
                    ephemeral: true
                });
            }
    
            const from_level = parseInt(fromLevel);
            const to_level = parseInt(toLevel);
    
            if (from_level < 1 || from_level >= 100 || to_level >= 100 || to_level <= 1 || from_level >= to_level) {
                return await interaction.reply({
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
            if (interaction.member.roles.cache.has(config.Discount_System["discount_15%"])) {
                discountPrice = 0.15;
                discount = 15;
            } else if (interaction.member.roles.cache.has(config.Discount_System["discount_10%"])) {
                discountPrice = 0.10;
                discount = 10;
            } else if (interaction.member.roles.cache.has(config.Discount_System["discount_6%"])) {
                discountPrice = 0.06;
                discount = 6;
            } else if (interaction.member.roles.cache.has(config.Discount_System["discount_4%"])) {
                discountPrice = 0.04;
                discount = 4;
            } else if (interaction.member.roles.cache.has(config.Discount_System["discount_2%"])) {
                discountPrice = 0.02;
                discount = 2;
            }
    
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
                return await interaction.reply({
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
                    let totalMoneyOne = `${config.Skill_System.Skill_Embed.gold_icon} **${((goldCostXP * XPCalculation / 1000000)).toFixed(2)}M**ㅤㅤ${config.Skill_System.Skill_Embed.money_icon} **${((goldCostXP * XPCalculation / 1000000 * BTCrate) - (goldCostXP * XPCalculation / 1000000 * BTCrate) * discountPrice).toFixed(2)}$**`;
                    let totalMoneyTwo = `${config.Skill_System.Skill_Embed.gold_icon} **${((goldCostXP * XPCalculation / 1000000) + (secondGoldCostXP * secondXPCalculation / 1000000)).toFixed(2)}M**ㅤㅤ${config.Skill_System.Skill_Embed.money_icon} **${(((goldCostXP * XPCalculation / 1000000 * BTCrate) + (secondGoldCostXP * secondXPCalculation / 1000000 * BTCrate)) - ((goldCostXP * XPCalculation / 1000000 * BTCrate) + (secondGoldCostXP * secondXPCalculation / 1000000 * BTCrate)) * discountPrice).toFixed(2)}$**`;
                    let totalMoneyThree = `${config.Skill_System.Skill_Embed.gold_icon} **${((goldCostXP * XPCalculation / 1000000) + (secondGoldCostXP * secondXPCalculation / 1000000) + (thirdGoldCostXP * thirdXPCalculation / 1000000)).toFixed(2)}M**ㅤㅤ${config.Skill_System.Skill_Embed.money_icon} **${(((goldCostXP * XPCalculation / 1000000 * BTCrate) + (secondGoldCostXP * secondXPCalculation / 1000000 * BTCrate) + (thirdGoldCostXP * thirdXPCalculation / 1000000 * BTCrate)) - ((goldCostXP * XPCalculation / 1000000 * BTCrate) + (secondGoldCostXP * secondXPCalculation / 1000000 * BTCrate) + (thirdGoldCostXP * thirdXPCalculation / 1000000 * BTCrate)) * discountPrice).toFixed(2)}$**`;
    
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
                    let totalMoneyOne = `${config.Skill_System.Skill_Embed.gold_icon} **${((goldCostXP * XPCalculation / 1000000)).toFixed(2)}M**ㅤㅤ${config.Skill_System.Skill_Embed.money_icon} **${((goldCostXP * XPCalculation / 1000000 * BTCrate) - (goldCostXP * XPCalculation / 1000000 * BTCrate) * discountPrice).toFixed(2)}$**`;
                    let totalMoneyTwo = `${config.Skill_System.Skill_Embed.gold_icon} **${((goldCostXP * XPCalculation / 1000000) + (secondGoldCostXP * secondXPCalculation / 1000000)).toFixed(2)}M**ㅤㅤ${config.Skill_System.Skill_Embed.money_icon} **${(((goldCostXP * XPCalculation / 1000000 * BTCrate) + (secondGoldCostXP * secondXPCalculation / 1000000 * BTCrate)) - ((goldCostXP * XPCalculation / 1000000 * BTCrate) + (secondGoldCostXP * secondXPCalculation / 1000000 * BTCrate)) * discountPrice).toFixed(2)}$**`;
    
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
                        value: `${config.Skill_System.Skill_Embed.calculator_icon} **${startingLevel}-${endingLevel}** - *${methodName === undefined ? "No name" : methodName}*\n\`${goldCostXP}gp/xp\` ${config.Skill_System.Skill_Embed.xp_icon} \`${XPCalculation.toLocaleString('en-US')}\` ${config.Skill_System.Skill_Embed.gold_icon} \`${(goldCostXP * XPCalculation / 1000000).toFixed(2)}M\`\n${config.Skill_System.Skill_Embed.gold_icon} **${(goldCostXP * XPCalculation / 1000000).toFixed(2)}M**ㅤㅤ${config.Skill_System.Skill_Embed.money_icon} **${((goldCostXP * XPCalculation / 1000000 * BTCrate) - (goldCostXP * XPCalculation / 1000000 * BTCrate) * discountPrice).toFixed(2)}$**`
                    });
                    continue;
                }
            }
    
            return await interaction.reply({
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
        }

        if (interaction.options.getSubcommand() === "quest") {
            const quest = interaction.options.getString('quests').toLowerCase();

            const splitQuest = quest.replaceAll(', ', ',');
            const extraSplit = splitQuest.replaceAll(' , ', ',');
            const allQuests = extraSplit.split(',');

            console.log(allQuests)
            
            const auth = await authorize();
    
            const sheets = google.sheets({
                version: 'v4',
                auth
            });
            const res = await sheets.spreadsheets.values.get({
                spreadsheetId: process.env.SPREADSHEET_ID,
                range: 'Config!A2:B',
            });
            const rows = res.data.values;
    
            let BTCrate = null;
            rows.forEach((row) => {
                if (row[0] !== "btc") return;
                BTCrate = parseFloat(row[1])
            });
    
            const res2 = await sheets.spreadsheets.values.get({
                spreadsheetId: process.env.SPREADSHEET_ID,
                range: 'Sheet15!A2:C',
            });
    
            const rows2 = res2.data.values;
    
                    let discountPrice = 0.0;
            let discount = 0;
            if (interaction.member.roles.cache.has(config.Discount_System["discount_15%"])) {
                discountPrice = 0.15;
                discount = 15;
            } else if (interaction.member.roles.cache.has(config.Discount_System["discount_10%"])) {
                discountPrice = 0.10;
                discount = 10;
            } else if (interaction.member.roles.cache.has(config.Discount_System["discount_6%"])) {
                discountPrice = 0.06;
                discount = 6;
            } else if (interaction.member.roles.cache.has(config.Discount_System["discount_4%"])) {
                discountPrice = 0.04;
                discount = 4;
            } else if (interaction.member.roles.cache.has(config.Discount_System["discount_2%"])) {
                discountPrice = 0.02;
                discount = 2;
            }
    
    
            let totalGoldCost = null;
            let fullQuestName = [];
            let questCost = null;
            rows2.forEach((row) => {
                if (row[0] === undefined || row[1] === undefined || row[2] === undefined) return;
                if (!allQuests.includes(row[0]) && !allQuests.includes(row[2])) return;
                questCost += parseFloat(((((parseInt(row[1]) / 1000) * BTCrate) - ((parseInt(row[1]) / 1000) * BTCrate) * discountPrice)).toFixed(2));
                fullQuestName.push(`• ${row[0]}`)
                totalGoldCost += (parseInt(row[1]) / 1000);
            })
    
            if (totalGoldCost === null || fullQuestName === [] || questCost === null) {
                return interaction.reply({
                    content: 'No quests found with input quest names! (Or your input or not formatted correctly)',
                    ephemeral: true
                });
            }
    
            return await interaction.reply({
                embeds: [
                    new EmbedBuilder()
                    .setTitle(config.Quest_System.Quest_Embed.title)
                    .setThumbnail(config.Quest_System.Quest_Embed.thumbnail)
                    .setColor(config.Quest_System.Quest_Embed.color)
                    .setDescription(`\`\`\`${discount === 0 ? "No Discount" : discount + "% Applied"}\`\`\`\n**Quests:**\n${fullQuestName.join('\n').replace(/(^\w{1})|(\s+\w{1})/g, letter => letter.toUpperCase())}\n\n${config.Quest_System.Quest_Embed.gold_icon} **${totalGoldCost}M**ㅤㅤ${config.Quest_System.Quest_Embed.money_icon} **${questCost.toFixed(2)}$**`)
                    .setFooter({text: config.Quest_System.Quest_Embed.footer.text, iconURL: config.Quest_System.Quest_Embed.footer.iconURL})
                    .setTimestamp()
                ]
            });
        }
    }
}

/*

Code used in this script has been written by PGTechnologies™
This project has been licensed through PGTechnologies™, you are NOT permitted to take credit for this project.
Require assistance with scripts? Join the discord and get help right away! - https://discord.gg/xQFFRzhJu2
Original Developer - PGamingHD#0666

*/