var fetch = require('node-fetch');
var sleep = require('sleep');
const { MessageEmbed } = require('discord.js');
const { get } = require('request');

let hash = 0;
let killid = 0;


async function getCharacterInfo (id) {
    const response = await fetch('https://esi.evetech.net/latest/characters/'+id+'/?datasource=tranquility', {headers: {'Content-Type': 'application/json', 'User-Agent': 'Helious Jin-Mei'}});
    const json = await response.json();
    return json;
}

async function getKillmailStats (derp) {
    await getZkill(derp);
    console.log(`https://esi.evetech.net/latest/killmails/${killid}/${hash}/?datasource=tranquility`);
    const response = await fetch(`https://esi.evetech.net/latest/killmails/${killid}/${hash}/?datasource=tranquility`, {headers: {'Content-Type': 'application/json', 'User-Agent': 'Helious Jin-Mei'}});
    const json = await response.json();
    return json;
}

async function getZkill (id) {
    sleep.sleep(1);
    const response = await fetch(`https://zkillboard.com/api/kills/characterID/${id}/`, {headers: {'Content-Type': 'application/json', 'User-Agent': 'Helious Jin-Mei'}});
    const json = await response.json();
    // loop through json 
    for (let i = 0; i < json.length; i++) {
        // get 1st killmail
        if (i === 0) {
            hash = json[i].zkb.hash;
            killid = json[i].killmail_id;
        }
    }
}

async function getAllianceName (id) {
    const response = await fetch(`https://esi.evetech.net/latest/alliances/${id}/?datasource=tranquility`, {headers: {'Content-Type': 'application/json', 'User-Agent': 'Helious Jin-Mei'}});
    const json = await response.json();
    return json;
}

async function getCorpName (id) {
    const response = await fetch(`https://esi.evetech.net/latest/corporations/${id}/?datasource=tranquility`, {headers: {'Content-Type': 'application/json', 'User-Agent': 'Helious Jin-Mei'}});
    const json = await response.json();
    return json;
}

async function getTimeInCorp (id) {
    const response = await fetch(`https://esi.evetech.net/latest/characters/${id}/corporationhistory/?datasource=tranquility`, {headers: {'Content-Type': 'application/json', 'User-Agent': 'Helious Jin-Mei'}});
    const json = await response.json();
    return json;
}

async function getZkillStats (id) {
    sleep.sleep(1);
    const response = await fetch(`https://zkillboard.com/api/stats/characterID/${id}/`, {headers: {'Content-Type': 'application/json', 'User-Agent': 'Helious Jin-Mei'}});
    const json = await response.json();
    return json;
}

async function getCharacterID (name) {
    const response = await fetch('https://esi.evetech.net/latest/search/?categories=character&datasource=tranquility&language=en&search='+encodeURI(name)+'&strict=true', {headers: {'Content-Type': 'application/json', 'User-Agent': 'Helious Jin-Mei'}});
    const json = await response.json();
    return json.character[0];
}

function joinedDate(startingDate, endingDate) {
    var startDate = new Date(new Date(startingDate).toISOString().substr(0, 10));
    if (!endingDate) {
        endingDate = new Date().toISOString().substr(0, 10);    // need date in YYYY-MM-DD format
    }
    var endDate = new Date(endingDate);
    if (startDate > endDate) {
        var swap = startDate;
        startDate = endDate;
        endDate = swap;
    }
    var startYear = startDate.getFullYear();
    var february = (startYear % 4 === 0 && startYear % 100 !== 0) || startYear % 400 === 0 ? 29 : 28;
    var daysInMonth = [31, february, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

    var yearDiff = endDate.getFullYear() - startYear;
    var monthDiff = endDate.getMonth() - startDate.getMonth();
    if (monthDiff < 0) {
        yearDiff--;
        monthDiff += 12;
    }
    var dayDiff = endDate.getDate() - startDate.getDate();
    if (dayDiff < 0) {
        if (monthDiff > 0) {
            monthDiff--;
        } else {
            yearDiff--;
            monthDiff = 11;
        }
        dayDiff += daysInMonth[startDate.getMonth()];
    }

    let string = "";
    if (yearDiff > 0) {
        string += yearDiff + " year" + (yearDiff > 1 ? "s" : "") + ", ";
    }
    if (monthDiff > 0) {
        string += monthDiff + " month" + (monthDiff > 1 ? "s" : "") + ", ";
    }
    if (dayDiff > 0) {
        string += dayDiff + " day" + (dayDiff > 1 ? "s" : "");
    }
    return string;
}


function dateDiff(startingDate, endingDate) {
    var startDate = new Date(new Date(startingDate).toISOString().substr(0, 10));
    if (!endingDate) {
        endingDate = new Date().toISOString().substr(0, 10);    // need date in YYYY-MM-DD format
    }
    var endDate = new Date(endingDate);
    if (startDate > endDate) {
        var swap = startDate;
        startDate = endDate;
        endDate = swap;
    }
    var startYear = startDate.getFullYear();
    var february = (startYear % 4 === 0 && startYear % 100 !== 0) || startYear % 400 === 0 ? 29 : 28;
    var daysInMonth = [31, february, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

    var yearDiff = endDate.getFullYear() - startYear;
    var monthDiff = endDate.getMonth() - startDate.getMonth();
    if (monthDiff < 0) {
        yearDiff--;
        monthDiff += 12;
    }
    var dayDiff = endDate.getDate() - startDate.getDate();
    if (dayDiff < 0) {
        if (monthDiff > 0) {
            monthDiff--;
        } else {
            yearDiff--;
            monthDiff = 11;
        }
        dayDiff += daysInMonth[startDate.getMonth()];
    }

    return yearDiff + ' year ago';
}

module.exports = {
	id: 'who',
	exec: (call) => {
        // get all args from call
        const name = call.args.join(' ');

        getCharacterID(name).then(function(id) {

            let Charid = id;

            getCharacterInfo(Charid).then(function(info) {
                let name = info.name;

                // set info.security_status to 2 decimal places
                let sec_status = info.security_status.toFixed(2);

                // "birthday": "2013-12-21T16:36:54Z",
                // remove everything after T from birthday
                let birthday = info.birthday.substring(0, info.birthday.indexOf('T'));
                // split DOB into month, date and year
                let doblong = birthday.split('-');
                let month = doblong[1];
                let date = doblong[2];
                let year = doblong[0];

                // get month name from number
                let monthName = new Date(year, month - 1).toLocaleString('default', { month: 'long' });

                // get only 1st 3 letters of month name
                let monthNameShort = monthName.substring(0, 3);

                var dob = new Date(info.birthday);
                var now = new Date();

                var age = dateDiff(dob, now);
                var None = "None";
                // create embed
                const embed = new MessageEmbed()
                .setColor('#0099ff')
                .setTitle(`${name}`)
                .setURL(`https://zkillboard.com/character/${Charid}/`)
                .setThumbnail(`https://images.evetech.net/characters/${Charid}/portrait?size=512`)
                .addField('Birthday', `${monthNameShort} ${date}, ${year}\n(${age})`, true)
                .addField('Security Status', `${sec_status}`, true)
                .setTimestamp(Date.now())
                .setFooter({ text: 'BUSA Bot'});
                
                        getCorpName(info.corporation_id).then(res => {
                            const promises = [];
                            promises.push(res);
                            return Promise.all(promises);
                        })
                        .then(function(res) {
                            getAllianceName(info.alliance_id).then(res => {
                                const promises = [];
                                promises.push(res);
                                return Promise.all(promises);
                            })
                            .then(function(res2) {
                                getZkillStats(Charid).then(res => {
                                    const promises = [];
                                    promises.push(res);
                                    return Promise.all(promises);
                                })
                                .then(function(res3) {
                                    getKillmailStats(Charid).then(res => {
                                        const promises = [];
                                        promises.push(res);
                                        return Promise.all(promises);
                                    })
                                    .then(function(res4) {
                                        getTimeInCorp(Charid).then(res => {
                                            const promises = [];
                                            promises.push(res);
                                            return Promise.all(promises);
                                        })
                                        .then(function(res5) {

                                            if(typeof res3[0].shipsDestroyed === 'undefined') {
                                                var shipsDestroyed = 0;
                                                var shipsLost = 0;
                                            } else {
                                                var shipsDestroyed = res3[0].shipsDestroyed;
                                                var shipsLost = res3[0].shipsLost;
                                            }

                                            let now = new Date();
                                            let joined = new Date(res5[0][0].start_date);

                                            embed.addField('Corporation', `${res[0].name}\n(${joinedDate(joined, now)})`, true)
                                            embed.addField('Alliance', `${res2[0].name ?? None}`, true);
                                            embed.addField('Kills / Losses', `${shipsDestroyed}/${shipsLost}`, true);
                                            // 2022-02-19T02:24:41Z
                                            // get res4[0].killmail_time and work out the time difference
                                            let then = new Date(res4[0].killmail_time);

                                            let timeDiff = dateDiff(then, now);
                                            let days = "";

                                            if(timeDiff.days > 0) {
                                                days = `${timeDiff.days} days`;
                                            } else if (res4[0].error) {
                                                days += "No killmails found";
                                            } else {
                                                days += "Today";
                                            }

                                            embed.addField('Last killboard activity', `${days}`, true);

                                            call.message.channel.send({ embeds: [embed] });
                                        });
                                    });
                                }).catch(function(err) {
                                    console.log(err);
                                    embed.addField('Alliance', `None`, true);
                                    embed.addField('Kills / Losses', `0/0`, true);
                                    embed.addField('Last killboard activity', `No killboard activity`, true);

                                    // work out when last kill was  
                                    call.message.channel.send({ embeds: [embed] });
                                });
                        });
                    });      
                
            });
        });
	}
};