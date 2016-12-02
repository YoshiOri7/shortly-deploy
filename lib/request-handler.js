var request = require('request');
var bcrypt = require('bcrypt-nodejs');
var util = require('../lib/utility');

var db = require('../app/config');
var User = require('../app/models/user');
var Link = require('../app/models/link');

// GET/ and GET/index  ===================================================
exports.renderIndex = function(req, res) {
  res.render('index');
};

// GET/signup  ===================================================
exports.signupUserForm = function(req, res) {
  res.render('signup');
};

// GET/login  ===================================================
exports.loginUserForm = function(req, res) {
  res.render('login');
};

// GET/logout  ===================================================
exports.logoutUser = function(req, res) {
  req.session.destroy(function() {
    res.redirect('/login');
  });
};
// GET/links  ===================================================
exports.fetchLinks = function(req, res) {
  Link.find({}, function(err, links) {
    if (err) { throw err; }

    res.status(200).send(links);      
  });

};
// POST/links  ===================================================
exports.saveLink = function(req, res) {
  var uri = req.body.url;

  if (!util.isValidUrl(uri)) {
    console.log('Not a valid url: ', uri);
    return res.sendStatus(404);
  }

  
  util.getUrlTitle(uri, function(err, title) {
    if (err) {
      console.log('Error reading URL heading: ', err);
      return res.sendStatus(404);
    }

    var link = new Link({
      url: uri,
      // baseUrl: req.headers.origin,
      baseUrl: 'baseURL',
      title: title,
      visits: 0,
      created_at: new Date(),
      updated_at: new Date()
    });

    link.save().then(function(link) {
      res.status(200).send(link);      
    });    

  });
};
// POST/login ===================================================
exports.loginUser = function(req, res) {
  var username = req.body.username;
  var password = req.body.password;
  var userHash = bcrypt.hashSync(password);

  User.findOne({username: username}, function(err, user) {
    if (err) { throw err; }

    // is user does not exist
    if (!user) {
      res.redirect('/login');

    // if user esists
    } else {
      // compare the password
      if (bcrypt.compareSync(user.password, userHash)) {
        util.createSession(req, res, user);
      } else {
        res.redirect('/login');      
      }
    }
  });

};
// POST/signup ===================================================
exports.signupUser = function(req, res) {
  var username = req.body.username;
  var password = req.body.password;

  var user = new User({
    username: username,
    password: password,
    created_at: new Date(),
    updated_at: new Date()
  });
  

  user.save(function(err) {
    if (err) { throw err; }

    res.redirect('/');
  });

};
// GET/* ===================================================
exports.navToLink = function(req, res) {
  var reqCode = req.url.slice(1);
  
  Link.findOne({code: reqCode}, function(err, link) {
    if (err) { throw err; }
    res.redirect(link.url);
  });
};