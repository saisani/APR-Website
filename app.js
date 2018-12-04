// maybe all required node packages
var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var mongoose = require('mongoose');
var session = require('express-session');
var MongoStore = require('connect-mongo')(session);
var bodyParser = require('body-parser');
var passport = require('passport');
var helmet = require('helmet');
  
// routers to handle post and getting traffic
var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');

// starting up app
var app = express();

// some middleware protection?
app.use(helmet());

// setting up mongoose connection
var mongoDB = process.env.MONGO_KEY;
mongoose.connect(mongoDB, {useNewUrlParser: true});
mongoose.Promise = global.Promise;
var db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));

// using sessions to track logins??
app.use(session({
  secret: 'work hard',
  resave: true,
  saveUninitialized: false,
  store: new MongoStore({
    mongooseConnection: db
  })
}));

// read/parse info coming in and out
app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());

// view engine setup. don't need it now for current static pages
// app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// setting up passport configuration
require('./config/passport');
app.use(passport.initialize());
app.use(passport.session());

// restrict private webpages with middleware
function isLoggedIn(req, res, next){
  if (req.isAuthenticated())
    return next();

  return res.redirect('/');
}

// more parsing libraries
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
// app.use(express.static(path.join(__dirname, 'public')));

// loading static pages but should switch to a render model for the leaderboard
// Public Webpages:
app.use('/', express.static('routes/main_page'));
app.use('/registration', express.static('routes/registration_page'));
app.use('/login', express.static('routes/login_page'));
app.use('/login-error', express.static('routes/login_error_page'));
app.use('/pricing', express.static('routes/pricing_page'));
app.use('/email-confirmation', express.static('routes/email_confirmation_page'));

// Resources:
app.use('/resources', express.static('routes/resources_page'));

// Private Webpages:
app.use('/dashboard', isLoggedIn, express.static('routes/dashboard_page'));
app.use('/bom', express.static('routes/bom_page'));
app.use('/build', express.static('routes/build_car_page'));

// routers
app.use('/', indexRouter);
app.use('/users', usersRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;