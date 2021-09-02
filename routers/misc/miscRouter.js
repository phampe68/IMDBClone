const express = require('express');
const mongoose = require('mongoose');
const pug = require('pug');

const User = require("../../database/data-models/user-model");
const Movie = require('../../database/data-models/movie-model.js');
const checkLogin = require('../users/checkLogin');
const getRecommendedMovies = require("../users/getRecommendedMovies");

let router = express.Router();
router.use(express.urlencoded({extended: true}));
router.use(express.static("public"));
router.use(express.json());


// loads contribute page if user is contributor
const loadContribute = (req, res, next) => {
    User.findOne({_id: req.session.userId}).exec((err, user) => {
        if (!user) {
            res.status(401).redirect("/loginPage");
        }
        if (user.contributor === true) {
            let data = pug.renderFile("./templates/screens/contribute.pug");
            res.status(200).send(data);
        } else {
            res.status(403).redirect("back");
        }
    })
}

// loads default page
const loadHome = async (req, res, next) => {
    const maxMovies = 6; // how many movies to display on the front page

    // get recommended movies
    let user = await User.findById(req.session.userId);
    let recommendedMovieIDs = [];
    await getRecommendedMovies(user, req.session.viewedMovies).then(movieIDs => {recommendedMovieIDs = movieIDs;})
    let recommendedMovies = await Movie.find({'_id': {$in: user.moviesWatched}}).limit(5);

    let randomMovies = await Movie.find().limit(maxMovies - recommendedMovies.length);
    recommendedMovies = recommendedMovies.concat(randomMovies);

    let data = pug.renderFile('./templates/screens/index.pug', {recommendedMovies});
    res.status(200).send(data);
}

// redirects to logged in users page
const loadLoggedInUser = (req, res, next) => {
    res.status(200).redirect(`/users/${req.session.userId}/`);
}
router.get("/", [checkLogin, loadHome]);
router.get("/contribute", [checkLogin, loadContribute]);
router.get("/myProfile", [checkLogin, loadLoggedInUser]);
module.exports = router;
