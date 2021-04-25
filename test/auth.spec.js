require("./index.spec");

const request = require("supertest-session"),
      { expect } = require("chai");
const app = require("../src/app");
const User = require("../src/model/user");

const testUser = {
    key: "TestTestTestTest",
    username: "test",
    passwd: "WCRShQtBvK3x7Jkq"
};

require("../src/helper/db")(process.env.STUDIOUSHEXAMEMORY_MONGODB_URI, (db) => {
    describe("Authentication", () => {

        describe("GET /account/me", () => {
            it("Should have a status code of 401 when disconnected", (done) => {
                request(app)
                    .get("/account/me")
                    .expect(401)
                    .end((err) => {
                        if (err) return done(err);
                        done();
                    });
            });
        });


        describe("POST /account/register", () => {
            it("Should have a status code of 400 upon user creation with missing fields", (done) => {
                request(app)
                    .post("/account/register")
                    .set("Content-Type", "application/x-www-form-urlencoded")
                    .send({
                        key: testUser.key,
                        username: testUser.username,
                        passwd: testUser.passwd,
                        _csrf: "disabled"
                    })
                    .expect(200)
                    .end((err) => {
                        if (err) return done(err);
                        done();
                    });
            });

            it("Should not create an account with a wrong key", (done) => {
                const wrongKey = "ThisKeyIsWrong";
                request(app)
                    .post("/account/register")
                    .set("Content-Type", "application/x-www-form-urlencoded")
                    .send({
                        key: wrongKey,
                        username: testUser.username,
                        passwd: testUser.passwd,
                        passwd2: testUser.passwd,
                        _csrf: "disabled"
                    })
                    .expect(200)
                    .end(() => {
                        User.getUserByKey(db, wrongKey, (user) => {
                            expect(user).eql(null);
                            done();
                        });
                    });
            });

            it("Should have a status code of 200 upon user creation", (done) => {
                request(app)
                    .post("/account/register")
                    .set("Content-Type", "application/x-www-form-urlencoded")
                    .send({
                        key: testUser.key,
                        username: testUser.username,
                        passwd: testUser.passwd,
                        passwd2: testUser.passwd,
                        _csrf: "disabled"
                    })
                    .expect(200)
                    .end(done);
            });

            it("Should match the user created", (done) => {
                let bcrypt = require("bcrypt");
                User.getUserByKey(db, testUser.key, (user) => {
                    expect(user).to.have.all.keys("_id", "_key", "_username", "_passwd", "_role", "_status", "_exercisesDone");
                    expect(user._key).eql(testUser.key);
                    expect(user._username).eql(testUser.username);
                    expect(bcrypt.compareSync(testUser.passwd, user.passwd)).eql(true);
                    expect(user._role).eql("OWNER");
                    expect(user._status).eql("ALIVE");
                    expect(user._exercisesDone).eql(null);
                    done();
                });
            });

            it("Should not create an account with an used key", (done) => {
                request(app)
                    .post("/account/register")
                    .set("Content-Type", "application/x-www-form-urlencoded")
                    .send({
                        key: testUser.key,
                        username: testUser.username,
                        passwd: testUser.passwd,
                        passwd2: testUser.passwd,
                        _csrf: "disabled"
                    })
                    .expect(200)
                    .end(() => {
                        User.getUsers(db, (users) => {
                            expect(users.filter((user) => user._key === testUser.key)).length(1);
                            done();
                        });
                    });
            });
        });


        describe("POST /account/login", () => {
            it("Should have a status code of 400 upon user login with missing fields", (done) => {
                request(app)
                    .post("/account/login")
                    .set("Content-Type", "application/x-www-form-urlencoded")
                    .send({
                        username: testUser.username,
                        _csrf: "disabled"
                    })
                    .expect(400)
                    .end((err) => {
                        if (err) return done(err);
                        done();
                    });
            });

            it("Should deny access to invalid credentials", (done) => {
                request(app)
                    .post("/account/login")
                    .set("Content-Type", "application/x-www-form-urlencoded")
                    .send({
                        username: testUser.username,
                        passwd: "ThisPasswordIsWrong",
                        _csrf: "disabled"
                    })
                    .expect(200)
                    .end((_, res) => {
                        expect(JSON.parse(res.text).type).eql("error");
                        done();
                    });
            });

            it("Should deny access to suspended account", (done) => {

                db.collection("accounts").updateOne(
                    {key: testUser.key},
                    {$set: {status: "SUSPENDED"}},
                    () => {
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
                                expect(JSON.parse(res.text).type).eql("error");
                                db.collection("accounts").updateOne(
                                    {key: testUser.key},
                                    {$set: {status: "ALIVE"}},
                                    () => done());
                            });
                    }
                );
            });

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
                        done();
                    });
            });
        });
    });
});
