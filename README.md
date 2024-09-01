# DLMP3 Bot (Discord.JS Local MP3)
Original 2020 version by Andrew Lee, forked and updated throughout 2021-23 by Mayuwhim

Added queue system, looping single/looping queue, shuffling, searching by file name or artist name, sorting by date, filtering by audio filetypes, and some custom commands.
You can check everything I added in the help section below.

The bot ran on Discord.JS v12, which is no longer supported. Uploading code for preservation purposes.

This was my first experience maintaining a Discord bot. I didn't really use GitHub so I'm only making an "official" fork now.

# Original Description

A Discord bot that plays local mp3 audio tracks. Written in Discord.JS.

[Video Tutorial](https://www.youtube.com/watch?v=7X3FAhYW31I)

(Originally for Alee's birthday)

If there's anything wrong, feel free to make a fork and put a pull request.

# Configuration
Make a new file called `config.json`.
```
{
    "token": "token_here",
    "prefix": "dl:",
    "botOwner": "your_user_id_here",
    "statusChannel": "channel_id",
    "voiceChannel": "voice_channel_id"
}
```

Add your own audio files using the mp3 file extension to the `music` folder.

Launch the bot using `node bot.js` in terminal.

# Help Command
```
Public Only
-----------
help - Displays commands.
ping - Pong!
git - Links to the source repo.
playing - Tells you what it's playing at the moment.
about - About the bot.

Bot Owner Only
--------------
join - Joins voice chat.
resume - Resumes music.
pause - Pauses music.
skip - Skips the audio track.
leave - Leaves voice chat.
stop - Stops bot.

Additional Commands by Mayuwhim
-------------------------------
queue - Display queued songs
library - [Spreadsheet of my local songs](https://docs.google.com/spreadsheets/d/e/2PACX-1vStX8QLYjz5I1m7XIbx5igXWc7bbaKmY_HvcUMV2z4PMMyuEBVUH2zvILsEbrdLEdQ4StEFSJrIw4wZ/pubhtml)
roll [maxNum] - Random number generator
select [name] - Search by song name
loop - Loops single song
loopqueue - Loops entire queue
add [name] - Adds song to queue
addtop [name] - Adds song to top of queue
remove [queuePos] - Removes song from queue
clear - Clears queue
shuffle - Toggle shuffling (randomly picks from) song list
sortdate - Toggle sorting song list by date added
vc [ID] - Change voice channel
artist - Toggle sorting by artist
annoy - Copies any text/attachment anyone sends and resends it
And several joke commands that just trigger specific text messages
```
