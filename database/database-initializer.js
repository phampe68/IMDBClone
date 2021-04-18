const movieData = require('../movie-data-10.json');
const mongoose = require("mongoose");
const Schema = mongoose.Schema;


//import functions that generate suggestion fields
const getSimilarMovies = require('../routers/movies/getSimilarMovies');
const getFrequentCollaborators = require('../routers/persons/getFrequentCollaborators')


//import data-models
const Movie = require('../database/data-models/movie-model.js');
const Person = require('../database/data-models/person-model.js');
const User = require('../database/data-models/user-model.js');


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

const generateMovies = async () => {
    // generate database colelctions based off movie data:
    for (let i = 0; i < movieData.length; i++) {
        let movie = movieData[i];
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
    }
}


const initializeDB = async () => {
    await generateMovies();
    console.log("Generated all movies");


    //connect to database:
    await mongoose.connect('mongodb://localhost/IMDBClone', {useNewUrlParser: true}).catch(err => {
        console.log(err);
    });
    console.log("Connected to IMDB Clone");

    //drop database
    await mongoose.connection.db.dropDatabase().catch(err => {
        console.log("Error dropping collection. Likely case: collection did not exist", err);
    });
    console.log("Successfully dropped old collection");

    //add movies
    await Movie.insertMany(allMovies).catch(err => {
        console.log("Error adding movies", err);
    })
    console.log("Successfully inserted movies");

    //generate similar movies
    for (let movie of allMovies) {
        await getSimilarMovies(movie).then(similarMovies => {
            movie.similarMovies = similarMovies;
        })
    }

    //re add movies:
    await mongoose.connection.db.dropCollection('movies');
    await Movie.insertMany(allMovies).catch(err => {
        console.log("Error adding movies", err);
    })
    console.log("Successfully inserted movies with similar movies");


    //generate frequent collaborators for each person
    for (let person of allPersons) {
        await getFrequentCollaborators(person).then(collaborators => {
            person.frequentCollaborators = collaborators;
        }).catch(err => {
            console.log("Error getting frequent collaborators", err);
        })
    }

    console.log("Successfully added frequent collaborators");

    //add people
    await Person.insertMany(allPersons).catch(err => {
        console.log("Error adding people", err);
    })


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

    exampleUser1.followers = [exampleUser2._id];

    await exampleUser1.save().catch(err => {
        console.log("Error adding example user1", err);
    });
    console.log("Saved example user 1.");

    await exampleUser2.save().catch(err => {
        console.log("Error adding example user2", err);

    });
    console.log("Saved example user 2.");

    console.log("Finished.");
    process.exit(0);
}


initializeDB();

