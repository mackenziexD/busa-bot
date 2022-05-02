const config = require('../config.json');
const fetch = require('node-fetch');
const { MessageEmbed } = require('discord.js');
const { performance } = require('perf_hooks');
const { JSDOM } = require("jsdom");
const { window } = new JSDOM();
const schedule = require('node-schedule');
const fsPromises = require('fs').promises;
const fs = require('fs');

let totalPages = 0;
let currentPage = 0;

const sleep = ms => new Promise(r => setTimeout(r, ms));

async function getCharacterName (id) {
    const response = await fetch('https://esi.evetech.net/latest/characters/'+id+'/?datasource=tranquility');
    const json = await response.json();
    // check if json.corporation_id = 2014367342
    if (json.corporation_id == 2014367342) {
        return json.name;
    }else{
        return null;
    }
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

async function getCharacter90DayKills (id) {
    // get current month as number
    let month = new Date().getMonth() + 1;

    // make sure month is two digits
    if (month < 10) {
        month = '0' + month;
    }
    console.log(`https://zkillboard.com/api/stats/characterID/${id}/`)

    const response = await fetch('https://zkillboard.com/api/stats/characterID/'+id+'/', {
        headers: {
            'User-Agent': 'Helious Jin-Mei',
            'Content-Type': 'application/json'
        }
    });
    const json = await response.json();

	let total = 0;
	for(var day in json.activity) {
		// Activity object contains a max and a days key, skip over them
		if(day == "max" || day == "days") {
			continue;
		}

		for(var hour in json.activity[day]) {
			total += json.activity[day][hour]
		}
	}

    return total;
}

async function getFromSeat () {
    await getTotalPages();
    const options = {
        headers: {
            'User-Agent': 'application\json',
            'X-Token': config.seat_token,
        }
    };

    // loop through current_page to last_page
    let ToBePurged = [];
    for (let i = currentPage; i <= totalPages; i++) {
        const response = await fetch(`https://auth.busaesi.space/api/v2/users?page=${i}`, options);

        console.log(`https://auth.busaesi.space/api/v2/users?page=${i}`)
        const json = await response.json();
        // loop through json.data.main_character_id to find id
        for (let j = 0; j < json.data.length; j++) {
            try{
                await sleep(1000); // Sleep for 1 second because squizz rate limit bs
				let total = 0;
				// Loop through alts
				for (let k = 0; k < json.data[j].associated_character_ids.length; k++) {
                    total += await getCharacter90DayKills(json.data[j].associated_character_ids[k]);
                    await sleep(1000); // Sleep for 1 second because squizz rate limit bs
                }

                // Get Kills for Main
                total += await getCharacter90DayKills(json.data[j].main_character_id);

                // check if current total is less than 30
                if (total < 30) {
                    // push main_character_id to array
                    ToBePurged.push(json.data[j].main_character_id);
                }
			} catch (e) {
                console.log(e);
                continue;
            }
        }
    }
    return ToBePurged;

}

// create purge list every day at 12:00 AM and store in purge.json
async function purge () {
    const ToBePurged = await getFromSeat();
    return ToBePurged;
}

schedule.scheduleJob('0 0 * * *', () => {
    purge().then(ToBePurged => {
        fs.writeFileSync('purge.json', JSON.stringify(ToBePurged));
    });
})

const func = async filenames => {
    for(let fn of filenames) {
      let data = await fsPromises.readFile(fn)
      return data.toString('utf-8');
    }
}

module.exports = {
	id: 'purge',
	exec: (call) => {
        const start = window.performance.now();
        // check if users has role director
        if (call.message.member.roles.cache.find(r => r.name === 'Director') || call.message.member.roles.cache.find(r => r.name === 'Management')) {
            call.message.channel.send('Getting Purge List,\nThis list gets created every day at 00:00 EVE TIME: <http://time.nakamura-labs.com/?#1640995200>');

            
            // call getFromSeat then console.log the result
            func(['purge.json']).then(res => {

                    // inside a command, event listener, etc.
                const embed = new MessageEmbed()
                    .setColor('#0099ff')
                    .setTitle(`Purge List`)
                    .setDescription(`list of mains that accross all characters have  less than 30 kills in 90 days`)
                    .setTimestamp(Date.now())


                const promises = [embed];

                let dataArray = JSON.parse(res);

                // loop through purge.json
                for (let i = 0; i < dataArray.length; i++) {
                    // get character name
                    promises.push(getCharacterName(dataArray[i]));
                }

                return Promise.all(promises);

            })
            .then((arr) => {

                let embed = arr.shift();

                var text = "";
                var PurgeList = 0;
                for(let i = 0; i < arr.length; i++) {
                    // if arr.length is less than 10, add a space
                    // check if arr[i] is not null
                    if (arr[i] !== null) {
                        text += arr[i] + '\n';
                        PurgeList++;
                    }
                }

                if (PurgeList = 0) {
                    text = '\n';
                    embed.addField('No One To Purge', text);
                } else {
                    embed.addField('Mains', text);
                }

                // check message length
                if (embed.length > 1024) {
                    call.message.send(`Purge List \n${text}`)
                }

                const stop = window.performance.now();
                const timeUnformatted = (stop - start)/1000;
                const seconds = timeUnformatted.toFixed(2);
                // convert seconds to minutes
                const minutes = seconds/60;
                embed.setFooter({ text: `${minutes.toFixed(2)} minutes to create` });
                call.message.channel.send({ embeds: [embed] });
                console.log(`Time Taken to execute = ${(stop - start)/1000} seconds`);
            })
            .catch(err => {
                console.log(err);
            });

        } else{
            call.message.channel.send('You do not have the required role to do this.\nYou must have the role `Director`.');
            return;
        }
	}
};
