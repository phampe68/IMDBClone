let type;

function login(){
    type = "login";
    document.getElementById("form").submit();
}

function signup(){
    type = "signup";
    document.getElementById("form").submit();
}

const submitLogin = () =>{
    let enteredText = document.getElementById("inputUsername").value;
    //make request to find actors with name:
    let req = new XMLHttpRequest();
    req.onreadystatechange = () => {
        console.log("request returned");
        if (req.readyState === 4 && req.status === 200&&type==="signup") {
            alert("Username already exists. Please enter a new username");
            return false;
        }
        if(document.getElementById("inputUsername").value===""){
            alert("Please enter a username");
            return false;
        }
        if(document.getElementById("inputPassword").value===""){
            alert("Please enter a password");
            return false;
        }
        return true;
    }
    req.open("GET", `/users?name=${enteredText}`);
    req.send();

}