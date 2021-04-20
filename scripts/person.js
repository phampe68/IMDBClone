/**
 *  handler for unfollowing person, makes a put request to users/id/peopleFollowing
 */
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


/**
 *  handler for following person makes a put request to users/id/peopleFollowing
 */
const followPersonHandler = (userID, personID) => {
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
            followAction: "follow"
        }
    ));
}
