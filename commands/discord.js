const config = require('../config.json');
const fetch = require('node-fetch');
const { MessageEmbed, Util } = require('discord.js');
const { performance } = require('perf_hooks');
const { JSDOM } = require("jsdom");
const { window } = new JSDOM();

let totalPages = 0;
let currentPage = 0;

const sleep = ms => new Promise(r => setTimeout(r, ms));

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
    let SeatList = [];
    for (let i = currentPage; i <= totalPages; i++) {
        const response = await fetch(`https://auth.busaesi.space/api/v2/users?page=${i}`, options);

        console.log(`https://auth.busaesi.space/api/v2/users?page=${i}`)
        const json = await response.json();
        // loop through json.data.main_character_id to find id
        for (let j = 0; j < json.data.length; j++) {
            try{
                // get json.name and push to seat list
                SeatList.push(json.data[j].name);
			} catch (e) {
                console.log(e);
                continue;
            }
        }
    }
    return SeatList;

}

module.exports = {
	id: 'discord',
	exec: (call) => {
        const start = window.performance.now();
        // check if users has role director
        if (call.message.member.roles.cache.find(r => r.name === 'Director')) {
            // list all users with role director from discord
            // call.message.guild.id

            
            call.message.guild.members.fetch()
            .then(m => {
                // loop through m and get nicknames
                let nicknames = [];
                m.forEach(member => {
                    // check if not bot
                    if (!member.user.bot) {
                        nicknames.push(member.nickname);
                    }
                });


                // call getFromSeat() to get all users from seat
                getFromSeat()
                .then(seat => {
                    let names = "";
                    // compare seat and nicknames and check which is not in nicknames and append name to names
                    call.message.channel.send('**People not in discord:**');
                    for (let i = 0; i < seat.length; i++) {
                        if (!nicknames.includes(seat[i])) {
                            names += seat[i] + "\n";
                        }
                    }
                    const messageChunks = Util.splitMessage(names, {
                       names: 2000,
                       char: '\n'
                    });
              
                    messageChunks.forEach(async chunk => {
                       await call.message.channel.send(chunk);
                    });
                });
            })
            .catch(console.error);

            
        } else{
            call.message.channel.send('You do not have the required role to do this.\nYou must have the role `Director`.');
            return;
        }
	}
};
