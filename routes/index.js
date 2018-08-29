var express = require('express');
var path = require('path');
var router = express.Router();
var User = require('../models/user');
var stripe = require('stripe')("sk_test_ZVsMj6uyK2zOYAnV57UYeGhl");

/* GET home page. */
router.get('/', function(req, res, next) {
	return res.sendFile(path.join(__dirname + '/template/index.html'));
});

router.post('/registration', function(req, res, next){
	if(req.body.loginemail && req.body.loginpassword){
		User.authenticate(req.body.loginemail, req.body.loginpassword, function (error, user){
			if( error || !user){
				console.log('Wrong Email or Password');
				return res.redirect('/registration');
			}
			else {
				console.log("hit here");
				req.session.userId = user._id;
				return res.redirect('/leaderboard');
			}
		});
	}
	else if(req.body.frontpage_email){
		console.log("-----WENT THROUGH FRONT PAGE-----");
		return res.redirect('/registration');
	}
	else{
		console.log("-----You didn't enter anything-----");
		return res.redirect('/registration');
	}

});

router.post('/payment', function(req, res, next){
	if(	req.body.flname &&
		req.body.schoolname &&
		req.body.email &&
		req.body.password)
	{

		// creating entry for collection
		var userData = {
			flname: req.body.flname,
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
				req.session.userId = user._id;
				return res.redirect('/payment');
			}
		});

	}
});

router.post('/charge', function(req, res, next){

	let amount = 500;

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
			res.redirect('/leaderboard');
		}
		else {
			res.redirect('/payment');
		}
	});

});


module.exports = router;
