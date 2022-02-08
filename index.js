const { Client, Intents, DiscordAPIError, Collection, MessageEmbed, TextChannel } = require("discord.js");
const handler = require('d.js-command-handler');
const config = require("./config.json");
const fs = require("fs");
const WebSocket = require('ws');
const request = require('request');

const ws = new WebSocket("wss://zkillboard.com/websocket/");

const client = new Client({
    intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES]
});

function isset (accessor) {
    try {
      // Note we're seeing if the returned value of our function is not
      // undefined or null
      return accessor() !== undefined && accessor() !== null
    } catch (e) {
      // And we're able to catch the Error it would normally throw for
      // referencing a property of undefined
      return false
    }
  }


handler(__dirname + '/commands', client, { customPrefix: config.prefix });

client.on('ready', () => {
	console.log(client.user.username + ' has successfully booted up.');
    client.user.setActivity('KRABBING', { type: 'PLAYING' });
});

ws.on('error', (error) => {
    hook.error(' ', 'Web Socket Client Error', error);
    console.error(error);
})

ws.on('open', function open() {
    ws.send(JSON.stringify({"action":"sub","channel":"killstream"}));
    console.log("Web Socket Client Connected");
});

// check if the config.feeder_channel isnt empty


if (config.feeder_channel) {
    
    ws.on('message', function incoming(data) {
        // parse incoming message
        let message = JSON.parse(data);
        // reload config file
        let config = require("./config.json");

        function numberWithCommas(x){
            return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
        }

        // `totalValue: 26721546.59,`
        // add commas 
        // format message.zkb.totalValue to have commas every 3 digits
        let totalISK = numberWithCommas(message.zkb.totalValue);
        let sent = false;
        let AlreadySent = false;
        let NoBUSAAttacker = false;
        // check if killmail.attackers has corporation_id set
        if (message.attackers.length > 0 && message.attackers[0].corporation_id) {
            // loop through killmail.attackers and check if .corporation_id is 555
            for (let i = 0; i < message.attackers.length; i++) {
                // check if sent is false
                if (sent === false) {
                                                        //  corp id                                     corp id
                    if (message.attackers[i].corporation_id == 2014367342 && message.victim.corporation_id !== 2014367342) {
                        console.log("found BUSA")
                        // check if attrackers[i] only has 1 index
                        if (message.attackers.length == 1) {
                            if(config.show_pods !== true){
                                if(message.victim.ship_type_id == 670){
                                    break;
                                }
                            }
                            console.log("is a solo km");
                            request("https://esi.evetech.net/latest/characters/"+message.attackers[i].character_id+"/?datasource=tranquility", function (error, response, body) {
                                // check if error is null
                                if (!error && response.statusCode == 200) {
                                    // parse response
                                    let character = JSON.parse(body);
                                    // request to get 'https://esi.evetech.net/latest/universe/types/623/?datasource=tranquility&language=en' and get name from response
                                    request("https://esi.evetech.net/latest/universe/types/"+message.victim.ship_type_id+"/?datasource=tranquility&language=en", function (error, response, body) {
                                        let ship = JSON.parse(body);
                                        request("https://esi.evetech.net/latest/universe/types/"+message.attackers[i].ship_type_id+"/?datasource=tranquility&language=en", function (error, response, body) {

                                            // build embed
                                            let AttackerShip = JSON.parse(body);

                                            const SOLOEmbed = new MessageEmbed()
                                            .setColor('#F1C40F')
                                            .setTitle('SOLO KILL')
                                            .setURL(message.zkb.url)
                                            .setDescription(`${character.name} has killed a ${ship.name} in a ${AttackerShip.name}`)
                                            .setThumbnail('https://images.evetech.net/types/'+message.victim.ship_type_id+'/render?size=128')
                                            .addFields(
                                                { name: 'Value', value: totalISK+' ISK' }
                                            )
                                            .setTimestamp(Date.now())
                                            .setFooter({ text: 'Steaming From Zkillboard'});


                                            console.log(`${character.name} got a ${ship.name}`);

                                            // get feeder_channel from config.json
                                            let channel = client.channels.cache.get(config.feeder_channel);
                                            channel.send({ embeds: [SOLOEmbed] });
                                                
                                            sent = true;
                                        });
                                    });
                                }
                            });

                            AlreadySent == true;
                            break;
                        } else{
                            console.log("is not a solo km");
                        }
                        // check if zkb.totalValue is greater than 1000000000
                        if (message.zkb.totalValue > config.kill_limit && AlreadySent == false) {
                            if(config.show_pods !== true){
                                if(message.victim.ship_type_id == 670){
                                    break;
                                }
                            }
                            console.log("is a gang km");
                            // request json from "https://esi.evetech.net/latest/characters/96834527/?datasource=tranquility" and get name from response
                            request("https://esi.evetech.net/latest/characters/"+message.attackers[i].character_id+"/?datasource=tranquility", function (error, response, body) {
                                // check if error is null
                                if (!error && response.statusCode == 200) {
                                    // parse response
                                    let character = JSON.parse(body);
                                    // request to get 'https://esi.evetech.net/latest/universe/types/623/?datasource=tranquility&language=en' and get name from response
                                    request("https://esi.evetech.net/latest/universe/types/"+message.victim.ship_type_id+"/?datasource=tranquility&language=en", function (error, response, body) {
                                        let ship = JSON.parse(body);
                                        request("https://esi.evetech.net/latest/universe/types/"+message.attackers[i].ship_type_id+"/?datasource=tranquility&language=en", function (error, response, body) {

                                            const GangEmbed = new MessageEmbed()
                                            .setColor('#2ECC71')
                                            .setTitle('GANG BANGED')
                                            .setURL(message.zkb.url)
                                            .setDescription(`${character.name} got on a ${ship.name} in a ${AttackerShip.name}`)
                                            .setThumbnail('https://images.evetech.net/types/'+message.victim.ship_type_id+'/render?size=128')
                                            .addFields(
                                                { name: 'Value', value: totalISK+' ISK' }
                                            )
                                            .setTimestamp(Date.now())
                                            .setFooter({ text: 'Steaming From Zkillboard'});


                                            console.log(`${character.name} got a ${ship.name}`);

                                            // get feeder_channel from config.json
                                            let channel = client.channels.cache.get(config.feeder_channel);
                                            channel.send({ embeds: [GangEmbed] });

                                            console.log(`${character.name} got on a ${ship.name}`);

                                            sent = true;
                                        });
                                    });
                                }
                            });
                            break;

                        } else {
                            console.log("not over", config.kill_limit);
                        }
                
                    } else{
                        console.log("not BUSA");
                        NoBUSAAttacker = true;
                        break;
                    }
                }
            }
        } 

        //                                     corp id
        if (message.victim.corporation_id == 2014367342 && NoBUSAAttacker == true) {
                if(config.show_pods !== true){
                    if(message.victim.ship_type_id == 670){
                        return;
                    }
                }
                // check if zkb.totalValue is greater than 500000000 
                if (message.zkb.totalValue > config.loss_limit ) {
                    // request json from "https://esi.evetech.net/latest/characters/96834527/?datasource=tranquility" and get name from response
                        request("https://esi.evetech.net/latest/characters/"+message.victim.character_id+"/?datasource=tranquility", function (error, response, body) {
                            // check if error is null
                            if (!error && response.statusCode == 200) {
                                // parse response
                                let character = JSON.parse(body);
                                // request to get 'https://esi.evetech.net/latest/universe/types/623/?datasource=tranquility&language=en' and get name from response
                                request("https://esi.evetech.net/latest/universe/types/"+message.victim.ship_type_id+"/?datasource=tranquility&language=en", function (error, response, body) {
                                    let ship = JSON.parse(body);
    
                                    const FeederEmbed = new MessageEmbed()
                                    .setColor('#ED4245')
                                    .setTitle('FEEDER ALERT')
                                    .setURL(message.zkb.url)
                                    .setDescription(`${character.name} has lost a ${ship.name}`)
                                    .setThumbnail('https://images.evetech.net/types/'+message.victim.ship_type_id+'/render?size=128')
                                    .addFields(
                                        { name: 'Value', value: totalISK+' ISK' }
                                    )
                                    .setTimestamp(Date.now())
                                    .setFooter({ text: 'Steaming From Zkillboard'});
    
    
                                    console.log(`${character.name} got a ${ship.name}`);
    
                                    // get feeder_channel from config.json
                                    let channel = client.channels.cache.get(config.feeder_channel);
                                    channel.send({ embeds: [FeederEmbed] });
    
                                    console.log(`${character.name} fed a ${ship.name}`);
                                });
                            }
                        });
                } else {
                    console.log("Not Over", config.loss_limit);
                }
        }

    });
}

client.login(config.token);