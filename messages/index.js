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
const movieKey = process.env.movieKey;
const movieToken = process.env.movieToken;
const movieUrl = 'https://api.themoviedb.org/3/';


const LuisModelUrl = 'https://' + luisAPIHostName + '/luis/v1/application?id=' + luisAppId + '&subscription-key=' + luisAPIKey;

// Main dialog with LUIS
const recognizer = new builder.LuisRecognizer(LuisModelUrl);
const intents = new builder.IntentDialog({ recognizers: [recognizer] })
    .matches('greeting', (session, args) => {
        session.send('hello i am clappy', session.message.text);
    })
    .matches('actorForRole', (session, args) => {
        const movieEntity = args.entities.filter((entity) => entity.type === 'movieTitle');
        const characterEntity = args.entities.filter((entity) => entity.type === 'characterName');

        const movieTitle = movieEntity.length ? movieEntity[0].entity : null;
        const characterName = characterEntity.length ? characterEntity[0].entity : null;

        if (!movieTitle) {
            return session.send('Sorry, I don\'t understand which movie you are asking about.');
        } else if (!characterName) {
            return session.send('Sorry, I don\'t understand which movie character you are asking about.');
        }

        const teststring = 'intent: actorForRole, movie title: ' + movieTitle + ', character name: ' + characterName;
        const movieSearchUrl = movieUrl+'search/movie/?query=' + movieTitle + '&api_key='+ movieKey;

        session.send(teststring);

        request(movieSearchUrl, (error, response, body) => {
            if (!error && response.statusCode == 200) {

                const movieId = JSON.parse(body).results[0].id;
                const movieCreditsUrl = movieUrl+'movie/' + movieId + '/credits?api_key='+ movieKey;

                request(movieCreditsUrl, (error, response, body) => {
                    if (!error && response.statusCode == 200) {
                        const findCharacter = JSON.parse(body).cast.filter((c) => c.character.toLowerCase().includes(characterName));
                        const character = findCharacter.length ? character[0] : null;
                        session.send("I think the person you're looking for is " + character.name);
                    }
                });
            }
        });
    })
    .onDefault((session) => {
        session.send('Sorry, I did not understand \'%s\'.', session.message.text);
    });

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

