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
                    practiceStatus : "IDLE",    // IDLE / PRACTICING / END
                    exercisesDone : [],         // list of exercise done
                    exerciseSuccessCount : 0,   // number of success
                    exerciseMax : 0,            // number of exercise to do, 0 for infinite
                    exerciseTags : [],          // exercise tags filter
                    currentExercise : null,     // current exercise
                    endReason : null            // MANUAL / MAX_REACHED / DEPLETED
                }
            }

            // if in practice, show exercise, else start page
            if (req.session.practice.practiceStatus === "PRACTICING") {
                res.render("exercise/exercise", {
                    practice : req.session.practice
                });
            } else if (req.session.practice.practiceStatus === "IDLE") {
                this._exercise.getTags(this._db, (tags) => {
                    res.render("exercise/start", {
                        tags : tags
                    });
                });
            } else if (req.session.practice.practiceStatus === "END") {
                res.render("exercise/end", {
                    practice : req.session.practice
                });
            }

        });

        // list of exercises
        this._app.get("/manage", (req, res) => {

            this._exercise.getExercises(this._db, [], (rawExercises) => {

                const exercises = this._exercise.toJSONs(rawExercises);

                res.render("exercise/list",
                    {
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

            if (req.params.id.match(/[0-9a-f]{24}/)) {
                this._exercise.getExercise(this._db, this._mongodb, req.params.id, (exercise) => {
                    if (exercise !== null) {
                        res.render("exercise/edit", {
                            exercise : this._exercise.toJSON(exercise)
                        });
                    } else {
                        res.render("error");
                    }
                });
            } else {
                res.render("error");
            }

        });

        // export exercises
        this._app.get("/manage/export", (req, res) => {
            this._exercise.getExercises(this._db, [], (exercises) => {
                res.set({"Content-Disposition":"attachment; filename=\"shm-export.json\""});
                res.send(exercises);
            });
        });

        // import exercises page
        this._app.get("/manage/import", (req, res) => {
            res.render("exercise/import");
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

            if (req.session.practice !== undefined && !req.body.finish) {

                if (req.session.practice.practiceStatus === "PRACTICING") {

                    if (req.body.success !== undefined) {
                        // exercise submission

                        // add current exercise to exercise done list
                        req.session.practice.exercisesDone.push(
                            {
                                id : req.session.practice.currentExercise.id,
                                title : req.session.practice.currentExercise.title,
                                tags : req.session.practice.currentExercise.tags,
                                success : req.body.success === "true"
                            }
                        );

                        // update success count
                        if (req.body.success === "true") {
                            req.session.practice.exerciseSuccessCount += 1;
                        }

                        if (req.session.practice.exercisesDone.length < req.session.practice.exerciseMax || req.session.practice.exerciseMax === 0) {

                            // finds new exercise
                            this._exercise.getNextExercise(this._db, this._mongodb, req.session.practice.exerciseTags, req.session.practice.exercisesDone.map(e => e.id), (exercise) => {

                                if (exercise !== null) {
                                    req.session.practice.currentExercise = this._exercise.toJSON(exercise);
                                } else {
                                    // end practice (DEPLETED)
                                    req.session.practice.practiceStatus = "END";
                                    req.session.practice.endReason = "DEPLETED";
                                }


                                // terminates request
                                res.send("OK");
                            });

                        } else {
                            // end practice (MAX_REACHED)

                            req.session.practice.practiceStatus = "END";
                            req.session.practice.endReason = "MAX_REACHED";

                            res.send("OK");
                        }

                    } else if (req.body.end) {
                        // end practice (MANUAL)

                        req.session.practice.practiceStatus = "END";
                        req.session.practice.endReason = "MANUAL";

                        res.render("exercise/end", {
                            practice : req.session.practice
                        });

                    } else {
                        res.send("KO");
                    }

                } else if (req.session.practice.practiceStatus === "IDLE") {
                    // starting practice session

                    // reset practice data
                    req.session.practice = {
                        practiceStatus : "PRACTICING",
                        exercisesDone : [],
                        exerciseSuccessCount : 0,
                        endReason : null
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
                    this._exercise.getNextExercise(this._db, this._mongodb, req.session.practice.exerciseTags, req.session.practice.exercisesDone.map(e => e.id), (exercise) => {

                        if (exercise !== null) {
                            req.session.practice.currentExercise = this._exercise.toJSON(exercise);
                        } else {
                            // end practice (DEPLETED)
                            req.session.practice.practiceStatus = "END";
                            req.session.practice.endReason = "DEPLETED";
                        }

                        // refreshing page
                        res.redirect("/");
                    });

                } else {

                    res.render("exercise/end", {
                        practice : req.session.practice
                    });
                }

            } else {

                if (req.body.finish) {
                    req.session.practice.practiceStatus = "IDLE";
                }

                // session undefined
                res.redirect("/");

            }


        });

        // new exercise
        this._app.post("/manage/new", (req, res) => {
            this._updateInsertExercise(req, res);
        });

        this._app.post("/manage/edit", (req, res) => {
            this._updateInsertExercise(req, res);
        });

        this._app.post("/manage/delete", (req, res) => {
            this._exercise.deleteExercise(this._db, this._mongodb, req.body.id);
            res.redirect("/manage");
        });

    }

    _updateInsertExercise(req, res) {
        const exercise = new this._exercise(req.body.id !== undefined ? req.body.id : -1, req.body.title, req.body.statement, req.body.response, this._exercise.formatTime(req.body.time), this._exercise.formatTags(req.body.tags.split(",")));

        if (exercise.saveExercise(this._db, this._mongodb)) {
            res.redirect("/manage");
        } else {
            res.redirect("/error");
        }
    }
}
