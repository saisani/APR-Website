var express = require('express');
var path = require('path');
var router = express.Router();
var User = require('../models/user');
var stripe = require('stripe')(process.env.STRIPE_SKEY);
var passport = require('passport');

/* GET home page. */
router.get('/', function(req, res, next) {
    // return res.sendFile(path.join(__dirname + '/template/index.html'));
    return res.redirect('/');
});

/* GET Sign In page */
router.get('/registration', function(req, res, next) {
    return res.redirect('/registration');
});

/* Get Login page */
router.get('/login', function(req, res, next) {
    return res.redirect('/login');
});

/* Logout */
router.get('/logout', function(req, res, next) {
    req.logout();
    res.redirect('/');
})

/* Login Page */
router.post('/login', passport.authenticate('local-login', {
    successRedirect: '/dashboard',
    failureRedirect: 'https://www.apracing.io/#contact',
}));

/* Processing Stripe Payment and SignIn Registration */
/* For new registration page, we are not using the stripe integration 
just yet */
router.post('/charge', function(req, res, next) {

    // registration fee
    const amount = process.env.FEE_AMOUNT;

    if( req.body.flname &&
        req.body.schoolname &&
        req.body.email &&
        req.body.teamname_reg &&
        req.body.password_reg &&
        req.body.password_conf )
    {
        // make sure the passwords match
        if( req.body.password != req.body.password_conf ) {
            return res.redirect('https://www.apracing.io/#contact');
        }

        // creating entry for collection
        var userData = {
            flname: req.body.flname,
            teamname: req.body.teamname,
            schoolname: req.body.schoolname,
            password: req.body.password,
            email: req.body.email,
        }

        // adding entry to mongo db?
        User.create(userData, function(error, user) {
            if( error ) {
                console.log(error);
                return res.redirect('https://www.apracing.io/#contact');
            }
            
            req.logIn(user, function(){
                req.session.save(function() {
                    return res.redirect('/dashboard');
                });
            });
        });
    }
});

module.exports = router;
