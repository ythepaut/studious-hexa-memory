module.exports = class {

    constructor(app, express, path, db, mongodb) {
        this._app = app;
        this._express = express;
        this._path = path;
        this._db = db;
        this._mongodb = mongodb;
        this._initializeRoutes();
        this._exercise = require("../model/exercise");
    }


    _initializeRoutes() {

        // setting static folder
        this._app.use(this._express.static(this._path.join(__dirname, "../static")));


        /////////////////////////////////////////
        // "GET" pages

        // home (practice)
        this._app.get("/", (req, res) => {

            // set session if not set
            if (req.session.practice === undefined) {
                req.session.practice = {
                    inPractice : false,         // true if practicing
                    exercisesDone : [],         // list of exercise done
                    exerciseSuccessCount : 0,   // number of success
                    exerciseMax : 0,            // number of exercise to do, 0 for infinite
                    exerciseTags : [],          // exercise tags filter
                    currentExercise : null      // current exercise
                }
            }

            // if in practice, show exercise, else start page
            if (req.session.practice.inPractice) {
                res.render("exercise/exercise", {
                    practice : req.session.practice
                });
            } else {
                this._exercise.getTags(this._db, (tags) => {
                    res.render("exercise/start", {
                        tags : tags
                    });
                });
            }

        });

        // list of exercises
        this._app.get("/manage", (req, res) => {

            this._exercise.getExercises(this._db, [], (rawExercises) => {

                const exercises = this._exercise.toJSONs(rawExercises);

                res.render("exercise/list",
                    {
                        exerciseCount : 0,
                        exerciseTime : 0,
                        exerciseDone : 0,
                        successRate : 0,
                        exercises : exercises
                    }
                );
            });
        });

        // new exercise page
        this._app.get("/manage/new", (req, res) => {
            res.render("exercise/new");
        });

        // edit exercise page
        this._app.get("/manage/edit/:id", (req, res) => {

            const exercise = this._exercise.getExercise(this._db, this._mongodb, req.params.id, (exercise) => {
                if (exercise !== null) {
                    res.render("exercise/edit", {
                        exercise : this._exercise.toJSON(exercise)
                    });
                } else {
                    res.render("error");
                }
            });

        });

        // about page
        this._app.get("/about", (req, res) => {
            res.render("about/about");
        });

        // legal page
        this._app.get("/legal", (req, res) => {
            res.render("about/legal");
        });


        /////////////////////////////////////////
        // Form POSTs

        // start practice
        this._app.post("/", (req, res) => {

            if (req.session.practice !== undefined) {

                if (req.session.practice.inPractice) {

                    if (req.body.success !== undefined) {
                        // exercise submission

                        // add current exercise to exercise done list
                        req.session.practice.exercisesDone.push(req.session.practice.currentExercise.id);

                        // update success count
                        if (req.body.success) {
                            req.session.practice.exerciseSuccessCount += 1;
                        }

                        // finds new exercise
                        this._exercise.getNextExercise(this._db, this._mongodb, req.session.practice.exerciseTags, req.session.practice.exercisesDone, (exercise) => {
                            req.session.practice.currentExercise = this._exercise.toJSON(exercise);

                            // terminates request
                            res.send("OK");
                        });

                    } else if (req.body.end) {
                        // end practice

                        req.session.practice.inPractice = false; // FIXME
                        res.render("exercise/end", {
                            practice : req.session.practice
                        });

                    } else {
                        res.send("KO");
                    }

                } else {
                    // starting practice session

                    // reset practice data
                    req.session.practice = {
                        inPractice : true,
                        exercisesDone : [],
                        exerciseSuccessCount : 0
                    }
                    if (!isNaN(req.body.exerciseCount) && !isNaN(parseInt(req.body.exerciseCount))) {
                        req.session.practice.exerciseMax = Math.max(parseInt(req.body.exerciseCount), 0);
                    } else {
                        req.session.practice.exerciseMax = 0;
                    }
                    if (typeof req.body.tags === "string") {
                        req.session.practice.exerciseTags = [req.body.tags];
                    } else if (typeof req.body.tags === "object") {
                        req.session.practice.exerciseTags = req.body.tags;
                    } else {
                        req.session.practice.exerciseTags = [];
                    }
                    this._exercise.getNextExercise(this._db, this._mongodb, req.session.practice.exerciseTags, req.session.practice.exercisesDone, (exercise) => {

                        req.session.practice.currentExercise = this._exercise.toJSON(exercise);

                        // refreshing page
                        res.redirect("/");
                    });
                }

            } else {

                // session undefined
                res.redirect("/");

            }


        });

        // new exercise
        this._app.post("/manage/new", (req, res) => {
            const exercise = new this._exercise(-1, req.body.title, req.body.statement, req.body.response, this._exercise.formatTime(req.body.time), this._exercise.formatTags(req.body.tags.split(",")));

            if (exercise.saveExercise(this._db)) {
                res.redirect("/manage");
            } else {
                res.redirect("/error");
            }
        });

        // TODO edit exercise
        this._app.post("/manage/edit", (req, res) => {
            res.send("TODO");
        });

        this._app.post("/manage/delete", (req, res) => {
            this._exercise.deleteExercise(this._db, this._mongodb, req.body.id);
            res.redirect("/manage");
        });


    }
}
