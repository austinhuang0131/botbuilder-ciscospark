const snekfetch = require("snekfetch");

var sparkConnector = (function(options) {
  // Option check
  function sparkConnector(options) {
    if (!options.name)
      throw "BotBuilder-CiscoSpark > Name argument (username@sparkbot.io) not defined.";
    if (!options.token)
      throw "BotBuilder-CiscoSpark > Token argument not defined.";
    if (!options.port)
      throw "BotBuilder-CiscoSpark > Webhook port argument not defined.";
  }
  // Define random stuff
  sparkConnector.prototype.onEvent = handler => this.handler = handler;
  sparkConnector.prototype.startConversation = () => {
    if (this.options.debug)
      console.log("BotBuilder-CiscoSpark > startConversation", arguments);
  };
  sparkConnector.prototype.onInvoke = () => {
    if (this.options.debug)
      console.log("BotBuilder-CiscoSpark > onInvoke", arguments);
  };

  // Listener
  sparkConnector.prototype.listen = (req, res) => {
    if (this.options.debug) console.log("BotBuilder-CiscoSpark > Message received", req.body);
    res.send("ok");
    let message = req.body;
    if (message.data.personEmail !== this.options.name) snekfetch.get("https://api.ciscospark.com/v1/messages/"+message.data.id)
    .set(`Authorization`, "Bearer " + this.options.token)
    .then(r => {
      var msg = {
        timestamp: Date.parse(r.created),
        source: "ciscospark",
        entities: [],
        text: !r.body.text ? null : r.body.text.replace(/^ /, ""),
        attachments: !r.body.files ? [] : r.body.files.map(f => {
          snekfetch.get(f)
          .set(`Authorization`, "Bearer " + this.options.token)
          .then(a => {return {content: a.body, contentType: require("buffer-type")(a.body).type}});
        }),
        address: {
          bot: { name: this.options.name, id: "placeholder" },
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
      if (this.options.debug)
        console.log("BotBuilder-CiscoSpark > Processed message", msg);
    });
  };

  sparkConnector.prototype.send = function(messages, cb) {
    if (messages.filter(m => m.source === "ciscospark").length !== messages.length)
      return Promise.reject(
        "BotBuilder-CiscoSpark > Ignoring messages for other platforms..." +
          JSON.stringify(messages)
      );
    if (this.options.debug)
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
    if (this.options.debug)
      console.log("BotBuilder-CiscoSpark > Messages ready to go... " + JSON.stringify(body));
    if (body.length !== 0) body.forEach(b => {
      snekfetch.post("https://api.ciscospark.com/v1/messages")
      .set(`Authorization`, "Bearer " + this.options.token)
      .set(`Content-Type`, "application/json")
      .send(b)
      .then(r => {if (this.options.debug) console.log("BotBuilder-CiscoSpark > Here it goes... ", r.body);});
    });
  };
  return sparkConnector;
})();

exports.connector = sparkConnector;
