const express = require('express');
const mongoose = require('mongoose');
const pug = require('pug');
const User = require('../../database/data-models/user-model.js');
const Movie = require('../../database/data-models/movie-model.js');
const Person = require('../../database/data-models/person-model.js');
const Notification = require('../../database/data-models/notification-model.js');
const Review = require('../../database/data-models/review-model.js');


let router = express.Router();

const getReview = (req, res, next) => {
    let id;

    try {
        id = mongoose.Types.ObjectId(req.params.id);
    } catch (err) {
        res.status(404).send("ERROR 404: Could not find review.");
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
            let data = pug.renderFile("./partials/review.pug", {
                author: author,
                review: review
            });
            res.send(data);
        })
    })
}



const reviewsPageParser = (req, res, next) => {
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
const getReviews = (req, res, next) => {
    let urlParts = req.originalUrl.split('/');
    let movieID = urlParts[urlParts.indexOf('movies') + 1];

    let limit = req.query.limit;
    let page = req.query.page;
    let offset = limit * (page - 1);

    Review.find({
        movie: movieID
    }).limit(limit).skip(offset).exec((err, reviews) => {
        if (err) {
            console.log(err);
            res.status(404).send("Couldn't find review." + err);
        }


        req.nextURL = `/movies/${movieID}/reviews?${req.queryString}&page=${page + 1}`;
        req.reviews = reviews;
        next();
    });

}
const sendReviewPage = (req, res, next) => {
    console.log(req.nextURL);
    res.format({
        "application/json": () => {
            res.status(200).json(req.reviews);
        },
        "text/html": () => {
            console.log(req.reviews);
            let data = pug.renderFile("./partials/reviewPage.pug", {
                reviews: req.reviews,
                nextURL: req.nextURL
            })
            res.send(data);
        },
    })
}

const addReview = async (req, res, next) => {
    let review = new Review();
    let score;
    if(req.query.hasOwnProperty("score")){
        score = Number(req.query.score);
    }else{req.redirect("back");}
    if(!score){
        req.redirect("back");
    }

    let user = req.user;

    review.author = user._id;
    review.score = score;

    review.movie = req.other._id;

    console.log(`Score: ${review.score}`)

    review.summaryText = req.body.summaryText;
    review.fullText = req.body.fullText;

    console.log(user);
    console.log(req.other);

    user["reviews"].push(review._id);
    req.other["reviews"].push(review._id);


    let notification = new Notification();
    notification.text = user["username"]+" posted a review of " + req.other["title"];
    notification.link = `/movies/${req.other._id}/reviews/${review._id}`;

    let followers;
    followers = await User.find({'_id': {$in: user.followers}});
    let x;
    for (x in followers){
        console.log("Before:");
        console.log(followers[x]);
        followers[x]["notifications"].push(notification._id);
        console.log("After:");
        console.log(followers[x]);
        await followers[x].save(function(err){if(err)throw err;})
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
    //req.score = score;
    //calcAverage(req);
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
    res.redirect(`/movies/${req.query.id}`);
}

function checkLogin (req,res,next){
    if(!req.session.userId){
        console.log("checking")
        res.redirect("/loginPage");
    }
    next();
}

const getUserAndOther = async (req,res,next)=>{
    if(req.query.hasOwnProperty("id")){
        req.other = await Movie.findOne({'_id': mongoose.Types.ObjectId(req.query.id)});
    }
    req.user = await User.findOne({'_id': mongoose.Types.ObjectId(req.session.userId)});
    next();
}

function calcAverage(req){
    let total
    if(req.score){
        total = req.score;
    }
    let i;
    Review.find({'_id': {$in: req.other.reviews}}).exec((err,reviews)=>{
        for(i in reviews){
            total += reviews[i].score;
            console.log(`Rating #${i+1}: ${reviews[i].score}`);
        }
        if(total){
            req.other.averageRating = total/(Number(i)+1);
        }else{req.other.averageRating = 0}
        console.log("Average Rating:");
        console.log(req.other.averageRating);
    })
}


router.post('/addReview?',checkLogin,getUserAndOther,addReview);
router.get('/:id', checkLogin,getReview);
router.get('/', [checkLogin,reviewsPageParser, getReviews, sendReviewPage]);
module.exports = router;
