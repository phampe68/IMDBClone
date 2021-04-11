const express = require('express');
const mongoose = require('mongoose');
//const session = require('express-session');
const pug = require('pug');
const User = require('../database/data-models/user-model.js');
const Movie = require('../database/data-models/movie-model.js');
const Person = require('../database/data-models/person-model.js');
const Notification = require('../database/data-models/notification-model.js');

let router = express.Router();

//const app = express();
//app.use(express.static("public"));
//app.use(session({ secret: 'a super duper secret secret'}))

//app.use(express.json())

//app.use(express.urlencoded({extended:true}));


const getUser = (req, res, next) => {
    let id;

    try {
        id = mongoose.Types.ObjectId(req.params.id);
    } catch (err) {
        res.status(404).send("ERROR 404: Could not find user.");
    }

    //find the movie in the db by its id
    User.findOne({
        _id: mongoose.Types.ObjectId(id)
    }).exec((err, user) => {
        if (err || !user) {
            //res.status(404).send("Could not find user.");
            return;
        }

        // use ids in user obj to find relevant data to render the page:

        Person.find({'_id': {$in: user.peopleFollowing}}).exec((err, peopleFollowing) => {
            User.find({'_id': {$in: user.usersFollowing}}).exec((err, usersFollowing) => {
                Movie.find({'_id': {$in: user.moviesWatched}}).exec((err, moviesWatched) => {
                    Movie.find({'_id': {$in: user.recommendedMovies}}).exec((err, recommendedMovies) => {
                        Notification.find({'_id': {$in: user.notifications}}).exec((err, notifications) => {
                            let reviews = [];
                            req.options = {
                                user: user,
                                peopleFollowing: peopleFollowing,
                                usersFollowing: usersFollowing,
                                moviesWatched: moviesWatched,
                                recommendedMovies: recommendedMovies,
                                reviews: reviews,
                                notifications: notifications
                            };
                            next();
                        })
                    })
                })
            })
        })
    })
}

let other = (req, res) => {
    console.log("rendering another user");
    let data = pug.renderFile("./partials/otherUser.pug",req.options);
    res.send(data);
}

let current = (req, res) => {
    console.log("rendering current user");
    let data = pug.renderFile("./partials/user.pug",req.options);
    res.send(data);
}


router.get('/:id/', getUser,other);
router.get('/myProfile/:id/', getUser,current);

module.exports = router;