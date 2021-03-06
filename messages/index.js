/*-----------------------------------------------------------------------------
This template demonstrates how to use an IntentDialog with a LuisRecognizer to add 
natural language support to a bot. 
For a complete walkthrough of creating this type of bot see the article at
http://docs.botframework.com/builder/node/guides/understanding-natural-language/
-----------------------------------------------------------------------------*/
"use strict";
const builder = require("botbuilder");
const botbuilder_azure = require("botbuilder-azure");
const request = require("request");
const actorForRole = require('./intents/actorForRole');
const directorName = require('./intents/directorName');

const useEmulator = (process.env.NODE_ENV == 'development');

const connector = useEmulator ? new builder.ChatConnector() : new botbuilder_azure.BotServiceConnector({
    appId: process.env['MicrosoftAppId'],
    appPassword: process.env['MicrosoftAppPassword'],
    stateEndpoint: process.env['BotStateEndpoint'],
    openIdMetadata: process.env['BotOpenIdMetadata']
});

const bot = new builder.UniversalBot(connector);

// Make sure you add code to validate these fields
const luisAppId = process.env.LuisAppId;
const luisAPIKey = process.env.LuisAPIKey;
const luisAPIHostName = process.env.LuisAPIHostName || 'api.projectoxford.ai';


const LuisModelUrl = 'https://' + luisAPIHostName + '/luis/v1/application?id=' + luisAppId + '&subscription-key=' + luisAPIKey;

// Main dialog with LUIS
const recognizer = new builder.LuisRecognizer(LuisModelUrl);
const intents = new builder.IntentDialog({ recognizers: [recognizer] })
    .matches('actorForRole', actorForRole)
    .matches('directorName', directorName)
    .matches('greeting', (session, args) => {session.send('hello i am clappy', session.message.text)})
    .onDefault((session) => {session.send('Sorry, I did not understand \'%s\'.', session.message.text)});

bot.dialog('/', intents);

if (useEmulator) {
    const restify = require('restify');
    const server = restify.createServer();
    server.listen(3978, function() {
        console.log('test bot endpont at http://localhost:3978/api/messages');
    });
    server.post('/api/messages', connector.listen());    
} else {
    module.exports = { default: connector.listen() }
}

