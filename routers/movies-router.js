const express = require('express');
const mongoose = require('mongoose');
const pug = require('pug');

const Movie = require('../database/data-models/movie-model.js');
const Person = require('../database/data-models/person-model.js');

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

    let queryString = "";
    for(let param in req.query) {
        if (param === "page")
            continue
        queryString += `&${param}=${req.query[param]}`;
    }

    console.log(queryString);
    req.queryString = queryString;
    //build query string for pagination:


    req.queryObj = query;
    next();
}

const getMovie = (req, res, next) => {
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

        // use ids in movie obj to find relevant data to render the page:

        //TODO : add user functionality, for now leave watched as false
        //let watched = exampleUser.moviesWatched.includes(id);
        let watched = false;

        Person.find({'_id': {$in: movie.actor}}).exec((err, actors) => {
            Person.find({'_id': {$in: movie.director}}).exec((err, directors) => {
                Person.find({'_id': {$in: movie.writer}}).exec((err, writers) => {
                    Movie.find({'_id': {$in: movie.relatedMovies}}).exec((err, relatedMovies) => {
                        let reviews = [];
                        let data = pug.renderFile("./partials/movie.pug", {
                            movie: movie,
                            watched: watched,
                            directors: directors,
                            writers: writers,
                            actors: actors,
                            reviews: reviews,
                            relatedMovies: relatedMovies
                        });
                        res.send(data);
                    })
                })
            })
        })
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


const searchMovie = async (req, res, next) => {
    let query = req.queryObj;
    let limit = req.query.limit;
    let page = req.query.page;
    let offset = limit * (page-1);

    Movie.find(query).limit(limit).skip(offset).exec((err, results) => {
        if (results === undefined)
            results = [];

        let nextURL = `/movies?${req.queryString}&page=${page + 1}`;

        let data = pug.renderFile("./partials/movieSearch.pug", {
            movies: results,
            nextURL
        });


        res.send(data);
    });
}


//specify handlers:
router.get('/:id', getMovie);
router.get('/?', queryParser);
router.get('/?', searchMovie);

module.exports = router;
