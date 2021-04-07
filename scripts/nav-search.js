// credit: https://stackoverflow.com/questions/8029532/how-to-prevent-submitting-the-html-forms-input-field-value-if-it-empty


/**
 * handler for advanced search on submit, removes inputs from url if no value is entered in that input, prevents form submission if all inputs are missing values
 * @returns {boolean} : false if no values are entered, true otherwise
 */
const submitAdvancedSearch = () => {
    let form = document.getElementById('advanced-search-form');
    let somethingEntered = false;

    //find out if something is entered, remove name property from input if there's nothing entered (this removes it from the url)
    for(let input of form.childNodes){
        if(input.value !== "")
            somethingEntered = true;
        else
            input.name = "";
    }

    //alert user if nothing entered
    if(!somethingEntered){
        alert("Please enter a value in one of the textboxes.");
        return false;
    }
    return true;
}
