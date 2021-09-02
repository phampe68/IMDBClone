const signIn = () => {
    let loginButton = document.getElementById("loginButton");
    let signupLink = document.getElementById("signupButton");


    // make spinner visible
    let spinner = document.getElementById("loadingSpinner");
    spinner.classList.remove("visually-hidden");

    // get info for sign up
    let enteredUsername = document.getElementById("inputUsername").value;
    let eneteredPassword = document.getElementById("inputPassword").value;

    // do basic checks
    if(enteredUsername === ""){
        alert("Please enter a username");
        //remove spinner
        spinner.classList.add("visually-hidden");
        return;
    }
    else if(eneteredPassword === ""){
        alert("Please enter a password");
        //remove spinner
        spinner.classList.add("visually-hidden");
        return;
    }



    let req = new XMLHttpRequest();

    //once we get a response
    req.onreadystatechange = () => {
        console.log(req.status);

        if (req.readyState === 4 && req.status === 401) {
            //remove spinner
            spinner.classList.add("visually-hidden");
            alert("Incorrect username or password. Try again.");
            //re-enable buttons
            loginButton.disabled = false;
            signupLink.href = "/signUp";
        }
        else if (req.readyState === 4 && req.status === 200){
            window.location.href = '/';
        }
    }

    // make a post request to signup route
    req.open("POST", `/signIn`);
    req.setRequestHeader("Content-Type", "application/json");
    req.send(JSON.stringify({
        username: enteredUsername,
        password: eneteredPassword
    }));

    // disable buttons while we wait for a response
    loginButton.disabled = true;
    signupLink.href = '#';
}
