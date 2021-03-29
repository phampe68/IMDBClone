const mongoose = require('mongoose');
const Schema = mongoose.Schema;

let reviewSchema = Schema({
    author: {type: Schema.Types.ObjectId, ref: 'Person'},
    movie: {type: Schema.Types.ObjectId, ref: 'Movie'},
    summaryText: {type: String},
    fullText: {type: String},
    score: {type: Number}
});

let Review = mongoose.model("Review", reviewSchema);
module.exports = Review;