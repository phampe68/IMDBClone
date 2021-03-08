const pug = require('pug');
const express = require('express');


let app = express();

app.use(express.static("public"));
app.use(express.json())

//Start adding route handlers here
//handler for adding recipe
app.get('/', (req, res) => {
    let data = pug.renderFile('./partials/index.pug');
    res.send(data);

})


//page displaying all recipes and links to each one
app.get('/recipes', (req, res) => {
  //  let data = pug.renderFile("./public/screens/recipes.pug",   {recipes: database})
  //  res.send(data)
})

//page displaying a single recipe
app.get('/recipes/:id', (req, res) => {
    let id = req.params.id;

    //redirect back to recipes page if no recipe found
    if (database[id] === undefined) {
        res.redirect('/recipes');
        return
    }
    let data = pug.renderFile("./public/screens/singleRecipe.pug", {recipe: database[id]})
    res.send(data);
})


app.listen(3000);
console.log("Server listening at http://localhost:3000");
