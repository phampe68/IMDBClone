const addToWatchListHandler = (movieID, userID) => {
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
            watchlistAction: "add"
        }
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