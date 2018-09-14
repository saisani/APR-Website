var express = require('express');
var path = require('path');
var router = express.Router();
var User = require('../models/user');
var stripe = require('stripe')(process.env.STRIPE_SKEY);

/* GET home page. */
router.get('/', function(req, res, next) {
	// return res.sendFile(path.join(__dirname + '/template/index.html'));
	return res.redirect('/');
});

router.get('/registration', function(req, res, next) {
	return res.redirect('/registration');
});

router.get('/signin', function(req, res, next) {
	return res.redirect('/signin');
});

/* Login Page */
router.post('/login', function(req, res, next) {
	if(req.body.email && req.body.password){
		User.authenticate(req.body.email, req.body.password, function (error, user){
			if( error || !user){
				console.log("Wrong Email or Password");
				return res.redirect('/signin');
			}
			else {
				console.log("Hit here");
				req.session.userId = user._id;
				return res.redirect('/welcome');
			}
		});
	}
	
});

/* Processing Stripe Payment */
router.post('/charge', function(req, res, next){
	
	// registration fee
	const amount = process.env.FEE_AMOUNT;

	if(	req.body.flname &&
		req.body.schoolname &&
		req.body.email &&
		req.body.password &&
		req.body.password_conf &&
		req.body.teamname )
	{

		// make sure the passwords match
		if( req.body.password != req.body.password_conf ) {
			return res.redirect('/registration');
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
		User.create(userData, function(error, user){
			if (error){
				console.log(error);
				return res.redirect('/registration');
			}
			else{
					stripe.customers.create({
						email: req.body.stripeEmail,
						source: req.body.stripeToken
					})
					.then(customer =>
							stripe.charges.create({
							amount,
							description: "Registration Charge",
							currency: "usd",
							customer: customer.id
					}))
					.then(function(charge) {
						if(charge.status == "succeeded"){
							res.redirect('/welcome');
						}
					});
				}
		});

	}

});

module.exports = router;
