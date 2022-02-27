const fetch = require('node-fetch');
const request = require('request');
const { MessageEmbed } = require('discord.js');
const { channel } = require('diagnostics_channel');
const config = require("../config.json");


let totalPages = 0;
let currentPage = 0;
var alts = "";

function stepError(n) {
    throw(n);
}

async function getCharacterName (id) {
    const response = await fetch('https://esi.evetech.net/latest/characters/'+id+'/?datasource=tranquility');
    const json = await response.json();
    return json.name;
}

async function getCharacterID (name) {
    const response = await fetch('https://esi.evetech.net/latest/search/?categories=character&datasource=tranquility&language=en&search='+encodeURI(name)+'&strict=true');
    const json = await response.json();
    return json.character[0];
}


async function getTotalPages () {
    const options = {
        headers: {
            'User-Agent': 'application\json',
            'X-Token': config.seat_token,
        }
    };
    const response = await fetch('https://auth.busaesi.space/api/v2/users', options);

    const json = await response.json();

    totalPages = json.meta.last_page;
    currentPage = json.meta.current_page;

    return;
}


async function getFromSeat (id) {
    await getTotalPages();
    const options = {
        headers: {
            'User-Agent': 'application\json',
            'X-Token': config.seat_token,
        }
    };

    // loop through current_page to last_page
    loop1:
    for (let i = currentPage; i <= totalPages; i++) {
        const response = await fetch(`https://auth.busaesi.space/api/v2/users?page=${i}`, options);

        console.log(`https://auth.busaesi.space/api/v2/users?page=${i}`)
        const json = await response.json();
        // loop through json.data.main_character_id to find id
        for (let j = 0; j < json.data.length; j++) {
            if (json.data[j].main_character_id == id) {
                console.log(json.data[j]);
                return json.data[j];
                break loop1;
            }
            else if (json.data[j].associated_character_ids.length > 0){
                for (let k = 0; k < json.data[j].associated_character_ids.length; k++) {
                    if (json.data[j].associated_character_ids[k] == id) {
                        return json.data[j];
                        break loop1;
                    }
                }
            }
        }
    }
    return null;

}


module.exports = {
	id: 'alt',
	exec: (call) => {
        let channellookup = false;
        let channelID = 0;
        if (call.message.member.roles.cache.find(r => r.name === 'Director') || call.message.member.roles.cache.find(r => r.name === 'Management') || call.message.member.roles.cache.find(r => r.name === 'SeAT Admin')) {
            // check if channel "lookup" exists
            if (call.message.guild.channels.cache.find(channel => channel.name === 'lookup')) {
                // get channel id of "lookup"
                channelID = call.message.guild.channels.cache.find(channel => channel.name === 'lookup').id;
                channellookup = true
                console.log(channelID);
            }
            if(channellookup) {
                const name = call.args.join(' ');
                let characterID = getCharacterID(name);
                call.message.guild.channels.cache.get(channelID).send(`Searching for **${name}** ...\n\`\`\`\Requsted by ${call.message.author.username}\`\`\`\ `);
                characterID
                .then(result => getFromSeat(result), stepError)
                .then(res => {
                    // delete the message the bot sent

                    console.log(res);
                    if(res == null) {
                        call.message.guild.channels.cache.get(channelID).send('Cant Find Character in Seat');
                    }

                    // inside a command, event listener, etc.
                    const embed = new MessageEmbed()
                        .setColor('#0099ff')
                        .setTitle(`${res.name}'s Look Up`)
                        .setURL(`https://auth.busaesi.space/characters/${res.main_character_id}/sheet`)
                        .setThumbnail(`https://images.evetech.net/characters/${res.main_character_id}/portrait?size=512`)
                        .setTimestamp(Date.now())
                        .setFooter({ text: 'Pulled From SeAT' });

                        // loop through res.associated_character_ids to get all id's
                        console.log(res.associated_character_ids);

                        const promises = [embed];
                        for (let i = 0; i < res.associated_character_ids.length; i++) {
                            promises.push(getCharacterName(res.associated_character_ids[i]));
                        }

                        return Promise.all(promises);

                })
                .then((arr) => {

                    let embed = arr.shift();

                    var text = "";
                    for(let i = 0; i < arr.length; i++) {
                        text += arr[i] + '\n';
                    }

                    embed.addField('Alts', text);

                    // check message length
                    if (embed.length > 1024) {
                        call.message.guild.channels.cache.get(channelID).send(`${res.name}'s Look Up\n${text}`)
                    }


                    call.message.guild.channels.cache.get(channelID).send({ embeds: [embed] });

                })
                .catch(err => {
                    console.log(err);
                });

            } else {
                call.message.channel.send("Channel lookup does not exist");
            }

        } else {
            call.message.channel.send('You do not have the required role to do this.\nYou must have the role `Director`.');
            return;
        }
	}
};
