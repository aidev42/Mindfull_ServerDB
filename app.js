var express = require('express');
var path = require('path');
var mongoose = require('mongoose');
var bodyParser = require('body-parser');
var cors = require('cors')

// Init app
var app = express();

// Connect with Mongo DB
var mongoUri =  process.env.MONGODB_URI || 'mongodb://localhost/Mindfilled';
mongoose.connect(mongoUri);

//Init the middle-ware
app.use(cors())
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

//MIDDLEWARE FOR TROUBLESHOOTING
app.use(function(req,res,next){ //console logs url calls
  console.log(req.method + " " + req.url);
  next();
});

//View Engine
app.set( 'views', path.join(__dirname, 'views'));
app.set( 'view engine', 'jade');

//User model and database
var Activity = require('./model/activity');

// app.options('/retrieve', cors());
// app.post('/retrieve', function (req, res, done) {
//   var dataReturn = {}
//   console.log('user email is: ', req.body.email)
//   console.log('password is:', req.body.password)


//   User.findOne({
//       'email': req.body.email
//     },
//     function(err, user){
//       if(err || req.body.password == undefined){ return done(err); }

//       if(!user){
//         console.log('no user found')
//         return done(err)
//       }
//       console.log('user is: ', user)
//       //check password
//       var hash = user.generateHash(req.body.password)
//       console.log(hash)
//       if (!(user.validPassword(req.body.password))) {
//         console.log('bad password')
//         return done(err);
//       } else {
//         dataReturn = {
//           'Favorites': user.favorites,
//           'Decisions': user.decisions
//         }
//       }
//     console.log('data to be sent: ', dataReturn)
//     res.send(dataReturn);
//   });
// });

app.options('/', cors());
app.post('/', function (req, res, done) {
  console.log('hit the post')
  Activity.find({
      'userID': req.body.userID,
      'type': req.body.type
    })
  .sort({'started': 'desc'})
  .exec(function(err, activities){

  if(err){ return done(err); }
  console.log('now at activities: ', activities)
    var activity = undefined
    // if no activity found, create new
      if (activities.length == 0){
        console.log('no activity found')
        activity = new Activity({
          'userID': req.body.userID,
          'type': req.body.type,
          'started': req.body.time
        });
      }
      // if activity found and has already ended, create a new activity
      else if(activities[0].ended != undefined){
        activity = new Activity({
          'userID': req.body.userID,
          'type': req.body.type,
          'started': req.body.time
        });
      }
      // if activity found and has not ended, add end time and length
      else if (activities[0].ended == undefined){
        activity = activities[0]
        activity.ended = req.body.time
        //Number of minutes elapsed
        activity.length = (activity.ended - activity.started) / (1000 * 60)
      }
      //save changes made to activity
      activity.save(function(err){
          if(err) console.log('error saving activity' + err);
          return done(err, activity);
        });
  });
  res.send('done')
});

// listen
app.listen(process.env.PORT || 3000 )

console.log('listening on port 3000')