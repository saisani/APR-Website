var express = require('express');
var path = require('path');
var router = express.Router();
var User = require('../models/user');
var stripe = require('stripe')(process.env.STRIPE_SKEY);
var passport = require('passport');
var nodemailer = require('nodemailer');
var mailgen = require('mailgen');
var jwt = require('jsonwebtoken');
var emailValidater = require('email-validator');

/* NOTES for changes
Need a better way to redirect to a certain part
Stripe payment should be moved to dashboard
*/

/* EMAILER to work with GMAIL */
var transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 456,
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
}));

/* Confirming JWT Token */
router.get('/confirmation/:token', function(req, res, next) {
    try {
        var receivedToken = jwt.verify(req.params.token, process.env.JWT_SECRET);

        // updating db entry
        User.updateOne({_id: receivedToken.id}, {isConfirmed: true}, function(error, info) {
            if(error) {
                console.log(error);
                return res.redirect('/');
            }
            else return res.redirect('/dashboard');
        });
    }
    catch(error) {
        console.log(error);
        return res.redirect('/');
    }
});

/* Processing Stripe Payment and SignIn Registration */
/* For new registration page, we are not using the stripe integration 
just yet */
router.post('/charge', function(req, res, next) {

    // registration fee
    const amount = process.env.FEE_AMOUNT;

    if(req.body.flname &&
       req.body.schoolname &&
       req.body.email_reg &&
       req.body.location &&
       req.body.teamname_reg &&
       req.body.password_reg &&
       req.body.password_conf)
    {
        // checking if email has valid form
        let email_reg = req.body.email_reg;
        var isEmail = emailValidater.validate(email_reg);
        if(!isEmail) return res.redirect('https://www.apracing.io/#contact');

        // make sure the passwords match
        let password_reg = req.body.password_reg;
        if(password_reg != req.body.password_conf) return res.redirect('/');

        // useful vars
        let flname_reg = req.body.flname;

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
        User.create(userData, function(error, user) {
            if(error) return res.redirect('https://www.apracing.io/#contact');
            else {
                var registration_token = jwt.sign({id: user._id}, process.env.JWT_SECRET, {expiresIn: 84600});

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
                                link: `https://apracing.io/confirmation/${registration_token}`
                            }
                        },
                        outro: 'P.S. Help us improve by telling us what\'d you\'d like to see in the future (near and far). You can reach me at akin@apracing.io or via chat on your dashboard. This goes for any help you need. We\'re working hard to make this a dope league for you!'
                    }
                };

                // generating the html from the previous template
                var emailBody = emailGenerator.generate(emailOptions);

                // setting the sender options
                var emailerOptions = {
                    from:'"Admin" <admin@apracing.io>',
                    to: email_reg,
                    subject: 'APRacing.io Confirmation Email',
                    text: '',
                    html: emailBody
                };

                // sending out email
                transporter.sendMail(emailerOptions, (error, info)=> {
                    if(error) {
                        // removing added user after failure
                        user.remove()
                        return res.redirect('https://www.apracing.io/#contact');
                    }
                    else return res.redirect('/email-confirmation')
                });
            }  
        });
    }

    else return res.redirect('https://www.apracing.io/#contact')
});

module.exports = router;


// req.logIn(user, function(){
//                 req.session.save(function() {
//                     return res.redirect('/dashboard');
//                 });
//             });