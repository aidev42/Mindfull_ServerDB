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

app.options('/history', cors());
app.post('/history', function (req, res, done) {
  console.log('hit the history post')
  var dataReturn = {}
  var endTime = undefined
  //first find the latest activity to have ended
  //THIS SORT WITH FINDONE MAY NOT WORK
  Activity.findOne({
      'userID': req.body.userID,
    })
  .sort({'ended': 'desc'})
  .exec(function(err, activity){
    console.log('activity found: ', activity)
    if(err){ return done(err); }
    if (activity.ended == undefined){
      endTime = new Date()
    } else{
      endTime = activity.ended
      endTime.setDate(endTime.getDate()-7)
    }
    console.log('endTime is: ', endTime)
  // })

  //Now find all activies started before the cutoff
  Activity.find({
      'userID': req.body.userID,
      'ended': {$gte : endTime}
    })
  .sort({'ended': 'desc'})
  .exec(function(err, activities){
    console.log('endTime is: ', endTime)
    if(err){ return done(err); }
    dataReturn = activities
    console.log('data to be sent: ', dataReturn)
    res.send(dataReturn);
  });
    })
});

app.options('/', cors());
app.post('/', function (req, res, done) {
  console.log('hit the post')
  var activity = undefined


  //In case old working was not clicked off, first update old working

  // if selected tpye not equal to workingtype, try to find working type, if can find it AND doesn't already have an end time add an end time
  if (req.body.type != req.body.workingType){
    Activity.find({
      'userID': req.body.userID,
      'type': req.body.workingType
    })
  .sort({'started': 'desc'})
  .exec(function(err, activities){
    if(err){ return done(err); }
    if (activities.length > 0 && activities[0].ended == undefined){
        activity = activities[0]
        activity.ended = req.body.time
        //Number of minutes elapsed
        activity.duration = Math.round((activity.ended - activity.started) / (1000 * 60))
        activity.hours = Math.floor(activity.duration / 60)
        activity.minutes = activity.duration % 60
      //save changes made to activity
      activity.save(function(err){
          if(err) console.log('error saving activity' + err);
          return done(err, activity);
        });
      }
    })
  }

  //Now update newly clicked
  Activity.find({
      'userID': req.body.userID,
      'type': req.body.type
    })
  .sort({'started': 'desc'})
  .exec(function(err, activities){

  if(err){ return done(err); }
  console.log('now at activities: ', activities)


    // if no activity of type found, create new
      if (activities.length == 0){
        console.log('no activity found')
        activity = new Activity({
          'userID': req.body.userID,
          'type': req.body.type,
          'started': req.body.time
        });
      }
      // if activity of type found and has already ended, create a new activity
      else if(activities[0].ended != undefined){
        activity = new Activity({
          'userID': req.body.userID,
          'type': req.body.type,
          'started': req.body.time
        });
      }
      // if activity of type found and has not ended, add end time and duration
      else if (activities[0].ended == undefined){
        activity = activities[0]
        activity.ended = req.body.time
        //Number of minutes elapsed
        activity.duration = Math.round((activity.ended - activity.started) / (1000 * 60))
        activity.hours = Math.floor(activity.duration / 60)
        activity.minutes = activity.duration % 60
      }
      //save changes made to activity
      activity.save(function(err){
          if(err) console.log('error saving activity' + err);
          return done(err, activity);
        });
  });
  res.send('done')
});

//Per documentation angular $http does not allow a DELETE request to send a body, so while a DELETE request is semantically correct and works via postman, must use PUT here as 2nd best option
app.options('/history', cors());
app.put('/history', function (req, res, done) {
  Activity.find({
      '_id': req.body._id
    })
  .remove()
  .exec(function(err, activity){

  if(err){ return done(err); }
  res.send('done removing')
  })
});

// listen
app.listen(process.env.PORT || 3000 )

console.log('listening on port 3000')