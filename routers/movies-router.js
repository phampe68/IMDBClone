const express = require('express');
const mongoose = require('mongoose');
const pug = require('pug');
const Movie = require('../database/data-models/movie-model.js');
const Person = require('../database/data-models/person-model.js');

let router = express.Router();

const getMovie = (req, res, next) => {
    let id = mongoose.Types.ObjectId(req.params.id);

    //find the movie in the db by its id
    Movie.findOne({
        _id: id
    }).exec((err, movie) => {
        console.log(movie);

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
    let query = {};

    //build a query based on query params
    if (req.query.hasOwnProperty("title"))
        query.title = {$regex: `.*${req.query.title}.*`, $options: 'i'};
    if (req.query.hasOwnProperty("genre"))
        query.genre = {$regex: `.*${req.query.genre}.*`, $options: 'i'};
    if (req.query.hasOwnProperty("actorName")) {
        //find id associated with actorName
        await getPersonIDByName(req.query.actorName).then(id => {
            query.actor = id;
            console.log(id);
        });
    }


    Movie.find(query).exec((err, results) => {
        if (results === undefined)
            results = [];

       // console.log(query, results);
        let data = pug.renderFile("./partials/movieSearch.pug", {
            movies: results
        });

        res.send(data);
    });
}



//specify handlers:
router.get('/:id', getMovie);
router.get('/?', searchMovie);

module.exports = router;
