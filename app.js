require("dotenv").config();
const session = require("express-session");
const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const bcrypt = require("bcryptjs");
const asyncHandler = require("express-async-handler");

mongoose.connect(process.env.MONGODB);
const db = mongoose.connection;
db.on("error", console.error.bind(console, "mongo connection error"));

var createError = require("http-errors");
var express = require("express");
var path = require("path");
var cookieParser = require("cookie-parser");
var logger = require("morgan");
const { body, validationResult } = require("express-validator");
const User = require("./models/user");
const Post = require("./models/post");

const postRouter = require("./routes/postRouter");

var app = express();

// view engine setup
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

app.use(session({ secret: "cats", resave: false, saveUninitialized: true }));

passport.use(
    new LocalStrategy(async (username, password, done) => {
        try {
            const user = await User.findOne({ username: username });
            if (!user) {
                return done(null, false, { message: "Incorrect username" });
            }
            const match = await bcrypt.compare(password, user.password);
            if (!match) {
                return done(null, false, { message: "Incorrect password" });
            }
            return done(null, user);
        } catch (err) {
            return done(err);
        }
    })
);

passport.serializeUser((user, done) => {
    done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
    try {
        const user = await User.findOne({ _id: id });
        done(null, user);
    } catch (err) {
        done(err);
    }
});

app.use(passport.initialize());
app.use(passport.session());

app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

app.use((req, res, next) => {
    res.locals.currentUser = req.user;
    next();
});

app.use("/post", postRouter);

app.get(
    "/",
    asyncHandler(async (req, res, next) => {
        const allPosts = await Post.find().populate("creator").exec();
        res.render("index", { title: "Members Only", posts: allPosts });
    })
);

app.get("/sign-up", (req, res, next) => {
    res.render("sign-up-form", {
        formdata: null,
        errors: null,
    });
});
app.post(
    "/sign-up",
    body("username")
        .trim()
        .isLength({ min: 4 })
        .withMessage("Username must be at least 4 characters long")
        .custom(async (value) => {
            const user = await User.findOne({ username: value });
            if (user) {
                throw new Error("Username already taken");
            }
        })
        .withMessage("Username already taken")
        .escape(),
    body("password")
        .trim()
        .isLength({ min: 5 })
        .withMessage("Password must be at least 5 characters long")
        .escape(),
    body("passwordConfirmation")
        .trim()
        .custom((value, { req }) => {
            return value === req.body.password;
        })
        .withMessage("Password confirmation does not match the password")
        .escape(),
    asyncHandler(async (req, res, next) => {
        const errors = validationResult(req);

        if (!errors.isEmpty()) {
            res.render("sign-up-form", {
                formdata: {
                    username: req.body.username,
                    admin: req.body.admin,
                },
                errors: errors.array(),
            });
            return;
        } else {
            bcrypt.hash(req.body.password, 10, async (err, hashedPassword) => {
                if (err) {
                    return next(err);
                }
                const admin = !!req.body.admin;
                const user = new User({
                    username: req.body.username,
                    password: hashedPassword,
                    membershipStatus: admin ? "member" : "guest",
                    admin: admin,
                });
                const result = await user.save();
                res.redirect("/");
            });
        }
    })
);

app.get("/log-in", (req, res, next) => {
    res.render("log-in-form", {
        formdata: null,
        errors: null,
    });
});

app.post(
    "/log-in",
    passport.authenticate("local", {
        successRedirect: "/",
        failureFlashRedirect: "/",
    })
);

app.get("/log-out", (req, res, next) => {
    req.logout((err) => {
        if (err) {
            return next(err);
        }
        res.redirect("/");
    });
});

app.get("/membership", (req, res, next) => {
    if (!req.user) {
        res.redirect("/log-in");
    }
    if (req.user?.membershipStatus === "member") {
        res.redirect("/");
    }

    res.render("membership-form", {
        formdata: null,
        errors: null,
    });
});

app.post("/membership", [
    body("secretCode")
        .trim()
        .custom((value) => {
            return value === "cats";
        })
        .withMessage("Wrong code..."),
    asyncHandler(async (req, res, next) => {
        const errors = validationResult(req);

        const user = new User({
            username: req.user.username,
            membershipStatus: "member",
            admin: req.user.admin,
            _id: req.user._id,
        });

        if (!errors.isEmpty()) {
            res.render("membership-form", {
                formdata: { secretCode: req.body.secretCode },
                errors: errors.array(),
            });
            return;
        } else {
            await User.findByIdAndUpdate(req.user._id, user, {});

            res.redirect("/");
        }
    }),
]);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
    next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get("env") === "development" ? err : {};

    // render the error page
    res.status(err.status || 500);
    res.render("error");
});

module.exports = app;
