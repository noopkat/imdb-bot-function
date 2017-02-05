var request = require("request");
var movieApiConfig = require('../movieApiConfig');

module.exports = function(session, args) {
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
    session.send(teststring);

    const movieSearchUrl = movieApiConfig.movieUrl+'search/movie/?query=' + movieTitle + '&api_key='+ movieApiConfig.movieKey;

    request(movieSearchUrl, (error, response, body) => {
        if (!error && response.statusCode == 200) {

            const results = JSON.parse(body).results;

            if (!results.length) {
                return session.send("I couldn't find the right movie you're asking about.");
            }

            // this is a basic placeholder, we should return a set of movies to choose from as chat buttons
            // if (results.length > 1) {
            //     return session.send("I got multiple results, I'm not sure which one to choose.");
            // }

            const movieId = results[0].id;
            const movieCreditsUrl = movieApiConfig.movieUrl+'movie/' + movieId + '/credits?api_key='+ movieApiConfig.movieKey;

            request(movieCreditsUrl, (error, response, body) => {
                if (!error && response.statusCode == 200) {
                    const findCharacter = JSON.parse(body).cast.filter((c) => c.character.toLowerCase().includes(characterName));
                    const character = findCharacter.length ? findCharacter[0] : null;
                    if (!character) {
                        return session.send("Sorry, I didn't find that character in the movie.");
                    }
                    session.send("I think the person you're looking for is " + character.name);
                } else {
                    session.send("Sorry, something went wrong when I was trying to look up the character in the movie.");
                }
            });
        } else {
            session.send("Sorry, something went wrong when I was looking up the movie.")
        }
    });
};