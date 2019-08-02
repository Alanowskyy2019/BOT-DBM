onst DBM = {};
const DiscordJS = DBM.DiscordJS = require('discord.js');

//---------------------------------------------------------------------
// Bot
// Contains functions for controlling the bot.
//---------------------------------------------------------------------

const Bot = DBM.Bot = {};

Bot.$cmds = {}; // Normal commands
Bot.$icds = []; // Includes word commands
Bot.$regx = []; // Regular Expression commands
Bot.$anym = []; // Any message commands
Bot.$evts = {}; // Events

Bot.bot = null;

Bot.init = function() {
	this.initBot();
	this.reformatData();
	this.initEvents();
	this.login();
};

Bot.initBot = function() {
	this.bot = new DiscordJS.Client();
};

Bot.reformatData = function() {
	this.reformatCommands();
	this.reformatEvents();
};

Bot.reformatCommands = function() {
	const data = Files.data.commands;
	if(!data) return;
	this._caseSensitive = Boolean(Files.data.settings.case === 'true');
	for(let i = 0; i < data.length; i++) {
		const com = data[i];
		if(com) {
			switch(com.comType) {
				case '1':
					this.$icds.push(com);
					break;
				case '2':
					this.$regx.push(com);
					break;
				case '3':
					this.$anym.push(com);
					break;
				default:
					if(this._caseSensitive) {
						this.$cmds[com.name] = com;
						if(com._aliases) {
							const aliases = com._aliases;
							for(let j = 0; j < aliases.length; j++) {
								this.$cmds[aliases[j]] = com;
							}
						}
					} else {
						this.$cmds[com.name.toLowerCase()] = com;
						if(com._aliases) {
							const aliases = com._aliases;
							for(let j = 0; j < aliases.length; j++) {
								this.$cmds[aliases[j].toLowerCase()] = com;
							}
						}
					}
					break;
			}
		}
	}
};

Bot.reformatEvents = function() {
	const data = Files.data.events;
	if(!data) return;
	for(let i = 0; i < data.length; i++) {
		const com = data[i];
		if(com) {
			const type = com['event-type'];
			if(!this.$evts[type]) this.$evts[type] = [];
			this.$evts[type].push(com);
		}
	}
};

Bot.initEvents = function() {
	this.bot.on('ready', this.onReady.bind(this));
	this.bot.on('message', this.onMessage.bind(this));
	Events.registerEvents(this.bot);
};

Bot.login = function() {
	this.bot.login(Files.data.settings.token);
};

Bot.onReady = function() {
	if(process.send) process.send('BotReady');
	console.log('Bot is ready!');
	this.restoreVariables();
	this.preformInitialization();
};

Bot.restoreVariables = function() {
	Files.restoreServerVariables();
	Files.restoreGlobalVariables();
};

Bot.preformInitialization = function() {
	const bot = this.bot;
	if(this.$evts["1"]) {
		Events.onInitialization(bot);
	}
	if(this.$evts["3"]) {
		Events.setupIntervals(bot);
	}
};

Bot.onMessage = function(msg) {
	if(!msg.author.bot) {
		try {
			if(!this.checkCommand(msg)) {
				this.onAnyMessage(msg);
			}
		} catch(e) {
			console.error(e);
		}
	}
};

Bot.checkCommand = function(msg) {
	let command = this.checkTag(msg.content);
	if(command) {
		if(!this._caseSensitive) {
			command = command.toLowerCase();
		}
		const cmd = this.$cmds[command];
		if(cmd) {
			Actions.preformActions(msg, cmd);
			return true;
		}
	}
	return false;
};
