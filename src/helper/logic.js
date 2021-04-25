module.exports = class {

    constructor(db, mongodb, path) {
        this._db = db;
        this._mongodb = mongodb;
        this._exercise = require("../model/exercise");
        this._user = require("../model/user");
        this._fs = require("fs");
        this._path = path;
        this._bcrypt = require("bcrypt");
        this._language = new (require("./utils/language"))(this._fs, path);
    }

    /**
     * JSON response constructor
     * @param {number}              code            HTTP response code
     * @param {Object}              data            JSON to send for "json", view params for "view"
     */
    responseJSON(code, data) {
        return {
            type : "json",
            code : code,
            data : data
        };
    }
    /**
     * JSON response constructor
     * @param {number}              code            HTTP response code
     * @param {string}              view            View to render (path from /view without .ejs extension)
     * @param {Object}              data            JSON to send for "json", view params for "view"
     */
    responseView(code, view, data) {
        return {
            type : "view",
            code : code,
            data : data,
            view : view
        };
    }
    /**
     * Redirection response constructor
     * @param {string}              target          Redirection target
     */
    responseRedirection(target) {
        return {
            type : "redirection",
            target : target
        };
    }


    /////////////////////////////////////////
    // Practice / Exercise

    /**
     * Render of practice page (start, next, end)
     * @param {Object}              req             Express request
     * @param {function}            callback        Callback fct : callback(response)
     */
    handlePractice(req, callback) {
        // set session if not set
        if (typeof req.session.practice === "undefined") {
            req.session.practice = {
                practiceStatus : "IDLE",    // IDLE / PRACTICING / END
                exercisesDone : [],         // list of exercise done
                exerciseSuccessCount : 0,   // number of success
                exerciseMax : 0,            // number of exercise to do, 0 for infinite
                exerciseTags : [],          // exercise tags filter
                exerciseTagOperation : "",  // exercise tags operation : INTERSECTION / UNION
                currentExercise : null,     // current exercise
                endReason : null            // MANUAL / MAX_REACHED / DEPLETED
            };
        }

        // if in practice, show exercise, else start page
        if (req.session.practice.practiceStatus === "PRACTICING") {
            callback(this.responseView(200, "exercise/exercise", {
                practice : req.session.practice,
                user : req.session.user
            }));
        } else if (req.session.practice.practiceStatus === "IDLE") {
            this._exercise.getTags(this._db, (tags) => {
                callback(this.responseView(200, "exercise/start", {
                    tags : tags,
                    user : req.session.user
                }));
            });
        } else if (req.session.practice.practiceStatus === "END") {
            callback(this.responseView(200, "exercise/end", {
                practice : req.session.practice,
                user : req.session.user
            }));
        }
    }

    /**
     * Submission on practice page (start, new, end)
     * @param {Object}              req             Express request
     * @param {function}            callback        Callback fct : callback(response)
     */
    handlePracticeSubmission(req, callback) {
        if (typeof req.session.practice !== "undefined" && !req.body.finish) {

            if (req.session.practice.practiceStatus === "PRACTICING") {

                if (typeof req.body.success !== "undefined") {
                    // exercise submission

                    // add current exercise to exercise done list
                    req.session.practice.exercisesDone.push({
                        id : req.session.practice.currentExercise.id,
                        title : req.session.practice.currentExercise.title,
                        tags : req.session.practice.currentExercise.tags,
                        success : req.body.success === "true"
                    });

                    // update success count
                    if (req.body.success === "true") {
                        req.session.practice.exerciseSuccessCount += 1;
                    }

                    if (req.session.practice.exercisesDone.length < req.session.practice.exerciseMax || req.session.practice.exerciseMax === 0) {

                        // finds new exercise
                        this._findNextPracticeExercise(req, callback);

                    } else {
                        // end practice (MAX_REACHED)

                        req.session.practice.practiceStatus = "END";
                        req.session.practice.endReason = "MAX_REACHED";

                        callback(this.responseJSON(200, {}));
                    }

                } else if (req.body.end) {
                    // end practice (MANUAL)

                    req.session.practice.practiceStatus = "END";
                    req.session.practice.endReason = "MANUAL";

                    callback(this.responseView(200, "exercise/end", {
                        practice : req.session.practice,
                        user : req.session.user
                    }));

                } else {
                    callback(this.responseJSON(400, {}));
                }

            } else if (req.session.practice.practiceStatus === "IDLE") {
                // starting practice session

                // reset practice data
                req.session.practice = {
                    practiceStatus : "PRACTICING",
                    exercisesDone : [],
                    exerciseSuccessCount : 0,
                    endReason : null
                };
                if (!isNaN(req.body.exerciseCount) && !isNaN(parseInt(req.body.exerciseCount, 10))) {
                    req.session.practice.exerciseMax = Math.max(parseInt(req.body.exerciseCount, 10), 0);
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
                req.session.practice.exerciseTagOperation = req.body.tagOperation;
                this._findNextPracticeExercise(req, callback);

            } else {
                callback(this.responseView(200, "exercise/end", {
                    practice : req.session.practice,
                    user : req.session.user
                }));
            }
        } else {
            if (req.body.finish) {
                // Submit exercise result and reset practice to home page
                req.session.practice.practiceStatus = "IDLE";
                if (req.session.user) {
                    this._user.getUser(this._db, this._mongodb, req.session.user._id, (user) => {
                        user.newExercisesDone(this._db, this._mongodb, req.session.practice.exercisesDone);
                    });
                }
            }
            // session undefined
            callback(this.responseRedirection("/"));
        }
    }

    /**
     * Finds the next exercise, updates the practice object and refreshes the client's page
     * Only used by `handlePracticeSubmission()`
     * @param {Object}              req             Express request
     * @param {function}            callback        Callback fct : callback(response)
     */
    _findNextPracticeExercise(req, callback) {
        this._exercise.getNextExercise(this._db, this._mongodb, req.session.practice.exerciseTags, req.session.practice.exerciseTagOperation, req.session.practice.exercisesDone.map((e) => e.id), (exercise) => {

            if (exercise !== null) {
                req.session.practice.currentExercise = this._exercise.toJSON(exercise);
            } else {
                // end practice (DEPLETED)
                req.session.practice.practiceStatus = "END";
                req.session.practice.endReason = "DEPLETED";
            }

            // refreshing page
            callback(this.responseRedirection("/"));
        });
    }

    /**
     * Exercise list page
     * @param {Object}              req             Express request
     * @param {function}            callback        Callback fct : callback(response)
     */
    handleExerciseList(req, callback) {
        if (req.session.user.role === "ADMIN" || req.session.user.role === "OWNER") {
            this._exercise.getExercises(this._db, [], "INTERSECTION", (rawExercises) => {
                const exercises = this._exercise.toJSONs(rawExercises);
                callback(this.responseView(200, "exercise/list", {
                    exerciseDone : 0,
                    successRate : 0,
                    exercises : exercises,
                    user : req.session.user
                }));
            });
        } else {
            callback(this.responseView(403, "error", {
                verbose : this.language.getTranslations(req.session.lang).generic.verbose.error.accessDenied,
                user : req.session.user
            }));
        }
    }

    /**
     * Exercise creation page
     * @param {Object}              req             Express request
     * @param {function}            callback        Callback fct : callback(response)
     */
    handleExerciseNew(req, callback) {
        if (req.session.user.role === "ADMIN" || req.session.user.role === "OWNER") {
            callback(this.responseView(200, "exercise/new", {
                user : req.session.user
            }));
        } else {
            callback(this.responseView(403, "error", {
                verbose : this.language.getTranslations(req.session.lang).generic.verbose.error.accessDenied,
                user : req.session.user
            }));
        }
    }

    /**
     * Exercise creation form submission
     * @param {Object}              req             Express request
     * @param {function}            callback        Callback fct : callback(response)
     */
    handleExerciseNewSubmission(req, callback) {
        if (req.session.user.role === "ADMIN" || req.session.user.role === "OWNER") {
            const exercise = new this._exercise(-1, req.body.title, req.body.statement, req.body.response, this._exercise.formatTime(req.body.time), this._exercise.formatTags(req.body.tags.split(",")));
            exercise.save(this._db, this._mongodb, false, () => {});
            callback(this.responseJSON(200, {
                type : "success",
                message : this.language.getTranslations(req.session.lang).exercise.createEdit.verbose.success.created,
                redirect : "/exercise/list"
            }));
        } else {
            callback(this.responseJSON(403, {
                type : "error",
                message : this.language.getTranslations(req.session.lang).generic.verbose.error.permissionDenied
            }));
        }
    }

    /**
     * Exercise edit page
     * @param {Object}              req             Express request
     * @param {function}            callback        Callback fct : callback(response)
     */
    handleExerciseEdit(req, callback) {
        if (req.session.user.role === "ADMIN" || req.session.user.role === "OWNER") {
            this._exercise.getExercise(this._db, this._mongodb, req.params.id, (exercise) => {
                if (exercise !== null) {
                    callback(this.responseView(200, "exercise/edit", {
                        exercise : this._exercise.toJSON(exercise),
                        user : req.session.user
                    }));
                } else {
                    callback(this.responseView(404, "error", {
                        verbose : this.language.getTranslations(req.session.lang).exercise.createEdit.verbose.error.notFound,
                        user : req.session.user
                    }));
                }
            });
        } else {
            callback(this.responseView(403, "error", {
                verbose : this.language.getTranslations(req.session.lang).generic.verbose.error.accessDenied,
                user : req.session.user
            }));
        }
    }

    /**
     * Exercise edit form submission
     * @param {Object}              req             Express request
     * @param {function}            callback        Callback fct : callback(response)
     */
    handleExerciseEditSubmission(req, callback) {
        if (req.session.user.role === "ADMIN" || req.session.user.role === "OWNER") {
            const exercise = new this._exercise(req.body.id, req.body.title, req.body.statement, req.body.response, this._exercise.formatTime(req.body.time), this._exercise.formatTags(req.body.tags.split(",")));
            exercise.save(this._db, this._mongodb, false, () => {});
            callback(this.responseJSON(200, {
                type : "success",
                message : this.language.getTranslations(req.session.lang).exercise.createEdit.verbose.success.edited,
                redirect : "/exercise/list"
            }));
        } else {
            callback(this.responseJSON(403, {
                type : "error",
                message : this.language.getTranslations(req.session.lang).generic.verbose.error.permissionDenied
            }));
        }
    }

    /**
     * Exercise delete form submission
     * @param {Object}              req             Express request
     * @param {function}            callback        Callback fct : callback(response)
     */
    handleExerciseDelete(req, callback) {
        if (req.session.user.role === "ADMIN" || req.session.user.role === "OWNER") {
            this._exercise.deleteExercise(this._db, this._mongodb, req.body.id);
            callback(this.responseJSON(200, {
                type : "success",
                message : this.language.getTranslations(req.session.lang).exercise.list.verbose.success.deleted,
                redirect : "/exercise/list"
            }));
        } else {
            callback(this.responseJSON(403, {
                type : "error",
                message : this.language.getTranslations(req.session.lang).generic.verbose.error.permissionDenied
            }));
        }
    }

    /**
     * Exercise clone form submission
     * @param {Object}              req             Express request
     * @param {function}            callback        Callback fct : callback(response)
     */
    handleExerciseClone(req, callback) {
        if (req.session.user.role === "ADMIN" || req.session.user.role === "OWNER") {
            this._exercise.getExercise(this._db, this._mongodb, req.body.id, (exercise) => {
                let clone = Object.assign({}, this._exercise.toJSON(exercise));
                clone.id = -1;
                this._exercise.toExercise(clone).save(this._db, this._mongodb, false, (id) => {
                    callback(this.responseRedirection("/exercise/edit/" + id));
                });
            });
        } else {
            callback(this.responseView(403, "error", {
                verbose : this.language.getTranslations(req.session.lang).generic.verbose.error.permissionDenied,
                user : req.session.user
            }));
        }
    }

    /**
     * Exercise export
     * @param {Object}              req             Express request
     * @param {Object}              res             Express response
     */
    handleExerciseExport(req, res) {
        if (req.session.user.role === "ADMIN" || req.session.user.role === "OWNER") {
            this._exercise.getExercises(this._db, [], "INTERSECTION", (exercises) => {
                res.set({"Content-Disposition":"attachment; filename=\"shm-export.json\""});
                res.send(exercises);
            });
        } else {
            res.status(403).render("error", {
                verbose : this.language.getTranslations(req.session.lang).generic.verbose.error.permissionDenied,
                user : req.session.user
            });
        }
    }

    /**
     * Exercise import page
     * @param {Object}              req             Express request
     * @param {function}            callback        Callback fct : callback(response)
     */
    handleExerciseImport(req, callback) {
        if (req.session.user.role === "ADMIN" || req.session.user.role === "OWNER") {
            callback(this.responseView(200, "exercise/import", {
                user : req.session.user
            }));
        } else {
            callback(this.responseView(403, "error", {
                verbose : this.language.getTranslations(req.session.lang).generic.verbose.error.accessDenied,
                user : req.session.user
            }));
        }
    }

    /**
     * Exercise import form submission
     * @param {Object}              req             Express request
     * @param {Object}              res             Express response
     * @param {function}            callback        Callback fct : callback(response)
     */
    handleExerciseImportSubmission(req, res, callback) {
        if (req.session.user.role === "ADMIN" || req.session.user.role === "OWNER") {

            let multer = require("multer");
            require("../config/storage")(multer, require("path"), (storage) => {
                let upload = multer({storage : storage}).any("import");

                upload(req, res, (err) => {

                    if (err) {
                        console.error(err);
                        callback(this.responseView(400, "error", {
                            verbose : this.language.getTranslations(req.session.lang).generic.verbose.error.unknown
                        }));
                    } else if (!req.files[0]) {
                        callback(this.responseView(400, "error", {
                            verbose : this.language.getTranslations(req.session.lang).exercise.import.verbose.error.noFileSelected
                        }));
                    } else {
                        let path = this._path.join("src/uploads/", req.files[0].filename);

                        // checking if file has json extension
                        if (path.match(/.{0,100}\.json/)) {

                            let importJSON = {};

                            // getting content as json
                            try {
                                importJSON = JSON.parse(this._fs.readFileSync(path, "utf8").toString());
                                this._exercise.importExercises(this._db, this._mongodb, importJSON);
                                callback(this.responseRedirection("/exercise/list"));
                            } catch (ex) {
                                callback(this.responseView(400, "error", {
                                    verbose : this.language.getTranslations(req.session.lang).exercise.import.verbose.error.wrongFormat
                                }));
                            }

                        } else {
                            callback(this.responseView(400, "error", {
                                verbose : this.language.getTranslations(req.session.lang).exercise.import.verbose.error.wrongFormat
                            }));
                        }
                        this._fs.unlinkSync(path);
                    }

                });
            });
        } else {
            callback(this.responseView(403, "error", {
                verbose : this.language.getTranslations(req.session.lang).generic.verbose.error.permissionDenied,
                user : req.session.user
            }));
        }
    }


    /////////////////////////////////////////
    // Account

    /**
     * Login verification
     * @param {Object}              req             Express request
     * @param {function}            next            Express next function
     * @param {function}            callback        Callback fct : callback(response)
     */
    handleAccountLoggedInVerification(req, next, callback) {
        if (typeof req.session.user === "undefined") {
            this._user.getUsers(this._db, (users) => {
                // giving owner key for first registration if needed
                let key = null;
                if (users.filter((user) => user.role === "OWNER" && user.status === "ALIVE").length === 0) {
                    if (users.filter((user) => user.role === "OWNER" && user.status === "PENDING_REGISTRATION").length === 0) {
                        this._user.create(this._db, "OWNER", () => {});
                    } else {
                        for (const user of users) {
                            if (user.role === "OWNER") {
                                key = user.key;
                            }
                        }
                    }
                }
                // rendering login page
                if (req.method === "POST") {
                    callback(this.responseJSON(401, {
                        type : "error",
                        message : this.language.getTranslations(req.session.lang).generic.verbose.error.invalidSession
                    }));
                } else {
                    callback(this.responseView(401, "account/login", {
                        key : key
                    }));
                }
            });
        } else {
            next();
        }
    }

    /**
     * Account status verification
     * @param {Object}              req             Express request
     * @param {function}            next            Express next function
     * @param {function}            callback        Callback fct : callback(response)
     */
    handleAccountStatusVerification(req, next, callback) {
        this._user.getUser(this._db, this._mongodb, req.session.user._id, (user) => {
            if (user !== null) {
                req.session.user = this._user.toJSON(user);

                if (req.session.user.status !== "SUSPENDED") {
                    next();
                } else {
                    if (req.method === "POST") {
                        callback(this.responseJSON(401, {
                            type : "error",
                            message : this.language.getTranslations(req.session.lang).generic.verbose.error.invalidSession
                        }));
                    } else {
                        callback(this.responseView(200, "error", {
                            verbose : this.language.getTranslations(req.session.lang).account.login.verbose.error.accountSuspended
                        }));
                    }
                    req.session.destroy();
                }
            } else {
                if (req.method === "POST") {
                    callback(this.responseJSON(401, {
                        type : "error",
                        message : this.language.getTranslations(req.session.lang).generic.verbose.error.invalidSession
                    }));
                } else {
                    callback(this.responseRedirection("/"));
                }
                req.session.destroy();
            }
        });
    }

    /**
     * User login submission
     * @param {Object}              req             Express request
     * @param {function}            callback        Callback fct : callback(response)
     */
    handleAccountLogin(req, callback) {
        this._user.getUserByName(this._db, req.body.username, (user) => {
            if (user !== null && this._bcrypt.compareSync(req.body.passwd, user.passwd)) {
                if (user.status === "ALIVE") {
                    req.session.user = this._user.toJSON(user);
                    callback(this.responseJSON(200, {
                        type : "success",
                        message : this._language.stringFormatter(
                            this.language.getTranslations(req.session.lang).account.login.verbose.success.welcome,
                            user.username
                        ),
                        redirect : typeof req.body.next !== "undefined" ? req.body.next : "/"
                    }));
                } else {
                    callback(this.responseJSON(200, {
                        type : "error",
                        message : this.language.getTranslations(req.session.lang).account.login.verbose.error.accountSuspended
                    }));
                }
            } else {
                callback(this.responseJSON(200, {
                    type : "error",
                    message : this.language.getTranslations(req.session.lang).account.login.verbose.error.invalidCredentials
                }));
            }
        });
    }

    /**
     * Account logout
     * @param {Object}              req             Express request
     * @param {function}            callback        Callback fct : callback(response)
     */
    handleAccountLogout(req, callback) {
        req.session.destroy();
        callback(this.responseRedirection("/"));
    }

    /**
     * User register submission
     * @param {Object}              req             Express request
     * @param {function}            callback        Callback fct : callback(response)
     */
    handleAccountRegister(req, callback) {
        this._user.getUserByKey(this._db, req.body.key, (user) => {
            if (user !== null && user.status === "PENDING_REGISTRATION") {
                this._user.getUserByName(this._db, req.body.username, (u) => {
                    if (u === null) {
                        user.username = req.body.username;
                        user.passwd = this._bcrypt.hashSync(req.body.passwd, 12);
                        user.status = "ALIVE";
                        user.update(this._db, this._mongodb);
                        callback(this.responseJSON(200, {
                            type : "success",
                            message : this.language.getTranslations(req.session.lang).account.login.verbose.success.accountCreated
                        }));
                    } else {
                        callback(this.responseJSON(200, {
                            type : "error",
                            message : this.language.getTranslations(req.session.lang).generic.verbose.error.usernameAlreadyUsed
                        }));
                    }
                });
            } else {
                callback(this.responseJSON(200, {
                    type : "error",
                    message : this.language.getTranslations(req.session.lang).account.login.verbose.error.invalidKey
                }));
            }
        });
    }

    /**
     * User edit own account submission (change username, change password, delete account)
     * @param {Object}              req             Express request
     * @param {function}            callback        Callback fct : callback(response)
     */
    handleAccountEditSubmission(req, callback) {
        this._user.getUserByName(this._db, req.session.user.username, (user) => {
            if (this._bcrypt.compareSync(req.body.passwd, user.passwd)) {
                if (req.body.action === "changeusername") {
                    this._user.getUserByName(this._db, req.body.username, (u) => {
                        if (u === null) {
                            user.username = req.body.username;
                            user.update(this._db, this._mongodb);
                            callback(this.responseJSON(200, {
                                type : "success",
                                message : this.language.getTranslations(req.session.lang).account.profile.verbose.success.usernameChanged,
                                redirect : "/account/login"
                            }));
                            req.session.destroy();
                        } else {
                            callback(this.responseJSON(200, {
                                type : "error",
                                message : this.language.getTranslations(req.session.lang).generic.verbose.error.usernameAlreadyUsed
                            }));
                        }
                    });
                } else if (req.body.action === "changepassword") {
                    user.passwd = this._bcrypt.hashSync(req.body.newpasswd,12);
                    user.update(this._db, this._mongodb);
                    callback(this.responseJSON(200, {
                        type : "success",
                        message : this.language.getTranslations(req.session.lang).account.profile.verbose.success.passwordChanged,
                        redirect : "/account/login"
                    }));
                    req.session.destroy();
                } else if (req.body.action === "delete") {
                    user.delete(this._db, this._mongodb);
                    callback(this.responseJSON(200, {
                        type : "success",
                        message : this.language.getTranslations(req.session.lang).account.profile.verbose.success.accountDeleted,
                        redirect : "/account/login"
                    }));
                    req.session.destroy();
                }
            } else {
                callback(this.responseJSON(200, {
                    type : "error",
                    message : this.language.getTranslations(req.session.lang).account.profile.verbose.error.invalidPassword
                }));
            }
        });
    }

    /**
     * Edit account submission by admin
     * @param {Object}              req             Express request
     * @param {function}            callback        Callback fct : callback(response)
     */
    handleAccountAdminEditSubmission(req, callback) {
        if (req.session.user.role === "OWNER") {
            this._user.getUser(this._db, this._mongodb, req.body.id, (user) => {
                if (user !== null && user.role !== "OWNER") {
                    if (req.body.role !== "void") {
                        user.role = req.body.role;
                    }
                    if (req.body.status !== "void") {
                        if (user.status !== "PENDING_REGISTRATION") {
                            user.status = req.body.status;
                        }
                    }
                    user.update(this._db, this._mongodb);
                    callback(this.responseJSON(200, {
                        type : "success",
                        message : this.language.getTranslations(req.session.lang).account.list.verbose.success.userEdited,
                        redirect : "/account/list"
                    }));
                } else {
                    callback(this.responseJSON(200, {
                        type : "error",
                        message : this.language.getTranslations(req.session.lang).generic.verbose.error.cantEditUser
                    }));
                }
            });
        } else {
            callback(this.responseJSON(403, {
                type : "error",
                message : this.language.getTranslations(req.session.lang).generic.verbose.error.permissionDenied
            }));
        }
    }

    /**
     * Account list page
     * @param {Object}              req             Express request
     * @param {function}            callback        Callback fct : callback(response)
     */
    handleAccountList(req, callback) {
        if (req.session.user.role === "OWNER") {
            this._user.getUsers(this._db, (users) => {
                callback(this.responseView(200, "account/list", {
                    users : users,
                    user : req.session.user
                }));
            });
        } else {
            callback(this.responseView(403, "error", {
                verbose : this.language.getTranslations(req.session.lang).generic.verbose.error.accessDenied,
                user : req.session.user
            }));
        }
    }

    /**
     * Account creation form submission
     * @param {Object}              req             Express request
     * @param {function}            callback        Callback fct : callback(response)
     */
    handleAccountNewSubmission(req, callback) {
        if (req.session.user.role === "OWNER") {
            this._user.create(this._db, req.body.role, (key) => {
                callback(this.responseJSON(200, {
                    type : "success",
                    message : this._language.stringFormatter(
                        this.language.getTranslations(req.session.lang).account.list.verbose.success.keyCreated,
                        key
                    )
                }));
            });
        } else {
            callback(this.responseJSON(403, {
                type : "error",
                message : this.language.getTranslations(req.session.lang).generic.verbose.error.permissionDenied
            }));
        }
    }

    /**
     * Account delete by owner form submission
     * @param {Object}              req             Express request
     * @param {function}            callback        Callback fct : callback(response)
     */
    handleAccountDeleteSubmission(req, callback) {
        if (req.session.user.role === "OWNER") {
            this._user.getUser(this._db, this._mongodb, req.body.id, (user) => {
                if (user !== null && user.role !== "OWNER") {
                    user.delete(this._db, this._mongodb);
                    callback(this.responseJSON(200, {
                        type : "success",
                        message : this.language.getTranslations(req.session.lang).account.list.verbose.success.userDeleted,
                        redirect : "/account/list"
                    }));
                } else {
                    callback(this.responseJSON(200, {
                        type : "error",
                        message : this.language.getTranslations(req.session.lang).generic.verbose.error.cantEditUser
                    }));
                }
            });
        } else {
            callback(this.responseJSON(403, {
                type : "error",
                message : this.language.getTranslations(req.session.lang).generic.verbose.error.permissionDenied
            }));
        }
    }


    /////////////////////////////////////////
    // Miscellaneous

    /**
     * Change language form form submission
     * @param {Object}              req             Express request
     * @param {function}            callback        Callback fct : callback(response)
     */
    handleChangeLanguageSubmission(req, callback) {
        if (this._language.getSupportedLanguages().map((lang) => lang.iso).includes(req.body.lang)) {
            req.session.lang = req.body.lang;
            callback(this.responseJSON(200, {
                type : "success",
                message : this.language.getTranslations(req.session.lang).language.verbose.success.languageChanged,
                refresh : true
            }));
        } else {
            callback(this.responseJSON(200, {
                type : "error",
                message : this.language.getTranslations(req.session.lang).language.verbose.error.notSupported
            }));
        }
    }


    /////////////////////////////////////////

    get language() {
        return this._language;
    }

};
