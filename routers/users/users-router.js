const mongoose = require('mongoose');

const pug = require('pug');
const User = require('../../database/data-models/user-model.js');
const Movie = require('../../database/data-models/movie-model.js');
const Person = require('../../database/data-models/person-model.js');
const Notification = require('../../database/data-models/notification-model.js');
const Review = require('../../database/data-models/review-model');
const express = require('express');

let reviewRouter = require('../reviews/reviews-router.js');
const session = require('express-session');
let router = express.Router();
router.use(express.urlencoded({extended: true}));
router.use(express.static("public"));
router.use(express.json());

mongoose.connect('mongodb://localhost/IMDBClone', {useNewUrlParser: true});
let db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'))
db.once('open', () => {
    console.log("User router connected");
})

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

    let recommendedMovieIDs = [];
    await getRecommendedMovies(user, req.session.viewedMovies).then(movieIDs => {
        recommendedMovieIDs = movieIDs;
    })
    const [peopleFollowing, usersFollowing, moviesWatched, recommendedMovies, notifications, reviews]
        = await Promise.all([
        Person.find({'_id': {$in: user.peopleFollowing}}),
        User.find({'_id': {$in: user.usersFollowing}}),
        Movie.find({'_id': {$in: user.moviesWatched}}),
        Movie.find({'_id': {$in: recommendedMovieIDs}}),
        Notification.find({'_id': {$in: user.notifications}}),
        Review.find({'_id': {$in: user.reviews}}).limit(10),
    ]);


    // load options common for both types of users (logged in, or other)
    console.log("Notifications:");
    console.log(notifications);
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
        req.options.seeReviewsURL = `/users/${user._id}/revi`
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
const getNotifications = async (req, res, next) => {
    let urlParts = req.originalUrl.split('/');
    let userID = urlParts[urlParts.indexOf('users') + 1];

    let limit = req.query.limit;
    let page = req.query.page;
    let offset = limit * (page - 1);

    let user = await User.findById(userID);


    let notifs = await Notification.find({
        _id: {$in: user.notifications}
    }).limit(limit).skip(offset).catch(err => {
        res.status(404).send("Couldn't find notification.");
    });

    let count = await Notification.find({_id: {$in: user.notifications}}).count();
    let resultsLeft = count - ((page - 1) * limit);
    if (resultsLeft <= limit)
        req.nextURL = `/users/${userID}/notifications?${req.queryString}&page=${page}`;
    else
        req.nextURL = `/users/${userID}/notifications?${req.queryString}&page=${page + 1}`;


    req.notifs = notifs;
    next();


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

const changeAccountType = async (req, res, next) => {
    let id = mongoose.Types.ObjectId(req.session.userId);
    let user;

    user = await User.findOne({_id: id});

    user.contributor = req.contributor;

    user.save(function (err) {
        if (err) throw err;
        console.log("updated account type")
        console.log(req.body);
        res.redirect("/myProfile");
    })
}

const followUser = async (req, res, next) => {
    let user = req.user;
    let other = req.other;
    if (user && other) {
        user["usersFollowing"].push(other._id);
        other["followers"].push(user._id);
    }
    user.save(function (err) {
        if (err) throw err;
        console.log("updated user following list");
    })
    other.save(function (err) {
        if (err) throw err;
        console.log("updated user following list");
        res.redirect(`/users/${other._id}`);
    })
}

const unfollowUser = async (req, res, next) => {
    let user = req.user;
    let other = req.other;
    let from = req.body.from;
    if (user && other) {
        user["usersFollowing"].pull({_id: other._id});
        other["followers"].pull({_id: user._id});
        console.log(user["usersFollowing"]);
    }
    user.save(function (err) {
        if (err) throw err;
    })
    other.save(function (err) {
        if (err) throw err;
        console.log("updated user following list");
        if (from === "profile") {
            res.redirect("/myProfile");
        } else {
            res.redirect(`/users/${other._id}`)
        }
    })
}

const deleteNotification = async (req, res, next) => {
    let user, notification;
    user = await User.findOne({_id: req.session.userId});
    notification = await Notification.findOne({_id: req.params.id});
    user["notifications"].pull(notification.id);
    user.save(function (err) {
        if (err) throw err;
        res.redirect("/myProfile");
    })
}

function checkLogin(req, res, next) {

    if (!req.session.userId) {
        console.log("checking")
        res.redirect("/loginPage");
    }
    next();
}

const getUserAndOther = async (req, res, next) => {
    req.user = await User.findOne({'_id': mongoose.Types.ObjectId(req.session.userId)});
    req.other = await User.findOne({'_id': mongoose.Types.ObjectId(req.params.id)});
    next();
}

const setToTrue = (req, res, next) => {
    req.contributor = true;
    next();
}

const setToFalse = (req, res, next) => {
    req.contributor = false;
    next();
}




const sendUserReviewsPage = (req, res, next) => {

}





router.post('/deleteNotification/:id', checkLogin, deleteNotification);
router.get('/:id/notifications/', checkLogin, notificationsPageParser, getNotifications, sendNotificationsPage);
router.get('/:id/', checkLogin, getUser, checkLogin, loadUser, sendUser);
router.post('/followUser/:id', checkLogin, getUserAndOther, followUser);
router.post('/unfollowUser/:id', checkLogin, getUserAndOther, unfollowUser);
router.post('/accountType/true/:id', checkLogin, setToTrue, changeAccountType);
router.post('/accountType/false/:id', checkLogin, setToFalse, changeAccountType);
router.use('/:userID/reviews/', reviewRouter);
module.exports = router;
