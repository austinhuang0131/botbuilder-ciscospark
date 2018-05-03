const Flint = require("node-flint");

function Create(options) {
  // Option check
  if (!options.name) throw "BotBuilder-CiscoSpark > Name argument (username@sparkbot.io) not defined.";
  if (!options.token) throw "BotBuilder-CiscoSpark > Token argument not defined.";
  if (!options.webhookUrl) throw "BotBuilder-CiscoSpark > Webhook URL argument not defined.";
  if (!options.port) throw "BotBuilder-CiscoSpark > Webhook port argument not defined.";

  // Define random stuff
	var bot = new Flint({
		token: options.token,
		webhookUrl: options.webhookUrl,
		port: options.port,
		messageFormat: "markdown"
	});
	bot.start();
  this.onEvent = (handler) => this.handler = handler;
  this.startConversation = () => {if (options.debug) console.log("BotBuilder-CiscoSpark > startConversation", arguments)};
  this.onInvoke = () => {if (options.debug) console.log("BotBuilder-CiscoSpark > onInvoke", arguments)};
  
  // Text-only Messages reception
  bot.on("messages", function (bot, message, id) {
    if (message.email === options.name || !message.files) return;
    if (options.debug) console.log("BotBuilder-CiscoSpark > New text message", message);
		this.handler([{
			timestamp: Date.parse(message.created),
			source: "ciscospark",
			entities: [],
			text: message.text.replace(/^ /, ""),
			address: {
					bot: { name: options.name, id: bot.person.id },
					user: { name: message.personEmail, id: message.personId },
					channelId: "ciscospark",
					channelName: "ciscospark",
					msg: message,
					conversation: {
						id: message.roomId,
						isGroup: message.roomType === "group" ? true : false
					}
			}
		}]);
  });
  
  // Messages w/ att reception
  bot.on("files", function (bot, message, id) {
    if (message.email === options.name) return;
    if (options.debug) console.log("BotBuilder-CiscoSpark > New text message", message);
		this.handler([{
			timestamp: Date.parse(message.created),
			source: "ciscospark",
			entities: [],
			text: !message.text ? null : message.text.replace(/^ /, ""),
			attachments: message.files.map(f => {return {content: f.binary, contentType: f.type}}),
			address: {
					bot: { name: options.name, id: bot.person.id },
					user: { name: message.personEmail, id: message.personId },
					channelId: "ciscospark",
					channelName: "ciscospark",
					msg: message,
					conversation: {
						id: message.roomId,
						isGroup: message.roomType === "group" ? true : false
					}
			}
		}]);
  });
  
  // Message dispatching
  this.send = function(messages, cb) {
    if (options.debug)
      console.log(
        "BotBuilder-CiscoSpark > Sending messages... " + JSON.stringify(messages)
      );
      var body = [];
      messages.map(msg => {
        if (!msg.attachments) body.push({roomId: msg.address.conversation.id, text: msg.text});
        else if (msg.attachments.length === 1) body.push({roomId: msg.address.conversation.id, text: msg.text, file: msg.attachments[0].contentUrl});
        else console.error("BotBuilder-CiscoSpark > ERROR: You CANNOT send more than 1 attachment in a message.");
      });
      if (body.length !== 0) body.map(m => bot.say(m.roomId, m.text, m.file));
  };
	
	// Listener
	this.listen = require('node-flint/webhook')(bot);
  return this;
}

module.exports = Create;
