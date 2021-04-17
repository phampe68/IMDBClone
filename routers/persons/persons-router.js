const mongoose = require('mongoose');
const pug = require('pug');
const Movie = require('../../database/data-models/movie-model.js');
const Person = require('../../database/data-models/person-model.js');
const User = require('../../database/data-models/user-model.js');

const MAX_ITEMS = 50;
const DEFAULT_LIMIT = 50;

const express = require('express');
const session = require('express-session');

let router = express.Router();

router.use(session({
    name: "session",
    secret: 'a super duper secret secret',
    saveUninitialized: true,
    //store: new redisStore({ host: 'localhost',port: 6379, client: client,ttl:260})
}))

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
 * Gets a single person object by its ID
 */
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
        req.person = person;
        next();
    })
}





/**
 * use ids in person obj to find relevant data to render the page:
 * store options for rendering pug template in req
 */
const loadPerson = async (req, res, next) => {
    let person = req.person;
    let currUserId = mongoose.Types.ObjectId(req.session.userId);
    let collaboratorIDs = person.frequentCollaborators;

    let currUser, moviesWritten, moviesDirected, moviesActed, collaborators;

    currUser = await User.findOne({'_id': currUserId});
    moviesWritten = await Movie.find({'_id': {$in: person.writerFor}});
    moviesDirected = await Movie.find({'_id': {$in: person.directorFor}});
    moviesActed = await Movie.find({'_id': {$in: person.actorFor}});
    collaborators = await Person.find({'_id': {$in: collaboratorIDs}});

    let following = currUser['peopleFollowing'].includes(person._id) === true;

    req.options = {
        person: person,
        moviesWritten: moviesWritten,
        moviesDirected: moviesDirected,
        moviesActed: moviesActed,
        frequentCollaborators: collaborators,
        following: following
    };
    next();
}


/**
 * If content type header is text/html, send the rendered pug template,
 * if it's application/json, send the json representation of the person
 */
const sendPerson = (req, res, next) => {
    res.format({
        "application/json": () => {
            res.status(200).json(req.person);
        },
        "text/html": () => {
            let data = pug.renderFile("./partials/person.pug", req.options);
            res.status(200).send(data);
        },
    })
}

function checkLogin (req,res,next){
    if(!req.session.userId){
        console.log("checking")
        res.redirect("/loginPage");
    }
    next();
}

//specify handlers:
router.get('/:id', [checkLogin, getPerson, loadPerson, sendPerson]);
router.get('/?', queryParser);
router.get('/?', searchPeople);


module.exports = router;
