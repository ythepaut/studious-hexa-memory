const request = require("supertest");
const app = require("../src/app");

describe("Static pages", () => {
    describe("GET /", () => {
        it("Should have a status code of 200", (done) => {
                request(app)
                    .get("/")
                    .expect(200)
                    .end((err) => {
                        if (err) return done(err);
                        done();
                    });
        });
    });
    describe("GET /about", () => {
        it("Should have a status code of 200", (done) => {
            request(app)
                .get("/about")
                .expect(200)
                .end((err) => {
                    if (err) return done(err);
                    done();
                });
        });
    });
    describe("GET /legal", () => {
        it("Should have a status code of 200", (done) => {
            request(app)
                .get("/legal")
                .expect(200)
                .end((err) => {
                    if (err) return done(err);
                    done();
                });
        });
    });
});
