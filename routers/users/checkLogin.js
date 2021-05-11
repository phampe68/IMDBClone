/**
 * middleware for making sure user is logged in
 */
const express = require('express');

function checkLogin(req, res, next) {
    if (!req.session.loggedin) {
        console.log("checking")
        res.status(401).redirect("/loginPage");
        return;
    }
    next();
}

module.exports = checkLogin;
