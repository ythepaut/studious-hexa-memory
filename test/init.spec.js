const app = require("../src/app");

const testKey = "TestTestTestTest";

// Waiting for server to start
before((done) => {
    app.on("server_started", () => {
        done();
    });
});

// Populating database
before((done) => {
    require("../src/helper/db")(process.env.STUDIOUSHEXAMEMORY_MONGODB_URI, async (db) => {

        // Test user
        await db.collection("accounts").insertOne({
            role : "OWNER",
            status : "PENDING_REGISTRATION",
            key : testKey
        });

        done();
    });
});

// Cleaning database
after((done) => {
    require("../src/helper/db")(process.env.STUDIOUSHEXAMEMORY_MONGODB_URI, async (db) => {

        // Test user
        await db.collection("accounts").deleteMany(
            {key : "TestTestTestTest"}
        );

        // Test exercise
        await db.collection("exercises").deleteMany(
            {tags : {$regex : "test-ci"}}
        );


        done();
    });
});

// Closing server
after((done) => {
    app.close();
    done();
});
