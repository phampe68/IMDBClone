const express = require('express');
const mongoose = require('mongoose');
const pug = require('pug');
const Movie = require('../database/data-models/movie-model.js');
const Person = require('../database/data-models/person-model.js');

let router = express.Router();

const getPerson = (req, res, next) => {
    let id = mongoose.Types.ObjectId(req.params.id);

    //find the Person in the db by its id
    Person.findOne({
        _id: id
    }).exec((err, person) => {
        console.log(person);

        // use ids in person obj to find relevant data to render the page:
        Movie.find({'_id': {$in: person.writerFor}}).exec((err, moviesWritten) => {
            Movie.find({'_id': {$in: person.directorFor}}).exec((err, moviesDirected) => {
                Movie.find({'_id': {$in: person.actorFor}}).exec((err, moviesActed) => {
                    Person.find({'_id': {$in: person.frequentCollaborators}}).exec((err, frequentCollaborators) => {
                        let data = pug.renderFile("./partials/person.pug", {
                            person: person,
                            moviesWritten: moviesWritten,
                            moviesDirected: moviesDirected,
                            moviesActed: moviesActed,
                            frequentCollaborators: frequentCollaborators,
                        });
                        res.send(data);
                    })
                })
            })
        })
    })
}


const getActors = (req, res, next) => {
    Person.find(
        {actorFor: {$exists: true, $not: {$size: 0}}}
    ).exec((err, actors) => {
        res.send(actors);
    })
}


//specify handlers:
router.get('/:id', getPerson);
router.get('/actors/', getActors);


module.exports = router;
