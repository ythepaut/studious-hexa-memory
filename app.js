require("dotenv").config();
let http = require("http"),
    express = require("express"),
    path = require("path"),
    bodyParser = require("body-parser"),
    mongodb = require("mongodb"),
    session = require("express-session"),
    RateLimit = require("express-rate-limit");
let app = express(),
    server = http.createServer(app);


// setting middlewares
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.use(new RateLimit({
    windowMs: 5 * 60 * 1000,
    max: 1000
}));

app.use(session({
    secret : process.env.STUDIOUSHEXAMEMORY_SESSION_SECRET,
    resave : false,
    saveUninitialized : false
}));

app.set("view engine", "ejs");

// setting routes
require("./helper/db")((client) => {
    new (require("./helper/service"))(app, express, path, client, mongodb);
});


// starting server
server.listen(process.env.STUDIOUSHEXAMEMORY_SERVER_PORT, () => {
    console.log(`Server is now listening on port ${process.env.STUDIOUSHEXAMEMORY_SERVER_PORT}...`);
});
