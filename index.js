const {REST, Routes} = require('discord.js');
const fs = require('node:fs');
const path = require('node:path');
const {Client, Events, GatewayIntentBits, Collection} = require('discord.js');
const {token, clientId, guildId} = require('./config.json');
const { Player } = require('discord-player');
const { spawn } = require('child_process');


//"Guild" refers to the Discord Server
//TO DO: Add more intents with additional functionality
const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildVoiceStates, GatewayIntentBits.GuildIntegrations]});

client.player = new Player(client);

client.commands = new Collection();

const foldersPath = path.join(__dirname, 'commands');
const commandFolders = fs.readdirSync(foldersPath);

for (const folder of commandFolders) {
    const commandsPath = path.join(foldersPath, folder);
    const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

    for (const file of commandFiles) {
        const filePath = path.join(commandsPath, file);
        const command = require(filePath);

        if ('data' in command && 'execute' in command) {
            client.commands.set(command.data.name, command);
        }
        else {
            console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
        }
    }
}

client.on(Events.InteractionCreate, async interaction => {
    if (!interaction.isChatInputCommand()) return;

    const command = interaction.client.commands.get(interaction.commandName);

    if(!command) {
        console.error(`No command matching ${interaction.commandName} was found.`);
        return;
    }
    
    try {
        await command.execute(interaction);
    } catch (error) {
		console.error(error);
		if (interaction.replied || interaction.deferred) {
			await interaction.followUp({ content: 'There was an error while executing this command!', ephemeral: true });
		} else {
			await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
		}
	}
})

client.on('voiceStateUpdate', (oldState, newState) => {
    console.log(`Voice state update event received.`);
    console.log(`Old State: ${oldState.member.user.tag} in ${oldState.channel ? oldState.channel.name : 'no channel'}`);
    console.log(`New State: ${newState.member.user.tag} in ${newState.channel ? newState.channel.name : 'no channel'}`);
 });

client.once(Events.ClientReady, c => {
    console.log(`Ready! Logged in as ${c.user.tag}`);
})

client.login(token);

