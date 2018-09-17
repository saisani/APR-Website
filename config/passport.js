var mongoose = require('mongoose');
var passport = require('passport');
var LocalStrategy = require('passport-local');

var User = mongoose.model('User');

// to allow for persistent login
passport.serializeUser(function(user, done) {
    done(null, user.id);
});

passport.deserializeUser(function(id, done) {
    User.findById(id, function(err, user) {
        done(err, user);
    });
});

// strategy for login
passport.use('local-login', new LocalStrategy({
    usernameField: 'email',
    passwordField: 'password'
}, function(username, password, done) {
    User.findOne({ email:username }, function(err, user) {
      if (err) { return done(err); }
      if (!user) {
        return done(null, false, { message: 'Incorrect username.' });
      }
      if (!user.validPassword(password)) {
        return done(null, false, { message: 'Incorrect password.' });
      }
      return done(null, user);
    });
  }
));