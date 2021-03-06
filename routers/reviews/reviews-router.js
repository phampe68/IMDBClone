const express = require('express');
const mongoose = require('mongoose');
const pug = require('pug');
const User = require('../../database/data-models/user-model.js');
const Movie = require('../../database/data-models/movie-model.js');
const Person = require('../../database/data-models/person-model.js');
const Notification = require('../../database/data-models/notification-model.js');
const Review = require('../../database/data-models/review-model.js');
const pageParser = require('../pageParser');
const checkLogin = require('../users/checkLogin');



let router = express.Router({mergeParams: true});
router.use(express.urlencoded({extended: true}));
router.use(express.static("public"));
router.use(express.json());

const MAX_ITEMS = 50;
const DEFAULT_LIMIT = 10;

//find a review based on a review's id. return review's
const getReview = (req, res, next) => {
    let id;

    try {
        id = mongoose.Types.ObjectId(req.params.id);
    } catch (err) {
        res.status(404).send("ERROR 404: Could not find review.");
        return;
    }

    //find the review in the db by its id
    Review.findOne({
        _id: mongoose.Types.ObjectId(id)
    }).exec((err, review) => {
        if (err || !review) {
            res.status(404).send("Could not find Review.");
            return;
        }
        User.findOne({'_id': review.author}).exec((err, author) => {
            let data = pug.renderFile("./templates/screens/review.pug", {
                author: author,
                review: review
            });
            res.status(200).send(data);
        })
    })
}

/**
 * Gets all the reviews associated with movieID in param
 */
const getMovieReviews = async (req, res, next) => {
    let movieID = req.params.movieID;

    let limit = req.query.limit;
    let page = req.query.page;
    let offset = limit * (page - 1);


    let reviews = await Review.find({movie: movieID}).limit(limit).skip(offset);
    let count = await Review.find({movie: movieID}).count();

    if(!reviews||!count){
        res.status(404).send("Request not found");
        return;
    }
    let resultsLeft = count - ((page - 1) * limit);
    if (resultsLeft <= limit)
        req.nextURL = `/movies/${movieID}/reviews?${req.queryString}&page=${page}`;
    else
        req.nextURL = `/movies/${movieID}/reviews?${req.queryString}&page=${page + 1}`;

    req.reviews = reviews;
    next();
}


/**
 * Gets all the reviews associated with userID in param
 */
const getUserReviews = async (req, res, next) => {
    let userID = req.params.userID;


    let limit = req.query.limit;
    let page = req.query.page;
    let offset = limit * (page - 1);

    let reviews = await Review.find({author: userID}).limit(limit).skip(offset);
    let count = await Review.find({author: userID}).count();

    let resultsLeft = count - ((page - 1) * limit);
    if (resultsLeft <= limit)
        req.nextURL = `/users/${userID}/reviews?${req.queryString}&page=${page}`;
    else
        req.nextURL = `/users/${userID}/reviews?${req.queryString}&page=${page + 1}`;



    req.reviews = reviews;
    next();
}

const determineType = (req, res, next) => {
    if (req.params.movieID)
        getMovieReviews(req, res, next);
    else if(req.params.userID)
        getUserReviews(req, res, next);

}

const sendReviewPage = (req, res, next) => {
    //console.log(req.nextURL);
    res.format({
        "application/json": () => {
            res.status(200).json(req.reviews);
        },
        "text/html": () => {
            let data = pug.renderFile("./templates/screens/reviewPage.pug", {
                reviews: req.reviews,
                nextURL: req.nextURL
            })
            res.status(200).send(data);
        },
    })
}

//post a review and add it to the user's and movie's review lists
const addReview = async (req, res, next) => {
    let review = new Review();
    let score;
    if (req.query.hasOwnProperty("score")) {
        score = Number(req.query.score);
    } else {
        res.redirect("back");
    }
    if (!score) {
        res.redirect("back");
    }

    let user = req.user;

    review.author = user._id;
    review.score = score;
    review.authorName = user.username;

    let total = score;

    let i,reviews;
    reviews = await Review.find({'_id': {$in: req.other.reviews}});
    console.log("reviews:");
    console.log(reviews);
    for (i in reviews) {
        total += reviews[i].score;
        console.log(`Rating #${i + 1}: ${reviews[i].score}`);
    }

    console.log("Total:");
    console.log(total);
    console.log("Number:");
    console.log((Number(i) + 2));

    if(Number(i)+1){
        req.other.averageRating = total / (Number(i) + 2);
    }else{
        req.other.averageRating = total
    }

    console.log("Average Rating:");
    console.log(req.other.averageRating);


    review.movie = req.other._id;

    console.log(`Score: ${review.score}`)

    if(req.body.type==="full"){
        review.summaryText = req.body.summaryText;
        review.fullText = req.body.fullText;
        if(review.summaryText ===""||review.fullText===""){
            res.status(400).redirect("back");
            return;
        }
    }

    console.log(user);
    console.log(req.other);

    user["reviews"].push(review._id);
    req.other["reviews"].push(review._id);


    let notification = new Notification();
    notification.text = user["username"] + " posted a review of " + req.other["title"];
    notification.link = `/movies/${req.other._id}/reviews/${review._id}`;

    let followers;
    followers = await User.find({'_id': {$in: user.followers}});
    let x;
    for (x in followers) {
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
        if (err) throw err;
        console.log("Saved new notification.");
        console.log(notification);
        console.log(followers);
    })

    await user.save(function (err) {
        if (err) throw err;
        console.log("Updated user.");
        console.log(user["reviews"]);
    })

    await req.other.save(function (err) {
        if (err) throw err;
        console.log("Updated movie.");
        console.log(req.other["reviews"]);
    })
    await review.save(function (err) {
        if (err) throw err;
        console.log("Saved new review.");
        console.log(review);
    })
    res.status(201).redirect(`/movies/${req.query.id}`);
}


const getUserAndOther = async (req, res, next) => {
    if (req.query.hasOwnProperty("id")) {
        req.other = await Movie.findOne({'_id': mongoose.Types.ObjectId(req.query.id)});
    }
    req.user = await User.findOne({'_id': mongoose.Types.ObjectId(req.session.userId)});
    next();
}



router.post('/addReview?', checkLogin, getUserAndOther, addReview);
router.get('/:id', checkLogin, getReview);
router.get('/', [checkLogin, pageParser, determineType, sendReviewPage]);


module.exports = router;
