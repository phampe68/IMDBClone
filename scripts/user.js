const unfollowHandler = (userID) => {
    let req = new XMLHttpRequest();

    req.onreadystatechange = () => {
        if (req.readyState === 4 && req.status === 200) {

            window.location.reload();

        }
    }

    let params = {
        "range":"Sheet1!A4:C4",
        "majorDimension": "ROWS",
        "values": [
            ["Hello World","123", "456"]
        ],
    };

    req.open("PUT", `/users/unfollowUser/${userID}`);
    req.send(JSON.stringify(
       params
    ));
}
const saveAccountType = (cont) => {
    let form = document.getElementById("form");
    let id = form.getAttribute("text");
    form.action = `/users/accountType/${cont}/${id}`
}
