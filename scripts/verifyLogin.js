const submitLogin = () =>{
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