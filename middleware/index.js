var Post = require("../models/post");
var Comment = require("../models/comment");

var middlewareObj = {};


middlewareObj.checkCampgroundOwnership = function(req, res, next){
    //is the user logged in?
    if(req.isAuthenticated()){
        Post.findById(req.params.id, function(err, foundPost){
            if(err || !foundPost){
                console.log(err);
                //req.flash("error", "Campground not found");
                res.redirect("/campgrounds");
            } else {
                if(foundPost.author.id.equals(req.user._id) && req.user.isAdmin){  //compara object id foundCampground.author.id com string req.user._id
                    next();
                } else {
                    //req.flash("error", "You don't have permission to do that");
                    res.redirect("back");
                }
            }
        });
    }else{
        req.flash("error", "You need to be logged in to do that");
        res.redirect("back");
    }
}

middlewareObj.checkCommentOwnership = function(req, res, next){
    //is the user logged in?
    if(req.isAuthenticated()){
        Comment.findById(req.params.comment_id, function(err, foundComment){
            if(err || !foundComment){
                console.log(err);
                req.flash("error", "Sorry, that comment doest not exist!");
                res.redirect("back");
            } else {
                if(foundComment.author.id.equals(req.user._id) || req.user.isAdmin){  //compara object id foundCampground.author.id com string req.user._id
                    next();
                } else {
                    req.flash("error", "You don't have permission to do that");
                    res.redirect("back");
                }
            }
        });
    }else{
        req.flash("error", "You need to be logged in to do that");
        res.redirect("back");
    }
}

middlewareObj.isLoggedIn = function(req, res, next){
    if(req.isAuthenticated()){
        return next();
    } else {
        res.redirect("/login");
    }
}

middlewareObj.isAdmin = function(req, res, next){
    if(req.isAuthenticated() && req.user.isAdmin){
        return next();
    } else {
        res.redirect("/inicio");
    }
}

module.exports = middlewareObj;