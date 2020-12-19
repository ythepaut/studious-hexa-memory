require("dotenv").config();
let http = require("http"),
    express = require("express"),
    path = require("path"),
    bodyParser = require('body-parser');
let app = express(),
    server = http.createServer(app);

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

// setting view engine
app.set("view engine", "ejs");

// setting routes
require("./helper/db")((client) => {
    new (require("./helper/service"))(app, express, path, client);
});

// starting server
server.listen(process.env.STUDIOUSHEXAMEMORY_SERVER_PORT, () => {
    console.log(`Server is now listening on port ${process.env.STUDIOUSHEXAMEMORY_SERVER_PORT}...`);
});
