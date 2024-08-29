/**************************************************************************
 * 
 *  DLMP3 Bot: A Discord bot that plays local mp3 audio tracks.
 *  (C) Copyright 2020
 *  Programmed by Andrew Lee 
 *  
 *  This program is free software: you can redistribute it and/or modify
 *  it under the terms of the GNU General Public License as published by
 *  the Free Software Foundation, either version 3 of the License, or
 *  (at your option) any later version.
 *
 *  This program is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *  GNU General Public License for more details.
 *
 *  You should have received a copy of the GNU General Public License
 *  along with this program.  If not, see <https://www.gnu.org/licenses/>.
 * 
 *  Edits by Hoi (Mayuwhim) - file search, looping single/queue, artist
 *  search, sort by date, shuffling, filetype filtering, and custom commands.
 *
 ***************************************************************************/
const Discord = require('discord.js');
const fs = require('fs');
const bot = new Discord.Client();
const config = require('./config.json');
let dispatcher;
let audio;
let voiceChannel;
let fileData;
let audioNum = 0;
let songName = 'hi';
let hasQueue = false;
let wrongSong = false;
let loop = false;
let loopQueue = false;
let queuedLoop = false;
let queuedSong = false;
let ownerBot = false;
let alpha = false;
let songs = [];
let curSong;
let fileDate = false;
let files;
let filesByDate = [];
let beAnnoying = false;
let artisting = false;
let artistFilter = 'hi';

const dir = './music';
const filetypes = ['mp3','m4a','wav','ogg'];

bot.login(config.token);

function playAudio() {
    findDate();
    //join vc
    voiceChannel.join().then(connection => {
        if (fileDate) {
            files = filesByDate;
        } else {
            files = fs.readdirSync(dir);
        }

    //LOOP OFF
        if (!loop) {  
            if (queuedLoop) loop = true;

            if (songs.length>0) hasQueue = true;

            if (!hasQueue) {
                shuffleSong(files);
            }

            if (hasQueue) {
                searchSong(files);
            }

            if (wrongSong) {
                const invalidSong = new Discord.MessageEmbed()
                .addField('Invalid Song!', 'Query is cAsE sEnSiTivE!')
                .setColor('#ff0000')
                let statusChannel = bot.channels.cache.get(config.statusChannel);
                if (!statusChannel) return console.error('The status channel does not exist! Skipping.');
                statusChannel.send(invalidSong);
                wrongSong = false;
            }

        }

    //LOOP ON
        if (loop){
            audio = audio;
            queuedLoop = false;
        }

        dispatcher = connection.play('./music/' + audio);

        dispatcher.on('start', () => {
            console.log('Now playing ' + audio);
            fileData = "Now Playing: " + audio;
            fs.writeFile("now-playing.txt", fileData, (err) => { 
            if (err) 
                console.log(err); 
            }); 
            const statusEmbed = new Discord.MessageEmbed()
            .addField('Now Playing', `${audio}`)
            .setColor('#0066ff')

            let statusChannel = bot.channels.cache.get(config.statusChannel);
            if (!statusChannel) return console.error('The status channel does not exist! Skipping.');
            statusChannel.send(statusEmbed);
        });

        dispatcher.on('error', console.error);

        dispatcher.on('finish', () => {
            console.log('Music has finished playing.');
            playAudio();
        });

    }).catch(e => {
        console.error(e);
    });
  
}

//Shuffle (randomly select song from song folder)
function shuffleSong(files) {
    let attempts = files.length*7;
    while (true) {
        //shuffle
        if (!alpha) {
            audioNum = Math.floor(Math.random() * files.length);
            audio = files[audioNum];
            console.log('Searching .mp3 file...');
            let validsong = false;
            
            for (let i = 0; i<filetypes.length; i++) {
                if (audio.endsWith('.'+filetypes[i])) {
                    validsong = true;
                }
            }
            
            if (artisting) {
                let kek = audio.split(' - ');
                if (audio.indexOf(' - ') == -1 || (!kek[1].toLowerCase().startsWith(artistFilter.toLowerCase()) && attempts>0)) {
                    validsong = false;
                    attempts--;
                }
            }
            
            if (validsong) {
                if (attempts <= 0 && artisting) artistFail();
                break;
            }
        }
        //no shuffle
        if (alpha) {
            audioNum++;
            if (audioNum>=Math.floor(files.length)) {
                audioNum=0;
            }
            audio = files[audioNum];
            console.log('Going to next file...');
            let validsong = false;
            
            for (let i = 0; i<filetypes.length; i++) {
                if (audio.endsWith('.'+filetypes[i])) {
                    validsong = true;
                }
            }
            
            if (artisting) {
                let kek = audio.split(' - ');
                if (audio.indexOf(' - ') == -1 || (!kek[1].toLowerCase().startsWith(artistFilter.toLowerCase()) && attempts>0)) {
                    validsong = false;
                    attempts--;
                }
            }
            
            if (validsong) {
                if (attempts <= 0 && artisting) artistFail();
                break;
            }
        }
    }
}

//Looping through song folder for matching file name
function searchSong(files) {
    let attempt = 1; //how many full loops around the folder
    if (!loopQueue) curSong = songs.shift(); //take top song out of queue TODO loopqueue
    
    if (loopQueue && songs.length>0) {
        curSong = songs[0];
        songs.push(songs.shift());
    }
    
    audioNum = 0;
    while (hasQueue){
        audio = files[audioNum];
        console.log('Searching music file for '+curSong);
        let validsong = false;
        for (let i = 0; i<filetypes.length; i++) {
            if (audio.endsWith('.'+filetypes[i])) {
                validsong = true;
            }
        }
        if (audio.startsWith(curSong) && validsong) {
            hasQueue=false;
            break;
        }
        audioNum++;
        if (audioNum>=Math.floor(files.length)) {
            audioNum=0;
            attempt++;
        }
        if (attempt >2) {
            wrongSong = true;
            
            if (loopQueue) {
                songs.pop();
                if (songs.length>0) curSong = songs[0];
                else loopqueue = false;
            }
            
            if (songs.length>0) {
                searchSong(files);
                break;
            }
            hasQueue = false;
            audioNum = Math.floor(Math.random() * files.length);
            audio = files[audioNum];
            break;
        }
    }
}

//Sorting songs by date added
function findDate() {
    let names = fs.readdirSync(dir);
    let ints = [];
    for (let i = 0; i<names.length; i++) {
        ints.push({name:names[i],date:fs.statSync(`${dir}/${names[i]}`).mtimeMs});
    }
    let sorts = ints.sort(
        (p1, p2) => (p1.date < p2.date) ? 1 : (p1.date > p2.date) ? -1 : 0);
    filesByDate = [];
    for (let i = 0; i<sorts.length; i++) {
        filesByDate.push(sorts[i].name);
    }
}

//Search by Artist - No song with specified artist exists
function artistFail() {
    const artistL = new Discord.MessageEmbed()
    .addField('Artist Not Found!', 'Try again if you think this is a mistake.')
    .setColor('#ff0000')
    let statusChannel = bot.channels.cache.get(config.statusChannel);
    if (!statusChannel) return console.error('The status channel does not exist! Skipping.');
    statusChannel.send(artistL);
    artisting = false;
}

//status stuff on startup
bot.on('ready', () => {
    console.log('Bot is ready!');
    console.log(`Logged in as ${bot.user.tag}!`);
    console.log(`Prefix: ${config.prefix}`);
    console.log(`Owner ID: ${config.botOwner}`);
    console.log(`Voice Channel: ${config.voiceChannel}`);
    console.log(`Status Channel: ${config.statusChannel}\n`);

    bot.user.setPresence({
        activity: {
          name: `"""music""" | ${config.prefix}help`
        },
        status: 'online',
    }).then(presence => console.log(`Activity set to "${presence.activities[0].name}"`)).catch(console.error);

    const readyEmbed = new Discord.MessageEmbed()
    .setAuthor(`${bot.user.username}`, bot.user.avatarURL())
    .setDescription('Starting bot...')
    .setColor('#0066ff')

    let statusChannel = bot.channels.cache.get(config.statusChannel);
    if (!statusChannel) return console.error('The status channel does not exist! Skipping.');
    statusChannel.send(readyEmbed);
    voiceChannel = bot.channels.cache.get(config.voiceChannel);
    if (!voiceChannel) return console.error('The voice channel does not exist!\n(Have you looked at your configuration?)');
    console.log('Connected to the voice channel.');
    playAudio();
});

//Filter messages for command prefix from humans
bot.on('message', async msg => {
    if (msg.author.bot) return;
    if (!msg.guild) return;
	
	//be annoying (repeat every message sent)
    if (!msg.content.startsWith(config.prefix)) {
        if (beAnnoying) {
            if (msg.content != '') msg.channel.send(msg.content);
            if (msg.attachments.size > 0) {
                var Attachment = (msg.attachments).array();
                Attachment.forEach(function(attachment) {
                    msg.channel.send(attachment.url);
                })
            }
        }
        return;
    }
	
	//parse command
    let [command, ...rest] = msg.content.split(' ');
    command = command.slice(config.prefix.length);
    songName = rest.join(' ');
    let rollNum = rest[0];

  // Public allowed commands
    
switch (command) {
    case 'help':
        if (!msg.guild.member(bot.user).hasPermission('EMBED_LINKS')) return msg.reply('**ERROR: This bot doesn\'t have the permission to send embed links please enable them to use the full help.**');
        const helpEmbed = new Discord.MessageEmbed()
        .setAuthor(`${bot.user.username} Help`, bot.user.avatarURL())
        .setDescription(`Currently playing \`${audio}\`.`)
        .addField('Public Commands', `${config.prefix}help\n${config.prefix}ping\n${config.prefix}git\n${config.prefix}playing\n${config.prefix}queue\n${config.prefix}about\n${config.prefix}library\n${config.prefix}roll\n`, true)
        .addField('Bot Owner Only', `${config.prefix}join\n${config.prefix}resume\n${config.prefix}pause\n${config.prefix}skip\n${config.prefix}leave\n${config.prefix}stop\n${config.prefix}select ${config.prefix}p\n${config.prefix}loop\n${config.prefix}loopqueue\n${config.prefix}add ${config.prefix}q\n${config.prefix}addtop ${config.prefix}qt\n${config.prefix}remove ${config.prefix}rm\n${config.prefix}clear\n${config.prefix}shuffle\n${config.prefix}sortdate\n${config.prefix}vc\n${config.prefix}artist\n\n${config.prefix}annoy\n`, true)

        .addField('Joke Commands', `${config.prefix}kenos\n${config.prefix}w ${config.prefix}o\n${config.prefix}mc ${config.prefix}modcheck\n${config.prefix}lbozo ${config.prefix}elpozo ${config.prefix}L\n${config.prefix}charles ${config.prefix}bear ${config.prefix}donowall\n${config.prefix}bruh\n${config.prefix}catjam ${config.prefix}cj ${config.prefix}joe (me!!)\n${config.prefix}trolled ${config.prefix}troll\n${config.prefix}trelled ${config.prefix}treel ${config.prefix}tre\n${config.prefix}ofc ${config.prefix}ofcourse ${config.prefix}wowbro\n${config.prefix}bob ${config.prefix}wifi ${config.prefix}zhang\n${config.prefix}haha ${config.prefix}pointandlaugh ${config.prefix}lo\n${config.prefix}wh ${config.prefix}whatgames ${config.prefix}what\n${config.prefix}lag ${config.prefix}bob2\n${config.prefix}happi\n${config.prefix}aintnoway ${config.prefix}AINTNOWAY ${config.prefix}skull\n${config.prefix}? ${config.prefix}HUH\n\n${config.prefix}wakeupsoap\n${config.prefix}wakeuprobot\n${config.prefix}wakeupbob\n${config.prefix}wakeupbear\n${config.prefix}wakeuphoi\n${config.prefix}wakeupjack\n${config.prefix}602092952159780874\n${config.prefix}727\n`, true)

        .setFooter('Credits to Andrew Lee & Hoioidoi. Licensed with GPL-3.0.')
        .setColor('#0066ff')

        msg.channel.send(helpEmbed);
        break;
    case 'ping':
        msg.reply('Pong!');
        break;
    case 'git':
        msg.reply('This is the source code of this project (without modifications from Hoi).\nhttps://github.com/Alee14/DLMP3');
        break;
    case '602092952159780874':
        msg.channel.send('<a:chatting:1015805539587985438> nice typo');
        break;
    case 'playing':
        msg.channel.send('Currently playing `' + audio + '`.');
        break;
    case 'about':
        msg.channel.send('The bot code was created by Andrew Lee (Alee#4277). Modifications by Hoioidoi#5656. Written in Discord.JS and licensed with GPL-3.0.');
        break;
    case 'library':
        msg.channel.send('List of all songs:\nhttps://docs.google.com/spreadsheets/d/e/2PACX-1vStX8QLYjz5I1m7XIbx5igXWc7bbaKmY_HvcUMV2z4PMMyuEBVUH2zvILsEbrdLEdQ4StEFSJrIw4wZ/pubhtml');
        break;
    //emotes and inside jokes lol
    case 'wakeupsoap':
        msg.channel.send('<@REDACTED> <a:WAKEUP:1001288987744424056>');
        break;
    case 'wakeuprobot':
        msg.channel.send('<@REDACTED> <a:WAKEUP:1001288987744424056>');
        break;
    case 'wakeupbob':
        msg.channel.send('<@REDACTED> <a:WAKEUP:1001288987744424056>');
        break;
    case 'wakeuphoi':
        msg.channel.send('<@REDACTED> <a:WAKEUP:1001288987744424056>');
        break;
    case 'wakeupbear':
        msg.channel.send('<@REDACTED> <a:WAKEUP:1001288987744424056>');
        break;
    case 'wakeupjack':
        msg.channel.send('<@REDACTED> <a:WAKEUP:1001288987744424056>');
        break;
    case 'w':
    case 'o':
        msg.channel.send('<a:chatting:1015805539587985438> nice typo');
        break;
    case 'mc':
    case 'modcheck':
        msg.channel.send('<a:modCheck:1019003049173323857>');
        break;
    case 'lbozo':
    case 'elpozo':
    case 'L':
        msg.channel.send('<a:elpozo:1019005117757931601>');
        break;
    case 'charles':
    case 'bear':
    case 'donowall':
        msg.channel.send('<a:donowall:1019007639654506496>');
        break;
    case 'trolled':
    case 'troll':
        msg.channel.send('<a:trolled:903377565778067486>');
        break;
    case 'trelled':
    case 'treel':
    case 'tre':
        msg.channel.send('<a:tre:1019005374776488056>');
        break;
    case 'catjam':
    case 'joe':
    case 'cj':
        msg.channel.send('<a:catJAM:997694914710229083>');
        break;
    case 'bruh':
        msg.channel.send('<a:bruh:997701719318347937>');
        break;
    case 'ofc':
    case 'ofcourse':
    case 'wowbro':
        msg.channel.send('<a:OfCourse:1035221641841627246>');
        break;
    case '?':
    case 'HUH':
        msg.channel.send('<a:anti:1035222370518048788>');
        break;
    case 'wifi':
    case 'bob':
    case 'zhang':
        msg.channel.send('<a:bpb:1037925840287174687>');
        break;
    case 'haha':
    case 'pointandlaugh':
    case 'lo':
        msg.channel.send('<a:bobLaughingAtYou:1067642694991630426>');
        break;
    case 'wh':
    case 'whatgames':
    case 'what':
        msg.channel.send('<a:WHATGAMES:1066621651350978701>');
        break;
    case 'lag':
    case 'bob2':
        msg.channel.send('<a:LAG:1052324133909827695>');
        break;
    case 'happi':
        msg.channel.send('<a:happi:1046559418122240100>');
        break;
    case 'aintnoway':
    case 'AINTNOWAY':
    case 'skull':
        msg.channel.send('<a:AINTNOWAY:1069878427554959360>');
        break;
	//some other commands
    case 'queue':
        let que = 'Add something using =add\n';
        for (let i = 0; i<songs.length; i++) {
            que+=(i+1)+'. ';
            que+=songs[i];
            que+='\n';
        }
        const statusEmbed = new Discord.MessageEmbed()
        .addField('Queue', `${que}`)
        .setColor('#0066ff')

        let statusChannel = bot.channels.cache.get(config.statusChannel);
        if (!statusChannel) return console.error('The status channel does not exist! Skipping.');
        statusChannel.send(statusEmbed);
        break;
    case 'roll':
        let num = parseInt(rollNum);
        if (Number.isNaN(num) || num < 1) msg.reply('Not a valid number!');
        else {
            let rand = Math.floor(Math.random()*num) + 1;
            msg.channel.send(rand);
        }
        break;
}

// Bot owner (DJ) exclusive
    ownerBot = false;
    for (let i = 0; i<config.botOwner.length; i++) {
        if ([config.botOwner[i]].includes(msg.author.id)) ownerBot = true;
    }
    if (!ownerBot) return;
    
switch (command) {
    case 'yousuckatcooking':
        msg.channel.send('screw u');
        msg.guild.leave(); //leave server
        break;
    case 'join':
        msg.reply('Joining voice channel.');
        console.log('Connected to the voice channel.');
        playAudio();
        break;
    case 'resume':
        msg.reply('Resuming music.');
        dispatcher.resume();
        break;
    case 'pause':
        msg.reply('Pausing music.');
        dispatcher.pause();
        break;
    case 'skip':
        msg.reply('Skipping `' + audio + '`...');
        dispatcher.pause();
        dispatcher = null;
        playAudio();
        break;
    case 'select':
    case 'p':
        if (songName == null) songName == "nothing";
        if (loop) {
            queuedLoop = true;
            loop = false;
        }
        msg.reply('Skipping `' + audio + '` and looking for `'+ songName+'` ...');
        songs.unshift(songName);
        dispatcher.pause();
        dispatcher = null;
        hasQueue = true;
        playAudio();
        break;
    case 'add':
    case 'q':
        if (songName == null) songName == "nothing";
        if (loop) {
            queuedLoop = true;
            loop = false;
        }
        msg.reply('Added `'+ songName+'` to queue!');
        songs.push(songName);
        hasQueue = true;
        break;
    case 'addtop':
    case 'qt':
        if (songName == null) songName == "nothing";
        if (loop) {
            queuedLoop = true;
            loop = false;
        }
        msg.reply('Added `'+ songName+'` to top of queue!');
        songs.unshift(songName);
        hasQueue = true;
        break;
    case 'remove':
    case 'rm':
        let remove = parseInt(rollNum);
        if (Number.isNaN(remove) || remove>songs.length || remove<=0) {
            msg.reply('Not a valid number!');
        } else {
            msg.reply('Removed `'+ songs[remove-1]+'`!');
            songs.splice(remove-1,1);
        }
        break;
    case 'clear':
        songs = [];
        msg.reply('Cleared the queue.');
        break;
    case 'loop':
        loop = !loop;
        if (loop) msg.reply('Loop is now on!');
        if (!loop) msg.reply('Loop is now off!');
        break;
    case 'loopqueue':
        loopQueue = !loopQueue;
        if (loopQueue) msg.reply('Queue loop is now on!');
        if (!loopQueue) msg.reply('Queue loop is now off!');
        break;
    case 'shuffle':
        alpha = !alpha;
        if (alpha) msg.reply('Shuffling is off!');
        if (!alpha) msg.reply('Shuffling is on!');
        break;
    case 'sortdate':
        fileDate = !fileDate;
        if (fileDate) msg.reply('Now sorting by date inserted into playlist! (why)');
        if (!fileDate) msg.reply('Now sorting by alphabetical order.');
        break;
    case 'artist': //search by artist instead of song name
        switch (songName) {
            case '?_?':
            case '?':
            case '*':
            case 'everyone':
            case 'joe you cannot cook':
                artisting = false;
                msg.reply('No longer filtering by artist.');
                break;
            default:
                artisting = true;
                artistFilter = songName;
                msg.reply('Now filtering songs made by `'+songName+'*`.');
                break;    
        }
        break;
    case 'vc':
        let tempvc = bot.channels.cache.get(rollNum);
        if (!tempvc || tempvc.type !== 'voice') msg.reply('Voice channel not found.');
        else {
            msg.reply(`Voice channel changed to <#${tempvc.id}>!`);
            console.log('Voice channel changed to ' + tempvc.id);
            voiceChannel = tempvc;
        }
        break;
    case 'annoy': //repeat every message
        beAnnoying = !beAnnoying;
        if (beAnnoying) msg.channel.send('Joe is now annoying');
        if (!beAnnoying) msg.channel.send('smh');
        break;
    case 'leave':
        voiceChannel = bot.channels.cache.get(config.voiceChannel);
        if (!voiceChannel) return console.error('The voice channel does not exist!\n(Have you looked at your configuration?)');
        msg.reply('Leaving voice channel.');
        console.log('Leaving voice channel.');
        fileData = "Now Playing: Nothing";
        fs.writeFile("now-playing.txt", fileData, (err) => { 
        if (err) 
            console.log(err); 
        }); 
        audio = "Not Playing";
        dispatcher.destroy();
        voiceChannel.leave();
        break;
    case 'stop': //shut down the bot
        await msg.reply('Powering off...');
        fileData = "Now Playing: Nothing";
        await fs.writeFile("now-playing.txt", fileData, (err) => { 
        if (err) 
            console.log(err); 
        }); 
        const statusEmbed = new Discord.MessageEmbed()
        .setAuthor(`${bot.user.username}`, bot.user.avatarURL())
        .setDescription(`Powering down ${bot.user.username}...`)
        .setColor('#0066ff')
        let statusChannel = bot.channels.cache.get(config.statusChannel);
        if (!statusChannel) return console.error('The status channel does not exist! Skipping.');
        await statusChannel.send(statusEmbed);
        console.log('Powering off...');
        dispatcher.destroy();
        bot.destroy();
        process.exit(0);
        break;
}

});
