module.exports = class {

    constructor(app, express, path, db, mongodb) {
        this._app = app;
        this._express = express;
        this._path = path;
        this._db = db;
        this._mongodb = mongodb;
        this._exercise = require("../model/exercise");
        this._user = require("../model/user");
        this._fs = require("fs");
        this._bcrypt = require("bcrypt");
        this._validation = require("./validation");
        this._validator = require("express-joi-validation").createValidator({
            passError: true
        });

        this._initializeRoutes();
    }


    _initializeRoutes() {

        /////////////////////////////////////////
        // setting static folder
        this._app.use(this._express.static(this._path.join(__dirname, "../static")));


        /////////////////////////////////////////
        // Start / Practice / End pages

        // page
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
                    practice : req.session.practice,
                    user : req.session.user
                });
            } else if (req.session.practice.practiceStatus === "IDLE") {
                this._exercise.getTags(this._db, (tags) => {
                    res.render("exercise/start", {
                        tags : tags,
                        user : req.session.user
                    });
                });
            } else if (req.session.practice.practiceStatus === "END") {
                res.render("exercise/end", {
                    practice : req.session.practice,
                    user : req.session.user
                });
            }

        });

        // start/end practice + next exercise
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
                            practice : req.session.practice,
                            user : req.session.user
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
                        practice : req.session.practice,
                        user : req.session.user
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


        /////////////////////////////////////////
        // About pages

        // about page
        this._app.get("/about", (req, res) => {
            res.render("about/about", {
                user : req.session.user
            });
        });

        // legal page
        this._app.get("/legal", (req, res) => {
            res.render("about/legal", {
                user : req.session.user
            });
        });


        /////////////////////////////////////////
        // Login/register page

        // logging in
        this._app.post("/account/login", this._validator.body(this._validation.formLoginSchema), (req, res) => {

            this._user.getUserByName(this._db, req.body.username, (user) => {
                if (user !== null && this._bcrypt.compareSync(req.body.passwd, user.passwd)) {
                    req.session.user = this._user.toJSON(user);
                    res.redirect(req.body.next !== undefined ? req.body.next : "/");
                } else {
                    res.render("error", {
                        verbose : "Identifiants de connexion incorrects.",
                        user : req.session.user
                    });
                }
            });
        });

        // registering
        this._app.post("/account/register", this._validator.body(this._validation.formRegisterSchema), (req, res) => {
            this._user.getUserByKey(this._db, req.body.key, (user) => {
                if (user !== null && user.status === "PENDING_REGISTRATION") {
                    this._user.getUserByName(this._db, req.body.username, (u) => {
                        if (u === null) {
                            user.username = req.body.username;
                            user.passwd = this._bcrypt.hashSync(req.body.passwd,12);
                            user.status = "ALIVE";
                            user.update(this._db, this._mongodb);
                            res.redirect("/account/login");
                        } else {
                            res.render("error", {
                                verbose : "Nom d'utilisateur déjà utilisé.",
                                user : req.session.user
                            });
                        }
                    });
                } else {
                    res.render("error", {
                        verbose : "Clé d'enregistrement incorrecte ou déjà utilisée.",
                        user : req.session.user
                    });
                }
            })
        });

        // login page
        this._app.use((req, res, next) => {
            if (req.session.user === undefined) {
                this._user.getUsers(this._db, (users) => {
                    // giving owner key for first registration if needed
                    let key = null;
                    if (users.filter(user => user.role === "OWNER" && user.status === "ALIVE").length === 0) {
                        if (users.filter(user => user.role === "OWNER" && user.status === "PENDING_REGISTRATION").length === 0) {
                            key = this._user.create(this._db, "OWNER");
                        } else {
                            for (const user of users) {
                                if (user.role === "OWNER") {
                                    key = user.key;
                                }
                            }
                        }
                    }
                    // rendering login page
                    res.render("account/login", {
                        key : key
                    });
                });
            } else {
                next();
            }
        });

        // account status verification
        this._app.use((req, res, next) => {
            this._user.getUser(this._db, this._mongodb, req.session.user._id, (user) => {
                req.session.user = this._user.toJSON(user);

                if (req.session.user.status !== "SUSPENDED") {
                    next();
                } else {
                    req.session.destroy();
                    res.render("error", {
                        verbose : "Votre compte est suspendu."
                    });
                }
            });
        });


        //-------------------------------------------------------------
        // LOGIN REQUIRED BEYOND THIS MARK
        //-------------------------------------------------------------


        /////////////////////////////////////////
        // Exercise management

        // list of exercises
        this._app.get("/exercise/list", (req, res) => {
            if (req.session.user.role === "ADMIN" || req.session.user.role === "OWNER") {
                this._exercise.getExercises(this._db, [], (rawExercises) => {
                    const exercises = this._exercise.toJSONs(rawExercises);
                    res.render("exercise/list",
                        {
                            exerciseDone : 0,
                            successRate : 0,
                            exercises : exercises,
                            user : req.session.user
                        }
                    );
                });
            } else {
                res.render("error", {
                    verbose : "Permission insuffisante",
                    user : req.session.user
                });
            }
        });

        // new exercise
        this._app.get("/exercise/new", (req, res) => {
            if (req.session.user.role === "ADMIN" || req.session.user.role === "OWNER") {
                res.render("exercise/new", {
                    user : req.session.user
                });
            } else {
                res.render("error", {
                    verbose : "Permission insuffisante",
                    user : req.session.user
                });
            }
        });
        this._app.post("/exercise/new", this._validator.body(this._validation.formNewExerciseSchema), (req, res) => {
            if (req.session.user.role === "ADMIN" || req.session.user.role === "OWNER") {
                const exercise = new this._exercise(-1, req.body.title, req.body.statement, req.body.response, this._exercise.formatTime(req.body.time), this._exercise.formatTags(req.body.tags.split(",")));
                exercise.save(this._db, this._mongodb, false, () => {});
                res.redirect("/exercise/list");
            } else {
                res.render("error", {
                    verbose : "Permission insuffisante",
                    user : req.session.user
                });
            }
        });

        // edit exercise
        this._app.get("/exercise/edit/:id", this._validator.params(this._validation.dbIdSchema), (req, res) => {
            if (req.session.user.role === "ADMIN" || req.session.user.role === "OWNER") {
                this._exercise.getExercise(this._db, this._mongodb, req.params.id, (exercise) => {
                    if (exercise !== null) {
                        res.render("exercise/edit", {
                            exercise : this._exercise.toJSON(exercise),
                            user : req.session.user
                        });
                    } else {
                        res.render("error", {
                            verbose : "Exercice innexistant.",
                            user : req.session.user
                        });
                    }
                });
            } else {
                res.render("error", {
                    verbose : "Permission insuffisante",
                    user : req.session.user
                });
            }
        });
        this._app.post("/exercise/edit", this._validator.body(this._validation.formEditExerciseSchema), (req, res) => {
            if (req.session.user.role === "ADMIN" || req.session.user.role === "OWNER") {
                const exercise = new this._exercise(req.body.id, req.body.title, req.body.statement, req.body.response, this._exercise.formatTime(req.body.time), this._exercise.formatTags(req.body.tags.split(",")));
                exercise.save(this._db, this._mongodb, false, () => {});
                res.redirect("/exercise/list");
            } else {
                res.render("error", {
                    verbose : "Permission insuffisante",
                    user : req.session.user
                });
            }
        });

        // delete exercise
        this._app.post("/exercise/delete", this._validator.body(this._validation.dbIdSchema), (req, res) => {
            if (req.session.user.role === "ADMIN" || req.session.user.role === "OWNER") {
                this._exercise.deleteExercise(this._db, this._mongodb, req.body.id);
                res.redirect("/exercise/list");
            } else {
                res.render("error", {
                    verbose : "Permission insuffisante",
                    user : req.session.user
                });
            }
        });

        // clone exercise
        this._app.post("/exercise/clone", this._validator.body(this._validation.dbIdSchema), (req, res) => {
            if (req.session.user.role === "ADMIN" || req.session.user.role === "OWNER") {
                this._exercise.getExercise(this._db, this._mongodb, req.body.id, (exercise) => {
                    let clone = Object.assign({}, this._exercise.toJSON(exercise));
                    clone.id = -1;
                    this._exercise.toExercise(clone).saveExercise(this._db, this._mongodb, false, (id) => {
                        res.redirect("/exercise/edit/" + id);
                    });
                });
            } else {
                res.render("error", {
                    verbose : "Permission insuffisante",
                    user : req.session.user
                });
            }
        });

        // export exercises
        this._app.get("/exercise/export", (req, res) => {
            if (req.session.user.role === "ADMIN" || req.session.user.role === "OWNER") {
                this._exercise.getExercises(this._db, [], (exercises) => {
                    res.set({"Content-Disposition":"attachment; filename=\"shm-export.json\""});
                    res.send(exercises);
                });
            } else {
                res.render("error", {
                    verbose : "Permission insuffisante",
                    user : req.session.user
                });
            }
        });

        // import exercises
        this._app.get("/exercise/import", (req, res) => {
            if (req.session.user.role === "ADMIN" || req.session.user.role === "OWNER") {
                res.render("exercise/import", {
                    user : req.session.user
                });
            } else {
                res.render("error", {
                    verbose : "Permission insuffisante",
                    user : req.session.user
                });
            }
        });
        this._app.post("/exercise/import", (req, res) => {
            if (req.session.user.role === "ADMIN" || req.session.user.role === "OWNER") {

                let multer = require("multer");
                require("../config/storage")(multer, this._path, (storage) => {
                    let upload = multer({storage : storage}).any("import");

                    upload(req, res, (err) => {

                        if (err) {
                            throw err;
                        } else if (!req.files[0]) {
                            res.render("error", {
                                verbose : "Aucun fichier sélectionné."
                            });
                        } else {
                            let path = req.files[0].path;

                            // checking if file has json extension
                            if (path.match(/.*\.json/)) {

                                let importJSON = {};

                                // getting content as json
                                try {
                                    importJSON = JSON.parse(this._fs.readFileSync(path, "utf8").toString());
                                    this._exercise.importExercises(this._db, this._mongodb, importJSON);
                                    this._fs.unlinkSync(path);
                                    res.redirect("/exercise/list");
                                } catch (ex) {
                                    this._fs.unlinkSync(path);
                                    res.render("error", {
                                        verbose : "Le fichier envoyé n'est pas un fichier JSON."
                                    });
                                }

                            } else {
                                this._fs.unlinkSync(path);
                                res.render("error", {
                                    verbose : "Le fichier envoyé n'est pas un fichier JSON."
                                });
                            }
                        }

                    });
                });
            } else {
                res.render("error", {
                    verbose : "Permission insuffisante",
                    user : req.session.user
                });
            }

        });


        /////////////////////////////////////////
        // Account management

        // profile page
        this._app.get("/account/me", (req, res) => {
            res.render("account/profile", {
                user : req.session.user
            });
        });
        this._app.post("/account/edit", this._validator.body(this._validation.formEditProfile), (req, res) => {
            this._user.getUserByName(this._db, req.session.user.username, (user) => {
                if (this._bcrypt.compareSync(req.body.passwd, user.passwd)) {
                    if (req.body.action === "changeusername") {
                        this._user.getUserByName(this._db, req.body.username, (u) => {
                            if (u === null) {
                                user.username = req.body.username;
                                user.update(this._db, this._mongodb);
                                req.session.destroy();
                                res.redirect("/account/me");
                            } else {
                                res.render("error", {
                                    verbose : "Nom d'utilisateur déjà utilisé.",
                                    user : req.session.user
                                });
                            }
                        });
                    } else if (req.body.action === "changepassword") {
                        user.passwd = this._bcrypt.hashSync(req.body.newpasswd,12);
                        user.update(this._db, this._mongodb);
                        req.session.destroy();
                        res.redirect("/account/me");
                    } else if (req.body.action === "delete") {
                        user.delete(this._db, this._mongodb);
                        req.session.destroy();
                        res.redirect("/account/me");
                    }
                } else {
                    res.render("error", {
                        verbose : "Mot de passe incorrect",
                        user : req.session.user
                    });
                }
            });
        });

        // account list
        this._app.get("/account/list", (req, res) => {
            if (req.session.user.role === "OWNER") {
                this._user.getUsers(this._db, (users) => {
                    res.render("account/list", {
                        users : users,
                        user : req.session.user
                    });
                });
            } else {
                res.render("error", {
                    verbose : "Permission insuffisante",
                    user : req.session.user
                });
            }
        });

        // create account key
        this._app.post("/account/new", this._validator.body(this._validation.formNewKey), (req, res) => {
            if (req.session.user.role === "OWNER") {
                this._user.create(this._db, req.body.role);
                res.redirect("/account/list");
            } else {
                res.render("error", {
                    verbose : "Permission insuffisante",
                    user : req.session.user
                });
            }
        });

        // delete account
        this._app.post("/account/delete", this._validator.body(this._validation.dbIdSchema), (req, res) => {
            if (req.session.user.role === "OWNER") {
                this._user.getUser(this._db, this._mongodb, req.body.id, (user) => {
                    if (user !== null) {
                        user.delete(this._db, this._mongodb);
                    }
                    res.redirect("/account/list");
                });
            } else {
                res.render("error", {
                    verbose : "Permission insuffisante",
                    user : req.session.user
                });
            }
        });

        // edit account
        this._app.post("/account/adminedit", this._validator.body(this._validation.formEditUser), (req, res) => {
            if (req.session.user.role === "OWNER") {
                this._user.getUser(this._db, this._mongodb, req.body.id, (user) => {
                    if (user !== null && user.role !== "OWNER") {
                        if (req.body.role !== undefined) {
                            user.role = req.body.role;
                        }
                        if (req.body.status !== undefined) {
                            if (user.status !== "PENDING_REGISTRATION") {
                                user.status = req.body.status;
                            }
                        }
                        user.update(this._db, this._mongodb);
                        res.redirect("/account/list");
                    } else {
                        res.render("error", {
                            verbose : "Impossible de modifier cet utilisateur",
                            user : req.session.user
                        });
                    }
                });
            } else {
                res.render("error", {
                    verbose : "Permission insuffisante",
                    user : req.session.user
                });
            }
        });

        // log out
        this._app.get("/account/logout", (req, res) => {
            req.session.destroy();
            res.redirect("/");
        });


        /////////////////////////////////////////
        // error pages

        // 400 - Form validation error
        this._app.use((err, req, res, next) => {
            if (err && err.error && err.error.isJoi) {
                res.status(400).render("error", {
                    verbose : "Requête ou formulaire invalide. Veuillez vérifier les champs et réessayez.",
                    user : req.session.user
                });
                console.log(err.error.toString());
            } else {
                next(err);
            }
        });

        // 404 - No route
        this._app.use((req, res) => {
            res.status(404).render("error", {
                verbose : "Cette page n'éxiste pas.",
                user : req.session.user
            });
        });

    }
};
