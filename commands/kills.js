const fetch = require('node-fetch');
const { MessageEmbed } = require('discord.js');

var kills = "";
let SevenDays = 0;

function isEmpty(obj) {
    return Object.keys(obj).length === 0;
}

async function getCharacterID (name) {
    const response = await fetch('https://esi.evetech.net/latest/search/?categories=character&datasource=tranquility&language=en&search='+encodeURI(name)+'&strict=false');
    const json = await response.json();
    return json.character[0];
}

async function getCharacterKills (id) {
    // get current month as number
    let month = new Date().getMonth() + 1;

    // make sure month is two digits
    if (month < 10) {
        month = '0' + month;
    }

    const response = await fetch('https://zkillboard.com/api/stats/characterID/'+id+'/', {
        headers: {
            'User-Agent': 'Helious Jin-Mei'
        }
    });
    const json = await response.json();
    kills = json;
    return;
}

module.exports = {
	id: 'kills',
	exec: (call) => {
        // setting up variables
        const name = call.args.join(' ');
        let characterID = getCharacterID(name);

        let isEmpty = (val) => {
            let typeOfVal = typeof val;
            switch(typeOfVal){
                case 'object':
                    return (val.length == 0) || !Object.keys(val).length;
                    break;
                case 'string':
                    let str = val.trim();
                    return str == '' || str == undefined;
                    break;
                case 'number':
                    return val == '';
                    break;
                default:
                    return val == '' || val == undefined;
            }
        };

        characterID.then(data => { 
            getCharacterKills(data).then(data => { 
                // check if kills.activepvp is undefined or null
                if(!isEmpty(kills.activepvp)) {
                    SevenDays = kills.activepvp.kills.count;
                } else {
                    SevenDays = 0;
                }
                let killIndex = [];
                
                // loop throught activity from 0 - 7
                for (let i = 0; i < 7; i++) {
                    for(var key in kills.activity[i]){
                        var value = kills.activity[i][key];
                        killIndex.push(value);
                    }
                }


                let total = 0;
                for (let i = 0; i < killIndex.length; i++) {
                    // get all indexs from killIndex and add them together
                    total += killIndex[i];
                }

                // create embed
                const embed = new MessageEmbed()
                    .setColor('#0099ff')
                    .setTitle(name + '\'s ')
                    .setThumbnail('https://images.evetech.net/characters/'+kills.info.id+'/portrait?size=512')
                    .setDescription('Kills in the last 7 days: ' + SevenDays + '\n 90 Day Total Kills: ' + total)
                    .setTimestamp(Date.now())
                    .setFooter({ text: 'BUSA Bot'});
            
                call.message.channel.send({ embeds: [embed] });
            }); 
        });

	}
};