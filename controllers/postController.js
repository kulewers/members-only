const Post = require("../models/post");
const User = require("../models/user");
const { body, validationResult } = require("express-validator");

const asyncHandler = require("express-async-handler");

exports.post_create_get = asyncHandler(async (req, res, next) => {
    if (!req.user) {
        res.redirect("/log-in");
    }
    res.render("post-form", {
        post: null,
        errors: null,
    });
});

exports.post_create_post = [
    (req, res, next) => {
        if (!req.user) {
            res.redirect("/log-in");
        }
        next();
    },
    body("title", "Title must contain at least 3 characters")
        .trim()
        .isLength({ min: 3 })
        .escape(),
    body("body", "Body must contain at least 3 characters")
        .trim()
        .isLength({ min: 3 })
        .escape(),
    asyncHandler(async (req, res, next) => {
        const errors = validationResult(req);

        console.log("hello world");

        const post = new Post({
            title: req.body.title,
            body: req.body.body,
            creator: req.user._id,
            timestamp: new Date(),
        });

        if (!errors.isEmpty()) {
            res.render("post-form", {
                post: post,
                errors: errors.array(),
            });
            return;
        } else {
            await post.save();
            res.redirect("/");
        }
    }),
];

exports.post_delete_get = [
    (req, res, next) => {
        if (!req.user.admin) {
            res.redirect("/");
        }
        next();
    },
    asyncHandler(async (req, res, next) => {
        const post = await Post.findById(req.params.id)
            .populate("creator")
            .exec();

        if (post === null) {
            const err = new Error("Post not found");
            err.status = 404;
            return next(err);
        }

        res.render("post-delete", {
            post: post,
        });
    }),
];

exports.post_delete_post = [
    (req, res, next) => {
        if (!req.user.admin) {
            res.redirect("/");
        }
        next();
    },
    asyncHandler(async (req, res, next) => {
        await Post.findByIdAndDelete(req.params.id);
        res.redirect("/");
    }),
];
