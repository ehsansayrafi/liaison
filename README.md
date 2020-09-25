# Discord Omegle
A Discord Omegle bot made in node.js. Talk to a random user in a different Discord server over voice chat.
## Requirements
* node.js (I used v12.18.1)
* discord.js (v12.3.1)
* node-opus (v0.3.3)
* signale (v1.4.0)

## Setup
Put Discord bot token in the config.json file:
```json
{
    "token": "discord bot token",
    "prefix": "-"
}
```
While in a voice channel type -queue to look for another user to match with. They must be in a different server.
