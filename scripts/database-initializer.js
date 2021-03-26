const movieData = require('../movie-data-10.json');
const mongoose = require("mongoose");
const Schema = mongoose.Schema;

//define schemas for each object:
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
    plot: {type: String}
});
let personSchema = Schema({
    name: {type: String, required: true},
    writerFor: [{type: Schema.Types.ObjectId, ref: 'Movie'}],
    actorFor: [{type: Schema.Types.ObjectId, ref: 'Movie'}],
    directorFor: [{type: Schema.Types.ObjectId, ref: 'Movie'}],
    frequentCollaborators: [{type: Schema.Types.ObjectId, ref: 'Person'}],
    numFollowers: {type: Number},
});
let userSchema = Schema({
    username: {type: String, required: true},
    contributor: {type: Boolean, required: true},
    peopleFollowing: [{type: Schema.Types.ObjectId, ref: 'Person'}],
    usersFollowing: [{type: Schema.Types.ObjectId, ref: 'User'}],
    moviesWatched: [{type: Schema.Types.ObjectId, ref: 'Movie'}],
    recommendedMovies: [{type: Schema.Types.ObjectId, ref: 'Movie'}],
    notifications: [{type: Schema.Types.ObjectId, ref: 'Notification'}],
});
let notificationSchema = Schema({
    text: {type: String},
    relatedID: {type: Schema.Types.ObjectId},
    link: {type: String}

});
let reviewSchema = Schema({
    author: {type: Schema.Types.ObjectId, ref: 'Person'},
    movie: {type: Schema.Types.ObjectId, ref: 'Movie'},
    summaryText: {type: String},
    fullText: {type: String},
    score: {type: Number}
});


// objects that can be extracted from movies json data
let Movie = mongoose.model("Movie", movieSchema);
let allMovies = [];

let Person = mongoose.model("Person", personSchema);
let allPersons = [];

/**
 * create a new person if person with name doesn't exist
 * update person
 */
const addPersonToMovie = (personName, movie, position) => {
    let currPerson = allPersons.find(person => person.name === personName);
    if (currPerson === undefined) {
        let newPerson = new Person();

        newPerson._id = mongoose.Types.ObjectId();
        newPerson.name = personName;
        newPerson.writerFor = [];
        newPerson.actorFor = [];
        newPerson.directorFor = [];
        newPerson.frequentCollaborators = [];
        allPersons.push(newPerson);
    }

    currPerson = allPersons.find(person => person.name === personName);
    let positionMap = {
        "writerFor": "writer",
        "actorFor": "actor",
        "directorFor": "director"
    }
    currPerson[position].push(movie._id);
    movie[positionMap[position]].push(currPerson._id);

}

// generate database colelctions based off movie data:
movieData.forEach(movie => {

    //generate movie obj
    let aMovie = new Movie();
    aMovie._id = mongoose.Types.ObjectId();
    aMovie.title = movie.Title;
    aMovie.year = movie.year;
    aMovie.averageRating = 0;
    aMovie.rated = movie.Rated;
    aMovie.released = movie.Released;
    aMovie.runtime = movie.Runtime;
    aMovie.genre = movie.Genre;
    aMovie.plot = movie.Plot;

    movie.Actors.forEach(actorName => {
        addPersonToMovie(actorName, aMovie, "actorFor");
    })

    //Repeat for directors
    movie.Director.forEach(directorName => {
        addPersonToMovie(directorName, aMovie, "directorFor");
    })

    //Repeat for writers
    movie.Writer.forEach(writerName => {
        addPersonToMovie(writerName, aMovie, "writerFor");
    })

    allMovies.push(aMovie);
});

//connect to database:
mongoose.connect('mongodb://localhost/IMDBClone', {useNewUrlParser: true});

let db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', () => {
    //drop database first
    console.log("Connected to IMDB Clone");

    mongoose.connection.db.dropDatabase((err, results) => {
        if (err) {
            console.log("Error dropping collection. Likely case: collection did not exist (don't worry unless you get other errors...)")
            return;
        } else
            console.log("Cleared movies collection");

        Movie.insertMany(allMovies, (err, result) => {
            if (err) {
                console.log(err);
                return;
            }
            console.log("Successfully added movies");

            Person.insertMany(allPersons, (err, result) => {
                if (err) {
                    console.log(err);
                    return;
                }
                console.log("Successfully added people");
                mongoose.connection.close()
            })
        })
    })
});



