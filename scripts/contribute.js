let actors = [];
let writers = [];
let directors = [];

const personSelectKeyPress = (i) => {
    let enteredText;
    if(i===1){
        enteredText = document.getElementById('writerNameSearch').value;
    }
    else if(i===2){
        enteredText = document.getElementById('directorNameSearch').value;
    }
    else if(i===3){
        enteredText = document.getElementById('actorNameSearch').value;
    }
    //make request to find actors with name:
    let req = new XMLHttpRequest();

    //update autocomplete suggestions using person search api
    req.onreadystatechange = () => {
        if (req.readyState === 4 && req.status === 200) {
            // response is array of person objects, exctract their names
            let peopleNames = JSON.parse(req.responseText);

            let personList;
            if(i===1){
                personList = document.getElementById('writersAutoList');
            }
            else if(i===2){
                personList = document.getElementById('directorsAutoList');
            }
            else{
                personList = document.getElementById('actorAutoList');
            }

            console.log(peopleNames);

            //reset actor list first:
            personList.innerHTML = "";
            //use names to populate data list suggestions
            peopleNames.forEach(name => {
                let listItem = document.createElement("option");
                listItem.value = name;
                personList.appendChild(listItem);
            })
        }
    }
    req.open("GET", `/people?name=${enteredText}&limit=${10}`);
    req.send();
}

function addItem(type){
    console.log(`adding ${type}`);
    let list;
    if(type==="writer"){
        list = writers;
    }
    else if(type==="director"){
        list = directors;
    }
    else{
        list = actors;
    }
    let text = document.getElementById(`${type}NameSearch`).value;
    if(text.length===0){
        return;
    }
    document.getElementById(`${type}NameSearch`).value ="";

    list.push(text);

    update(type);
}

function makeWriterListItem(type,x){
    console.log(`making ${type} list item`);
    let list;
    if(type==="writer"){
        list = writers;
    }
    else if(type==="director"){
        list = directors;
    }
    else{
        list = actors;
    }
    let listItem = document.createElement("li");
    listItem.className = `${type}List`;
    let input = document.createElement('input');
    input.type = "text";
    input.name = `${type}Name`;
    input.style.color = "black";
    console.log(list[x]);
    input.value = list[x];
    listItem.appendChild(input);
    return listItem;
}

function update(type){
    console.log(`updating ${type} list`);
    let list;
    if(type==="writer"){
        list = writers;
    }
    else if(type==="director"){
        list = directors;
    }
    else{
        list = actors;
    }
    document.getElementById(`${type}List`).innerHTML = "";
    for (let x = 0; x < list.length; x++) {
        let listItem = makeWriterListItem(type,x);
        document.getElementById(`${type}List`).appendChild(listItem);
    }
}
