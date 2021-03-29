const mongoose = require('mongoose');
const Schema = mongoose.Schema;

let userSchema = Schema({
    username: {type: String, required: true},
    contributor: {type: Boolean, required: true},
    peopleFollowing: [{type: Schema.Types.ObjectId, ref: 'Person'}],
    usersFollowing: [{type: Schema.Types.ObjectId, ref: 'User'}],
    moviesWatched: [{type: Schema.Types.ObjectId, ref: 'Movie'}],
    recommendedMovies: [{type: Schema.Types.ObjectId, ref: 'Movie'}],
    notifications: [{type: Schema.Types.ObjectId, ref: 'Notification'}],
});

let User = mongoose.model("User", userSchema);
module.exports = User;