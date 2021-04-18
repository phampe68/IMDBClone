const mongoose = require('mongoose');
const Schema = mongoose.Schema;
let movieSchema = Schema({
    title: {type: String, required: true},
    year: {type: Number, required: true},
    rated: {type: String},
    released: {type: String},
    runtime: {type: String, required: true},
    genre: {type: [String], required: true},
    averageRating: {type: Number},
    director: [{type: Schema.Types.ObjectId, ref: 'Person', required: true}],
    actor: [{type: Schema.Types.ObjectId, ref: 'Person', required: true}],
    writer: [{type: Schema.Types.ObjectId, ref: 'Person', required: true}],
    similarMovies: [{type: Schema.Types.ObjectId, ref: 'Movie'}],
    plot: {type: String},
    awards: [{type: String}],
    poster: {type: String},
    reviews: [{type: Schema.Types.ObjectId, ref: 'Review'}],
});

let Movie = mongoose.model("Movie", movieSchema);
module.exports = Movie;
