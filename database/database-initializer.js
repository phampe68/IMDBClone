const movieData = require('../movie-data-1000.json');
const mongoose = require("mongoose");
const Schema = mongoose.Schema;

//import data-models
const Movie = require('../database/data-models/movie-model.js');
const Person = require('../database/data-models/person-model.js');
const User = require('../database/data-models/user-model.js');
const Notification = require('../database/data-models/notification-model.js');
const Review = require('../database/data-models/review-model.js');


// collection of movies and people which is extracted from movie data
let allMovies = [];
let allPersons = [];


/**
 * Creates a new person with personName and default values if the person isn't in the allPersons collection
 * - Updates references to that person in movie object (ex: if the person wrote the movie, add their id to the movie obj)
 * - update reference to movie associated with person  (i.e. if the person wrote the movie, also add the movie to the person obj)
 * @param personName: name of person to add
 * @param movie: movie object to update with related person
 * @param position: role person had in movie (i.e. writer, director, actor)
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
        newPerson.numFollowers = 0;
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
    //aMovie._id = mongoose.Types.ObjectId();
    aMovie.title = movie.Title;
    aMovie.year = movie.year;
    aMovie.averageRating = 0;
    aMovie.rated = movie.Rated;
    aMovie.released = movie.Released;
    aMovie.genre = movie.Genre;


    movie.Director.forEach(directorName => {
        addPersonToMovie(directorName, aMovie, "directorFor");
    })
    movie.Writer.forEach(writerName => {
        addPersonToMovie(writerName, aMovie, "writerFor");
    })
    movie.Actors.forEach(actorName => {
        addPersonToMovie(actorName, aMovie, "actorFor");
    })
    aMovie.plot = movie.Plot;
    aMovie.awards = movie.Awards;
    aMovie.poster = movie.Poster;
    aMovie.reviews = [];
    aMovie.runtime = movie.Runtime;
    aMovie.relatedMovies = [];

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
                let exampleUser1 = new User({
                    username: "exampleUser1",
                    password: "password",
                    accountType: "regular",
                    contributor: false,
                    peopleFollowing: [],
                    usersFollowing: [],
                    moviesWatched: [],
                    recommendedMovies: [],
                    notifications: [],
                    reviews: []
                })
                exampleUser1.save(function(err){
                    if(err) throw err;
                    console.log("Saved new user.");
                });
                let exampleUser2 = new User({
                    username: "exampleUser2",
                    password: "password",
                    accountType: "regular",
                    contributor: false,
                    peopleFollowing: [],
                    usersFollowing: [exampleUser1.id],
                    moviesWatched: [],
                    recommendedMovies: [],
                    notifications: [],
                    reviews: []
                })
                exampleUser2.save(function(err){
                    if(err) throw err;
                    console.log("Saved new user.");
                });
            })
        })
    })
});



