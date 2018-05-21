const snekfetch = require("snekfetch");

var sparkConnector = function() {
  // Option check
  function sparkConnector(options) {
    var self = this;
    if (!options.name)
      throw "BotBuilder-CiscoSpark > Name argument (username@sparkbot.io) not defined.";
    if (!options.token)
      throw "BotBuilder-CiscoSpark > Token argument not defined.";
    if (!options.port)
      throw "BotBuilder-CiscoSpark > Webhook port argument not defined.";
    this.options = options;
  }  
  // Define random stuff
  sparkConnector.onEvent = function(handler) {
    return this.handler = handler
  };
  sparkConnector.prototype.startConversation = function() {
    var self = this;
    if (self.options.debug)
      console.log("BotBuilder-CiscoSpark > startConversation", arguments);
  };
  sparkConnector.prototype.onInvoke = function() {
    var self = this;
    if (self.options.debug)
      console.log("BotBuilder-CiscoSpark > onInvoke", arguments);
  };

  // Listener
  sparkConnector.listen = function(req, res){
    var self = this;
    console.log(self);
    if (self.options.debug) console.log("BotBuilder-CiscoSpark > Message received", req.body);
    res.send("ok");
    let message = req.body;
    if (message.data.personEmail !== self.options.name) snekfetch.get("https://api.ciscospark.com/v1/messages/"+message.data.id)
    .set(`Authorization`, "Bearer " + self.options.token)
    .then(r => {
      var msg = {
        timestamp: Date.parse(r.created),
        source: "ciscospark",
        entities: [],
        text: !r.body.text ? null : r.body.text.replace(/^ /, ""),
        attachments: !r.body.files ? [] : r.body.files.map(f => {
          snekfetch.get(f)
          .set(`Authorization`, "Bearer " + self.options.token)
          .then(a => {return {content: a.body, contentType: require("buffer-type")(a.body).type}});
        }),
        address: {
          bot: { name: self.options.name, id: "placeholder" },
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
      self.handler([msg]);
      if (self.options.debug)
        console.log("BotBuilder-CiscoSpark > Processed message", msg);
    });
  };

  sparkConnector.prototype.send = function(messages, cb) {
    var self = this;
    if (messages.filter(m => m.source === "ciscospark").length !== messages.length)
      return Promise.reject(
        "BotBuilder-CiscoSpark > Ignoring messages for other platforms..." +
          JSON.stringify(messages)
      );
    if (self.options.debug)
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
    if (self.options.debug)
      console.log("BotBuilder-CiscoSpark > Messages ready to go... " + JSON.stringify(body));
    if (body.length !== 0) body.forEach(b => {
      snekfetch.post("https://api.ciscospark.com/v1/messages")
      .set(`Authorization`, "Bearer " + this.options.token)
      .set(`Content-Type`, "application/json")
      .send(b)
      .then(r => {if (self.options.debug) console.log("BotBuilder-CiscoSpark > Here it goes... ", r.body);});
    });
  };
  return sparkConnector;
};

module.exports.connector = sparkConnector;
