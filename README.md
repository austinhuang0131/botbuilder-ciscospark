# botbuilder-ciscospark
Microsoft BotBuilder Connector to Cisco Spark.

## Preparation
### Install
`npm i botbuilder-ciscospark --save`

### Config
First of all, you need to change some of your environment variables (`.env`) if you need. I know it's stupid, but [that's how the official library `node-ciscobot` works.](https://github.com/CiscoDevNet/node-sparkbot/blob/master/sparkbot/webhook.js#L54)

* `OVERRIDE_PORT` or `PORT` for server port, default `8080`.
* `WEBHOOK_PATH` for webhook path, default `/`.
* `SPARK_TOKEN` for your Cisco Spark access token.
* `WEBHOOK_SECRET` for your webhook secret, default unset. We'll talk about this in the next section.
* We're not using `COMMAND_PREFIX`.

### Webhook Registration
1. Go to [this page](https://developer.webex.com/endpoint-webhooks-post.html).
2. Enable Test Mode on the top-right.
3. Change header `Authorization` to `Bearer ` followed by your token.
4. Put whatever `name`.
5. Put your hostname followed by your webhook path as `targetUrl`.
6. Put `message` as `resource`.
7. Put `created` as `event`. We're only tracking messages.
8. If your bot is global, ignore `filter`. Otherwise, it is usually `roomId=<room id>`. See documentation.
9. If you want extra security, add `secret`. Then, put the same value as the `WEBHOOK_SECRET` in your enviroment variables.
10. Run it. Expect success result.

### Script
Add this to your bot script.
```js
const cisco = require("botbuilder-ciscospark")({
	name: "something@sparkbot.io"
});
bot.connector("ciscospark", cisco);
```
The `name` should be the Cisco Spark username if your bot. It should always end with `sparkbot.io`. Failure to do so may initiate infinite loops, which none of us like.

## Usage
The connector can receive and send messages, and process attachments in the messages (Only tested on images, should work universally in theory).

Messages unsupported by the platform, including...

* Cards, any kind of them
* Buttons or input suggestions
* Messages with multiple attachments

...are ignored.

## I NEED HELP!!!!!!
[GitHub Issues](https://github.com/austinhuang0131/botbuilder-ciscospark/issues)
