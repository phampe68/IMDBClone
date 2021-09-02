// sign up by sending entered fields
const signUp = () => {
    let loginLink = document.getElementById("loginLink");
    let signupButton = document.getElementById("signupButton");

    // make spinner visible
    let spinner = document.getElementById("loadingSpinner");
    spinner.classList.remove("visually-hidden");

    // get info for sign up
    let enteredUsername = document.getElementById("inputUsername").value;
    let eneteredPassword = document.getElementById("inputPassword").value;

    // do basic checks
    if(enteredUsername === ""){
        alert("Please enter a username");
        return;
    }
    else if(eneteredPassword === ""){
        alert("Please enter a password");
        return;
    }



    let req = new XMLHttpRequest();

    //once we get a response
    req.onreadystatechange = () => {
        console.log(req.status);
        if (req.readyState === 4 && req.status === 409) {
            //remove spinner
            spinner.classList.add("visually-hidden");
            alert("Username already exists. Try again.");
            //re-enable buttons
            loginLink.href = "/loginPage";
            signupButton.disabled = false;
        }
        else if (req.readyState === 4 && req.status === 200){
            window.location.href = '/';
        }
    }

    // make a post request to signup route
    req.open("POST", `/signUp`);
    req.setRequestHeader("Content-Type", "application/json");
    req.send(JSON.stringify({
        username: enteredUsername,
        password: eneteredPassword
    }));

    // disable buttons while we wait for a response
    //re-enable buttons
    loginLink.href = "#";
    signupButton.disabled = true;
}

