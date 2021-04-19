const unfollowHandler = (userID) => {
    let req = new XMLHttpRequest();

    req.onreadystatechange = () => {
        console.log(req.status);

        if (req.readyState === 4 && req.status === 200) {
            window.location.reload();
        }
    }


    req.open("PUT", `/users/unfollowUser`);
    req.setRequestHeader("Content-Type", "application/json");

    req.send(JSON.stringify(
        {userId: userID,}
    ));
}


const followHandler = (userID) => {
    let req = new XMLHttpRequest();

    req.onreadystatechange = () => {
        console.log(req.status);
        if (req.readyState === 4 && req.status === 200) {
            window.location.reload();
        }
    }


    req.open("PUT", `/users/followUser`);
    req.setRequestHeader("Content-Type", "application/json");

    req.send(JSON.stringify(
        {userId: userID,}
    ));
}


const updateNotificationHandler = (userID, notificationID) => {
    let req = new XMLHttpRequest();

    req.onreadystatechange = () => {
        console.log(req.status);
        if (req.readyState === 4 && req.status === 200) {
            window.location.reload();
        }
    }


    req.open("PUT", `/users/${userID}/notifications`);
    req.setRequestHeader("Content-Type", "application/json");

    console.log(userID, notificationID);

    req.send(JSON.stringify(
        {
            userId: userID,
            notificationId: notificationID
        },
    ));
}


const updateContributorHandler = (userID) => {
    let req = new XMLHttpRequest();

    req.onreadystatechange = () => {
        console.log(req.status);
        if (req.readyState === 4 && req.status === 200) {
            window.location.reload();
        }
    }

    req.open("PUT", `/users/${userID}`);
    req.setRequestHeader("Content-Type", "application/json");
    let contributor = document.getElementById("radContributor").checked;

    req.send(JSON.stringify(
        {
            userId: userID,
            contributor: contributor
        },
    ));
}


