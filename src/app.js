require("dotenv").config({path: `${__dirname}/../.env`});
let http = require("http"),
    express = require("express"),
    path = require("path"),
    bodyParser = require("body-parser"),
    mongodb = require("mongodb"),
    session = require("express-session"),
    RateLimit = require("express-rate-limit"),
    csrf = require("csurf");
let app = express(),
    server = http.createServer(app);


// setting middlewares

// body parser setup
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

// rate limit (1000 request / 5min window max) setup
app.use(new RateLimit({
    windowMs: 5 * 60 * 1000,
    max: 1000
}));

// session setup
app.use(session({
    secret : process.env.STUDIOUSHEXAMEMORY_SESSION_SECRET,
    resave : false,
    saveUninitialized : false
}));

// CSRF protection
if (process.env.STUDIOUSHEXAMEMORY_ENVIRONMENT !== "test") {
    app.use(csrf({}));
}

app.set("view engine", "ejs");
app.set("views", `${__dirname}/views`);

// setting routes
require("./helper/db")(process.env.STUDIOUSHEXAMEMORY_MONGODB_URI, (client) => {
    new (require("./helper/service"))(app, express, path, client, mongodb);
});


// starting server
server.listen(process.env.STUDIOUSHEXAMEMORY_SERVER_PORT, () => {
    console.log(`Server is now listening on port ${process.env.STUDIOUSHEXAMEMORY_SERVER_PORT}...`);
    // Ensures the server is started before running tests
    setTimeout(() => server.emit("server_started"), 1000);
});

module.exports = server;
