const unfollowPersonHandler = (userID, personID) => {
    let req = new XMLHttpRequest();

    req.onreadystatechange = () => {
        console.log(req.status);

        if (req.readyState === 4 && req.status === 204) {
            window.location.reload();
        }
    }


    req.open("PUT", `/users/${userID}/peopleFollowing`);
    req.setRequestHeader("Content-Type", "application/json");

    req.send(JSON.stringify(
        {
            userId: userID,
            personId: personID,
            followAction: "unfollow"
        }
    ));
}


const unfollowHandler = (userID) => {
    let req = new XMLHttpRequest();

    req.onreadystatechange = () => {
        console.log(req.status);

        if (req.readyState === 4 && req.status === 204) {
            window.location.reload();
        }
    }


    req.open("PUT", `/users/${userID}/usersFollowing`);
    req.setRequestHeader("Content-Type", "application/json");

    req.send(JSON.stringify(
        {
            userId: userID,
            followAction: "unfollow"
        }
    ));
}


const followHandler = (userID) => {
    let req = new XMLHttpRequest();

    req.onreadystatechange = () => {
        console.log(req.status);
        if (req.readyState === 4 && req.status === 204) {
            window.location.reload();
        }
    }

    req.open("PUT", `/users/${userID}/usersFollowing`);
    req.setRequestHeader("Content-Type", "application/json");

    req.send(JSON.stringify(
        {
            userId: userID,
            followAction: "follow"
        }
    ));
}


const updateNotificationHandler = (userID, notificationID) => {
    let req = new XMLHttpRequest();

    req.onreadystatechange = () => {
        console.log(req.status);
        if (req.readyState === 4 && req.status === 204) {
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
        if (req.readyState === 4 && req.status === 204) {
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


const removeFromWatchListHandler = (movieID, userID) => {
    let req = new XMLHttpRequest();

    req.onreadystatechange = () => {
        console.log(req.status);
        if (req.readyState === 4 && req.status === 204) {
            window.location.reload();
        }
    }

    req.open("PUT", `/users/${userID}/moviesWatched`);
    req.setRequestHeader("Content-Type", "application/json");

    req.send(JSON.stringify(
        {
            userId: userID,
            movieId: movieID,
            watchlistAction: "remove"
        }
    ));
}