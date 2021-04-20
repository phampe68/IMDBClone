const Movie = require('../../database/data-models/movie-model.js');


/**
 * Get movies that are similar genre and have similar actors
 *  - STEP 1: get top 50 movies by genre similarity using aggregation pipeline
 *  - STEP 2: sort the top 50 movies by similar people
 *  - STEP 3: store list of IDs in request
 */
const getSimilarMovies = async (movie, limit) => {
    /* STEP 1: get top 50 movies by genre similarity using aggregation pipeline
    see: https://stackoverflow.com/questions/41491393/query-for-similar-array-in-mongodb
     */

    let simGenreMovieIDs = await Movie.aggregate(
        [
            {$unwind: "$genre"}, //unwind the genre array to go through its separate keywords
            {
                $match: {
                    genre: {$in: movie.genre}, //look for movies that contain the genre
                    _id: {$ne: movie._id},  //exclude the original movie's ID
                }
            },
            {
                $group: {
                    _id: "$_id", // group back movies using id
                    count: {$sum: 1}, //sum up movies (this counts how many genres are shared with the original movie)
                }
            },
            //specify the result object: with the id, count of similar genres, and score (which is the mean value for similar genres)
            // i.e. divide number of genre similarities by total genres.
            {$project: {_id: 1, count: 1, score: {$divide: ["$count", movie.genre.length]}}},
            {$sort: {score: -1}},
        ]).limit(10);


    let movieIDs = simGenreMovieIDs.map(ele => ele._id);

    //find movie objects from aggregation results
    let simGenreMovies = await Movie.find({
        _id: {$in: movieIDs}
    });
    // STEP 2: sort the top 50 movies by similar people
    let similarMovies = {}; //stores number of similar people between each movie and the original

    //get all people associated with the original movie
    let originalMoviePeople = [].concat(movie.writer, movie.director, movie.actor);
    originalMoviePeople = [...new Set(originalMoviePeople)]; //remove duplicates

    //go through list of 50 similar genre movies
    simGenreMovies.forEach(aMovie => {
        similarMovies[aMovie._id] = 0;

        //get all people associated with a similar genre movie
        let otherMoviePeople = [].concat(aMovie.writer, aMovie.director, aMovie.actor);
        otherMoviePeople = [...new Set(otherMoviePeople)]; //remove duplicates

        //check for similarities and add to score in similarMovies obj if similarity exists
        originalMoviePeople.forEach(person => {
            otherMoviePeople.forEach(otherPerson => {
                //convert object IDs to strings for comparison
                if ((person + "") === (otherPerson + "")) {
                    similarMovies[aMovie._id]++;
                }
            })
        })
    });

    // STEP 3: store list of IDs in request
    //use ES10 sort by value: https://stackoverflow.com/questions/1069666/sorting-object-property-by-values
    similarMovies = Object.fromEntries(
        Object.entries(similarMovies).sort(([, a], [, b]) => b - a)
    );

    similarMovies = Object.keys(similarMovies);
    return similarMovies.slice(0, limit);
}

module.exports = getSimilarMovies;
