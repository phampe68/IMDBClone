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
            let data = pug.renderFile("./partials/review.pug",{
                author: author,
                review: review
            });
            res.send(data);
        })
    })
}

const getReviewPage = (req, res, next) => {
    let urlParts = req.originalUrl.split('/');
    let movieID = urlParts[urlParts.indexOf('movies') + 1];

    Review.find({
        movie: movieID
    }).exec((err, reviews) => {
        let data = pug.renderFile('./partials/reviewPage.pug', {
            reviews
        });

        res.send(data);
    })


}



router.get('/:id', getReview);
router.get('/', getReviewPage);
module.exports = router;
