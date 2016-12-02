var request = require('request');
var crypto = require('crypto');
var bcrypt = require('bcrypt-nodejs');
var util = require('../lib/utility');

var db = require('../app/config');
var User = require('../app/models/user');
var Link = require('../app/models/link');
// var Users = require('../app/collections/users');
// var Links = require('../app/collections/links');

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
  // ***************
  // Links.reset().fetch().then(function(links) {
  //   res.status(200).send(links.models);
  // });
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

  // hash the url
  var shasum = crypto.createHash('sha1');
  shasum.update(uri);
  var code = shasum.digest('hex').slice(0, 5);


  
  util.getUrlTitle(uri, function(err, title) {
    if (err) {
      console.log('Error reading URL heading: ', err);
      return res.sendStatus(404);
    }

  console.log('-----------------')
  console.log(uri)
  console.log(req.headers.origin)
  console.log(code)
  console.log(title)

    var link = new Link({
      url: uri,
      baseUrl: req.headers.origin,
      code: code,
      title: title,
      visits: 0,
      created_at: new Date(),
      updated_at: new Date()
    });
    
    link.save(function(err) {
      if (err) { throw err; }

      console.log('link saved!');
      res.status(200).send(link);      
    });    
  });
  // new Link({ url: uri }).fetch().then(function(found) {
  //   if (found) {
  //     res.status(200).send(found.attributes);
  //   } else {
  //     util.getUrlTitle(uri, function(err, title) {
  //       if (err) {
  //         console.log('Error reading URL heading: ', err);
  //         return res.sendStatus(404);
  //       }
  //       var newLink = new Link({
  //         url: uri,
  //         title: title,
  //         baseUrl: req.headers.origin
  //       });
  //       newLink.save().then(function(newLink) {
  //         Links.add(newLink);
  //         res.status(200).send(newLink);
  //       });
  //     });
  //   }
  // });
};
// POST/login ===================================================
exports.loginUser = function(req, res) {
  var username = req.body.username;
  var password = req.body.password;

  User.find({username: username}, function(err, user) {
    if (err) { throw err; }

    // is user does not exist
    if (!user) {
      res.redirect('/login');

    // if user esists
    } else {
      // compare the password
      if (user.password === password) {
        util.createSession(req, res, user);
      } else {
        res.redirect('/login');      
      }
    }
  });

  // new User({ username: username })
  //   .fetch()
  //   .then(function(user) {
  //     if (!user) {
  //       res.redirect('/login');
  //     } else {
  //       user.comparePassword(password, function(match) {
  //         if (match) {
  //           util.createSession(req, res, user);
  //         } else {
  //           res.redirect('/login');
  //         }
  //       });
  //     }
  //   });
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
    console.log('User created');
  });
  // new User({ username: username })
  //   .fetch()
  //   .then(function(user) {
  //     if (!user) {
  //       var newUser = new User({
  //         username: username,
  //         password: password
  //       });
  //       newUser.save()
  //         .then(function(newUser) {
  //           Users.add(newUser);
  //           util.createSession(req, res, newUser);
  //         });
  //     } else {
  //       console.log('Account already exists');
  //       res.redirect('/signup');
  //     }
  //   });

};
// GET/* ===================================================
exports.navToLink = function(req, res) {
  new Link({ code: req.params[0] }).fetch().then(function(link) {
    if (!link) {
      res.redirect('/');
    } else {
      link.set({ visits: link.get('visits') + 1 })
        .save()
        .then(function() {
          return res.redirect(link.get('url'));
        });
    }
  });
};