const config = require("../config.json");
const fs = require("fs");

module.exports = {
	id: 'killfeed-update',
	exec: (call) => {

        // check if users has `Director` role or if config.bot.owner is equal to the user id
        if (call.message.member.roles.cache.find(r => r.name === 'Director') || call.message.author.id === config.helious) {

            call.prompt('What\'s the lowest value killmails you want to show?\n example `1,000,000,000` would be 1B ISK', { time: 60000 }).then((msg) => {
                // Resolves with the response.
                let KillLimit = msg.content;
                call.prompt('What\'s the lowest value lossmails you want to show?\n example `500,000,000` would be 1B ISK', { time: 60000 }).then((msg) => {

                    let LossLimit = msg.content;
                    call.prompt('Do you want to show pods?\n its enabed by **default**!, reply with `yes` or `no`', { time: 60000 }).then((msg) => {
                    
                        let Pod = msg.content;

                        // case switch pod to true to false from yes or no
                        if (Pod == "yes") {
                            config.show_pods = true;
                        } else {
                            config.show_pods = false;
                        }

                        // remove any commas from the numbers
                        KillLimit = KillLimit.replace(/,/g, '');
                        LossLimit = LossLimit.replace(/,/g, '');

                        config.kill_limit = KillLimit;
                        config.loss_limit = LossLimit;
                        
                        // edit config.json to update the feeder_channel, kill_limit, and loss_limit
                        fs.writeFile("./config.json", JSON.stringify(config, null, 4), err => {
                            if (err) {
                                console.error(err);
                                return;
                            }
                            console.log("Config file has been updated");
                        });

                        call.message.channel.send('Killfeed updated.');
                        return;
                    })

                })
            }).catch((exc) => {
                // Rejects when the command is cancelled, out of time, or surpasses the maximum amount of attempts.
                // In this case surpassing the maximum amount of attempts is impossible since there is no filter.
                call.message.channel.send('Cancelled prompt.');
            });
        } else {
            call.message.channel.send('You do not have the required role to do this.\nYou must have the role `Director`.');
            return;
        }
        
    }
};