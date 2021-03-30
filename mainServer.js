const express = require('express');
const app = express();
const mongoose = require('mongoose');
const pug = require('pug');


//routers:
let movieRouter = require('./routers/movies-router.js');
let personRouter = require('./routers/persons-router.js');

app.use("/movies", movieRouter);
app.use("/people", personRouter);
app.use(express.static("public"));
app.use(express.json())
app.set("view engine", "pug");

mongoose.connect('mongodb://localhost/IMDBClone', {useNewUrlParser: true});

/**
 * EXAMPLE OBJECTS: Movie, Person, User, Notification, Review
 * (NOTE: for now
 */
let exampleMovie = {
    "id": 0,
    "Title": "Meatballs 4",
    "Year": "1992",
    "Rated": "R",
    "Released": "04 Dec 1992",
    "Runtime": "84 mins",
    "Genre": [
        "Comedy"
    ],
    "Director": [
        0
    ],
    "Writer": [
        0,
        1,
        2
    ],
    "Actors": [
        0,
        0,
        0,
        0
    ],
    "Plot": "Ricky is the hottest water-ski instructor around and he has just be rehired by his former employer/camp to whip up attendance. But the camp is in serious financial trouble and the owner of ...",
    "Awards": "N/A",
    "Poster": "https://m.media-amazon.com/images/M/MV5BZjY1NDZjYjYtZjRmMi00M2NhLTllMDktZDg2ZTRmNDA4Njc5XkEyXkFqcGdeQXVyNjQ4NTg2ODY@._V1_SX300.jpg",
    "Reviews": [
        0,
    ]
}
let examplePerson = {
    name: "Bob Logan",
    id: 0,
    contributions: [
        0
    ],
    numFollowers: 0
}
let exampleUser = {
    username: "exampleUser",
    password: "not_a_secure_password",
    id: 0,
    accountType: "regular",
    peopleFollowing: [
        0
    ],
    usersFollowing: [
        {username: "exampleUser2"},
        {username: "exampleUser3"}
    ],
    moviesWatched: [0, 1],
    recommendedMovies: [
        0, 0, 1
    ],
    notifications: [
        {text: "Followed!"}
    ]
}
let exampleOtherUser = {
    username: "exampleOtherUser",
    password: "not_a_secure_password",
    id: 1,
    accountType: "contributor",
    peopleFollowing: [
        0
    ],
    usersFollowing: [
        0,
        0
    ],
    moviesWatched: [0, 1],
    recommendedMovies: [
        0, 0, 1
    ],
    notifications: [
        0, 0
    ]
}
let exampleReview = {
    id: 0,
    name: "exampleName",
    movie: 1,
    summaryText: "This was an incredible movie. Loved it!",
    fullText: "Extremely good movie with great plot, actors, and writing. I especially loved how Bob Logan managed to act, direct, and write the whole thing!",
    score: 8
}
let exampleNotification = {
    id: 0,
    text: "Jean meadows is part of a new movie!",
    type: "movie",
    relatedID: 0
}

//Start adding route handlers here
//handler for adding recipe
app.get('/', (req, res) => {
    let data = pug.renderFile('./partials/index.pug');
    res.send(data);
})

//page displaying a single user
app.get('/users/myProfile', (req, res) => {
    //use id in param to get a user (for now just use an exampleUser object)
    let id = req.params.id;
    let mainUser = exampleUser;

    //here we would use the ids in our user object to get all the other relevant objects for this page
    //for now we'll just use example objects
    let usersFollowing = [exampleOtherUser, exampleOtherUser];
    let peopleFollowing = [examplePerson, examplePerson, examplePerson];
    let moviesWatched = [exampleMovie];
    let recommendedMovies = [exampleMovie, exampleMovie, exampleMovie];
    let notifications = [exampleNotification, exampleNotification, exampleNotification];

    let data = pug.renderFile("./partials/user.pug", {
        user: mainUser,
        usersFollowing: usersFollowing,
        peopleFollowing: peopleFollowing,
        moviesWatched: moviesWatched,
        recommendedMovies: recommendedMovies,
        notifications: notifications
    })
    res.send(data)
})


//page for viewing another user
app.get(`/users/:id`, (req, res) => {
    let peopleFollowing = [examplePerson, examplePerson, examplePerson];
    let moviesWatched = [exampleMovie];
    let reviewsWritten = [exampleReview];

    let data = pug.renderFile("./partials/otherUser.pug", {
        user: exampleOtherUser,
        peopleFollowing: peopleFollowing,
        moviesWatched: moviesWatched,
        reviewsWritten: reviewsWritten
    });
    res.send(data);
})

/*
//page displaying a single person
app.get('/people/:id', (req, res) => {
    //use id in param to get a person (for now just user examplePerson object)
    let id = req.params.id;

    //here we would use the ids in our person object to get all the other relevant objects for this page
    //for now we'll just use example objects
    let following = exampleUser.peopleFollowing.includes(id);
    let frequentCollaborators = [examplePerson, examplePerson, examplePerson];
    let moviesWritten = [exampleMovie, exampleMovie];
    let moviesDirected = [exampleMovie];
    let moviesActed = [exampleMovie];

    let data = pug.renderFile("./partials/person.pug", {
        person: examplePerson,
        following: following,
        frequentCollaborators: frequentCollaborators,
        moviesWritten: moviesWritten,
        moviesDirected: moviesDirected,
        moviesActed: moviesActed
    })
    res.send(data);
})

 */

//page displaying login form
app.get('/login/', (req, res) => {
    let data = pug.renderFile("./partials/login.pug");
    res.send(data);
})

//page for contribution form
app.get('/contribute/', (req, res) => {
    let data = pug.renderFile("./partials/contribute.pug");
    res.send(data);
})

//page for a single review
app.get(`/reviews/:id`, (req, res) => {
    let data = pug.renderFile("./partials/review.pug", {review: exampleReview});
    res.send(data);
})


app.listen(3000);

console.log("Server listening at http://localhost:3000");
