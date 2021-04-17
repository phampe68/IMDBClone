const mongoose = require('mongoose');
const Schema = mongoose.Schema;

let reviewSchema = Schema({
    author: {type: Schema.Types.ObjectId, ref: 'User', required: true},
    movie: {type: Schema.Types.ObjectId, ref: 'Movie', required: true},
    summaryText: {type: String, minLength: 3},
    fullText: {type: String},
    score: {type: Number, required: true, min: 1}
});

let Review = mongoose.model("Review", reviewSchema);
module.exports = Review;
