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


//specify handlers:
router.get('/:id', getMovie);


module.exports = router;
