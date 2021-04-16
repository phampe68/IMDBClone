const express = require('express');
const mongoose = require('mongoose');
const pug = require('pug');

const Movie = require('../database/data-models/movie-model.js');
const Person = require('../database/data-models/person-model.js');
const Review = require('../database/data-models/review-model.js');
let reviewRouter = require('../routers/reviews-router.js');

let router = express.Router();


/**
 * build a query object based off of query paramaters that will be used to search the database
 *  make sure params are good
 *  - limit: maximum number of pages to send back
 *  - page: page of results to send back
 *  - title: title of movie (search by contains)
 *  - genre: movie genre (search by contains)
 *  - actor name: movie should contain this actor
 */
const MAX_ITEMS = 50;
const DEFAULT_LIMIT = 10;


/**
 * parses query params into a query object
 */
const queryParser = async (req, res, next) => {
    let query = {};

    //parse limit param
    try {
        if (req.query.hasOwnProperty("limit")) {
            let limit = Number(req.query.limit);
            req.query.limit = (limit < MAX_ITEMS) ? limit : MAX_ITEMS;
        } else {
            req.query.limit = DEFAULT_LIMIT;
        }
    } catch {
        req.query.limit = DEFAULT_LIMIT;
    }

    //parse page param
    try {
        if (req.query.hasOwnProperty("page")) {
            let page = Number(req.query.page);
            req.query.page = (page > 1) ? page : 1;
        } else {
            req.query.page = 1;
        }
    } catch {
        req.query.page = 1;
    }

    //parse title, genre, and actor name
    if (req.query.hasOwnProperty("title"))
        query.title = {$regex: `.*${req.query.title}.*`, $options: 'i'};
    if (req.query.hasOwnProperty("genre"))
        query.genre = {$regex: `.*${req.query.genre}.*`, $options: 'i'};
    if (req.query.hasOwnProperty("actorName")) {
        //find id associated with actorName
        await getPersonIDByName(req.query.actorName).then(id => {
            query.actor = id;
        });
    }

    //save the query string
    let queryString = "";
    for (let param in req.query) {
        if (param === "page")
            continue
        queryString += `&${param}=${req.query[param]}`;
    }

    req.queryString = queryString;
    req.queryObj = query;
    next();
}

/**
 * Finds movies that match query object generated from queryParser and generate template
 */
const searchMovie = (req, res, next) => {
    let query = req.queryObj;
    let limit = req.query.limit;
    let page = req.query.page;
    let offset = limit * (page - 1);

    Movie.find(query).limit(limit).skip(offset).exec((err, results) => {
        //link to navigate to next page
        req.nextURL = `/movies?${req.queryString}&page=${page + 1}`;
        req.searchResults = results;

        next();
    });
}


const sendSearchResults = (req, res, next) => {
    res.format({
        "application/json": () => {
            res.status(200).json(req.searchResults);
        },
        "text/html": () => {
            let data = pug.renderFile("./partials/movieSearch.pug", {
                movies: req.searchResults,
                nextURL: req.nextURL
            });
            res.status(200).send(data);
        }
    })
}




/**
 * Asynchronous function for finding a person's ID given their name
 *  - helper for search function
 * @param personName
 * @returns promise containing found ID
 */
const getPersonIDByName = async (personName) => {
    return Person.findOne(
        {
            name: {$regex: `.*${personName}.*`, $options: 'i'}
        }
    ).exec().then((result) => {
        return result._id;
    }).catch((err) => {
        return `Error finding person ID by name: ${err}`;
    });
}


/**
 * Given a movieID in the URL, find a movie object with the associated ID
 * return 404 if not found
 */
const getMovie = (req, res, next) => {
    //extract ID from request param
    let id;
    try {
        id = mongoose.Types.ObjectId(req.params.id);
    } catch (err) {
        res.status(404).send("ERROR 404: Could not find movie.");
    }

    //find the movie in the db by its id
    Movie.findOne({
        _id: mongoose.Types.ObjectId(id)

    }).exec((err, movie) => {
        if (err || !movie) {
            res.status(404).send("Could not find movie.");
        }

        req.movie = movie;
        next();
    })
}


/**
 * Get movies that are similar genre and have similar actors
 *  - STEP 1: get top 50 movies by genre similarity using aggregation pipeline
 *  - STEP 2: sort the top 50 movies by similar people
 *  - STEP 3: store list of IDs in request
 */
const getSimilarMovies = (req, res, next) => {
    let movie = req.movie;

    /* STEP 1: get top 50 movies by genre similarity using aggregation pipeline
    see: https://stackoverflow.com/questions/41491393/query-for-similar-array-in-mongodb
     */
    Movie.aggregate(
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
        ]).limit(50)
        .exec((err, res) => {
            let movieIDs = res.map(ele => ele._id);

            //find movie objects from aggregation results
            Movie.find({
                _id: {$in: movieIDs}
            }).exec((err, simGenreMovies) => {
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

                //only keep top 10 movies
                req.similarMovies = Object.keys(similarMovies).slice(0, 10);
                next();
            })
        });
}


/**
 * Renders a pug template of a movie
 * @param req: contains the movie object needed to generate the template
 * @return callback: a callback containing rendered pug with all movie data
 */
const createMovieTemplate = (req, callback) => {
    //TODO : add user functionality, for now leave watched as false
    //let watched = exampleUser.moviesWatched.includes(id);
    let watched = false;
    let movie = req.movie;
    //find actors
    Person.find({'_id': {$in: movie.actor}}).exec((err, actors) => {
        //find directors
        Person.find({'_id': {$in: movie.director}}).exec((err, directors) => {
            //find movies
            Person.find({'_id': {$in: movie.writer}}).exec((err, writers) => {
                //find related movies (list of IDs stored in req)
                Movie.find({'_id': {$in: req.similarMovies}}).exec((err, relatedMovies) => {
                    //TODO: add review functionality
                    Review.find({'_id': {$in: movie.reviews}}).exec((err, reviews) => {
                        //generate template with found data
                        let data = pug.renderFile("./partials/movie.pug", {
                            movie: movie,
                            watched: watched,
                            directors: directors,
                            writers: writers,
                            actors: actors,
                            reviews: reviews,
                            relatedMovies: relatedMovies
                        });
                        return callback(data);
                    })
                })
            })
        })
    })
}


/**
 * If content type header is text/html, send the rendered pug template,
 * if it's application/json, send the json representation of the movie
 */
const sendMovie = (req, res, next) => {
    res.format({
        "application/json": () => {
            res.status(200).json(req.movie);
        },
        "text/html": () => {
            createMovieTemplate(req, (data) => {
                res.send(data);
            })
        },
    })
}



//specify handlers:
router.get('/:id', [getMovie, getSimilarMovies, sendMovie]);
router.get('/?', [queryParser, searchMovie, sendSearchResults]);
router.use('/:id/reviews/', reviewRouter);

module.exports = router;
