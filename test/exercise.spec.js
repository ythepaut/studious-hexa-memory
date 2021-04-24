const request = require("supertest-session"),
    { expect } = require("chai");
const app = require("../src/app");
const Exercise = require("../src/model/exercise");

let userCookie = null;
const testUser = {
    key: "TestTestTestTest",
    username: "test",
    passwd: "WCRShQtBvK3x7Jkq"
};
const testExercise = {
    title: "Test exercise",
    statement: "Test exercise statement",
    response: "Test exercise response",
    time: 30,
    tags: "test,ignore-me,test-ci"
};

require("../src/helper/db")(process.env.STUDIOUSHEXAMEMORY_MONGODB_URI, (db) => {
    describe("Exercise management", () => {
        describe("User Login", () => {
            it("Should allow access with valid credentials", (done) => {
                request(app)
                    .post("/account/login")
                    .set("Content-Type", "application/x-www-form-urlencoded")
                    .send({
                        username: testUser.username,
                        passwd: testUser.passwd,
                        _csrf: "disabled"
                    })
                    .expect(200)
                    .end((_, res) => {
                        expect(JSON.parse(res.text).type).eql("success");
                        userCookie = res.header["set-cookie"];
                        done();
                    });
            });
        });


        describe("GET /exercise/list", () => {
            it("Should have a status code of 200", (done) => {
                request(app)
                    .get("/exercise/list")
                    .set("Cookie", userCookie)
                    .expect(200)
                    .end((err) => {
                        if (err) return done(err);
                        done();
                    });
            });
        });


        describe("GET /exercise/new", () => {
            it("Should have a status code of 200", (done) => {
                request(app)
                    .get("/exercise/new")
                    .set("Cookie", userCookie)
                    .expect(200)
                    .end((err) => {
                        if (err) return done(err);
                        done();
                    });
            });
        });


        describe("POST /exercise/new", () => {
            it("Should have a status code of 400 upon exercise creation with missing fields", (done) => {
                request(app)
                    .post("/exercise/new")
                    .set("Cookie", userCookie)
                    .set("Content-Type", "application/x-www-form-urlencoded")
                    .send({
                        title: testExercise.title,
                        statement: testExercise.statement,
                        time: testExercise.time,
                        tags: testExercise.tags,
                        _csrf: "disabled"
                    })
                    .expect(400)
                    .end((err) => {
                        if (err) return done(err);
                        done();
                    });
            });

            it("Should have a status code of 200 upon exercise creation", (done) => {
                request(app)
                    .post("/exercise/new")
                    .set("Cookie", userCookie)
                    .set("Content-Type", "application/x-www-form-urlencoded")
                    .send({
                        title: testExercise.title,
                        statement: testExercise.statement,
                        response: testExercise.response,
                        time: testExercise.time,
                        tags: testExercise.tags,
                        _csrf: "disabled"
                    })
                    .expect(200)
                    .end((err) => {
                        if (err) return done(err);
                        done();
                    });
            });

            it("Should match the exercise created", (done) => {
                const splittedTags = testExercise.tags.split(/[ ]*,[ ]*/);
                Exercise.getExercises(db, splittedTags, "INTERSECTION", (exercises) => {

                    expect(exercises).length(1);

                    const exercise = exercises[0];

                    expect(exercise).to.have.all.keys("_id", "_title", "_statement", "_response", "_time", "_tags");
                    expect(exercise._title).eql(testExercise.title);
                    expect(exercise._statement).eql(testExercise.statement);
                    expect(exercise._response).eql(testExercise.response);
                    expect(exercise._time).eql(testExercise.time);
                    expect(exercise._tags).to.have.same.members(splittedTags);
                    done();
                });
            });
        });
    });
});
