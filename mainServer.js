const express = require('express');
const session = require('express-session');
const app = express();
const mongoose = require('mongoose');
const pug = require('pug');
//const redis = require('redis');
//const redisStore = require('connect-redis')(session);
//const client  = redis.createClient();


//connect mongoose
mongoose.connect('mongodb://localhost/IMDBClone', {useNewUrlParser: true});
let db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'))
db.once('open', () => {
    console.log("Connected to IMDB Clone");
})
app.set("view engine", "pug");
app.use(express.static("public"));

const User = require('./database/data-models/user-model.js');
const Review = require("./database/data-models/review-model");
const Movie = require("./database/data-models/movie-model");
const Person = require("./database/data-models/person-model");
const Notification = require("./database/data-models/notification-model");

app.use(express.json())
app.set("view engine", "pug");

app.use(session({ name: "session",
    secret: 'a super duper secret secret',
    saveUninitialized: true,
    //store: new redisStore({ host: 'localhost',port: 6379, client: client,ttl:260})
}))

//routers:
let movieRouter = require('./routers/movies/movies-router.js');
let personRouter = require('./routers/persons/persons-router.js');
let userRouter = require('./routers/users/users-router.js');
let reviewRouter = require('./routers/reviews/reviews-router.js');

app.use("/movies", movieRouter);
app.use("/people", personRouter);
app.use("/users", userRouter);
app.use("/reviews", reviewRouter);

//mount routers
app.use("/movies", movieRouter);
app.use("/people", personRouter);
app.use("/users", userRouter);
app.use("/reviews", reviewRouter);

app.use(express.static("public"));
app.use(express.json())
app.use(express.urlencoded({extended:true}));

mongoose.connect('mongodb://localhost/IMDBClone', {useNewUrlParser: true});


//Middleware to ensure that the user is logged in before doing pretty much anything
function checkLogin (req,res,next){
    console.log("checking login");
    console.log(req.session.userId);
    if(!req.session.userId){
        console.log("going to login page")
        res.status(401).redirect("/loginPage");
    }else{
        next();
    }
}

//home page route:
app.get('/', checkLogin,function(req, res) {
    let data
    if(req.session.loggedin === true){
        data = pug.renderFile('./templates/screens/index.pug');
    }else{
        console.log("Redirecting to login page")
        //res.redirect("/loginPage");
    }
    res.status(200).send(data);
})

//page displaying a single user
app.get('/myProfile',checkLogin, function (req, res) {
    if(req.session.loggedin===true){
        console.log(req.session.loggedin);
        console.log(req.session.username);
        console.log(req.session.userId);
        res.status(200).redirect(`/users/${req.session.userId}/`);
    }
    else{
        res.status(401).redirect("/loginPage");
    }
})


//page displaying login form
app.get('/loginPage/', (req, res) => {
    let data = pug.renderFile("./templates/screens/login.pug");
    res.status(200).send(data);
})

//page for contribution form
app.get('/contribute', checkLogin, function(req,res){
    User.findOne({_id: req.session.userId}).exec((err, user) => {
        if(!user){
            res.status(401).redirect("/loginPage");
        }
        if(user.contributor === true){
            let data = pug.renderFile("./templates/screens/contribute.pug");
            res.status(200).send(data);
        }else{res.status(403).redirect("back");}
    })
})

//checks whether a user is signing up or logging in, then passes to respective function
app.post('/login',function(req,res,next){
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
        res.status(401).redirect("/logout");
    }
    console.log("Logging in with credentials:");
    console.log("Username: " + req.body.username);
    console.log("Password: " + req.body.password);

    let user = new User;

    await getUserByName(req.body.username).then(result => {
        if (!result) {
            console.log("Username does not exist");
            res.status(401).redirect("back");
        }
        else{
            user = result;
        }
    })
    if (user.password === password) {
        req.session.username = username;
        req.session.loggedin = true;
        req.session.userId = user.id;
        res.status(200).redirect(`/users/${user.id}`);
        console.log(`Logged in with user id ${req.session.userId}`);
    } else {
        res.status(401).redirect("back");
    }
}


//log a user out of their session
app.get('/logout',function (req,res,next) {
    if(!req.session.loggedin){
        res.status(401);
    }else{
        req.session.loggedin = false;
        req.session.username = false;
        req.session.userId = false;
        res.status(200);
    }
    res.redirect("/loginPage");
    next();
})

//add a new user to database, using username and password
const signup = async(req,res,next) => {
    console.log("Signing up");
    let username = req.body.username;
    let password = req.body.password;

    if (req.session.loggedin) {
        res.status(401).send("Already logged in.");
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
                req.session.userId = newUser.id;
                res.status(201).redirect(`/myProfile`);
            });
        } else {
            res.status(409).send("Username already exists.")
        }
    });
}

//returns a user object by searching for its username in the database
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



/**
 * catch urls that don't exist
 */
const redirectBadURL = (req, res) => {
    res.status(404).send("The requested URL was not found on our server.");
}
app.get('*',redirectBadURL);

app.listen(3000);

console.log("Server listening at http://localhost:3000");
