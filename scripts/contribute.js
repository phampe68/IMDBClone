const personSelectKeyPress = (i) => {
    let enteredText;
    if(i===1){
        enteredText = document.getElementById('writerNameSearch').value;
    }
    else if(i===2){
        enteredText = document.getElementById('directorNameSearch').value;
    }
    else if(i===3){
        enteredText = document.getElementById('actorNameSearch').value;
    }
    //make request to find actors with name:
    let req = new XMLHttpRequest();

    //update autocomplete suggestions using person search api
    req.onreadystatechange = () => {
        if (req.readyState === 4 && req.status === 200) {
            // response is array of person objects, exctract their names
            let peopleFound = JSON.parse(req.responseText);
            let peopleNames = peopleFound.map(person => person.name);
            let personList;
            if(i===1){
                personList = document.getElementById('writersAutoList');
            }
            else if(i===2){
                personList = document.getElementById('directorsAutoList');
            }
            else{
                personList = document.getElementById('actorAutoList');
            }

            console.log(peopleNames);

            //reset actor list first:
            personList.innerHTML = "";
            //use names to populate data list suggestions
            peopleNames.forEach(name => {
                let listItem = document.createElement("option");
                listItem.value = name;
                personList.appendChild(listItem);
            })
        }
    }
    req.open("GET", `/people?name=${enteredText}&limit=${10}`);
    req.send();
}

const sendMovieData = () => {
    let title = document.getElementById(inputTitle).value;
    let runtime = document.getElementById(inputRuntime).value;
    let releaseYear = document.getElementById(inputReleaseYear).value;
    let writer = document.getElementById(writerNameSearch).value;
    let director = document.getElementById(directorNameSearch).value;
    let actor = document.getElementById(actorNameSearch).value;

    let req = new XMLHttpRequest();
    console.log("sending data");
    req.onreadystatechange = () => {
        if (req.readyState === 4 && req.status === 200) {
            console.log(JSON.parse(req.response));
        }
    }
    req.open("POST","/movies/addMovie");
    req.send(JSON.stringify({
        title,runtime,releaseYear,writer,director,actor
    }))
}