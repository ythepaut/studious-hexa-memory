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
            res.render("exercise/practice", {
                tags : this._exercise.getTags()
            });
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
                    res.render("/error", {
                        exercise : null //TODO make error page
                    });
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

        // new exercise
        this._app.post("/manage/new", (req, res) => {
            const exercise = new this._exercise(-1, req.body.title, req.body.statement, req.body.response, this._exercise.formatTime(req.body.time), this._exercise.formatTags(req.body.tags.split(",")));

            if (exercise.saveExercise(this._db)) {
                res.redirect("/manage");
            } else {
                res.redirect("/error");
            }
        });

    }
}
