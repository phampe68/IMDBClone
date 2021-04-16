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

/**
 * Gets recommended movies for the logged in user
 */
let getRecommendedMovies = async (user, callback) => {
    //STEP 1: find all reviews by this user with 7 + stars

    Review.find({
        author: user._id,
        score: {"$gte": 7}
    })

    //STEP 2:
    next();

}
