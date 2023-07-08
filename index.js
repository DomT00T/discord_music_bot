/*
    Author: iTz Arshia
    Github: https://github.com/iTzArshia/iTz-DJ
    Current Version: 1.0.0
    DiscordJs Version: 14.8.0
    DisTube Version: 4.0.4
    @discordjs/voice Version: 0.15.0
*/

const Discord = require('discord.js');
const { DisTube } = require('distube');
const { SoundCloudPlugin } = require('@distube/soundcloud');
const { SpotifyPlugin } = require('@distube/spotify');
const { YtDlpPlugin } = require('@distube/yt-dlp');
const { DeezerPlugin } = require("@distube/deezer");
const fs = require('node:fs');
const func = require('./utils/functions');
const { row2, row3 } = require('./utils/components');
const config = require('./config.json');

// Discord Client Constructor
const client = new Discord.Client({
    intents: [
        Discord.GatewayIntentBits.Guilds,
        Discord.GatewayIntentBits.GuildVoiceStates,
        Discord.GatewayIntentBits.GuildMessages,
        Discord.GatewayIntentBits.MessageContent
    ]
});

// Event Handler
console.log(`Loading Events`);
const events = fs.readdirSync(`./events/`).filter(file => file.endsWith('.js'));
for (const file of events) {
    const event = require(`./events/${file}`);
    client.on(file.split('.')[0], event.bind(null, client));
    delete require.cache[require.resolve(`./events/${file}`)];
};

// Message Command Handler
console.log(`Loading Message Commands`);
client.MessageCommands = new Discord.Collection();
const messageCommands = fs.readdirSync(`./commands/messages/`).filter(files => files.endsWith('.js'));
for (const file of messageCommands) {
    const command = require(`./commands/messages/${file}`);
    client.MessageCommands.set(command.name.toLowerCase(), command);
    delete require.cache[require.resolve(`./commands/messages/${file}`)];
};

// Slash Command Handler
console.log(`Loading Slash Commands`);
client.SlashCommands = new Discord.Collection();
const slashCommands = fs.readdirSync(`./commands/interactions/`).filter(files => files.endsWith('.js'));
for (const file of slashCommands) {
    const command = require(`./commands/interactions/${file}`);
    client.SlashCommands.set(command.data.name, command);
    delete require.cache[require.resolve(`./commands/interactions/${file}`)];
};

client.distube = new DisTube(client, {  // DisTube client constructor
    // Change these on your risk! more info https://distube.js.org/#/docs/DisTube/stable/typedef/DisTubeOptions

    emitNewSongOnly: false,                 // Whether or not emitting DisTube#event:playSong event when looping a song or next song is the same as the previous one
    leaveOnEmpty: true,                     // Whether or not leaving voice channel if the voice channel is empty after DisTubeOptions.emptyCooldown seconds.
    leaveOnFinish: false,                   // Whether or not leaving voice channel when the queue ends.
    leaveOnStop: true,                      // Whether or not leaving voice channel after using DisTube#stop function.
    savePreviousSongs: true,                // Whether or not saving the previous songs of the queue and enable DisTube#previous method
    searchSongs: 5,                         // Limit of search results emits in DisTube#event:searchResult event when DisTube#play method executed. If searchSongs <= 1, play the first result
    searchCooldown: 30,                     // Built-in search cooldown in seconds (When searchSongs is bigger than 0)
    // youtubeCookie: '',                   // YouTube cookies. Read how to get it in YTDL's Example
    // youtubeIdentityToken: '',            // If not given; ytdl-core will try to find it. You can find this by going to a video's watch page; viewing the source; and searching for "ID_TOKEN".
    // customFilters: { },                  // Override defaultFilters or add more ffmpeg filters. Example={ "Filter name"="Filter value"; "8d"="apulsator=hz=0.075" }
    // ytdlOptions: { },                    // ytdl-core get info options
    emptyCooldown: 60,                      // Built-in leave on empty cooldown in seconds (When leaveOnEmpty is true)
    nsfw: false,                            // Whether or not playing age-restricted content and disabling safe search in non-NSFW channel.
    emitAddListWhenCreatingQueue: true,     // Whether or not emitting addList event when creating a new Queue
    emitAddSongWhenCreatingQueue: true,     // Whether or not emitting addSong event when creating a new Queue
    joinNewVoiceChannel: false,             // Whether or not joining the new voice channel when using DisTube#play method
    // streamType: DisTubeStream#type,      // Decide the DisTubeStream#type will be used (Not the same as DisTubeStream#type)
    directLink: true,                       // Whether or not play direct link of the song
    plugins: [                              // DisTube plugins.
        new DeezerPlugin(),                 // Deezer plugin.
        new SpotifyPlugin(),                // Spotify plugin.
        new SoundCloudPlugin(),             // SoundCloud plugin.
        new YtDlpPlugin()                   // yt-dlp plugin for supporting 700+ sites.
    ]

});

client.distube
    .on('addList', async (queue, playlist) => {     

        const embed = new Discord.EmbedBuilder()
            .setColor(config.MainColor)
            .setDescription(`เพิ่มเพลย์ลิสต์ใหม่เข้าคิว\n**Playlist:** ${playlist.name} (${playlist.songs.length} เพลง)`)
            .setFooter({
                text: `Commanded by ${playlist.songs[0].user.tag}`,
                iconURL: playlist.songs[0].user.displayAvatarURL({ size: 1024 })
            });

        await queue.textChannel?.send({ embeds: [embed] });

    })
    .on('addSong', async (queue, song) => {             // Emitted after bot add a new song to the playing Queue.

        const embed = new Discord.EmbedBuilder()
            .setColor(config.MainColor)
            .setDescription(`เพลงใหม่ถูกเพิ่มเข้าไปในคิว\n**Song:** [${song.name} (${song.formattedDuration})](${song.url})`)
            .setFooter({
                text: `Commanded by ${song.user.tag}`,
                iconURL: song.user.displayAvatarURL({ size: 1024 })
            });

        await queue.textChannel?.send({ embeds: [embed] });

    })
   
    .on('empty', async (queue) => {                     // Emitted when there is no user in the voice channel and there is a playing queue. If there is no playing queue, it will leave the channel without emitting this event.

        const embed = new Discord.EmbedBuilder()
            .setColor(config.ErrorColor)
            .setDescription('กูไปละบาย!!');

        await queue.textChannel?.send({ embeds: [embed] });

    })
    .on('error', async (textChannel, error) => {        // Emitted when bot encounters an error while playing songs.

        const embed = new Discord.EmbedBuilder()
            .setColor(config.ErrorColor)
            .setDescription(error.message.length > 4096 ? error.message.slice(0, 4093) + '...' : error.message);

        await textChannel?.send({ embeds: [embed] });

    })
  
    .on('noRelated', async (queue) => {                 // Emitted when autoplay is on, queue is empty, and bot cannot find related songs to play.
        const embed = new Discord.EmbedBuilder()
            .setColor(config.ErrorColor)
            .setDescription('I can\'t find any related song to play');

        await queue.textChannel?.send({ embeds: [embed] });

    })
    .on('playSong', async (queue, song) => {            // Emitted when bot plays a song.

        const voiceChannel = queue.distube.client.channels.cache.get(queue.voice.channelId);
        const voiceChannelMembers = voiceChannel.members.filter(member => !member.user.bot);

        const embed = new Discord.EmbedBuilder()
            .setColor(config.MainColor)
            .setDescription(`กำลังเล่น**[${song.name} (${song.formattedDuration})](${song.url})** สำหรับ ${voiceChannelMembers.size} ${voiceChannelMembers.size > 1 ? 'ผู้ฟัง' : 'ผู้ฟัง'} ใน ${voiceChannel}`)
            .setThumbnail(song?.thumbnail)
            .setFooter({
                text: `ไอ่นี้เป็นคนเปิด ${song.user.tag}`,
                iconURL: song.user.displayAvatarURL({ size: 1024 })
            });

        if (song.views) embed.addFields({
            name: '👀 ยอดวิว:',
            value: `${func.numberWithCommas(song.views)}`,
            inline: true
        });

        if (song.likes) embed.addFields({
            name: '👍🏻 Likes:',
            value: `${func.numberWithCommas(song.likes)}`,
            inline: true
        });

        if (song.dislikes) embed.addFields({
            name: '👎🏻 Dislikes:',
            value: `${func.numberWithCommas(song.dislikes)}`,
            inline: true
        });

        const filters = new Discord.StringSelectMenuBuilder()
            .setCustomId('filters')
            .setPlaceholder('เลือก Filters');

        const options = [];

        for (const filter of Object.keys(queue.distube.filters)) {
            options.push(
                {
                    label: filter.charAt(0).toUpperCase() + filter.slice(1),
                    value: filter
                }
            );
        };

        filters.addOptions(options);
        const row1 = new Discord.ActionRowBuilder()
            .addComponents([
                filters
            ]);

        const reply = await queue.textChannel?.send({
            embeds: [embed],
            components: [
                row1,
                row2,
                row3
            ]
        });

        const collector = await reply.createMessageComponentCollector({ time: song.duration * 1000 });

        collector.on('collect', async (int) => {

            const memberVC = int.member.voice.channel || null;
            const botVC = int.guild.members.me.voice.channel || null;

            if ((memberVC && botVC) && memberVC.id !== botVC.id) {

                const inVoiceEmbed = new Discord.EmbedBuilder()
                    .setColor(config.ErrorColor)
                    .setDescription('You aren\'t connected to my Voice Channel.');

                return await int.reply({
                    embeds: [inVoiceEmbed],
                    ephemeral: true
                });

            };

            await int.deferReply();

            try {


                if (int.customId === 'filters') {

                    if (queue.filters.has(int.values[0])) {
                        await queue.filters.remove(int.values[0]);
                    } else {
                        await queue.filters.add(int.values[0]);
                    };

                    await reply.edit({
                        components: [
                            row1,
                            row2,
                            row3
                        ]
                    });

                    const filtersEmbed = new Discord.EmbedBuilder()
                        .setColor(config.MainColor)
                        .setDescription(`**Current Queue Filters:** \`${queue.filters.names.join(', ') || 'OFF'}\`\n\n${func.queueStatus(queue)}`)
                        .setFooter({
                            text: `Commanded by ${int.user.tag}`,
                            iconURL: int.user.displayAvatarURL({ size: 1024 })
                        });

                    return await int.editReply({ embeds: [filtersEmbed] });


                } else if (int.customId.startsWith('loop')) {

                    const loopState = int.customId.split('-')[1];
                    const currentLoopState = queue.repeatMode;
                    const convertedLoopStates = {
                        0: 'off',
                        1: 'song',
                        2: 'queue'
                    };

                    let mode = 0;

                    if (convertedLoopStates[currentLoopState] === 'off') {

                        if (loopState === 'song') mode = 1;
                        else if (loopState === 'queue') mode = 2;

                    } else {

                        if (loopState !== convertedLoopStates[currentLoopState]) {

                            if (loopState === 'song') mode = 1;
                            else if (loopState === 'queue') mode = 2;

                        };

                    };

                    mode = await queue.setRepeatMode(mode);
                    mode = mode ? (mode === 2 ? 'All Queue' : 'This Song') : 'OFF';

                    const loopEmbed = new Discord.EmbedBuilder()
                        .setColor(config.MainColor)
                        .setDescription(`Loop mode changed to \`${mode}\`\n\n${func.queueStatus(queue)}`)
                        .setFooter({
                            text: `Commanded by ${int.user.tag}`,
                            iconURL: int.user.displayAvatarURL({ size: 1024 })
                        });

                    return await int.editReply({ embeds: [loopEmbed] });

                } else if (int.customId === 'previous') {

                    await queue.previous();

                    const skippedEmbed = new Discord.EmbedBuilder()
                        .setColor(config.MainColor)
                        .setDescription("กลับไป เพลงก่อนหน้า.")
                        .setFooter({
                            text: `Commanded by ${int.user.tag}`,
                            iconURL: int.user.displayAvatarURL({ size: 1024 })
                        });

                    await int.editReply({ embeds: [skippedEmbed] });

                    return await collector.stop();

                } else if (int.customId === 'pauseUnpause') {

                    if (queue.playing) {
                        await queue.pause();
                    } else {
                        await queue.resume();
                    };

                    const pauseUnpauseEmbed = new Discord.EmbedBuilder()
                        .setColor(config.MainColor)
                        .setDescription(`${queue.playing ? 'Resumed' : 'Paused'} เพลง.`)
                        .setFooter({
                            text: `Commanded by ${int.user.tag}`,
                            iconURL: int.user.displayAvatarURL({ size: 1024 })
                        });

                    return await int.editReply({ embeds: [pauseUnpauseEmbed] });

                } else if (int.customId === 'next') {

                    await queue.skip();

                    const skippedEmbed = new Discord.EmbedBuilder()
                        .setColor(config.MainColor)
                        .setDescription("ข้ามไป เพลงถัดไป.")
                        .setFooter({
                            text: `Commanded by ${int.user.tag}`,
                            iconURL: int.user.displayAvatarURL({ size: 1024 })
                        });

                    await int.editReply({ embeds: [skippedEmbed] });

                    return await collector.stop();

                } else if (int.customId.startsWith('vol')) {

                    const volumeUpDown = int.customId.split('-')[1];

                    if (volumeUpDown === 'up') await queue.setVolume(queue.volume + 10);
                    else if (volumeUpDown === 'down') await queue.setVolume(queue.volume - 10);

                    const volumeEmbed = new Discord.EmbedBuilder()
                        .setColor(config.MainColor)
                        .setDescription(`เปลี่ยนระดับเสียงเป็น \`${queue.volume}\`\n\n${func.queueStatus(queue)}`)
                        .setFooter({
                            text: `Commanded by ${int.user.tag}`,
                            iconURL: int.user.displayAvatarURL({ size: 1024 })
                        });

                    return await int.editReply({ embeds: [volumeEmbed] });

                } else if (int.customId === 'backward') {

                    await queue.seek(queue.currentTime - 10);

                    const seekEmbed = new Discord.EmbedBuilder()
                        .setColor(config.MainColor)
                        .setDescription(`ย้อนเพลงไป 10 วินาที`)
                        .setFooter({
                            text: `Commanded by ${int.user.tag}`,
                            iconURL: int.user.displayAvatarURL({ size: 1024 })
                        });

                    return await int.editReply({ embeds: [seekEmbed] });

                } else if (int.customId === 'stop') {

                    await queue.stop();

                    const stopEmbed = new Discord.EmbedBuilder()
                        .setColor(config.MainColor)
                        .setDescription("หยุดเล่น.")
                        .setFooter({
                            text: `Commanded by ${int.user.tag}`,
                            iconURL: int.user.displayAvatarURL({ size: 1024 })
                        });

                    await int.editReply({ embeds: [stopEmbed] });

                    return await collector.stop();

                } else if (int.customId === 'forward') {

                    await queue.seek(queue.currentTime + 10);

                    const seekEmbed = new Discord.EmbedBuilder()
                        .setColor(config.MainColor)
                        .setDescription(`skip ไป 10 วินาที`)
                        .setFooter({
                            text: `Commanded by ${int.user.tag}`,
                            iconURL: int.user.displayAvatarURL({ size: 1024 })
                        });

                    return await int.editReply({ embeds: [seekEmbed] });

                };

            } catch (error) {

                const errorEmbed = new Discord.EmbedBuilder()
                    .setColor(config.ErrorColor)
                    .setDescription(error.message.length > 4096 ? error.message.slice(0, 4093) + "..." : error.message)
                    .setFooter({
                        text: `Commanded by ${int.user.tag}`,
                        iconURL: int.user.displayAvatarURL({ size: 1024 })
                    });

                return await int.editReply({ embeds: [errorEmbed] });

            };

        });

        collector.on('end', async (collection, reason) => {

            if (["messageDelete", "messageDeleteBulk"].includes(reason)) return;
            await reply.edit({ components: [] }).catch(() => null);

        });

    })
    .on('searchCancel', async (message) => {            // Emitted when the search canceled due to timeout.

        const embed = new Discord.EmbedBuilder()
            .setColor(config.ErrorColor)
            .setDescription('ยกเลิกการค้นหาแล้ว')
            .setFooter({
                text: `Commanded by ${message.author.tag}`,
                iconURL: message.author.displayAvatarURL({ size: 1024 })
            });

        await message.reply({ embeds: [embed] });

    })
    .on("searchDone", () => { })                        // Emitted after the user chose a search result to play.
    .on('searchInvalidAnswer', async (message) => {     // Emitted when the search canceled due to user's next message is not a number or out of results range.

        const embed = new Discord.EmbedBuilder()
            .setColor(config.ErrorColor)
            .setDescription('จำนวนไม่ถูกต้อง')
            .setFooter({
                text: `Commanded by ${message.author.tag}`,
                iconURL: message.author.displayAvatarURL({ size: 1024 })
            });

        await message.reply({ embeds: [embed] });

    })
    .on('searchNoResult', async (message) => {          // Emitted when bot cannot find any results for the query.

        const embed = new Discord.EmbedBuilder()
            .setColor(config.ErrorColor)
            .setDescription('ไม่มีพิมพ์ควยไรมา!!')
            .setFooter({
                text: `Commanded by ${message.author.tag}`,
                iconURL: message.author.displayAvatarURL({ size: 1024 })
            });

        await message.reply({ embeds: [embed] });

    })
    .on('searchResult', async (message, result) => {    // Emitted when song param of play is invalid url. bot will wait for user's next message to choose a song manually.

        let i = 0;

        const embed = new Discord.EmbedBuilder()
            .setColor(config.MainColor)
            .setTitle('เลือกตัวเลือกจากด้านล่าง')
            .setDescription(`${result.map(song => `**${++i}**. ${song.name} (${song.formattedDuration})`).join('\n')}\n\n*Enter anything else or wait 30 seconds to cancel!*`)
            .setFooter({
                text: `Commanded by ${message.author.tag}`,
                iconURL: message.author.displayAvatarURL({ size: 1024 })
            });

        await message.reply({ embeds: [embed] });

    });

// Anti Crash
process.on('unhandledRejection', (reason, p) => {
    console.log('[antiCrash] :: Unhandled Rejection/Catch');
    console.log(reason?.stack, p);
});

process.on("uncaughtException", (err, origin) => {
    console.log('[antiCrash] :: Uncaught Exception/Catch');
    console.log(err?.stack, origin);
});

process.on('uncaughtExceptionMonitor', (err, origin) => {
    console.log('[antiCrash] :: Uncaught Exception/Catch (MONITOR)');
    console.log(err?.stack, origin);
});

// Discord Client login
client.login(config.Token);