var fetch = require('node-fetch');
const { MessageEmbed } = require('discord.js');

module.exports = {
	id: 'extract',
	exec: (call) => {
        // get args from call
        const args = call.args;
        // get 1st arg from args
        const sp = args[0];
        let text = "";

        function numberWithCommas(x) {
            return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
        }

        if(sp) {
            
        
        fetch('https://evepraisal.com/appraisal/structured.json', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json; charset=UTF-8'
            },
            body: JSON.stringify({"market_name": "jita", "items": [{"name": "Large Skill Injector"}, {"type_id": 34}]})
        })
        .then(res => res.json()).then(json => {
            injector = json.appraisal.totals.sell;
            fetch('https://evepraisal.com/appraisal/structured.json', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json; charset=UTF-8'
                },
                body: JSON.stringify({"market_name": "jita", "items": [{"name": "Skill Extractor"}, {"type_id": 34}]})
            }).then(i => i.json()).then(i => {
                extractor = i.appraisal.totals.sell;
                fetch('https://evepraisal.com/appraisal/structured.json', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json; charset=UTF-8'
                    },
                    body: JSON.stringify({"market_name": "jita", "items": [{"name": "Plex"}, {"type_id": 34}]})
                }).then(p => p.json()).then(p => {
                    
                    // remove comma from sp
                    let spNoComma = sp.replace(/,/g, '');
                    // subtract 5million from spNoComma
                    let FinalSP = (spNoComma - 5500000);
                    // convert finalSP to int
                    let FinalSPInt = parseInt(FinalSP);
                    console.log(FinalSPInt);
                    // check if FinalSP starts with -
                    if(FinalSPInt > 0) {
                        let extractors = Math.floor(FinalSPInt/500000);
                        
                        total = ((extractors * injector) - (extractors * extractor));
                        // add comman every 3 digits to total
                        total = total.toFixed(2);
                        total = total.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
                        // check if total start with -
                        // create embed
                        const embed = new MessageEmbed()
                        .setColor('#0099ff')
                        .setTitle('Extracting')
                        .setThumbnail('https://images.evetech.net/types/40520/icon?size=64')
                        .setDescription(`Extracting **${sp}** SP would require **${numberWithCommas(extractors)}**\n\n Injector Current Price **${numberWithCommas(injector)}**\n Extractor Current Price **${numberWithCommas(extractor)}**\n
                        
                        Total Profit: **${total}**`)
                        .setTimestamp(Date.now())
                        .setFooter({ text: 'Prices Pulled Via EvePraisal'});
                        
                        call.message.channel.send({ embeds: [embed] });
                    } else {
                        call.message.channel.send('You dont have enough SP to extract');
                    }
                })
            })
        });
        }
    }
};