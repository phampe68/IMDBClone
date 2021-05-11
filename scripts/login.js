const signIn = () => {
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
        if (req.readyState === 4 && req.status === 401) {
            alert("Incorrect username or password. Try again.");
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
}
