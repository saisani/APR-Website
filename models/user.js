var mongoose = require('mongoose');
var bcrypt = require('bcrypt');

var UserSchema = new mongoose.Schema({
  flname: {
    type: String,
    trim: true
  },
  teamname: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  schoolname: {
    type: String,
    trim: true
  },
  password: {
    type: String,
    required: true,
  },
  email : {
  	type: String,
  	required: true,
  	trim: true
  },
  isVerified : {
    type: Boolean,
    default: false
  }
});

// Login and Signup helper fxns
UserSchema.methods.generateHash = function(password) {
    return bcrypt.hashSync(password, bcrypt.genSaltSync(8), null);
};

UserSchema.methods.validPassword = function(password) {
    return bcrypt.compareSync(password, this.password);
};

//hashing a password before saving it to the database
UserSchema.pre('save', function (next) {
  var user = this;
  bcrypt.hash(user.password, 10, function (err, hash) {
    if (err) {
      return next(err);
    }
    user.password = hash;
    next();
  })
});


var User = mongoose.model('User', UserSchema);

module.exports = User;

