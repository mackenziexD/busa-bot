const config = require('../config.json');
const fetch = require('node-fetch');
const { MessageEmbed, Util } = require('discord.js');
const { performance } = require('perf_hooks');
const { JSDOM } = require("jsdom");
const { window } = new JSDOM();
const request = require('request');

let totalPages = 0;
let currentPage = 0;

const sleep = ms => new Promise(r => setTimeout(r, ms));

function getDiff (a1, a2) {

    var a = [], diff = [];

    for (var i = 0; i < a1.length; i++) {
        a[a1[i]] = true;
    }

    for (var i = 0; i < a2.length; i++) {
        if (a[a2[i]]) {
            delete a[a2[i]];
        } else {
            a[a2[i]] = true;
        }
    }

    for (var k in a) {
        diff.push(k);
    }

    return diff;
}

function getMatch(a, b) {
    var matches = [];

    for ( var i = 0; i < a.length; i++ ) {
        for ( var e = 0; e < b.length; e++ ) {
            if ( a[i] === b[e] ) matches.push( a[i] );
        }
    }
    return matches;
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
        if (call.message.member.roles.cache.find(r => r.name === 'Director') || call.message.member.roles.cache.find(r => r.name === 'Management') || call.message.member.roles.cache.find(r => r.name === 'SeAT Admin')) {
            // call.message.guild.id

            
            call.message.guild.members.fetch()
            .then(m => {
                // loop through m and get nicknames
                let nicknames = [];
                // check if member has role 'BUSA'
                m.forEach(member => {
                    if (member.roles.cache.find(r => r.name === 'BUSA') && !member.user.bot) {
                        nicknames.push(member.nickname ?? member.user.username);
                    }
                });

                console.log(nicknames);


                // call getFromSeat() to get all users from seat
                getFromSeat()
                .then(seat => {
                    let names = [];
                    let names2 = [];
                    // compare seat and nicknames and check which is not in nicknames and append name to names
                        request(`https://evewho.com/api/corplist/2014367342/`, (error, response, body) => {
                            if (error) {
                                console.log(error);
                            }
                            let json = JSON.parse(body);

                            const characters = json.characters;
                            // loop through characters and get names
                            for (let i = 0; i < characters.length; i++) {
                                names.push(characters[i].name);
                            }
                            getMatch(names, seat).forEach(name => {
                                names2.push(name);
                            });
                            // loop through seat
                            let diff = getDiff(nicknames, names2);
                            let text = '';
                            diff.forEach(name => {
                                text += `${name}\n`;
                            });
                            call.message.channel.send(`**People not in discord:**\n${text}`);

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
