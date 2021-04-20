<!-- PROJECT LOGO -->
<br />
<p align="center">


  <h1 align="center">IMDBClone</h1>






<!-- ABOUT THE PROJECT -->
## About The Project

[![Product Name Screen Shot][product-screenshot]](https://example.com)

 A web application with similar functionality to IMDB. Keeps a mongoDB database of movie information. Supports users who 
    can browse all information (movies, people, other users), adding movie reviews, contributing new movies, and following other people/users.
    Additionally, this website will generate: movie recommendations based on user's data, lists of similar movies for each movie, and frequent collaborators for each person.
    Note: 
    <ul>
        <li>"people" refers to people who are part of a movie (director, writer, or actor)</li>
        <li>"users" refer to the users who made accounts and are using the application</li>
    </ul>



### Built With
* [Bootstrap](https://getbootstrap.com)

* [node.js](https://nodejs.org/en/)
* [pug](https://pugjs.org/)
* [bootstrap5](https://getbootstrap.com/docs/5.0/getting-started/introduction/)
* [mongodb](https://www.mongodb.com/)
* [mongoose](https://mongoosejs.com/)
* [express](https://expressjs.com/)



<!-- GETTING STARTED -->
## Getting Started

To get a local copy up and running follow these simple steps.

### Prerequisites

* node
    [Download Node.js and npm](https://nodejs.org/en/download/)

* npm
  ```sh
  npm install npm@latest -g
  ```
* mongodb
    [Download mongodb](https://www.mongodb.com/try/download/community)

### Installation

1. Unzip submission and navigate to project level directory
2. Install NPM packages
   ```sh
   npm install
   ```
3. Initialize the database
   ```sh
    node database/database-initializer.js
    ```
4. Start the server
    ```sh
    node mainServer.js
    ```


<!-- Collaborators -->
## Collaborators

Peter Pham - 101141273
<br>
Eric Stewart - 101144582
<br>
Project Link: [https://github.com/phampe68/IMDBClone](https://github.com/phampe68/IMDBClone)



<!-- ACKNOWLEDGEMENTS -->
## Acknowledgements
Initialization script is based on professor Dave Mckenney's example initialization script.



[product-screenshot]: ./images/IMDBCloneLogo.jpg



