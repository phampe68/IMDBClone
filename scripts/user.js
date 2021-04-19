const unfollowHandler = (userID) => {
    let req = new XMLHttpRequest();

    req.onreadystatechange = () => {
        if (req.readyState === 4 && req.status === 204) {
            window.location.reload();
        }
    }


    req.open("PUT", `/users/unfollowUser/`);
    req.setRequestHeader("Content-Type", "application/json");

    req.send(JSON.stringify(
        {userId: userID,}
    ));
}


const followHandler = (userID) => {
    let req = new XMLHttpRequest();

    req.onreadystatechange = () => {
        if (req.readyState === 4 && req.status === 204) {
            window.location.reload();
        }
    }

    req.open("PUT", `/users/followUser/`);
    req.setRequestHeader("Content-Type", "application/json");

    req.send(JSON.stringify(
        {userId: userID,}
    ));
}


const saveAccountType = (cont) => {
    let form = document.getElementById("form");
    let id = form.getAttribute("text");
    form.action = `/users/accountType/${cont}/${id}`
}
