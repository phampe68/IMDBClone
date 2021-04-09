
window.onload = () => {

    //generate select of all actors:
    let actorSelect = document.getElementById('select-actor');
    //make request to get all people
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
    for(let input of form.childNodes){
        if(input.value !== "")
            somethingEntered = true;
        else
            badInputs.push(input);
    }

    //alert user if nothing entered
    if(!somethingEntered){
        alert("Please enter a value in one of the textboxes.");
        return false;
    }

    //remove names of bad inputs to exclude from url
    badInputs.forEach(input => {
        input.name = "";
    })
    return true;
}
