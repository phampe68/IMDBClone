/*
unchecks all star icons from 9 to i to unchecked
 */
const starMouseLeave = (i) => {
    let stars = document.getElementsByClassName("star-selector");


    for (let index = 9; index >= i; index--) {
        stars[index].classList.remove("star-checked");
    }
}


/*
unselects all stars and then selects all stars up to the one that was clicked
 */
const starMouseClick = (i) => {
    let stars = document.getElementsByClassName("star-selector");
    for (let index = 0; index < stars.length; index++)
        stars[index].classList.remove("star-clicked");
    for (let index = 0; index <= i; index++)
        stars[index].classList.add("star-clicked");

    //get the number of children with classname clicked
    let form = document.getElementById("form");
    console.log(form);
    let id = form.getAttribute("text");
    console.log(id);
    //get the old form action
    let old = form.action;
    //remove the score
    form.action = "";
    //add the score
    let score = i+1;
    //might have to rebuild the URL everytime
    form.action = `/addReview?score=`
    //replace score param in action with actual score
    form.action += score;// (make sure to check if this is already in the form action)
    form.action += `&id=${id}`;
    console.log(form.action);
}
