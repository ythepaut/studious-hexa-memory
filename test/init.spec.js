const app = require("../src/app");

// Waiting for server to start
before((done) => {
    app.on("server_started", () => {
        done();
    });
});

// Populating database
before((done) => {
    require("../src/helper/db")((db) => {

        // Test user
        db.collection("accounts").insertOne({
            role : "MEMBER",
            status : "PENDING_REGISTRATION",
            key : "TestTestTestTest"
        });

        done();
    });
});

// Cleaning database
after((done) => {
    require("../src/helper/db")((db) => {

        // Test user
        db.collection("accounts").deleteOne(
            {key : "TestTestTestTest"}
        );

        done();
    });
});

// Closing server
after((done) => {
    app.close();
    done();
});
