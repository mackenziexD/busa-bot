const config = require('../config.json');
const { MessageEmbed } = require('discord.js');

module.exports = {
	id: 'help',
	exec: (call) => {
        // check if users has role director
        if (call.message.member.roles.cache.find(r => r.name === 'Director') || call.message.author.id === config.helious) {
            const embed = new MessageEmbed()
            .setColor('#0099ff')
            .setTitle('Help Commands')
            .setDescription('These are the commands you can use')
            .addField('!help', 'Shows this message')
            .addField('!kills {character}', 'Pulls the last 7day and 90day kills of a character from zkillboard')
            .addField('!price {item}', 'Check the price of something at jita price')
            .addField('\u200B', '**Locked To Director**')
            .addField('!lookup {character}', '\n Pulls main and alts from seat of character')
            .addField('!setup-killfeed', '\n Pulls corp losses and kills from zkillboard with parameters that can be set') 
            .addField('!killfeed-update', '\n Updates the parameters for killfeed') 
            .addField('!discord', '\n See what members are not in discord')
            .addField('!purge', '\n Get characters from seat that have less than 30 kills in 90 days')
            .setTimestamp(Date.now())
            .setFooter({ text: 'Created By: Helious#4607'});
            
            call.message.channel.send({ embeds: [embed] });
        } else{
            const embed = new MessageEmbed()
            .setColor('#0099ff')
            .setTitle('Help Commands')
            .setDescription('These are the commands you can use')
            .addField('!help', 'Shows this message')
            .addField('!price {item}', 'Check the price of something at jita price')
            .addField('!kills {character}', 'Pulls the last 7day and 90day kills of a character from zkillboard')
            .setTimestamp(Date.now())
            .setFooter({ text: 'Created By: Helious#4607'});
            call.message.channel.send({ embeds: [embed] });
        }
	}
};