const pug = require('pug');
const express = require('express');

let app = express();
app.use(express.static("public"));
app.use(express.json())

let user = {
    username: "exampleUser",
    id: 0,
    accountType: "regular",
    peopleFollowing: [
        {name: "personName1"},
        {name: "personName2"},
        {name: "personName3"}


    ],
    usersFollowing: [
        {username: "exampleUser2"},
        {username: "exampleUser3"}
    ],
    moviesWatched: [
        {name: "Titanic"},
        {name: "Parasite"}
    ],
    recommendedMovies: [
        {name: "Breaking Bad"},
        {name: "Better Call Saul"}
    ],
    notifications: [
        {text: "Followed!"}
    ]
}


//Start adding route handlers here
//handler for adding recipe
app.get('/', (req, res) => {
    let data = pug.renderFile('./partials/index.pug');
    res.send(data);

})


//page displaying a single user
app.get('/users/:id', (req, res) => {
    let id = req.params.id;

    let data = pug.renderFile("./partials/user.pug", {user: user});
    res.send(data)
})


app.listen(3000);
console.log("Server listening at http://localhost:3000");
