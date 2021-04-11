const express = require('express');
const mongoose = require('mongoose');
const pug = require('pug');
const Movie = require('../database/data-models/movie-model.js');
const Person = require('../database/data-models/person-model.js');

const MAX_ITEMS = 50;
const DEFAULT_LIMIT = 50;
let router = express.Router();

const getPerson = (req, res, next) => {
    let id;
    try {
        id = mongoose.Types.ObjectId(req.params.id);
    } catch {
        res.status(404).send("Couldn't find person with id.");
    }


    //find the Person in the db by its id
    Person.findOne({
        _id: id
    }).exec((err, person) => {
        let collaboratorIDs = res.frequentCollaborators;

        // use ids in person obj to find relevant data to render the page:
        Movie.find({'_id': {$in: person.writerFor}}).exec((err, moviesWritten) => {
            Movie.find({'_id': {$in: person.directorFor}}).exec((err, moviesDirected) => {
                Movie.find({'_id': {$in: person.actorFor}}).exec((err, moviesActed) => {
                    Person.find({'_id': {$in: collaboratorIDs}}).exec((err, collaborators) => {
                        let data = pug.renderFile("./partials/person.pug", {
                            person: person,
                            moviesWritten: moviesWritten,
                            moviesDirected: moviesDirected,
                            moviesActed: moviesActed,
                            frequentCollaborators: collaborators,
                        });
                        res.send(data);

                    })


                })
            })
        })
    })
}

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
    if (req.query.hasOwnProperty('name')) {
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


/**
 * get top 5 most frequently collaborators of this person:
 *  works in 3 Steps:
 *  Step 1: get all movies that this person participated in
 *  Step 2: get all people who participated in these movies
 *  Step 3: tally up which people occur the most
 */
const getFrequentCollaborators = (req, res, next) => {
    //extract person id
    let id;
    try {
        id = mongoose.Types.ObjectId(req.params.id);
    } catch {
        res.status(404).send("Couldn't find person with id.");
    }


    Person.findById(id).exec((err, person) => {
        //Step 1: find all movieIDs person was part of
        let movieIDs = [].concat(person.writerFor, person.actorFor, person.directorFor);
        let uniqueMoviesIDs = [...new Set(movieIDs)]; //remove duplicates
        let collaborators = {};


        Movie.find({
            _id: {$in: uniqueMoviesIDs}
        }).exec((err, movies) => {
            //get all people involved in each movie
            movies.forEach(movie => {
                let allCollaborators = [].concat(movie.writer, movie.director, movie.actor);
                let uniqueCollaborators = [...new Set(allCollaborators)]; //remove duplicates (i.e if a person had 2+ roles, only count once)

                //tally people using the collaborators object
                uniqueCollaborators.forEach(collaborator => {
                    if (!collaborators.hasOwnProperty(collaborator))
                        collaborators[collaborator] = 1;
                    else
                        collaborators[collaborator]++;
                })
            })

            //use ES10 to by most frequent sort: https://stackoverflow.com/questions/1069666/sorting-object-property-by-values
            collaborators = Object.fromEntries(
                Object.entries(collaborators).sort(([, a], [, b]) => b - a)
            );

            // store object in res
            res.frequentCollaborators = (Object.keys(collaborators).slice(0, 5));
            next();
        });
    })
}


//specify handlers:
router.get('/:id', getFrequentCollaborators);
router.get('/:id', getPerson);
router.get('/?', queryParser);
router.get('/?', searchPeople);


module.exports = router;
