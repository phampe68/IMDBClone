const express = require('express');
const mongoose = require('mongoose');
const pug = require('pug');

const Movie = require('../../database/data-models/movie-model.js');
const Person = require('../../database/data-models/person-model.js');
const Review = require('../../database/data-models/review-model.js');
const User = require("../../database/data-models/user-model");

const getSimilarMovies = require('./getSimilarMovies');
let reviewRouter = require('../reviews/reviews-router.js');
let router = express.Router();

const MAX_ITEMS = 50;
const DEFAULT_LIMIT = 10;

/**
 * build a query object based off of query paramaters that will be used to search the database
 *  make sure params are good
 *  - limit: maximum number of pages to send back
 *  - page: page of results to send back
 *  - title: title of movie (search by contains)
 *  - genre: movie genre (search by contains)
 *  - actor name: movie should contain this actor
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
const searchMovie = async (req, res, next) => {
    let query = req.queryObj;
    let limit = req.query.limit;
    let page = req.query.page;
    let offset = limit * (page - 1);


    req.searchResults = await Movie.find(query).skip(offset).limit(limit).catch(err => {
        console.log(err);
        res.status(404).send("Couldn't find search results.");
    });
    let count = await Movie.find(query).count().catch(err => {
        console.log(err);
        res.status(404).send("Couldn't find search results.");
    });

    //make sure user can only navigate to next if there are more results
    if (count <= DEFAULT_LIMIT)
        req.nextURL = `/movies?${req.queryString}&page=${page - 1}`;
    else
        req.nextURL = `/movies?${req.queryString}&page=${page + 1}`;

    next();
}


/**
 * if content type header is application/json,
 * - send json representation of all search results (an array of movie objects)
 * if content type header is text/html,
 * - rendered pug template
 */
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


const loadMovies = async (req, res, next) => {
    let currUserId = mongoose.Types.ObjectId(req.session.userId);
    let movie = req.movie;

    let currUser, actors, directors, writers, reviews, similarMovies, relatedMovies;

    currUser = await User.findOne({'_id': currUserId});
    actors = await Person.find({'_id': {$in: movie.actor}});
    directors = await Person.find({'_id': {$in: movie.director}});
    writers = await Person.find({'_id': {$in: movie.writer}});
    reviews = await Review.find({'_id': {$in: movie.reviews}}).limit(5);

    let watched = currUser['moviesWatched'].includes(movie._id) === true;

    await getSimilarMovies(req.movie, 10).then(simMovies => {
        console.log(simMovies);
        similarMovies = simMovies;
    })

    relatedMovies = await Movie.find({'_id': {$in: similarMovies}});

    //generate template with found data
    req.seeReviewsURL = `/movies/${movie._id}/reviews?page=1`;
    req.options = {
        movie: movie,
        watched: watched,
        directors: directors,
        writers: writers,
        actors: actors,
        reviews: reviews,
        relatedMovies: relatedMovies,
        seeReviewsURL: req.seeReviewsURL
    };
    next();


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
            let data = pug.renderFile("./partials/movie.pug", req.options);

            //keep track of which movies have been viewed so far
            if(req.session.viewedMovies)
                req.session.viewedMovies.push(req.movie);
            else
                req.session.viewedMovies = [req.movie._id];

            console.log(req.session.viewedMovies);
            res.status(200).send(data);

        },
    })
}


//specify handlers:
router.get('/:id', [getMovie, loadMovies, sendMovie]);
router.get('/?', [queryParser, searchMovie, sendSearchResults]);
router.use('/:id/reviews/', reviewRouter);

module.exports = router;
