const mongoose = require('mongoose');
const Schema = mongoose.Schema;

let userSchema = Schema({
    username: {type: String, required: true},
    password: {type: String, required: true},
    contributor: {type: Boolean, required: true},
    peopleFollowing: [{type: Schema.Types.ObjectId, ref: 'Person', required: true}],
    usersFollowing: [{type: Schema.Types.ObjectId, ref: 'User', required: true}],
    moviesWatched: [{type: Schema.Types.ObjectId, ref: 'Movie', required: true}],
    recommendedMovies: [{type: Schema.Types.ObjectId, ref: 'Movie', required: true}],
    notifications: [{type: Schema.Types.ObjectId, ref: 'Notification', required: true}],
    reviews: [{type: Schema.Types.ObjectId, ref: 'Review', required: true}],
    followers: [{type: Schema.Types.ObjectId, ref: 'User', required: true}]
});

let User = mongoose.model("User", userSchema);
module.exports = User;
