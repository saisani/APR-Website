var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var mongoose = require('mongoose');
var session = require('express-session');
var MongoStore = require('connect-mongo')(session);
var bodyParser = require('body-parser');
var helmet = require('helmet');
  
var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');

var app = express();

// some middleware protection?
app.use(helmet());

// setting up mongoose connection
var mongoDB = 'mongodb://user_alpha:thereddragon2018@ds233212.mlab.com:33212/local_library_power_racing';
mongoose.connect(mongoDB, {useNewUrlParser: true});
mongoose.Promise = global.Promise;
var db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));

// using sessions to track logins??
// read why
app.use(session({
  secret: 'work hard',
  resave: true,
  saveUninitialized: false,
  store: new MongoStore({
    mongooseConnection: db
  })
}));

app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// loading static pages but should switch to a render model for the leaderboard
app.use('/', express.static('routes/main_page'));
app.use('/registration', express.static('routes/registration_page'));
app.use('/payment', express.static('routes/stripe_page'));
app.use('/welcome', express.static('routes/welcome_page'));
app.use('/leaderboard', express.static('routes/apr_leaderboard'));
app.use('/pricing', express.static('routes/pricing_page'));
app.use('/signin', express.static('routes/login_page'));

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
