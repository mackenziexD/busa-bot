var fetch = require('node-fetch');
module.exports = {
	id: 'extract_profit',
	exec: (call) => {
        let extractor = 0;
        let injector = 0;
        let plex = 0;
        let total = 0;
        let text = "";

        
        let insult = "";
        const random = Math.floor(Math.random() * 5) + 1;
        // if random is 1, call good emoji
        switch (random) {
            case 1:
                insult = "Pillock";
                break;
            case 2:
                insult = "Wanker";
                break;
            case 3:
                insult = "Spastic";
                break;
            case 4:
                insult = "Birdbrain";
                break;
            case 5:
                insult = "Village idiot";
                break;
        }
        // check if args is not empty
        if(call.args.length > 0) {
            text += `**You dumb ${insult}**, you dont need to add names onto this command.\nBut `;
        }
        
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
                    plex = p.appraisal.totals.sell;
                    total = ((2094000/500000) * injector) - ((2094000/500000) * extractor) - (500 * plex);
                    // add comman every 3 digits to total
                    total = total.toFixed(2);
                    total = total.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
                    // check if total start with -
                    if(total.charAt(0) == "-") {
                        call.message.channel.send(`${text}At the moment **its not** worth it, total profit is: **${total}**`);
                    } else {
                        call.message.channel.send(`${text}At the moment **it is** worth it, total profit is: **${total}**`);
                    }
                })
            })
        });


	}
};