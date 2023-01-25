const FlakeId = require("flakeid");
const flake = new FlakeId({
    mid: 45, //optional, define machine id
    timeOffset: (2023 - 1970) * 31536000 * 1000 //optional, define a offset time
});

module.exports.generateSnowflake = generateSnowflake;
module.exports.stringTemplateParser = stringTemplateParser;

function stringTemplateParser(expression, valueObj) {
    const templateMatcher = /{\s?([^{}\s]*)\s?}/g;
    let text = expression.replace(templateMatcher, (substring, value, index) => {
        value = valueObj[value];
        return value;
    });
    return text
}

function generateSnowflake() {
    return flake.gen();
}

/*

Code used in this script has been written by PGTechnologies™
This project has been licensed through PGTechnologies™, you are NOT permitted to take credit for this project.
Require assistance with scripts? Join the discord and get help right away! - https://discord.gg/xQFFRzhJu2
Original Developer - PGamingHD#0666

*/