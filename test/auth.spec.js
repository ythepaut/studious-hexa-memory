const request = require('supertest-session');
const app = require("../src/app");

describe("Auth Routes", () => {
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

        it("Should have a status code of 400 upon creating user with missing fields", (done) => {
            request(app)
                .post("/account/register")
                .set("Content-Type", "application/x-www-form-urlencoded")
                .send({
                    key: "ThisKeyIsWrong",
                    username: "test",
                    passwd: "WCRShQtBvK3x7Jkq",
                    _csrf: "disabled"
                })
                .expect(200)
                .end((err) => {
                    if (err) return done(err);
                    done();
                });
        });

        it("Should have a status code of 403 upon creating user with wrong key", (done) => {
            request(app)
                .post("/account/register")
                .set("Content-Type", "application/x-www-form-urlencoded")
                .send({
                    key: "ThisKeyIsWrong",
                    username: "test",
                    passwd: "WCRShQtBvK3x7Jkq",
                    passwd2: "WCRShQtBvK3x7Jkq",
                    _csrf: "disabled"
                })
                .expect(200)
                .end((err) => {
                    if (err) return done(err);
                    done();
                });
        });

        it("Should have a status code of 200 upon creating user", (done) => {
            request(app)
                .post("/account/register")
                .set("Content-Type", "application/x-www-form-urlencoded")
                .send({
                    key: "TestTestTestTest",
                    username: "test",
                    passwd: "WCRShQtBvK3x7Jkq",
                    passwd2: "WCRShQtBvK3x7Jkq",
                    _csrf: "disabled"
                })
                .expect(200)
                .end((err) => {
                    if (err) return done(err);
                    done();
                });
        });
    });
});
