const express = require('express');
const mongoose = require('mongoose');
const pug = require('pug');
const User = require('../database/data-models/user-model.js');
const Movie = require('../database/data-models/movie-model.js');
const Person = require('../database/data-models/person-model.js');
const Notification = require('../database/data-models/notification-model.js');
const Review = require('../database/data-models/review-model.js');

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


router.get('/:id', getReview);
router.get('/', [reviewsPageParser, getReviews, sendReviewPage]);
module.exports = router;
