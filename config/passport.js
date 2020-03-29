const LocalStrategy = require('passport-local').Strategy;
//const User = require('../models/user');
const config = require('../config/database');
const bcrypt = require('bcryptjs');

module.exports = function(passport){
  // Local Strategy
  //console.log("here");
  passport.use(new LocalStrategy(function(uname, password, done){
    // Match Username
   console.log("here"); 
    let query = {uname:uname};
    User.findOne(query, function(err, user){
      if(err) throw err;
      console.log(user);
      if(!user){
        console.log("no user");
        return done(null, false, {message: 'No user found'});
      }

      // Match Password
      bcrypt.compare(password, user.password, function(err, isMatch){
        if(err) throw err;
        if(isMatch){
          console.log("Success");
          return done(null, user);
        } else {
          console.log("fail");
          return done(null, false, {message: 'Wrong password'});
        }
      });
    });
  }));

  passport.serializeUser(function(user, done) {
    done(null, user.id);
  });

  passport.deserializeUser(function(id, done) {
    User.findById(id, function(err, user) {
      done(err, user);
    });
  });
}