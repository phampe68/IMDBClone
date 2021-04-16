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

const getRecommendedMovies = require("./getRecommendedMovies");

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
 */
const loadUser = async (req, res, next) => {
    let currUserId = mongoose.Types.ObjectId(req.session.userId);
    let user = req.user;

    let peopleFollowing, usersFollowing, moviesWatched, recommendedMovies, notifications, reviews, recommendedMovieIDs;

    await getRecommendedMovies(user, req.session.viewedMovies).then(movieIDs => {
        recommendedMovieIDs = movieIDs;
    })



    //get all relevant data to render page
    try {
        peopleFollowing = await Person.find({'_id': {$in: user.peopleFollowing}});
        usersFollowing = await User.find({'_id': {$in: user.usersFollowing}});
        moviesWatched = await Movie.find({'_id': {$in: user.moviesWatched}});
        recommendedMovies = await Movie.find({'_id': {$in: recommendedMovieIDs}}) // change this
        notifications = await Notification.find({'_id': {$in: user.notifications}});
        reviews = await Review.find({'_id': {$in: user.reviews}})
    } catch (err) {
        res.status(404).send("Error loading user");
    }
    // load options common for both types of users (logged in, or other)
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

    // specify loadType to determine which pug file to render
    if (currUserId.equals(req.user._id)) {
        req.loadType = "currentUser";
        req.options.seeNotificationsURL = `/users/${user._id}/notifications?page=1`;

        next();
    } else {
        req.loadType = "otherUser"
        User.findOne({'_id': currUserId}).exec((err, currUser) => {
            //make note if the logged in user is following this user
            req.options.following = currUser['usersFollowing'].includes(user._id) === true;
            next();
        })
    }
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


const notificationsPageParser = (req, res, next) => {
    //parse page param
    try {
        if (req.query.hasOwnProperty("page")) {
            let page = Number(req.query.page);
            req.query.page = (page > 1) ? page : 1; // if page <= 1, set to 1, o.w. set to page
        } else {
            req.query.page = 1;
        }
    } catch {
        req.query.page = 1;
    }

    //save the query string
    let queryString = "";
    for (let param in req.query) {
        if (param === "page")
            continue
        queryString += `&${param}=${req.query[param]}`;
    }

    req.queryString = queryString;
    next();
}

/**
 * Gets all the reviews associated with movieID in URL
 */
const getNotifications = (req, res, next) => {
    let urlParts = req.originalUrl.split('/');
    let userID = urlParts[urlParts.indexOf('users') + 1];

    let limit = req.query.limit;
    let page = req.query.page;
    let offset = limit * (page - 1);

    Notification.find({
        user: userID
    }).limit(limit).skip(offset).exec((err, notifs) => {
        if (err) {
            console.log(err);
            res.status(404).send("Couldn't find notifications." + err);
        }
        req.nextURL = `/users/${userID}/notifications?${req.queryString}&page=${page + 1}`;
        req.notifs = notifs;
        next();
    });
}

const sendNotificationsPage = (req, res, next) => {
    res.format({
        "application/json": () => {
            res.status(200).json(req.notifs);
        },
        "text/html": () => {
            let data = pug.renderFile("./partials/notifications.pug", {
                notifications: req.notifs,
                nextURL: req.nextURL
            })
            res.send(data);
        },
    })
}


router.get('/:id/notifications/', notificationsPageParser, getNotifications, sendNotificationsPage);
router.get('/:id/', getUser, loadUser, sendUser);

module.exports = router;
