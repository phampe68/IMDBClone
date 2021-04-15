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
    let action = document.getElementsByName("action");

    //get the number of children with classname clicked
    let form = document.getElementById("form");
    //get the old form action
    //remove the score
    //add the score
    //might have to rebuild the URL everytime

    //replace score param in action with actual score
    form.action += score;// (make sure to check if this is already in the for maction)

}
