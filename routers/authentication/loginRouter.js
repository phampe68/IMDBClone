const express = require('express');
const mongoose = require('mongoose');
const pug = require('pug');

const User = require("../../database/data-models/user-model");
const checkLogin = require('../users/checkLogin');

let router = express.Router();
router.use(express.urlencoded({extended: true}));
router.use(express.static("public"));
router.use(express.json());

mongoose.connect('mongodb://localhost/IMDBClone', {useNewUrlParser: true});
let db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'))
db.once('open', () => {
})

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


// sign in a user return 401 if bad credentials, 200 otherwise
const signIn = async (req, res, next) => {
    let username = req.body.username;
    let password = req.body.password;

    //if the user is already logged in, just redirect to home page
    if (req.session.loggedin) {
        res.status(200).redirect("/");
        return;
    }

    let user = await getUserByName(username);

    // check if there's no user
    if(!user){
        res.status(401).send("Username does not exist");
        return;
    }

    // check if the password is correct
    if (user.password === password) {
        req.session.username = username;
        req.session.loggedin = true;
        req.session.userId = user.id;
        res.status(200).redirect(`/users/${user.id}`);
        console.log(`Logged in with user id ${req.session.userId}`);
    } else {
        console.log("SHOULD BE 401");
        res.status(401).send("Password is incorrect");
    }
}


// sign up a new user and log them in after (keep them in the session)
const signUp = async (req, res, next) => {
    let username = req.body.username;
    let password = req.body.password;

    //check if user is already logged in
    if (req.session.loggedin) {
        res.status(200).redirect("back");
        return;
    }

    // make sure username is unique
    let databaseUsername = await getUserByName(username);
    if (databaseUsername) {
        res.status(409).send("Username Already Exists");
        return;
    }

    // create new user object
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

    //save the new user and redirect
    newUser.save(function (err) {
        if (err) throw err;
        console.log("Saved new user.");
        req.session.username = username;
        req.session.loggedin = true;
        req.session.userId = newUser.id;
        res.status(201).redirect(`/myProfile`);
    });
}


// displays sign in form
const loadSignUp = (req, res, next) => {
    let data = pug.renderFile("./templates/screens/signUp.pug");
    res.status(200).send(data);
}

// displays login form
const loadLogin = (req, res, next) => {
    let data = pug.renderFile("./templates/screens/login.pug");
    res.status(200).send(data);
}

// log user out of their session
const logout = (req, res, next) => {
    if (!req.session.loggedin) {
        res.status(401);
        return;
    } else {
        req.session.loggedin = false;
        req.session.username = false;
        req.session.userId = false;
        res.status(200);
    }
    res.redirect("/loginPage");
    next();
}


router.get("/signUp", loadSignUp);
router.post("/signUp", signUp);

router.post("/signIn", signIn);
router.get("/loginPage", loadLogin);

router.get("/logout", logout);
module.exports = router;
