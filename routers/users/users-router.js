const mongoose = require('mongoose');

const pug = require('pug');
const User = require('../../database/data-models/user-model.js');
const Movie = require('../../database/data-models/movie-model.js');
const Person = require('../../database/data-models/person-model.js');
const Notification = require('../../database/data-models/notification-model.js');
const Review = require('../../database/data-models/review-model');
const express = require('express');

const pageParser = require('../pageParser');

let reviewRouter = require('../reviews/reviews-router.js');
const session = require('express-session');
let router = express.Router();
router.use(express.urlencoded({extended: true}));
router.use(express.static("public"));
router.use(express.json());

const MAX_ITEMS = 50;
const DEFAULT_LIMIT = 10;

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
        Person.find({'_id': {$in: user.peopleFollowing}}).limit(10),
        User.find({'_id': {$in: user.usersFollowing}}).limit(10),
        Movie.find({'_id': {$in: user.moviesWatched}}).limit(10),
        Movie.find({'_id': {$in: recommendedMovieIDs}}).limit(10),
        Notification.find({'_id': {$in: user.notifications}}).limit(10),
        Review.find({'_id': {$in: user.reviews}}).limit(10),
    ]);


    // load options common for both types of users (logged in, or other)
    req.options = {
        user: user,
        peopleFollowing: peopleFollowing,
        usersFollowing: usersFollowing,
        moviesWatched: moviesWatched,
        recommendedMovies: recommendedMovies,
        reviews: reviews,
        notifications: notifications,
        following: false,
        seeReviewsURL: `/users/${user._id}/reviews?page=1`,
        seePeopleFollowingURL: `/users/${user._id}/peopleFollowing?page=1`,
        seeMoviesWatchedURL: `/users/${user._id}/moviesWatched?page=1`
    };


    // specify loadType to determine which pug file to render
    if (currUserId.equals(req.user._id)) {
        req.loadType = "currentUser";
        req.options.seeNotificationsURL = `/users/${user._id}/notifications?page=1`;
        req.options.seeUsersFollowingURL = `/users/${user._id}/usersFollowing?page=1`

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
            let data = (req.loadType === "currentUser") ? pug.renderFile('./templates/screens/user.pug', req.options) : pug.renderFile("./templates/screens/otherUser.pug", req.options);
            res.status(200).send(data);
        },
    })
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

//send a user's notification list as html, or as json.
const sendNotificationsPage = (req, res, next) => {
    res.format({
        "application/json": () => {
            res.status(200).json(req.notifs);
        },
        "text/html": () => {
            let data = pug.renderFile("./templates/screens/notifications.pug", {
                notifications: req.notifs,
                nextURL: req.nextURL
            })
            res.status(200).send(data);
        },
    })
}

//change a user's account type(to/from contributor)
const changeAccountType = async (req, res, next) => {
    let id = mongoose.Types.ObjectId(req.session.userId);
    let user;

    user = await User.findOne({_id: id});
    if (!user) {
        res.status(401).redirect("/loginPage");
    }
    user.contributor = req.contributor;

    user.save(function (err) {
        if (err) throw err;
        console.log("updated account type")
        res.status(204).redirect("/myProfile");
    })
}

//add user x to user y's following list, add user y to user x's followers
const followUser = async (req, res, next) => {
    let user = req.user;
    let other = req.other;
    if (user && other) {
        user["usersFollowing"].push(other._id);
        other["followers"].push(user._id);
    } else {
        res.status(404).send("Required users not found.")
        return;
    }

    user.save(function (err) {
        if (err){
            res.status(500).send("Couldn't save user.")
            return;
        }

        console.log("updated user following list");
    })
    other.save(function (err) {
        if (err){
            res.status(500).send("Couldn't save user.")
            return;
        }
        console.log("updated other user following list");
        res.status(200).send();
    })
}


//remove a user from following list, and remove from other user's followers
const unfollowUser = async (req, res, next) => {
    let user = req.user;
    let other = req.other;
    if (user && other) {
        user["usersFollowing"].pull({_id: other._id});
        other["followers"].pull({_id: user._id});
        console.log(user["usersFollowing"]);
    }

    user.save(function (err) {
        if (err) {
            res.status(500).send("Error saving user.");
        }
    })
    other.save(function (err) {
        if (err) {
            res.status(500).send("Error saving user.");
            return;
        }
        res.status(200).send();

    })
}

//remove a notification from a user's notification list
const deleteNotification = async (req, res, next) => {
    let user, notification;
    user = await User.findOne({_id: req.session.userId});
    notification = await Notification.findOne({_id: req.params.id});
    user["notifications"].pull(notification.id);
    user.save(function (err) {
        if (err) throw err;
        res.status(204).redirect("/myProfile");
    })
}

//middleware to ensure user is logged in
function checkLogin(req, res, next) {
    if (!req.session.userId) {
        console.log("checking")
        res.status(401).redirect("/loginPage");
    }
    next();
}

//search database to find user x and user y
const getUserAndOther = async (req, res, next) => {
    req.user = await User.findOne({'_id': mongoose.Types.ObjectId(req.session.userId)});
    req.other = await User.findOne({'_id': mongoose.Types.ObjectId(req.body.userId)});

    //console.log(req.user, req.other);
    next();
}

//These functions are unnecessary, but they have sentimental value
const setToTrue = (req, res, next) => {
    req.contributor = true;
    next();
}
const setToFalse = (req, res, next) => {
    req.contributor = false;
    next();
}

//load a user's own profile
const loadUsersPage = async (req, res, next) => {
    let currUserId = mongoose.Types.ObjectId(req.session.userId);
    let userID = req.params.id;

    //make sure user is who they say they are
    if (!currUserId.equals(userID)) {
        res.status(403).redirect("back");
    }


    let limit = req.query.limit;
    let page = req.query.page;
    let offset = limit * (page - 1);

    let user = await User.findById(userID);
    let followingUserIDs = user.usersFollowing;

    let followingUsers = await User.find({_id: {$in: followingUserIDs}}).limit(limit).skip(offset);
    let count = await User.find({_id: {$in: followingUserIDs}}).limit(limit).skip(offset).count();


    let resultsLeft = count - ((page - 1) * limit);
    if (resultsLeft <= limit)
        req.nextURL = `/users/${userID}/usersFollowing?${req.queryString}&page=${page}`;
    else
        req.nextURL = `/users/${userID}/usersFollowing?${req.queryString}&page=${page + 1}`;

    req.followingUsers = followingUsers;
    next();
}

//send the users following list, as json or html
const sendUsersPage = (req, res, next) => {
    res.format({
        "application/json": () => {
            res.status(200).json(req.followingUsers);
        },
        "text/html": () => {
            let data = pug.renderFile("./templates/screens/usersFollowing.pug", {
                users: req.followingUsers,
                nextURL: req.nextURL
            })
            res.status(200).send(data);
        },
    })
}

//retrieve user's followed people
const loadPeoplePage = async (req, res, next) => {
    let userID = req.params.id;

    let limit = req.query.limit;
    let page = req.query.page;
    let offset = limit * (page - 1);

    let user = await User.findById(userID);

    let peopleFollowingIDs = user.peopleFollowing;

    let peopleFollowing = await Person.find({_id: {$in: peopleFollowingIDs}}).limit(limit).skip(offset);
    let count = await Person.find({_id: {$in: peopleFollowingIDs}}).limit(limit).skip(offset).count();


    let resultsLeft = count - ((page - 1) * limit);
    if (resultsLeft <= limit)
        req.nextURL = `/users/${userID}/peopleFollowing?${req.queryString}&page=${page}`;
    else
        req.nextURL = `/users/${userID}/peopleFollowing?${req.queryString}&page=${page + 1}`;

    req.peopleFollowing = peopleFollowing;
    next();
}

//send user's followed people as json or html
const sendPeoplePage = (req, res, next) => {
    res.format({
        "application/json": () => {
            res.status(200).json(req.peopleFollowing);
        },
        "text/html": () => {
            let data = pug.renderFile("./templates/screens/peopleFollowing.pug", {
                peopleFollowing: req.peopleFollowing,
                nextURL: req.nextURL
            })
            res.status(200).send(data);
        },
    })
}

//retrieve user's watched movies list
const loadWatchedPage = async (req, res, next) => {
    let userID = req.params.id;

    let limit = req.query.limit;
    let page = req.query.page;
    let offset = limit * (page - 1);

    let user = await User.findById(userID);

    let watchedIDs = user.moviesWatched;

    let moviesWatched = await Movie.find({_id: {$in: watchedIDs}}).limit(limit).skip(offset);
    let count = await Movie.find({_id: {$in: watchedIDs}}).limit(limit).skip(offset).count();

    let resultsLeft = count - ((page - 1) * limit);
    if (resultsLeft <= limit)
        req.nextURL = `/users/${userID}/moviesWatched?${req.queryString}&page=${page}`;
    else
        req.nextURL = `/users/${userID}/moviesWatched?${req.queryString}&page=${page + 1}`;

    req.moviesWatched = moviesWatched;
    next();
}


//send user's watched movies list as json/html
const sendWatchedPage = (req, res, next) => {
    res.format({
        "application/json": () => {
            res.status(200).json(req.moviesWatched);
        },
        "text/html": () => {
            let data = pug.renderFile("./templates/screens/moviesWatched.pug", {
                moviesWatched: req.moviesWatched,
                nextURL: req.nextURL
            })
            res.status(200).send(data);
        },
    })
}
router.get('/:id/moviesWatched', [checkLogin, pageParser, loadWatchedPage, sendWatchedPage]);
router.get('/:id/usersFollowing', [checkLogin, pageParser, loadUsersPage, sendUsersPage]);
router.get('/:id/peopleFollowing', [checkLogin, pageParser, loadPeoplePage, sendPeoplePage]);
router.post('/deleteNotification/:id', checkLogin, deleteNotification);
router.get('/:id/notifications/', checkLogin, pageParser, getNotifications, sendNotificationsPage);
router.get('/:id/', checkLogin, getUser, checkLogin, loadUser, sendUser);
router.put('/followUser', checkLogin, getUserAndOther, followUser);
router.put('/unfollowUser', checkLogin, getUserAndOther, unfollowUser);
router.post('/accountType/true/:id', checkLogin, setToTrue, changeAccountType);
router.post('/accountType/false/:id', checkLogin, setToFalse, changeAccountType);
router.use('/:userID/reviews/', reviewRouter);


/*
router.put('/followUser', (req, res, next) => {
    console.log("METHOD", req.method);
    console.log("BODY", req.body);
})



router.put('/unfollowUser', (req, res, next) => {
    console.log("METHOD", req.method);
    console.log("BODY", req.body);
})
*/





module.exports = router;
