const express = require('express');
const session = require('express-session');
const app = express();
const mongoose = require('mongoose');
const pug = require('pug');
//const redis = require('redis');
//const redisStore = require('connect-redis')(session);
//const client  = redis.createClient();


mongoose.connect('mongodb://localhost/IMDBClone', {useNewUrlParser: true});

let db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'))
db.once('open', () => {
    console.log("Connected to IMDB Clone");
})


app.use(express.static("public"));

const User = require('./database/data-models/user-model.js');
const Review = require("./database/data-models/review-model");
const Movie = require("./database/data-models/movie-model");
const Person = require("./database/data-models/person-model");

app.use(express.json())
app.set("view engine", "pug");

app.use(session({ name: "session",
    secret: 'a super duper secret secret',
    saveUninitialized: true,
    //store: new redisStore({ host: 'localhost',port: 6379, client: client,ttl:260})
}))

//routers:
let movieRouter = require('./routers/movies-router.js');
let personRouter = require('./routers/persons-router.js');
let userRouter = require('./routers/users-router.js');
let reviewRouter = require('./routers/reviews-router.js');

app.use("/movies", movieRouter);
app.use("/people", personRouter);
app.use("/users", userRouter);
app.use("/reviews", reviewRouter);

app.use(express.urlencoded({extended:true}));

mongoose.connect('mongodb://localhost/IMDBClone', {useNewUrlParser: true});




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
    User.findOne({_id: req.session.userID}).exec((err, user) => {
        if(err||!user){
            console.log(`Error finding user with id ${req.session.userID}`)
        }
        if(user.contributor === true){
            let data = pug.renderFile("./partials/contribute.pug");
            res.send(data);
        }
    })

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
        res.redirect("/loginPage");
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
                res.redirect(`/myProfile`);
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

app.post("/addMovie",(req,res,next)=> {
    let title = req.body.title;
    let runtime = req.body.runtime;
    let releaseYear = req.body.releaseYear;
    let writers = req.body.writers;
    let directors = req.body.directors;
    let actors = req.body.actors;

    let movie = new Movie();
    movie.title = title;
    movie.runtime = runtime;
    movie.year = releaseYear;
    movie.writers = writers;
    movie.directors = directors;
    movie.actors = actors;

    Movie.save(movie,(err,result)=>{
        if(err) throw err;
        console.log("Saved new movie.");
    })
})

app.post("/addPerson",(req,res,next)=> {
    let name = req.body.name;
    Person.findOne({name:name}).exec((err,person)=>{
        if(!person){
            let newPerson = new Person();
            newPerson.name = name;
            newPerson.save(function (err) {
                if(err) throw err;
                console.log("Saved new person");
            })
        }
    });
})

app.post("/addReview/:id/",(req,res,next)=>{
    review = new Review();
    let score = parseInt(req.body.action);
    let id = mongoose.Types.ObjectId(req.params.id);
    User.findOne({_id:req.session.userID}).exec((err,user)=> {
        Movie.findOne({_id: id}).exec((err, movie) => {
            review.author = user._id;
            review.score = score;
            console.log(`Score: ${review.score}`)

            review.summaryText = req.body.summaryText;
            review.fullText = req.body.fullText;

            console.log(user);
            console.log(movie);

            user["reviews"].push(review._id);
            movie["reviews"].push(review._id);

            user.save(function (err) {
                if (err) throw err;
                console.log("Updated user.");
            });
            movie.save(function (err) {
                if (err) throw err;
                console.log("Updated movie.");
            });
            review.save(function (err) {
                if (err) throw err;
                console.log("Saved new review.");
                res.redirect(`/movies/${req.params.id}`);
            });
            console.log(req.body);
        })

    })
})

app.post("/accountType/:id",(req,res,next)=>{
    let id = mongoose.Types.ObjectId(req.params.id);
    console.log(req.body);
    User.findOne({_id: id}).exec((err, user) => {
        if(req.body.accountTypeRadio === "true"){
            user.contributor = true;
        }else{
            user.contributor = false;
        }
        user.save(function(err){
            if(err) throw err;
            console.log("updated account type")
        })
    })
})

app.post("/followUser/:id",(req,res,next)=> {
    let userID = mongoose.Types.ObjectId(req.session.userID);
    let otherID = mongoose.Types.ObjectId(req.params.id);

    User.findOne({'_id': userID}).exec((err, user) => {
        User.findOne({'_id': otherID}).exec((err, other) => {
            if(user&&other){
                user["usersFollowing"].push(other._id);
            }
            user.save(function(err){
                if(err) throw err;
                console.log("updated user following list");
                res.redirect(`/users/${otherID}`);
            })
        })
    })
})

app.post("/unfollowUser/:id",(req,res,next)=> {
    let userID = mongoose.Types.ObjectId(req.session.userID);
    let otherID = mongoose.Types.ObjectId(req.params.id);
    let from = req.body.from;
    console.log(`UserID ${userID} is attempting to unfollow ${otherID} from ${from}`);
    User.findOne({'_id': userID}).exec((err, user) => {
        User.findOne({'_id': otherID}).exec((err, other) => {
            if(user&&other){
                user["usersFollowing"].pull({_id: other._id});
                console.log(user["usersFollowing"]);
            }
            user.save(function(err){
                if (err) throw err;
                if(from === "profile"){
                    res.redirect("/myProfile");
                }else{
                    res.redirect(`/users/${otherID}`)
                }
            })
        })
    })
})

app.post("/followPerson/:id",(req,res,next)=> {
    let userID = mongoose.Types.ObjectId(req.session.userID);
    let otherID = mongoose.Types.ObjectId(req.params.id);

    User.findOne({'_id': userID}).exec((err, user) => {
        Person.findOne({'_id': otherID}).exec((err, other) => {
            if(user&&other){
                user["peopleFollowing"].push(other._id);
            }
            user.save(function(err){
                if(err) throw err;
                console.log("updated person following list");
                res.redirect(`/people/${otherID}`);
            })
        })
    })
})

app.post("/unfollowPerson/:id",(req,res,next)=> {
    let userID = mongoose.Types.ObjectId(req.session.userID);
    let otherID = mongoose.Types.ObjectId(req.params.id);
    let from = req.body.from;
    console.log(`UserID ${userID} is attempting to unfollow ${otherID} from ${from}`);
    User.findOne({'_id': userID}).exec((err, user) => {
        Person.findOne({'_id': otherID}).exec((err, other) => {
            if(user&&other){
                user["peopleFollowing"].pull({_id: other._id});
                console.log(user["peopleFollowing"]);
            }
            user.save(function(err){
                if (err) throw err;
                if(from === "profile"){
                    res.redirect("/myProfile");
                }else{
                    res.redirect(`/people/${otherID}`)
                }
            })
        })
    })
})

app.listen(3000);

console.log("Server listening at http://localhost:3000");
