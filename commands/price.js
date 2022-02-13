const config = require("../config.json");
const fs = require("fs");
const request = require('request');

module.exports = {
	id: 'price',
	exec: (call) => {

        // get args from call
        const args = call.args;
        // get item name from args
        const item = args.join(' ');
        
        var dataString = `{"market_name": "jita", "items": [{"name": "${item}"}, {"type_id": 34}]}`;

        var options = {
            url: 'https://evepraisal.com/appraisal/structured.json',
            method: 'POST',
            body: dataString
        };
        
        function callback(error, response, body) {
            if (!error && response.statusCode == 200) {
                const json = JSON.parse(body);
                // json.appraisal.totals.sell 0 decimal places
                const price = json.appraisal.totals.sell.toFixed(2);
                // set price to have commas for thousands
                const priceCommas = price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");

                call.message.channel.send(`${item} is selling for ${priceCommas} ISK In Jita`);
            }
        }
        
        request(options, callback);

    }
};