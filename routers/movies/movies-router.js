const express = require('express');
const mongoose = require('mongoose');
const pug = require('pug');

const Movie = require('../../database/data-models/movie-model.js');
const Person = require('../../database/data-models/person-model.js');
const Review = require('../../database/data-models/review-model.js');
const User = require("../../database/data-models/user-model");
const Notification = require("../../database/data-models/notification-model");

const getSimilarMovies = require('./getSimilarMovies');
const getFrequentCollaborators = require('../persons/getFrequentCollaborators');
const checkLogin = require('../users/checkLogin');

let reviewRouter = require('../reviews/reviews-router.js');
let router = express.Router();
router.use(express.urlencoded({extended:true}));
router.use(express.static("public"));
router.use(express.json());

const MAX_ITEMS = 50;
const DEFAULT_LIMIT = 10;

mongoose.connect('mongodb://localhost/IMDBClone', {useNewUrlParser: true});
let db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'))
db.once('open', () => {})

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


    let searchResults = await Movie.find(query).skip(offset).limit(limit).catch(err => {
        console.log(err);
        res.status(404).send("Couldn't find search results.");
    });

    req.searchResults = searchResults.map(movie => {
        return (
            {
                "_id": movie._id,
                "title": movie.title
            })
    })

    let count = await Movie.find(query).count().catch(err => {
        console.log(err);
        res.status(404).send("Couldn't find search results.");
    });

    //make sure user can only navigate to next if there are more results
    let resultsLeft = count - ((page - 1) * limit);
    if (resultsLeft <= limit)
        req.nextURL = `/movies?${req.queryString}&page=${page}`;
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
            let data = pug.renderFile("./templates/screens/movieSearch.pug", {
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
        res.status(500).send("Internal server error");
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
            return;
        }
        req.movie = movie;
        next();
    })
}

//find objects associated with ids stored in movie
const loadMovies = async (req, res, next) => {
    let currUserId = mongoose.Types.ObjectId(req.session.userId);

    let movie = req.movie;
    let similarMovieIDs = movie.similarMovies;
    let [currUser, actors, directors, writers, reviews, relatedMovies] = await Promise.all([
        User.findOne({'_id': currUserId}),
        Person.find({'_id': {$in: movie.actor}}),
        Person.find({'_id': {$in: movie.director}}),
        Person.find({'_id': {$in: movie.writer}}),
        Review.find({'_id': {$in: movie.reviews}}).limit(5),
        Movie.find({'_id': {$in: similarMovieIDs}})]
    );


    let watched = currUser['moviesWatched'].includes(movie._id) === true;
    let i;
    let total = 0;
    for (i in reviews) {
        total += reviews[i].score;
    }
    //movie.averageRating = total / (Number(i) + 1);

    //generate template with found data
    req.seeReviewsURL = `/movies/${movie._id}/reviews?page=1`;
    req.options = {
        userId: currUserId,
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
            let data = pug.renderFile("./templates/screens/movie.pug", req.options);

            //keep track of which movies have been viewed so far
            if(req.session.viewedMovies)
                req.session.viewedMovies.push(req.movie);
            else
                req.session.viewedMovies = [req.movie._id];

            res.status(200).send(data);

        },
    })
}

//use form data to create a new movie on the server
const addMovie = async (req,res,next) =>{
    console.log("addMovie request body");
    console.log(req.body);
    let writerNames = req.body.writerName;
    let directorNames = req.body.directorName;
    let actorNames = req.body.actorName;

    let movie = new Movie();

    movie.title = req.body.title;
    movie.runtime = req.body.runtime;
    movie.year = req.body.releaseYear;

    console.log(Array.isArray(directorNames));
    console.log(Array.isArray(actorNames));
    console.log(Array.isArray(writerNames));

    //determine whether input is an array, or a single person name
    if(!Array.isArray(directorNames)){
        console.log(directorNames.type);
        await addPersonToMovie(directorNames, movie, "directorFor");
    }
    else{
        for(let a in directorNames){
            await addPersonToMovie(directorNames[a], movie, "directorFor");
        }
    }
    if(!Array.isArray(writerNames)){
        await addPersonToMovie(writerNames, movie, "writerFor");
    }
    else {
        for (let b in writerNames) {
            await addPersonToMovie(writerNames[b], movie, "writerFor");
        }
    }
    if(!Array.isArray(actorNames)){
        await addPersonToMovie(actorNames, movie, "actorFor");
    }
    else {
        console.log("array");
        for (let c in actorNames) {
            await addPersonToMovie(actorNames[c], movie, "actorFor");
        }
    }
    movie.plot = "";
    movie.averageRating = 0;
    await getSimilarMovies(movie).then(similarMovies =>{
        movie.similarMovies = similarMovies;
    })

    movie.save(function(err){
        if(err) throw err;
        console.log("Saved new movie.");
        res.status(201).redirect("back");
    })
}


//find a person based on their name
const getPersonByName = async (name) => {
    let result;
    result = await Person.findOne(
        {
            name: name
        }
    ).catch((err) => {
        //console.log(`Error finding user by name: ${err}`);
        return `Error finding user by name: ${err}`;
    });
    return result;
}



const getUserAndOther = async (req,res,next)=>{
    req.user = await User.findOne({'_id': mongoose.Types.ObjectId(req.session.userId)});
    req.other = await Movie.findOne({'_id': mongoose.Types.ObjectId(req.params.id)});
    next();
}

/**
 * Creates a new person with personName and default values if the person isn't in the allPersons collection
 * - Updates references to that person in movie object (ex: if the person wrote the movie, add their id to the movie obj)
 * - update reference to movie associated with person  (i.e. if the person wrote the movie, also add the movie to the person obj)
 * @param personName: name of person to add
 * @param movie: movie object to update with related person
 * @param position: role person had in movie (i.e. writer, director, actor)
 */
const addPersonToMovie = async (personName, movie, position) => {
    let currPerson;
    currPerson = await getPersonByName(personName);
    if (!currPerson) {
        console.log(`New person's name: ${personName}`)
        let newPerson = new Person();
        newPerson._id = mongoose.Types.ObjectId();
        newPerson.name = personName;
        newPerson.writerFor = [];
        newPerson.actorFor = [];
        newPerson.directorFor = [];
        newPerson.frequentCollaborators = [];
        newPerson.numFollowers = 0;
        currPerson = newPerson;
        console.log("new person added");
    }else{
        let frequentCollaborators;
        frequentCollaborators = await getFrequentCollaborators(currPerson);

        currPerson.frequentCollaborators = frequentCollaborators;

        let notification = new Notification();
        let text;
        if(position === "writerFor"){
            text = "a writer";
        }
        else if(position === "directorFor"){
            text = "a director";
        }
        else{
            text = "an actor";
        }
        notification.text = currPerson["name"] + " was included as " +text+ " in " + movie["title"];
        notification.link = `/movies/${movie._id}`;

        let followers;
        followers = await User.find({'_id': {$in: currPerson.followers}});
        console.log("followers:")
        console.log(followers);

        for (let x in followers) {
            console.log("Before:");
            console.log(followers[x]);
            followers[x]["notifications"].push(notification._id);
            console.log("After:");
            console.log(followers[x]);
            await followers[x].save(function (err) {
                if (err) throw err;
            })
        }

        await notification.save(function (err) {
            if (err) { throw err;
            }
            console.log("Saved new notification.");
            console.log(notification);
            console.log(followers);
        })
    }


    let positionMap = {
        "writerFor": "writer",
        "actorFor": "actor",
        "directorFor": "director"
    }

    console.log(currPerson);
    currPerson[position].push(movie._id);
    console.log()
    movie[positionMap[position]].push(currPerson._id);

    currPerson.save(function(err){
        if(err)throw err;
    })


}

//specify handlers:
router.get('/:id', [checkLogin,getMovie, loadMovies, sendMovie]);
router.get('/?', [checkLogin,queryParser, searchMovie, sendSearchResults]);
router.use('/:movieID/reviews/', reviewRouter);
router.post('/',checkLogin,addMovie);

module.exports = router;
