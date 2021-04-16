/**
 * STEP 1: Find all movies that user reviewed with 7 or more stars and get top similar movies for each
 * STEP 2:
 */

const pug = require('pug');
const User = require('../../database/data-models/user-model.js');
const Movie = require('../../database/data-models/movie-model.js');
const Person = require('../../database/data-models/person-model.js');
const Notification = require('../../database/data-models/notification-model.js');
const Review = require('../../database/data-models/review-model');
const getSimilarMovies = require("../movies/getSimilarMovies.js");

/**
 * Gets recommended movies for the logged in user
 */
let getRecommendedMovies = async (user, viewedMovies) => {
    let recommendedMovies = [];
    //STEP 1: find all reviews by this user with 7 + stars
    let reviews = await Review.find({
        author: user._id,
        score: {"$gte": 7}
    });

    console.log(user._id);
    console.log(reviews);
    //STEP 2: get 2 similar movies for each highly rated movie
    for (const review of reviews) {
        let movie = await Movie.findById(review.movie);

        await getSimilarMovies(movie, 2).then(similarMovies => {
            recommendedMovies = recommendedMovies.concat(similarMovies);
        })
    }


    if (viewedMovies) {

        //STEP 3: find similar movies to previously viewed movies
        for (const movieID of viewedMovies) {
            let movie = await Movie.findById(movieID);

            await getSimilarMovies(movie, 4).then(similarMovies => {
                recommendedMovies = recommendedMovies.concat(similarMovies);
            })
        }
    }


    recommendedMovies = [...new Set(recommendedMovies)]; //remove any duplicates
    recommendedMovies = recommendedMovies.slice(0,10); //limit to 10 movies
    return recommendedMovies;
}
module.exports = getRecommendedMovies;
