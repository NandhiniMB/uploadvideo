const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const passport = require('passport');
r = require('express-validator');
const session = require('express-session');

// Bring in User Model
let User = require('../models/User');

// Register Form
router.get('/signup', function(req, res){
  res.render('signup');
});

// Register Proccess
router.post('/signup', function(req, res){
  const uname = req.body.uname;
  const email = req.body.email; 
  const password = req.body.password;
  const password2 = req.body.password2;

  req.checkBody('uname', 'Name is required').notEmpty();
  req.checkBody('email', 'Email is required').notEmpty();
  req.checkBody('email', 'Email is not valid').isEmail();
  //req.checkBody('username', 'Username is required').notEmpty();
  req.checkBody('password', 'Password is required').notEmpty();
  req.checkBody('password2', 'Passwords do not match').equals(req.body.password);

  let errors = req.validationErrors();
  //console.log(errors);
  if(errors){
    res.render('signup', {
      errors:errors
    });
  } 
  else {
    
    let newUser = new User({
      uname:uname,
      email:email,
      password:password,
      password2:password2
    });
    bcrypt.genSalt(10, function(err, salt){
      bcrypt.hash(newUser.password, salt, function(err, hash){
        if(err){
          console.log(err);
        }
        newUser.password = hash;
        newUser.save(function(err){
          console.log("new user save");
          if(err){
            console.log(err);
            return;
          } else {
            
            req.flash('success','You are now registered and can log in');
            res.redirect('/users/login');
           
          }
        });
      });
    });

    // console.log(newUser);
    // req.flash('success','You are now registered and can log in');
    // res.redirect('/users/login');
  }
});

//Login Form
router.get('/login', function(req, res){
res.render('login');
});

// Login Process
router.post('/login', function(req, res, next){
  passport.authenticate('local', {
    successRedirect:'/',
    failureRedirect:'/users/login',
    failureFlash: true
  })(req, res, next);
});

// logout
router.get('/logout', function(req, res){
  req.logout();
  req.flash('success', 'You are logged out');
  res.redirect('/users/login');
});

module.exports = router;