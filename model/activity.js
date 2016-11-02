var mongoose = require('mongoose');
var bcrypt   = require('bcrypt-nodejs');

var activitySchema = mongoose.Schema({
  userID: String,
  type: String,
  started: Date,
  ended: Date,
  duration: Number
});

// methods ======================
// generating a hash
// userSchema.methods.generateHash = function(password) {
//     return bcrypt.hashSync(password, bcrypt.genSaltSync(10), null);
// };

// // checking if password is valid
// userSchema.methods.validPassword = function(password) {
//     return bcrypt.compareSync(password, this.password);
// };

// create the model for users and expose it to our app
module.exports = mongoose.model('Activity', activitySchema);