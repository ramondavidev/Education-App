const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const flash = require("connect-flash");
const passport = require("passport");
const LocalStrategy = require("passport-local");
const methodOverride = require("method-override");



const Post = require("./models/post"),
Comment = require("./models/comment"),
User = require("./models/user");
middleware = require("./middleware");


mongoose.connect(process.env.DATABASEURL || 'mongodb://localhost:27017/masteredu', {
    useNewUrlParser: true,
    useCreateIndex: true
}).then(() => {
    console.log('Connected to DB!');
}).catch(err => {
    console.log('Error to connect to DB', err.message);
});

//password reset
//Go to https://myaccount.google.com/lesssecureapps and turn on less secure app access.
const async = require("async");
const nodemailer = require("nodemailer");
const crypto = require("crypto");


app.use(bodyParser.urlencoded({ extended: true }));
app.set("view engine", "ejs");
app.use(express.static(__dirname + "/public"));
app.use(methodOverride("_method"));
app.use(flash());

app.locals.moment = require('moment');

app.use(require("express-session")({
    secret: "type anything here",
    resave: false,
    saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use(function(req, res, next){
    //whatever we put in res.locals is going to be available in all the templetes, so it takes req.user and pass through the templete as currentUser
    res.locals.error = req.flash("error");
    res.locals.success = req.flash("success");
    res.locals.currentUser = req.user;
    next(); 
});



app.get('/', (req, res) =>
    res.render("landing")
);

app.get("/inicio", (req, res) =>
    res.render("index")
);

app.get("/info", (req, res) =>
    res.render("info")
);

app.get("/materiais", (req, res) =>
    res.render("downloadPage")
);

app.get("/teste", (req, res)=>
    res.render("teste")
);

function escapeRegex(text) {
    return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
};

//INDEX - show all posts
app.get("/revise",middleware.isLoggedIn ,function(req, res){
    var perPage = 8;
    var pageQuery = parseInt(req.query.page);
    var pageNumber = pageQuery ? pageQuery : 1;
    var noMatch = null;
    if(req.query.search) {
        const regex = new RegExp(escapeRegex(req.query.search), 'gi');
        Post.find({title: regex}).skip((perPage * pageNumber) - perPage).limit(perPage).exec(function (err, allPosts) {
            Post.count({title: regex}).exec(function (err, count) {
                if (err) {
                    console.log(err);
                    res.redirect("back");
                } else {
                    if(allPosts.length < 1) {
                        noMatch = "Tópico não encontrado, por favor tente novamente.";
                    }
                    res.render("topicos", {
                        posts: allPosts,
                        current: pageNumber,
                        pages: Math.ceil(count / perPage),
                        noMatch: noMatch,
                        search: req.query.search
                    });
                }
            });
        });
    } else {
        // get all posts from DB
        Post.find({}).skip((perPage * pageNumber) - perPage).limit(perPage).exec(function (err, allPosts) {
            Post.count().exec(function (err, count) {
                if (err) {
                    console.log(err);
                } else {
                    res.render("topicos", {
                        posts: allPosts,
                        current: pageNumber,
                        pages: Math.ceil(count / perPage),
                        noMatch: noMatch,
                        search: false
                    });
                }
            });
        });
    }
});

app.get("/postagem", middleware.isAdmin, function(req, res){
    res.render("postagem");
});

app.post("/revise",middleware.isAdmin, function(req, res){
    var newPost = new Post({
        title: req.body.title,
        image:  req.body.img,
        content: req.body.content,
        author: {
            id: req.user._id,
            username: req.user.username
        }
    });
    Post.create(newPost, function(err, newlyCreated){
        if(err){
            console.log(err);
        } else {
            console.log(newlyCreated);
            res.redirect("/revise");
        }
    })
});

app.get("/revise/:id", function(req, res){
    //faz com que não retorne o ids do comments, e sim o conteudo.
    Post.findById(req.params.id).populate("comments likes").exec(function(err, foundPost){
        if(err){
            console.log(err);
        } else {
            console.log(foundPost);
            //render show template with that post
            res.render("show", {post: foundPost});
        }
    });
});

app.get("/revise/:id/edit", middleware.checkCampgroundOwnership, (req, res) =>{
    Post.findById(req.params.id, (err, foundPost) =>{
        res.render("edit", {post: foundPost});
    });
});

app.put("/revise/:id", middleware.checkCampgroundOwnership, (req, res) =>{
    Post.findByIdAndUpdate(req.params.id, req.body.post, (err, updatedPost) =>{
        if(err){
            console.log(err);
        } else {
            res.redirect("/revise/" + req.params.id);
        }
    });
});

/*
router.put("/:id", middleware.checkCampgroundOwnership, function (req, res) {
    // find and update the correct campground
    Campground.findById(req.params.id, function (err, campground) {
        if (err) {
            console.log(err);
            res.redirect("/campgrounds");
        } else {
            campground.name = req.body.campground.name;
            campground.description = req.body.campground.description;
            campground.image = req.body.campground.image;
            campground.save(function (err) {
                if (err) {
                    console.log(err);
                    res.redirect("/campgrounds");
                } else {
                    res.redirect("/campgrounds/" + campground._id);
                }
            });
        }
    });
});
*/

app.delete("/revise/:id", middleware.checkCampgroundOwnership, (req, res) =>{
    Post.findByIdAndRemove(req.params.id, (err, postRemoved) =>{
        if(err){
            console.log(err);
        } else {
            res.redirect("/revise");
        }
    });
});

// Post Like Route
app.post("/revise/:id/like", middleware.isLoggedIn, function (req, res) {
    Post.findById(req.params.id, function (err, foundPost) {
        if (err) {
            console.log(err);
            return res.redirect("/inicio");
        }

        // check if req.user._id exists in foundPost.likes
        var foundUserLike = foundPost.likes.some(function (like) {
            return like.equals(req.user._id);
        });

        if (foundUserLike) {
            // user already liked, removing like
            foundPost.likes.pull(req.user._id);
        } else {
            // adding the new user like
            foundPost.likes.push(req.user);
        }

        foundPost.save(function (err) {
            if (err) {
                console.log(err);
                return res.redirect("/inicio");
            }
            return res.redirect("/revise/" + foundPost._id);
        });
    });
});

app.get("/revise/:id/comments/new", (req, res) => {
    Post.findById(req.params.id, (err, foundPost) => {
        if(err){
            console.log(err);
        } else {
            res.render("commentNew", {post: foundPost});
        }
    });
});

app.post("/revise/:id/comments", (req, res) => {
    Post.findById(req.params.id, (err, post) => {
        if(err){
            console.log(err);
        } else {
            Comment.create(req.body.comment, (err, commentCreated) => {
                if(err){
                    console.log(err);
                } else {
                    commentCreated.author.id = req.user._id;
                    commentCreated.author.username = req.user.username;
                    commentCreated.save();
                    post.comments.push(commentCreated);
                    post.save();
                    res.redirect("/revise/" + post._id);
                }
            });
        }
    });
});

app.get("/revise/:id/comments/:comment_id/edit", middleware.checkCommentOwnership, function(req, res){
    Comment.findById(req.params.comment_id, function(err, foundComment){
        if(err){
            console.log(err);
        } else {
            res.render("editComments", {post_id: req.params.id, comment: foundComment});
        }
    });
});

app.put("/revise/:id/comments/:comment_id", middleware.checkCommentOwnership, function(req, res){
    Comment.findByIdAndUpdate(req.params.comment_id, req.body.comment, function(err, updatedComment){
        if(err){
            res.redirect("back");
        } else {
            res.redirect("/revise/"+ req.params.id);
        }
    });
});

app.delete("/revise/:id/comments/:comment_id", middleware.checkCommentOwnership, function(req, res){
    Comment.findByIdAndRemove(req.params.comment_id, function(err){
        if(err){
            console.log(err);
        } else {
            res.redirect("/revise/"+ req.params.id);
        }
    });
});

app.get("/registro", (req, res) => {
    res.render("register");
});

app.post("/registro", (req, res) => {
    var newUser = new User({
        username: req.body.username,
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        email: req.body.email
    });
    User.register(newUser, req.body.password, (err, user) => {
        if(err){
            req.flash("error", err.message);
            return res.redirect("/registro");
        } else {
            passport.authenticate("local")(req, res, () =>{
                req.flash("success", "Seja bem vindo ao MasterEdu " + user.username);
                res.redirect("/revise");
            });
        }
    });
});

app.get("/login", (req, res) => {
    res.render("login");
});

app.post("/login", passport.authenticate("local",
    {
        successRedirect: "/revise",
        failureRedirect: "/login"
    }),(req, res) => {

    });

app.get("/logout", (req, res)=>{
    req.logout();
    req.flash("success", "Deslogado com sucesso! ");
    res.redirect("/login");
});

app.get("/user/:id", function(req, res){
    User.findById(req.params.id, function(err, foundUser){
        if(err){
            console.log(err);
        }
        Post.find().where('author.id').equals(foundUser._id).exec(function(err, posts){
            if(err){
                console.log(err);
            }
            res.render("profile", {user: foundUser, posts: posts});
        });
    });
});

app.get('/forgot', function(req, res){
    res.render("forgot");
});

app.post('/forgot', function(req, res, next) {
    async.waterfall([
      function(done) {
        crypto.randomBytes(20, function(err, buf) {
          var token = buf.toString('hex');
          done(err, token);
        });
      },
      function(token, done) {
        User.findOne({ email: req.body.email }, function(err, user) {
          if (!user) {
            //req.flash('error', 'No account with that email address exists.');
            return res.redirect('/forgot');
          }
  
          user.resetPasswordToken = token;
          user.resetPasswordExpires = Date.now() + 3600000; // 1 hour to expire request
  
          user.save(function(err) {
            done(err, token, user);
          });
        });
      },
      function(token, user, done) {
        var smtpTransport = nodemailer.createTransport({
          service: 'Gmail', 
          auth: {
            user: 'ramondhr742@gmail.com',
            pass: 'Frenesi167349'
          }
        });
        var mailOptions = {
          to: user.email,
          from: 'ramondhr742@gmail.com',
          subject: 'EduMaster Solicitação Para Mudar Senha',
          text: 'Você recebeu esse email porque você (ou alguem) solicitou um pedido para resetar a senha da sua conta.\n\n' +
            'Por favor click no link seguinte para prosseguir, ou cole o link no seu browser para completar o processo:\n\n' +
            'http://' + req.headers.host + '/reset/' + token + '\n\n' +
            'Se você não solicitou isso, por favor ignore esse email e o seu password vai permanecer o mesmo.\n'
        };
        smtpTransport.sendMail(mailOptions, function(err) {
          console.log('mail sent');
          //req.flash('success', 'An e-mail has been sent to ' + user.email + ' with further instructions.');
          done(err, 'done');
        });
      }
    ], function(err) {
      if (err) return next(err);
      res.redirect('/forgot');
    });
  });

  app.get('/reset/:token', function(req, res) {
    User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }, function(err, user) {
      if (!user) {
        //req.flash('error', 'Password reset token is invalid or has expired.');
        return res.redirect('/forgot');
      }
      res.render('reset', {token: req.params.token});
    });
  });
  
  app.post('/reset/:token', function(req, res) {
    async.waterfall([
      function(done) {
        User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }, function(err, user) {
          if (!user) {
            //req.flash('error', 'Password reset token is invalid or has expired.');
            return res.redirect('back');
          }
          if(req.body.password === req.body.confirm) {
            user.setPassword(req.body.password, function(err) {
              user.resetPasswordToken = undefined;
              user.resetPasswordExpires = undefined;
  
              user.save(function(err) {
                req.logIn(user, function(err) {
                  done(err, user);
                });
              });
            })
          } else {
              //req.flash("error", "Passwords do not match.");
              return res.redirect('back');
          }
        });
      },
      function(user, done) {
        var smtpTransport = nodemailer.createTransport({
          service: 'Gmail', 
          auth: {
            user: 'ramondhr742@gmail.com',
            pass: 'Frenesi167349'
          }
        });
        var mailOptions = {
          to: user.email,
          from: 'ramondhr742@gmail.com',
          subject: 'Sua Senha Foi Mudada',
          text: 'Oi' + user.username + ',\n\n' +
            'Esse email é uma confirmação informando que a senha da sua conta ' + user.email + ' foi mudada.\n'
        };
        smtpTransport.sendMail(mailOptions, function(err) {
          //req.flash('success', 'Success! Your password has been changed.');
          done(err);
        });
      }
    ], function(err) {
      res.redirect('/inicio');
    });
  });

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Our app is running on port ${ PORT }`);
});