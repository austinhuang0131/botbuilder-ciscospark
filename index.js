/*
		config = {
			port 			: process.env.OVERRIDE_PORT || process.env.PORT,
			path			: process.env.WEBHOOK_PATH,
			token			: process.env.SPARK_TOKEN,
			secret			: process.env.WEBHOOK_SECRET
		};
    also we need to ask for bot username ending with @sparkbot.io
*/

const SparkBot = require("node-sparkbot"),
bot = new SparkBot(),
SparkAPIWrapper = require("node-sparkclient"),
spark = new SparkAPIWrapper(process.env.SPARK_TOKEN);

function Create(options) {
  // Option check
  if (!options.name) throw "BotBuilder-CiscoSpark > Name argument (username@sparkbot.io) not defined.";
  
  // Define random stuff
  this.onEvent = (handler) => this.handler = handler;
  this.startConversation = () => {if (options.debug) console.log("BotBuilder-CiscoSpark > startConversation", arguments)};
  this.onInvoke = () => {if (options.debug) console.log("BotBuilder-CiscoSpark > onInvoke", arguments)};
  
  // Message reception
  bot.onEvent("messages", "created", function (trigger) {
    if (trigger.personEmail === options.name) return;
    if (options.debug) console.log("BotBuilder-CiscoSpark > New message", trigger);
    bot.decryptMessage(trigger, function (err, message) {
      let temp = [];
      if (message.files) message.files.forEach(m => {
        spark.getFile(m, function (err, fileInfo, fileData) {
          temp.push({
            contentType: fileInfo.contentType,
            content: fileData,
            name: fileInfo.fileName
          });
        });
      });
      this.handler([{
        timestamp: Date.parse(message.created),
        source: "ciscospark",
        entities: [],
        attachments: temp.length === 0 ? null : temp,
        text: !message.text ? null : message.text.replace(/^ /, ""), // First space always escape
        address: {
            bot: { name: options.name, id: "too lazy to extract it" },
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
      body.map(m => spark.createMessage(m.roomId, m.text, m.file));
  };
  return this;
}

module.exports = Create;
