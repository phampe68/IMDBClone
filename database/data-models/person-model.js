const mongoose = require('mongoose');
const Schema = mongoose.Schema;

let personSchema = Schema({
    name: {type: String, required: true},
    writerFor: [{type: Schema.Types.ObjectId, ref: 'Movie'}],
    actorFor: [{type: Schema.Types.ObjectId, ref: 'Movie'}],
    directorFor: [{type: Schema.Types.ObjectId, ref: 'Movie'}],
    frequentCollaborators: [{type: Schema.Types.ObjectId, ref: 'Person'}],
    numFollowers: {type: Number},
    followers: [{type: Schema.Types.ObjectId, ref: 'User'}]
});

let Person = mongoose.model("Person", personSchema);
module.exports = Person;
