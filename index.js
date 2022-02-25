const { Client, Intents, DiscordAPIError, Collection, MessageEmbed, TextChannel } = require("discord.js");
const handler = require('d.js-command-handler');
const config = require("./config.json");
const fs = require("fs");
const WebSocket = require('ws');
const request = require('request');


const client = new Client({
    intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES, Intents.FLAGS.GUILD_MEMBERS]
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

client.on('messageCreate', async message => {
    // check if message contains "good bot"
    if (message.content.toLowerCase().includes("good bot")) {
        // create a random number between 1 and 5
        let emoji = "";
        const random = Math.floor(Math.random() * 5) + 1;
        // if random is 1, call good emoji
        switch (random) {
            case 1:
                emoji = ":smile:";
                break;
            case 2:
                emoji = ":smiley:";
                break;
            case 3:
                emoji = ":grinning:";
                break;
            case 4:
                emoji = ":grin:";
                break;
            case 5:
                emoji = ":smirk:";
                break;
            default:
                emoji = ":BUSA:";
        }

        message.channel.send(`Thank you! ${emoji}`);
    }   
});


handler(__dirname + '/commands', client, { customPrefix: config.prefix });

client.on('guildMemberAdd', member => {
    client.channels.cache.get(config.welcome).send('**' + member.user.username + '**, has joined the server!'); 
});

client.on('guildMemberRemove', member => {
    client.channels.cache.get(config.welcome).send('**' + member.user.username + '**, has left the server');
});

client.on('ready', () => {
	console.log(client.user.username + ' has successfully booted up.');
    client.user.setActivity('Space Odyssey', { type: 'PLAYING' });
    client.user.setStatus('dnd');
});


var connect = function(){
    const ws = new WebSocket("wss://zkillboard.com/websocket/");

    ws.onerror = function(err) {
        client.channels.cache.get(config.feeder_channel).send('Error: ' + err);
        console.error(err);
        ws.close();
    };

    // ws.on('close)
    ws.onclose = function(err) {
        console.log('Socket is closed. Reconnect will be attempted in 1 second.', err.reason);
        setTimeout(function() {
          connect();
        }, 1000);
    };

    ws.onopen = function() {
        ws.send(JSON.stringify({"action":"sub","channel":"killstream"}));
        console.log("Web Socket Client Connected");
    };

    // check if the config.feeder_channel isnt empty
    if (config.feeder_channel) {
        ws.onmessage = function(e) {
            // parse incoming message
            let message = JSON.parse(e.data);
            // reload config file
            let config = require("./config.json");

            function numberWithCommas(x){
                return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
            }

            // `totalValue: 26721546.59,`
            // add commas 
            // format message.zkb.totalValue to have commas every 3 digits
            let totalISK = numberWithCommas(message.zkb.totalValue);
            let WasKill = false;
            let AlreadySent = false;

            // loop through attackers
            for (let i = 0; i < message.attackers.length; i++) {
                if(AlreadySent == true ) { break; }
                if(config.show_pods == false) {  if (message.victim.ship_type_id == 670) { break; } }
                if (message.victim.ship_type_id == 60244) { break; }

                // check blue on blue
                if(message.attackers[i].corporation_id == '2014367342' && message.victim.corporation_id == '2014367342'){
                    if (message.attackers[i].character_id) {                        
                        request("https://esi.evetech.net/latest/characters/"+message.attackers[i].character_id+"/?datasource=tranquility", function (error, response, body) {
                                // check if error is null
                            if (!error && response.statusCode == 200) {
                                // parse response
                                let character = JSON.parse(body);
                                // request to get 'https://esi.evetech
                                request("https://esi.evetech.net/latest/universe/types/"+message.victim.ship_type_id+"/?datasource=tranquility&language=en", function (error, response, body) {
                                    let ship = JSON.parse(body);
                                    request("https://esi.evetech.net/latest/universe/types/"+message.attackers[i].ship_type_id+"/?datasource=tranquility&language=en", function (error, response, body) {
                                        let AttackerShip = JSON.parse(body);
                                        const embed = new MessageEmbed()
                                        .setTitle(`GET MEME'D`)
                                        .setDescription(character.name+' has killed a '+ship.name+' in a '+AttackerShip.name)
                                        .setThumbnail('https://images.evetech.net/types/'+message.victim.ship_type_id+'/render?size=128')
                                        .addField('Value', totalISK+' ISK')
                                        .setURL(message.zkb.url)
                                        .setColor('#EB459E')
                                        .setFooter('Steaming From Zkillboard')
                                        .setTimestamp(Date.now());

                                        console.log(`${character.name} killed a ${ship.name}`);

                                        client.channels.cache.get(config.feeder_channel).send({ embeds: [embed] });
                                    });
                                });
                            }
                        });
                        AlreadySent = true;
                        WasKill = true;
                    }
                    if(WasKill == true){ break;}
                }

                // check if solo kill
                if (message.zkb.solo == true && message.attackers[i].corporation_id == '2014367342' ) {
                    // if pod break loop 
                    console.log(message.zkb.url);
                    
                    if (message.zkb.totalValue > config.kill_limit) {
                        if (message.attackers[i].character_id) {                        
                            request("https://esi.evetech.net/latest/characters/"+message.attackers[i].character_id+"/?datasource=tranquility", function (error, response, body) {
                                    // check if error is null
                                if (!error && response.statusCode == 200) {
                                    // parse response
                                    let character = JSON.parse(body);
                                    // request to get 'https://esi.evetech
                                    request("https://esi.evetech.net/latest/universe/types/"+message.victim.ship_type_id+"/?datasource=tranquility&language=en", function (error, response, body) {
                                        let ship = JSON.parse(body);
                                        request("https://esi.evetech.net/latest/universe/types/"+message.attackers[i].ship_type_id+"/?datasource=tranquility&language=en", function (error, response, body) {
                                            let AttackerShip = JSON.parse(body);
                                            const embed = new MessageEmbed()
                                            .setTitle('SOLO ALERT')
                                            .setDescription(character.name+' has killed a '+ship.name+' in a '+AttackerShip.name)
                                            .setThumbnail('https://images.evetech.net/types/'+message.victim.ship_type_id+'/render?size=128')
                                            .addField('Value', totalISK+' ISK')
                                            .setURL(message.zkb.url)
                                            .setColor('#FEE75C')
                                            .setFooter('Steaming From Zkillboard')
                                            .setTimestamp(Date.now());

                                            console.log(`${character.name} killed a ${ship.name}`);

                                            client.channels.cache.get(config.feeder_channel).send({ embeds: [embed] });
                                        });
                                    });
                                }
                            });
                            AlreadySent = true;
                            WasKill = true;
                        }
                        if(WasKill == true){ break;}
                    } else { console.log(`Killmail is less than than ${config.kill_limit}ISK`);}
                }
                // check if gang kill
                else if (message.attackers[i].alliance_id && message.attackers[i].corporation_id == '2014367342' ) {
                    // if pod break loop 
                    console.log(message.zkb.url);
                    
                    if (message.zkb.totalValue > config.kill_limit) {
                        if (message.attackers[i].character_id) {                        
                            request("https://esi.evetech.net/latest/characters/"+message.attackers[i].character_id+"/?datasource=tranquility", function (error, response, body) {
                                    // check if error is null
                                if (!error && response.statusCode == 200) {
                                    // parse response
                                    let character = JSON.parse(body);
                                    // request to get 'https://esi.evetech
                                    request("https://esi.evetech.net/latest/universe/types/"+message.victim.ship_type_id+"/?datasource=tranquility&language=en", function (error, response, body) {
                                        let ship = JSON.parse(body);
                                        request("https://esi.evetech.net/latest/universe/types/"+message.attackers[i].ship_type_id+"/?datasource=tranquility&language=en", function (error, response, body) {
                                            let AttackerShip = JSON.parse(body);
                                            const embed = new MessageEmbed()
                                            .setTitle('KILL ALERT')
                                            .setDescription(character.name+' got on a '+ship.name+' in a '+AttackerShip.name)
                                            .setThumbnail('https://images.evetech.net/types/'+message.victim.ship_type_id+'/render?size=128')
                                            .addField('Value', totalISK+' ISK')
                                            .setURL(message.zkb.url)
                                            .setColor('#57F287')
                                            .setFooter('Steaming From Zkillboard')
                                            .setTimestamp(Date.now());

                                            console.log(`${character.name} killed a ${ship.name}`);

                                            client.channels.cache.get(config.feeder_channel).send({ embeds: [embed] });
                                        });
                                    });
                                }
                            });
                            AlreadySent = true;
                            WasKill = true;
                        }
                        if(WasKill == true){ break;}
                    } else { console.log(`Killmail is less than than ${config.kill_limit}ISK`);}
                }
            }

            if (message.victim.corporation_id == '2014367342') {
                // check if zkb.totalValue is greater than 500000000 
                console.log(message.zkb.url);
                if (message.zkb.totalValue > config.loss_limit) {
                    // request json from "https://esi.evetech.net/latest/characters/96834527/?datasource=tranquility" and get name from response
                    request("https://esi.evetech.net/latest/characters/"+message.victim.character_id+"/?datasource=tranquility", function (error, response, body) {
                                        // check if error is null
                                        if (!error && response.statusCode == 200) {
                                            // parse response
                                            let character = JSON.parse(body);
                                            // request to get 'https://esi.evetech.net/latest/universe/types/623/?datasource=tranquility&language=en' and get name from response
                                            request("https://esi.evetech.net/latest/universe/types/"+message.victim.ship_type_id+"/?datasource=tranquility&language=en", function (error, response, body) {
                                                let ship = JSON.parse(body);
            
                                                const embed = new MessageEmbed()
                                                .setTitle('FEEDER ALERT')
                                                .setDescription(`${character.name} has lost a ${ship.name}`)
                                                .setThumbnail('https://images.evetech.net/types/'+message.victim.ship_type_id+'/render?size=128')
                                                .addField('Value', totalISK+' ISK')
                                                .setURL(message.zkb.url)
                                                .setColor('#ED4245')
                                                .setFooter('Steaming From Zkillboard')
                                                .setTimestamp(Date.now());   
            
                                                console.log(`${character.name} fed a ${ship.name}`);
            
                                                client.channels.cache.get(config.feeder_channel).send({ embeds: [embed] });
                                                
                                            });
                                        }
                    });
                            
                } else { console.log(`Lossmail wasnt greater than ${config.loss_limit}ISK`); }
            }
        };
    }
}

connect();

client.login(config.token);