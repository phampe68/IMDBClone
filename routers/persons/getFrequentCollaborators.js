
const Movie = require('../../database/data-models/movie-model.js');


/**
 * get top 5 most frequently collaborators of this person:
 *  works in 3 Steps:
 *  Step 1: get all movies that this person participated in
 *  Step 2: get all people who participated in these movies
 *  Step 3: tally up which people occur the most
 */
const getFrequentCollaborators = async (person) => {
    //Step 1: find all movieIDs person was part of
    let movieIDs = [].concat(person.writerFor, person.actorFor, person.directorFor);
    let uniqueMoviesIDs = [...new Set(movieIDs)]; //remove duplicates
    let collaborators = {};

    let movies = await Movie.find({
        _id: {$in: uniqueMoviesIDs}
    });

    //get all people involved in each movie (except for the person we're looking at)
    movies.forEach(movie => {
        let allCollaborators = [].concat(movie.writer, movie.director, movie.actor);
        let uniqueCollaborators = [...new Set(allCollaborators)]; //remove duplicates (i.e if a person had 2+ roles, only count once)
        //tally people using the collaborators object
        uniqueCollaborators.forEach(collaborator => {
            if (!collaborators.hasOwnProperty(collaborator))
                collaborators[collaborator] = 1;
            else
                collaborators[collaborator]++;
        })

        //use ES10 to by most frequent sort: https://stackoverflow.com/questions/1069666/sorting-object-property-by-values
        collaborators = Object.fromEntries(
            Object.entries(collaborators).sort(([, a], [, b]) => b - a)
        );

        collaborators = Object.keys(collaborators);
        //remove person we're looking at
        collaborators = collaborators.filter(collaborator => collaborator !== person._id + "");
        collaborators = collaborators.filter(collaborator=>collaborator!=="0"&&collaborator!=="1"&&collaborator!=="2"&&collaborator!=="3"&&collaborator!=="4");
        collaborators = collaborators.slice(0, 5);
    });
    return collaborators;
}

module.exports = getFrequentCollaborators;
