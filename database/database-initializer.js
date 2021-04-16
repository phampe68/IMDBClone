const movieData = require('../movie-data-10.json');
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
    aMovie.title = movie.Title;
    aMovie.averageRating = 0;
    aMovie.rated = movie.Rated;
    aMovie.released = movie.Released;
    aMovie.genre = movie.Genre;
    aMovie.year = movie.Year;


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

console.log("All movies generated", allMovies);
//connect to database:
mongoose.connect('mongodb://localhost/IMDBClone', {useNewUrlParser: true});

let db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', () => {
    console.log("Connected to IMDB Clone");
    //drop database first
    mongoose.connection.db.dropDatabase((err, results) => {
        if (err) {
            console.log("Error dropping collection. Likely case: collection did not exist (don't worry unless you get other errors...)")
            return;
        } else
            console.log("Cleared movies collection");

        //add movies
        Movie.insertMany(allMovies, (err, result) => {
            if (err) {
                console.log(err);
                return;
            }
            console.log("Successfully added movies");

            //add people
            Person.insertMany(allPersons, (err, result) => {
                if (err) {
                    console.log(err);
                    return;
                }
                console.log("Successfully added people");

                //add some example users

                //some example users:
                let exampleUser1 = new User({
                    username: "exampleUser1",
                    password: "password",
                    contributor: false,
                    peopleFollowing: [],
                    usersFollowing: [],
                    moviesWatched: [],
                    recommendedMovies: [],
                    notifications: [],
                    reviews: []
                });

                let exampleUser2 = new User({
                    username: "exampleUser2",
                    password: "password",
                    contributor: false,
                    peopleFollowing: [],
                    usersFollowing: [exampleUser1.id],
                    moviesWatched: [],
                    recommendedMovies: [],
                    notifications: [],
                    reviews: []
                });

                exampleUser1.save(function (err) {
                    if (err) {
                        console.log(err);
                        return;
                    }
                    console.log("Saved example user 1.");

                    exampleUser2.save(function (err) {
                        if (err) {
                            console.log(err);
                            return;
                        }
                        console.log("Saved example user 2.");
                        console.log("Finished.");
                        process.exit(0);
                    });
                });
            })
        })
    })
});



