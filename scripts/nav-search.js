
// credit: https://stackoverflow.com/questions/8029532/how-to-prevent-submitting-the-html-forms-input-field-value-if-it-empty

window.addEventListener('load', function() {
    let form = document.getElementById("advanced-search-form");

    form.addEventListener('submit', () => {
        let inputs = form.getElementsByTagName('input');
        console.log("ADDED");
        for(let input of inputs){
            if(input.name && !input.value)
                input.name ='';
        }
    })
});

