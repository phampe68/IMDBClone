const bodyParser = require("body-parser");

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
app.use(express.json())
app.set("view engine", "pug");

app.use(session({
    name: "session",
    secret: 'a super duper secret secret',
    saveUninitialized: true,
    //store: new redisStore({ host: 'localhost',port: 6379, client: client,ttl:260})
}))

//routers:
let movieRouter = require('./routers/movies/movies-router.js');
let personRouter = require('./routers/persons/persons-router.js');
let userRouter = require('./routers/users/users-router.js');
let reviewRouter = require('./routers/reviews/reviews-router.js');
let loginRouter = require('./routers/authentication/loginRouter.js');
let miscRouter = require("./routers/misc/miscRouter.js");

app.use("/movies", movieRouter);
app.use("/people", personRouter);
app.use("/users", userRouter);
app.use("/reviews", reviewRouter);
app.use("/", loginRouter);
app.use("/", miscRouter);

app.use(express.static("public"));
app.use(express.json())
app.use(express.urlencoded({extended: true}));

mongoose.connect('mongodb://localhost/IMDBClone', {useNewUrlParser: true});


/**
 * catch urls that don't exist
 */
const redirectBadURL = (req, res) => {
    res.status(404).send("The requested URL was not found on our server.");
}
app.get('*', redirectBadURL);


app.listen(3000);
console.log("Server listening at http://localhost:3000");
