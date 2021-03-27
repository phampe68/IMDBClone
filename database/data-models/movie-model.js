const mongoose = require('mongoose');
const Schema = mongoose.Schema;
let movieSchema = Schema({
    title: {type: String, required: true},
    year: {type: String},
    averageRating: {type: Number},
    rated: {type: String},
    released: {type: String},
    runtime: {type: String},
    genre: [String],
    director: [{type: Schema.Types.ObjectId, ref: 'Person'}],
    actor: [{type: Schema.Types.ObjectId, ref: 'Person'}],
    writer: [{type: Schema.Types.ObjectId, ref: 'Person'}],
    plot: {type: String},
    awards: [{type: String}],
    poster: {type: String},
    reviews: [{type: Schema.Types.ObjectId, ref: 'Review'}],
    relatedMovies: [{type: Schema.Types.ObjectId, ref: 'Movie'}]
});

let Movie = mongoose.model("Movie", movieSchema);
module.exports = Movie;
