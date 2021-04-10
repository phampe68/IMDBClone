const express = require('express');
const session = require('express-session');
const app = express();
const mongoose = require('mongoose');
const pug = require('pug');


//routers:
let movieRouter = require('./routers/movies-router.js');
let personRouter = require('./routers/persons-router.js');
let userRouter = require('./routers/users-router.js');

mongoose.connect('mongodb://localhost/IMDBClone', {useNewUrlParser: true});

let db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'))
db.once('open', () => {
    console.log("Connected to IMDB Clone");
})

app.use("/movies", movieRouter);
app.use("/people", personRouter);
app.use("/users", userRouter);
app.use(express.static("public"));

const User = require('./database/data-models/user-model.js');
const Review = require("./database/data-models/review-model");

app.use(express.json())
app.set("view engine", "pug");

app.use(session({ name: "session", secret: 'a super duper secret secret'}))

app.use(express.urlencoded({extended:true}));

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
    let data
    if(req.session.loggedin === true){
        data = pug.renderFile('./partials/index.pug');
    }else{
        console.log("Redirecting to login page")
        res.redirect("/loginPage");
    }
    res.send(data);
})

//page displaying a single user
app.get('/myProfile', (req, res) => {
    //console.log("ayo");
    if(req.session.loggedin===true){
        console.log(req.session.loggedin);
        console.log(req.session.username);
        console.log(req.session.userID);
        res.redirect(`/users/myProfile/${req.session.userID}/`);
    }
    else{
        res.redirect("/loginPage");
    }
})


//page displaying login form
app.get('/loginPage/', (req, res) => {
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

app.post("/login/", function(req,res,next){
    //determine which button was used on login form
    if(req.body.action==="login"){
        login(req,res,next);
    }else{
        signup(req,res,next);
    }
});

//receive and authenticate user credentials, set session user
const login = async(req,res,next) => {
    console.log("Logging in");
    let username = req.body.username;
    let password = req.body.password;

    if (req.session.loggedin) {
        res.redirect("/logout");
    }
    console.log("Logging in with credentials:");
    console.log("Username: " + req.body.username);
    console.log("Password: " + req.body.password);

    let user = new User;

    await getUserByName(req.body.username).then(result => {
        if (!result) {
            console.log("Username does not exist");
            return;
        }
        else{
            user = result;
        }
    })
    if (user.password === password) {
        req.session.username = username;
        req.session.loggedin = true;
        req.session.userID = user.id;
        res.redirect(`/users/myProfile/${user.id}`);
        console.log(`Logged in with user id ${req.session.userID}`);
        //res.status(200).send("Logged in");
    } else {
        console.log("Login unauthorized. Invalid password");
    }
}

//log a user out of their session
app.get("/logout", (req,res,next) => {
    if(!req.session.loggedin){
        res.status(200).send("Already logged out.");
    }else{
        req.session.loggedin = false;
        req.session.username = false;
        req.session.userID = false;
        console.log("successfully logged out");
        res.redirect("loginPage");
    }
    next();
})

//add a new user to database, using username and password
const signup = async(req,res,next) => {
    console.log("Signing up");
    let username = req.body.username;
    let password = req.body.password;

    if (req.session.loggedin) {
        res.status(200).send("Already logged in.");
        return;
    }

    await getUserByName(req.body.username).then(user => {
        console.log("ayo");
        //ensure username is unique
        if (!user) {
            //res.status(200).send("Authorized, username does not exist");
            console.log("Signing up with credentials:");
            console.log("Username: " + req.body.username);
            console.log("Password: " + req.body.password);

            let newUser = new User({
                username: username,
                password: password,
                accountType: "regular",
                contributor: false,
                peopleFollowing: [],
                usersFollowing: [],
                moviesWatched: [],
                recommendedMovies: [],
                notifications: [],
                reviews: []
            })
            newUser.save(function (err) {
                if (err) throw err;
                console.log("Saved new user.");
                req.session.username = username;
                req.session.loggedin = true;
                req.session.userID = newUser.id;
                res.redirect(`/users/${newUser.id}`);
            });
        } else {
            res.status(401).send("Username already exists.")
        }
    });
}

const getUserByName = async (userName) => {
    return User.findOne(
        {
            username: {$regex: `.*${userName}.*`, $options: 'i'}
        }
    ).exec().then((result) => {
        //console.log(`User found: ${result}`);
        return result;
    }).catch((err) => {
        //console.log(`Error finding user by name: ${err}`);
        return `Error finding user by name: ${err}`;
    });
}

app.post("/movies/addReview/:id/",(req,res,next)=>{
    review = new Review();
    if(req.body.action === "basic"){
        review.summaryText = "";
        review.fullText = "";
    }
    console.log(req.body);
})

app.listen(3000);

console.log("Server listening at http://localhost:3000");
