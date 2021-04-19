const saveAccountType = (cont) => {
    let form = document.getElementById("form");
    let id = form.getAttribute("text");
    form.action = `/users/accountType/${cont}/${id}`
}
