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
const MAX_ITEMS = 50;

const DEFAULT_LIMIT = 50;
const queryParser = (req, res, next) => {
    let query = {};

    //parse limit param
    try {
        if (req.query.hasOwnProperty("limit")) {

            let limit = Number(req.query.limit);
            req.query.limit = (limit < MAX_ITEMS) ? limit : MAX_ITEMS;

        } else {
            req.query.limit = DEFAULT_LIMIT;
        }
    } catch (err) {
        req.query.limit = DEFAULT_LIMIT;
    }
    if(req.query.hasOwnProperty('name')){
        query.name = {$regex: `.*${req.query.name}.*`, $options: 'i'};
    }
    req.queryObj = query;
    req.next();

}
const searchPeople = (req, res, next) => {
    let query = req.queryObj;
    let limit = req.query.limit;

    Person.find(query).limit(limit).exec((err, results) => {
        if (results === undefined)
            results = [];
        res.send(results);
    });




}


//specify handlers:
router.get('/:id', getPerson);
router.get('/?', queryParser);
router.get('/?', searchPeople);


module.exports = router;
