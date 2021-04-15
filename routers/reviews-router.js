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

    //find the movie in the db by its id
    Review.findOne({
        _id: mongoose.Types.ObjectId(id)
    }).exec((err, review) => {
        if (err || !review) {
            //res.status(404).send("Could not find user.");
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

router.get('/:id', getReview);
module.exports = router;