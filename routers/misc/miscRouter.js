const express = require('express');
const mongoose = require('mongoose');
const pug = require('pug');

const User = require("../../database/data-models/user-model");
const checkLogin = require('../users/checkLogin');

let router = express.Router();
router.use(express.urlencoded({extended: true}));
router.use(express.static("public"));
router.use(express.json());


// loads contribute page if user is contributor
const loadContribute = (req, res, next) => {
    User.findOne({_id: req.session.userId}).exec((err, user) => {
        if (!user) {
            res.status(401).redirect("/loginPage");
        }
        if (user.contributor === true) {
            let data = pug.renderFile("./templates/screens/contribute.pug");
            res.status(200).send(data);
        } else {
            res.status(403).redirect("back");
        }
    })
}

// loads default page
const loadHome = (req, res, next) => {
    let data = pug.renderFile('./templates/screens/index.pug');
    res.status(200).send(data);
}

// redirects to logged in users page
const loadLoggedInUser = (req, res, next) => {
    res.status(200).redirect(`/users/${req.session.userId}/`);

}
router.get("/", [checkLogin, loadHome]);
router.get("/contribute", [checkLogin, loadContribute]);
router.get("/myProfile", [checkLogin, loadLoggedInUser]);
module.exports = router;
