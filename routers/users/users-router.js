const mongoose = require('mongoose');

const pug = require('pug');
const User = require('../../database/data-models/user-model.js');
const Movie = require('../../database/data-models/movie-model.js');
const Person = require('../../database/data-models/person-model.js');
const Notification = require('../../database/data-models/notification-model.js');
const Review = require('../../database/data-models/review-model');
const express = require('express');
const session = require('express-session');
let router = express.Router();

const getSimilarMovies = require('../movies/getSimilarMovies.js');

router.use(session({
    name: "session",
    secret: 'a super duper secret secret',
    saveUninitialized: true,
    //store: new redisStore({ host: 'localhost',port: 6379, client: client,ttl:260})
}))


/**
 * Gets user by id in request
 */
const getUser = (req, res, next) => {

    let id;
    try {
        id = mongoose.Types.ObjectId(req.params.id);
    } catch (err) {
        res.status(404).send("ERROR 404: Could not find user.");
    }

    //find the user
    User.findOne({
        _id: mongoose.Types.ObjectId(id)
    }).exec((err, user) => {
        if (err || !user) {
            res.status(404).send("Could not find user.");
            return;
        }

        req.user = user;
        next();
    })
}


/**
 * use ids in user obj to find relevant data to render the page:
 * - if the user we're loading has a differnet ID than the logged in user, make sure to store that info
 *      - also store whether or not this user is being followed by the logged in user
 *
 */
const loadUser = (req, res, next) => {
    let currUserId = mongoose.Types.ObjectId(req.session.userId);
    let user = req.user;


    Person.find({'_id': {$in: user.peopleFollowing}}).exec((err, peopleFollowing) => {
        User.find({'_id': {$in: user.usersFollowing}}).exec((err, usersFollowing) => {
            Movie.find({'_id': {$in: user.moviesWatched}}).exec((err, moviesWatched) => {
                Movie.find({'_id': {$in: user.recommendedMovies}}).exec((err, recommendedMovies) => {
                    Notification.find({'_id': {$in: user.notifications}}).exec((err, notifications) => {
                        Review.find({'_id': {$in: user.reviews}}).exec((err, reviews) => {
                            //options common for both types of users (logged in, or other)
                            req.options = {
                                user: user,
                                peopleFollowing: peopleFollowing,
                                usersFollowing: usersFollowing,
                                moviesWatched: moviesWatched,
                                recommendedMovies: recommendedMovies,
                                reviews: reviews,
                                notifications: notifications,
                                following: false
                            };

                            //specify loadType to determine which pug file to render
                            if (currUserId.equals(req.user._id)) {
                                req.loadType = "currentUser";
                                next();
                            } else {
                                req.loadType = "otherUser"


                                User.findOne({'_id': currUserId}).exec((err, currUser) => {
                                    //make note if the logged in user is following this user
                                    req.options.following = currUser['usersFollowing'].includes(user._id) === true;

                                    next();

                                })


                            }
                        })
                    })
                })
            })
        })
    })
}


let sendUser = (req, res, next) => {
    res.format({
        "application/json": () => {
            res.status(200).json(req.user);
        },
        "text/html": () => {
            let data = (req.loadType === "currentUser") ? pug.renderFile('./partials/user.pug', req.options) : pug.renderFile("./partials/otherUser.pug", req.options);
            res.status(200).send(data);

        },
    })
}


/**
 * renders page for viewing other user
 */
let other = (req, res) => {
    console.log("rendering another user");

    let currUserId = mongoose.Types.ObjectId(req.session.userId);
    let otherUser = req.options.user;

    User.findOne({'_id': currUserId}).exec((err, currUser) => {
        //make note if the logged in user is following this user
        req.options.following = currUser['usersFollowing'].includes(otherUser._id) === true;

        let data = pug.renderFile("./partials/otherUser.pug", req.options);
        res.send(data);
    })
}


/**
 * Renders page for viewing user that's logged in
 */
let current = (req, res) => {
    console.log("rendering current user");
    let data = pug.renderFile("./partials/user.pug", req.options);
    res.send(data);
}

/**
 * STEP 1: Find all movies that user reviewed with 7 or more stars and get top similar movies for each
 * STEP 2:
 */

let getRecommendedMovies = (req, res, next) => {

    Review.find({})
    next();

}


router.get('/:id/', getUser, loadUser, sendUser);
//router.get('/myProfile/:id/', getUser, loadUser, getRecommendedMovies, current);

module.exports = router;
