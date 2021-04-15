window.onload = () => {

    let actorSelect = document.getElementById('select-actor');

    //make request to get all people
}

const actorSelectKeyPress = () => {
    let enteredText = document.getElementById('actorNameSearch').value;

    //make request to find actors with name:
    let req = new XMLHttpRequest();

    //update autocomplete suggestions using person search api
    req.onreadystatechange = () => {
        if (req.readyState === 4 && req.status === 200) {
            // response is array of person objects, exctract their names
            let peopleFound = JSON.parse(req.responseText);
            let actors = peopleFound.filter(person => person.actorFor.length > 0);
            let actorNames = actors.map(actor => actor.name);
            let actorList = document.getElementById('actorAutoList');

            console.log(actorNames);

            //reset actor list first:
            actorList.innerHTML = "";
            //use names to populate data list suggestions
            actorNames.forEach(name => {
                let listItem = document.createElement("option");
                listItem.value = name;
                actorList.appendChild(listItem);
            })


        }
    }

    req.open("GET", `/people?name=${enteredText}&limit=${10}`);
    req.send();

}


/**
 * handler for advanced search on submit, removes inputs from url if no value is entered in that input, prevents form submission if all inputs are missing values
 * @returns {boolean} : false if no values are entered, true otherwise
 */
const submitAdvancedSearch = () => {
    let form = document.getElementById('advanced-search-form');
    let somethingEntered = false;

    let badInputs = [];

    //find out if something is entered, remove name property from input if there's nothing entered (this removes it from the url)
    for (let input of form.childNodes) {
        if (input.value !== "" && input.value !== undefined){
            somethingEntered = true; console.log("VALUE: ", input.value)}
        else
            badInputs.push(input);
    }

    //alert user if nothing entered
    if (!somethingEntered) {
        alert("Please enter a value in one of the textboxes.");
        return false;
    }

    //remove names of bad inputs to exclude from url
    badInputs.forEach(input => {
        input.name = "";
    })
    return true;
}
