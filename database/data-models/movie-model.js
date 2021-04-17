const mongoose = require('mongoose');
const Schema = mongoose.Schema;
let movieSchema = Schema({
    title: {type: String, required: true},
    year: {type: Number, required: true},
    rated: {type: String, required: true},
    released: {type: String, required: true},
    runtime: {type: String, required: true},
    genre: {type: [String], required: true},
    averageRating: {type: Number, required: true},
    director: [{type: Schema.Types.ObjectId, ref: 'Person', required: true}],
    actor: [{type: Schema.Types.ObjectId, ref: 'Person', required: true}],
    writer: [{type: Schema.Types.ObjectId, ref: 'Person', required: true}],
    plot: {type: String, required: true},
    awards: [{type: String}],
    poster: {type: String},
    reviews: [{type: Schema.Types.ObjectId, ref: 'Review', required: true}],
});

let Movie = mongoose.model("Movie", movieSchema);
module.exports = Movie;
