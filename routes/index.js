var express = require('express');
var path = require('path');
var router = express.Router();
var User = require('../models/user');
var Educator = require('../models/educator');
var stripe = require('stripe')(process.env.STRIPE_SKEY);
var passport = require('passport');
var nodemailer = require('nodemailer');
var mailgen = require('mailgen');
var jwt = require('jsonwebtoken');
var emailValidater = require('email-validator');

/* NOTES for changes
Need a better way to redirect to a certain part
In Token Verification, should login user instead of redirecting to main page
Stripe payment should be moved to dashboard
*/

/* EMAILER to work with GMAIL */
var transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

/* EMAIL GENERATOR to create template */
var emailGenerator = new mailgen({
    theme: 'cerberus',
    product: {
        name: 'APRacing',
        link: 'https://www.apracing.io'
    }
});

/* GET home page. */
router.get('/', function(req, res, next) {
    return res.render('main');
});

/* Logout */
router.get('/logout', function(req, res, next) {
    req.logout();
    res.redirect('/');
});

/* Login Page */
router.post('/login', passport.authenticate('local-login', {
    successRedirect: '/dashboard',
    failureRedirect: 'https://www.apracing.io/#contact',
    //failureRedirect: '/'
}));

/* Confirming JWT Token */
router.get('/confirmation:token', function(req, res, next) {
    try {
        var receivedToken = jwt.verify(req.params.token, process.env.JWT_SECRET);
        //console.log(receivedToken);

        // updating db entry
        User.updateOne({_id: receivedToken.id}, {isVerified: true}, function(error, info) {
            if(error) {
                console.log(error);
                return res.redirect('/');
            }

            //console.log("USER UPDATED");
            return res.redirect('https://www.apracing.io/#contact');
        });

    }
    catch(error) {
        // console.log(error);
        return res.redirect('/');
    }
});

/* Processing Stripe Payment and SignIn Registration */
/* For new registration page, we are not using the stripe integration 
just yet */
router.post('/registration', function(req, res, next) {

    if(req.body.flname &&
       req.body.schoolname &&
       req.body.email_reg &&
       req.body.location &&
       req.body.teamname_reg &&
       req.body.password_reg &&
       req.body.password_conf)
    {
        // checking if email has valid form
        var email_reg = req.body.email_reg;
        var isEmail = emailValidater.validate(email_reg);
        if(!isEmail) return res.redirect('https://www.apracing.io/#contact');
        //if(!isEmail) return res.redirect('/');

        // make sure the passwords match
        var password_reg = req.body.password_reg;
        if(password_reg != req.body.password_conf) return res.redirect('https://www.apracing.io/#contact');

        // useful vars
        var flname_reg = req.body.flname;

        // creating entry to add to db
        var userData = 
        {
            flname: flname_reg,
            teamname: req.body.teamname_reg,
            schoolname: req.body.schoolname,
            location: req.body.location,
            password: password_reg,
            email: email_reg,
        };

        let firstName = flname_reg.split(' ')[0];

        // adding entry to mongo db?
        // console.log("STARTING TO ADD TO DB");
        User.create(userData, function(error, user) {
            if(error) return res.redirect('https://www.apracing.io/#contact');
            // if(error) {
            //     console.log(error);
            //     return res.redirect('/');
            // }
            else {
                //console.log("HIT TOKEN STAGE");
                
                var registration_token = jwt.sign({id: user._id}, process.env.JWT_SECRET, {expiresIn: 84600});
                //console.log("MADE REGISTRATION TOKEN");

                // filling out email template to send to first-time registrations
                var emailOptions = {
                    body: {
                        name: firstName,
                        intro: 'Thanks for signing up to APR!',
                        action: {
                            instructions: 'To start, confirm your email address and sign into your dashboard by clicking the button below.',
                            button: {
                                color: '#22BC66',
                                text: 'Confirm your account',
                                link: `https://www.apracing.io/confirmation${registration_token}`
                                //link:`http://localhost:3000/confirmation${registration_token}`
                            }
                        },
                        outro: 'P.S. Help us improve by telling us what\'d you\'d like to see in the future (near and far). You can reach me at akin@apracing.io or via chat on your dashboard. This goes for any help you need. We\'re working hard to make this a dope league for you!'
                    }
                };

                // generating the html from the previous template
                var emailBody = emailGenerator.generate(emailOptions);
                //console.log("MADE TEMPLATED EMAIL");

                // setting the sender options
                var mailOptions = {
                    from:'"Admin" <admin@apracing.io>',
                    to: email_reg,
                    subject: 'APRacing.io Confirmation Email',
                    text: 'Something here?',
                    html: emailBody
                };

                // sending out email
                //console.log("STARTING TO SEND EMAIL");
                transporter.sendMail(mailOptions, (error, info)=> {
                    if(error) {
                        // removing added user after failure
                        //console.log("SEND EMAIL failing. STARTING TO REMOVE USER");
                        user.remove()
                        console.log(error);
                        return res.redirect('https://www.apracing.io/#contact');
                        //return res.redirect('/');
                    }
                    else return res.redirect('/email-confirmation')
                });
            }  
        });
    }

    //else return res.redirect('https://www.apracing.io/#contact')
    else return res.redirect('/');
});

// saving information from educators
router.post('/educators', function(req, res, next) {
    
    if(req.body.flname && req.body.email)
    {
        // checking if email has valid form
        var email_reg = req.body.email;
        var isEmail = emailValidater.validate(email_reg);
        if (!isEmail) return res.redirect('/educators');
        
        // first and last name of educator
        let flname_reg = req.body.flname;

        // encapsulating educator input data
        var educatorData = 
        {
            name: flname_reg, 
            email: email_reg
        };

        Educator.create(educatorData, function(error, educator) {
            if (error) return res.redirect('/educators');
            else return res.redirect('/educator-confirmation');
        });
    }

    else return res.redirect('https://www.apracing.io/#email-form');
});

module.exports = router;


// req.logIn(user, function(){
//                 req.session.save(function() {
//                     return res.redirect('/dashboard');
//                 });
//             });