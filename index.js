const {
    token,
    prefix
} = require('./config.json');
const {
    Signale
} = require('signale');
const Discord = require('discord.js');
const client = new Discord.Client();

const queue = [];

async function checkQueue() {
    if (queue.length >= 2) {
        const userOne = queue.shift();
        const userTwo = queue.shift();

        createMatch(userOne, userTwo);
    }
}

async function createMatch(userOne, userTwo) {
    const matchLogger = new Signale({
        interactive: true,
        scope: 'DiscordOmegle'
    });

    matchLogger.await('Getting info...');

    const userOneGuild = client.guilds.cache.get(userOne.guildId);
    const userTwoGuild = client.guilds.cache.get(userTwo.guildId);

    const userOneVoiceChannel = client.channels.cache.get(userOne.channelId);
    const userTwoVoiceChannel = client.channels.cache.get(userTwo.channelId);

    const userOneMember = userOneGuild.members.cache.get(userOne.userId);
    const userTwoMember = userTwoGuild.members.cache.get(userTwo.userId);

    if (userOneMember.voice.channel.id != userOneVoiceChannel.id || userTwoMember.voice.channel.id != userTwoVoiceChannel.id) return matchLogger.error('A user disconnected from a voice channel!');

    const userOneVoiceChannelConnection = await client.channels.cache.get(userOne.channelId).join();
    const userTwoVoiceChannelConnection = await client.channels.cache.get(userTwo.channelId).join();

    const userOneMemberEmbedBegin = new Discord.MessageEmbed()
        .setColor('GREEN')
        .setTitle('Dismegle')
        .setDescription(`Your conversation with \`${userTwoMember.user.username}#${userTwoMember.user.discriminator}\` has begun! Say hi! 👋`)
        .setTimestamp();
    const userTwoMemberEmbedBegin = new Discord.MessageEmbed()
        .setColor('GREEN')
        .setTitle('Dismegle')
        .setDescription(`Your conversation with \`${userOneMember.user.username}#${userOneMember.user.discriminator}\` has begun! Say hi! 👋`)
        .setTimestamp();

    userOneMember.send(userOneMemberEmbedBegin).catch(() => {
        logger.warn(`${userOneMember.user.username}#${userOneMember.user.discriminator} has DMs turned off!`);
    });
    userTwoMember.send(userTwoMemberEmbedBegin).catch(() => {
        logger.warn(`${userTwoMember.user.username}#${userTwoMember.user.discriminator} has DMs turned off!`);
    });

    const userOneVoiceChannelAudio = userOneVoiceChannelConnection.receiver.createStream(userOne.userId, {
        end: 'manual'
    });
    userTwoVoiceChannelConnection.play(userOneVoiceChannelAudio, {
        type: 'opus'
    });

    const userTwoVoiceChannelAudio = userTwoVoiceChannelConnection.receiver.createStream(userTwo.userId, {
        end: 'manual'
    });
    userOneVoiceChannelConnection.play(userTwoVoiceChannelAudio, {
        type: 'opus'
    });

    matchLogger.success('Created match!');

    const userLeaveInterval = setInterval(function() {
        if ((userOneMember.voice.channelID === userOneVoiceChannel.id && userTwoMember.voice.channelID === userTwoVoiceChannel.id) && (userOneGuild.voice.channelID === userOneVoiceChannel.id && userTwoGuild.voice.channelID === userTwoVoiceChannel.id) && (userOneGuild.voice != null && userTwoGuild.voice != null)) return;
        userOneVoiceChannelAudio.destroy();
        userTwoVoiceChannelAudio.destroy();

        logger.info(`The conversation between ${userOneMember.user.username}#${userOneMember.user.discriminator} and ${userTwoMember.user.username}#${userTwoMember.user.discriminator} has ended.`);

        try {
            userOneGuild.voice.channel.leave();
            userTwoGuild.voice.channel.leave();
        } catch {
            logger.error('Error leaving voice channel.');
        }

        const userOneMemberEmbedEnd = new Discord.MessageEmbed()
            .setColor('RED')
            .setTitle('Dismegle')
            .setDescription('Your conversation has ended!')
            .setTimestamp();
        const userTwoMemberEmbedEnd = new Discord.MessageEmbed()
            .setColor('RED')
            .setTitle('Dismegle')
            .setDescription('Your conversation has ended!')
            .setTimestamp();

        userOneMember.send(userOneMemberEmbedEnd).catch(() => {
            logger.warn(`${userOneMember.user.username}#${userOneMember.user.discriminator} has DMs turned off!`);
        });
        userTwoMember.send(userTwoMemberEmbedEnd).catch(() => {
            logger.warn(`${userTwoMember.user.username}#${userTwoMember.user.discriminator} has DMs turned off!`);
        });

        clearInterval(userLeaveInterval);
    }, 1250);
}

const options = {
    logLevel: 'info',
    scope: 'Dismegle',
    stream: process.stdout
};

const logger = new Signale(options);
const interactive = new Signale({
    interactive: true,
    scope: 'Dismegle'
});

interactive.await('Attempting to log into Discord...');

client.on('ready', () => {
    interactive.success(`Logged into Discord as ${client.user.username}!`);
});

client.on('message', async message => {
    const args = message.content.slice(prefix.length).trim().split(/ +/);
    const command = args.shift().toLowerCase();

    if (command === 'queue') {
        if (!message.member.voice.channel) return message.channel.send('You must be in a voice channel to start queueing!');

        for (let i = 0; i < queue.length; i++) {
            if (queue[i].userId === message.author.id) return message.channel.send('You are already in the queue!');
            if (queue[i].guildId === message.guild.id) return message.channel.send('Someone in your server is already queueing!');
        }

        if(message.guild.voice && message.guild.voice.channelID) return message.channel.send('There is already a conversation in your server, you must wait for it to end!');

        message.channel.send('You have started queueing!');

        logger.info(`${message.author.username}#${message.author.discriminator} is queueing!`);

        queue.push({
            guildId: message.guild.id,
            channelId: message.member.voice.channel.id,
            userId: message.author.id
        });
    }
});

client.login(token).catch(() => {
    interactive.error('Error logging into Discord!');
});

setInterval(checkQueue, 5000);
