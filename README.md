# botbuilder-ciscospark
Microsoft BotBuilder Connector to Cisco Spark.

## Preparation
### Install
`npm i botbuilder-ciscospark --save`

### Script
Add this to your bot script.
```js
const cisco = require("botbuilder-ciscospark")({
	name: "something@sparkbot.io",
	token: "access token",
	port: process.env.PORT,
	webhookUrl: "https://example.com/cisco"
	// add debug:true if you like console spam
});
bot.connector("ciscospark", cisco);
```
The `name` should be the Cisco Spark username if your bot. It should always end with `sparkbot.io`. Failure to do so may initiate infinite loops, which none of us like.

## Usage
The connector can receive and send messages, and process attachments in the messages (Only tested on images, should work universally in theory).

Messages unsupported by the platform, including...

* Cards, any kind of them
* Buttons or input suggestions
* Messages with multiple attachments (Outbound, not inbound)

...are ignored.

## I NEED HELP!!!!!!
[GitHub Issues](https://github.com/austinhuang0131/botbuilder-ciscospark/issues)
