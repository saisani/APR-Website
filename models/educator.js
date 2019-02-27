/* Was used for separate set of models for page just for educators

var mongoose = require('mongoose');

// Teachers/Educators Model
var EducatorSchema = new mongoose.Schema({
  name : {
    type: String
  },
  email : {
    type: String,
    required: true,
    trim: true
  }
});

var Educator = mongoose.model('Educator', EducatorSchema);

module.exports = Educator;
*/