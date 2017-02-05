/*-----------------------------------------------------------------------------
This template demonstrates how to use an IntentDialog with a LuisRecognizer to add 
natural language support to a bot. 
For a complete walkthrough of creating this type of bot see the article at
http://docs.botframework.com/builder/node/guides/understanding-natural-language/
-----------------------------------------------------------------------------*/
"use strict";
var builder = require("botbuilder");
var botbuilder_azure = require("botbuilder-azure");
var request = require("request");

var useEmulator = (process.env.NODE_ENV == 'development');

var connector = useEmulator ? new builder.ChatConnector() : new botbuilder_azure.BotServiceConnector({
    appId: process.env['MicrosoftAppId'],
    appPassword: process.env['MicrosoftAppPassword'],
    stateEndpoint: process.env['BotStateEndpoint'],
    openIdMetadata: process.env['BotOpenIdMetadata']
});

var bot = new builder.UniversalBot(connector);

// Make sure you add code to validate these fields
var luisAppId = process.env.LuisAppId;
var luisAPIKey = process.env.LuisAPIKey;
var luisAPIHostName = process.env.LuisAPIHostName || 'api.projectoxford.ai';
var movieKey = process.env.movieKey;
var movieToken = process.env.movieToken;
var movieUrl = 'https://api.themoviedb.org/3/';


const LuisModelUrl = 'https://' + luisAPIHostName + '/luis/v1/application?id=' + luisAppId + '&subscription-key=' + luisAPIKey;

// Main dialog with LUIS
var recognizer = new builder.LuisRecognizer(LuisModelUrl);
var intents = new builder.IntentDialog({ recognizers: [recognizer] })
    .matches('greeting', (session, args) => {
        session.send('hello i am clappy', session.message.text);
    })
    .matches('actorForRole', (session, args) => {
        var movieTitle = args.entities.filter(function(entity) {
            return entity.type === 'movieTitle';
        })[0].entity;
        var characterName = args.entities.filter(function(entity) {
            return entity.type === 'characterName';
        })[0].entity;

        var teststring = 'intent: actorForRole, movie title: ' + movieTitle + ', character name: ' + characterName;
        var movieSearchUrl = movieUrl+'search/movie/?query=' + movieTitle + '&api_key='+ movieKey;

        session.send(teststring);

        request(movieSearchUrl, function (error, response, body) {
        if (!error && response.statusCode == 200) {

            var movieId = JSON.parse(body).results[0].id;
            var movieCreditsUrl = movieUrl+'movie/' + movieId + '/credits?api_key='+ movieKey;

            request(movieCreditsUrl, function (error, response, body) {
                if (!error && response.statusCode == 200) {
                    var character = JSON.parse(body).cast.filter(function(c) {
                        return c.character.toLowerCase().includes(characterName);
                    })[0];
                    session.send("I think the person you're looking for is " + character.name);
                }
            });
        }
    });

})
.onDefault((session) => {
    session.send('what the hell');
    session.send('Sorry, I did not understand \'%s\'.', session.message.text);
});

bot.dialog('/', intents);    

if (useEmulator) {
    var restify = require('restify');
    var server = restify.createServer();
    server.listen(3978, function() {
        console.log('test bot endpont at http://localhost:3978/api/messages');
    });
    server.post('/api/messages', connector.listen());    
} else {
    module.exports = { default: connector.listen() }
}

