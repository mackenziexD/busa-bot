module.exports =  {
    name: 'guildMemberAdd',
    once: false,
    execute(member, Discord, client) {

        const welcomechannelId = '940219767908880424'
        member.guild.channels.cache.get(welcomechannelId).send(`Hello <@${member.user.id}>, Welcome to **${member.guild.name}**. Thanks For Joining Our Server.`)

    }
}