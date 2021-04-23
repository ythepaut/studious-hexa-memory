const request = require("supertest");
const app = require("../src/app");

describe("Index Routes", () => {
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
});
