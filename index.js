const snekfetch = require("snekfetch");

function Create(options) {
  // Option check
  if (!options.name)
    throw "BotBuilder-CiscoSpark > Name argument (username@sparkbot.io) not defined.";
  if (!options.token)
    throw "BotBuilder-CiscoSpark > Token argument not defined.";
  if (!options.path)
    throw "BotBuilder-CiscoSpark > Path argument not defined.";
  if (!options.port)
    throw "BotBuilder-CiscoSpark > Webhook port argument not defined.";

  // Define random stuff
  options = Object.assign({ channelId: "cisco" }, options);
  this.onEvent = handler => this.handler = handler;
  this.startConversation = () => {
    if (options.debug)
      console.log("BotBuilder-CiscoSpark > startConversation", arguments);
  };
  this.onInvoke = () => {
    if (options.debug)
      console.log("BotBuilder-CiscoSpark > onInvoke", arguments);
  };

  // Reception
  this.processCiscoMessage = (message) => {
    if (message.data.personEmail !== options.name) snekfetch.get("https://api.ciscospark.com/v1/messages/"+message.data.id)
    .set(`Authorization`, "Bearer " + options.token)
    .then(r => {
      var msg = {
        timestamp: Date.parse(r.created),
        source: "ciscospark",
        entities: [],
        text: !r.body.text ? null : r.body.text.replace(/^ /, ""),
        attachments: !r.body.files ? [] : r.body.files.map(f => {
          snekfetch.get(f)
          .set(`Authorization`, "Bearer " + options.token)
          .then(a => {return {content: a.body, contentType: require("buffer-type")(a.body).type}});
        }),
        address: {
          bot: { name: options.name, id: "placeholder" },
          user: { name: r.body.personEmail, id: r.body.personId },
          channelId: "cisco",
          channelName: "ciscospark",
          msg: r,
          conversation: {
            id: r.body.roomId,
            isGroup: r.body.roomType === "group" ? true : false
          }
        }
      };
      this.handler([msg]);
      if (options.debug)
        console.log("BotBuilder-CiscoSpark > Processed message", msg);
    });
  }

  // Message dispatching
  this.send = function(messages, cb) {
    if (options.debug)
      console.log("BotBuilder-CiscoSpark > Preparing messages to go... " + messages);
    var body = [];
    messages.map(msg => {
      if (msg.attachments) {
        if (msg.attachments.length > 1)
          console.warn(
            "BotBuilder-CiscoSpark > WARNING: You CANNOT send more than 1 attachment in a message, despite being able to receive so."
          );
        body.push({
          roomId: msg.address.conversation.id,
          markdown: msg.text,
          files: [msg.attachments[0].contentUrl]
        });
      }
      else body.push({ roomId: msg.address.conversation.id, markdown: msg.text });
    });
    if (options.debug)
      console.log("BotBuilder-CiscoSpark > Messages ready to go... " + JSON.stringify(body));
    if (body.length !== 0) body.forEach(b => {
      snekfetch.post("https://api.ciscospark.com/v1/messages")
      .set(`Authorization`, "Bearer " + options.token)
      .set(`Content-Type`, "application/json")
      .send(b)
      .then(r => {if (options.debug) console.log("BotBuilder-CiscoSpark > Here it goes... ", r.body);});
    });
  };

  // Listener
  this.hears = (req, res) => {
    if (req.path === options.path) {
      if (options.debug) console.log("BotBuilder-CiscoSpark > Message received", req.body);
      res.send("ok");
      return this.processCiscoMessage(req.body);
    }
  };
  return this;
}

module.exports = Create;
