module.exports = class {

    constructor(db, mongodb) {
        this._db = db;
        this._mongodb = mongodb;
        this._exercise = require("../model/exercise");
        this._user = require("../model/user");
        this._fs = require("fs");
        this._bcrypt = require("bcrypt");
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
        }
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
        }
    }
    /**
     * Redirection response constructor
     * @param {string}              target          Redirection target
     */
    responseRedirection(target) {
        return {
            type : "redirection",
            target : target
        }
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
        if (req.session.practice === undefined) {
            req.session.practice = {
                practiceStatus : "IDLE",    // IDLE / PRACTICING / END
                exercisesDone : [],         // list of exercise done
                exerciseSuccessCount : 0,   // number of success
                exerciseMax : 0,            // number of exercise to do, 0 for infinite
                exerciseTags : [],          // exercise tags filter
                exerciseTagOperation : "",  // exercise tags operation : INTERSECTION / UNION
                currentExercise : null,     // current exercise
                endReason : null            // MANUAL / MAX_REACHED / DEPLETED
            }
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
        if (req.session.practice !== undefined && !req.body.finish) {

            if (req.session.practice.practiceStatus === "PRACTICING") {

                if (req.body.success !== undefined) {
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
                        this._exercise.getNextExercise(this._db, this._mongodb, req.session.practice.exerciseTags, req.session.practice.exerciseTagOperation, req.session.practice.exercisesDone.map(e => e.id), (exercise) => {

                            if (exercise !== null) {
                                req.session.practice.currentExercise = this._exercise.toJSON(exercise);
                            } else {
                                // end practice (DEPLETED)
                                req.session.practice.practiceStatus = "END";
                                req.session.practice.endReason = "DEPLETED";
                            }

                            // terminate request
                            callback(this.responseJSON(200, {}));
                        });

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
                req.session.practice.exerciseTagOperation = req.body.tagOperation;
                this._exercise.getNextExercise(this._db, this._mongodb, req.session.practice.exerciseTags, req.session.practice.exerciseTagOperation, req.session.practice.exercisesDone.map(e => e.id), (exercise) => {

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

            } else {
                callback(this.responseView(200, "exercise/end", {
                    practice : req.session.practice,
                    user : req.session.user
                }));
            }
        } else {
            if (req.body.finish) {
                req.session.practice.practiceStatus = "IDLE";
            }
            // session undefined
            callback(this.responseRedirection("/"));
        }
    }

    /**
     * Exercise list page
     * @param {Object}              req             Express request
     * @param {function}            callback        Callback fct : callback(response)
     */
    handleExerciseList(req, callback) {
        if (req.session.user.role === "ADMIN" || req.session.user.role === "OWNER") {
            this._exercise.getExercises(this._db, [], "UNION", (rawExercises) => {
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
                verbose : "Permission requise pour afficher cette page.",
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
                verbose : "Permission requise pour afficher cette page.",
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
                message : "Exercice créé avec succès.",
                redirect : "/exercise/list"
            }));
        } else {
            callback(this.responseJSON(403, {
                type : "error",
                message : "Permission requise pour effectuer cette action."
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
                        verbose : "Exercice innexistant.",
                        user : req.session.user
                    }));
                }
            });
        } else {
            callback(this.responseView(403, "error", {
                verbose : "Permission requise pour afficher cette page.",
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
                message : "Exercice modifié avec succès.",
                redirect : "/exercise/list"
            }));
        } else {
            callback(this.responseJSON(403, {
                type : "error",
                message : "Permission requise pour effectuer cette action."
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
                message : "Exercice supprimé avec succès.",
                redirect : "/exercise/list"
            }));
        } else {
            callback(this.responseJSON(403, {
                type : "error",
                message : "Permission requise pour effectuer cette action."
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
                verbose : "Permission requise pour effectuer cette action.",
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
            this._exercise.getExercises(this._db, [], "UNION", (exercises) => {
                res.set({"Content-Disposition":"attachment; filename=\"shm-export.json\""});
                res.send(exercises);
            });
        } else {
            res.status(403).render("error", {
                verbose : "Permission requise pour effectuer cette action.",
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
                verbose : "Permission requise pour afficher cette page.",
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
                        throw err;
                    } else if (!req.files[0]) {
                        callback(this.responseView(400, "error", {
                            verbose : "Aucun fichier sélectionné."
                        }));
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
                                callback(this.responseRedirection("/exercise/list"));
                            } catch (ex) {
                                this._fs.unlinkSync(path);
                                callback(this.responseView(400, "error", {
                                    verbose : "Le fichier envoyé n'est pas un fichier JSON."
                                }));
                            }

                        } else {
                            this._fs.unlinkSync(path);
                            callback(this.responseView(400, "error", {
                                verbose : "Le fichier envoyé n'est pas un fichier JSON."
                            }));
                        }
                    }

                });
            });
        } else {
            callback(this.responseView(403, "error", {
                verbose : "Permission requise pour effectuer cette action.",
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
                if (req.method === "POST") {
                    callback(this.responseJSON(401, {
                        type : "error",
                        message : "Session invalide. Veuillez vous reconnecter."
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
                    req.session.destroy();
                    if (req.method === "POST") {
                        callback(this.responseJSON(401, {
                            type : "error",
                            message : "Session invalide. Veuillez vous reconnecter."
                        }));
                    } else {
                        callback(this.responseView(200, "error", {
                            verbose : "Connexion impossible : Votre compte a été suspendu pour une durée indeterminée."
                        }));
                    }
                }
            } else {
                req.session.destroy();
                if (req.method === "POST") {
                    callback(this.responseJSON(401, {
                        type : "error",
                        message : "Session invalide. Veuillez vous reconnecter."
                    }));
                } else {
                    callback(this.responseRedirection("/"));
                }
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
                req.session.user = this._user.toJSON(user);
                callback(this.responseJSON(200, {
                    type : "success",
                    message : "Bienvenue " + user.username + " !",
                    redirect : req.body.next !== undefined ? req.body.next : "/"
                }));
            } else {
                callback(this.responseJSON(200, {
                    type : "error",
                    message : "Identifiants de connexion incorrects"
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
                        user.passwd = this._bcrypt.hashSync(req.body.passwd,12);
                        user.status = "ALIVE";
                        user.update(this._db, this._mongodb);
                        callback(this.responseJSON(200, {
                            type : "success",
                            message : "Compte créé avec succès. Vous pouvez désormais vous connecter."
                        }));
                    } else {
                        callback(this.responseJSON(200, {
                            type : "error",
                            message : "Ce nom d'utilisateur est déjà utilisé."
                        }));
                    }
                });
            } else {
                callback(this.responseJSON(200, {
                    type : "error",
                    message : "Cette clé d'enregistrement est incorrecte ou déjà utilisée."
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
                            req.session.destroy();
                            callback(this.responseJSON(200, {
                                type : "success",
                                message : "Nom d'utilisateur changé avec succès. Déconnexion...",
                                redirect : "/account/login"
                            }));
                        } else {
                            callback(this.responseJSON(200, {
                                type : "error",
                                message : "Ce nom d'utilisateur est déjà utilisé."
                            }));
                        }
                    });
                } else if (req.body.action === "changepassword") {
                    user.passwd = this._bcrypt.hashSync(req.body.newpasswd,12);
                    user.update(this._db, this._mongodb);
                    req.session.destroy();
                    callback(this.responseJSON(200, {
                        type : "success",
                        message : "Mot de passe changé avec succès. Déconnexion...",
                        redirect : "/account/login"
                    }));
                } else if (req.body.action === "delete") {
                    user.delete(this._db, this._mongodb);
                    req.session.destroy();
                    callback(this.responseJSON(200, {
                        type : "success",
                        message : "Compte supprimé avec succès. Déconnexion...",
                        redirect : "/account/login"
                    }));
                }
            } else {
                callback(this.responseJSON(200, {
                    type : "error",
                    message : "Mot de passe incorrect."
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
                        message : "Utilisateur modifié avec succès.",
                        redirect : "/account/list"
                    }));
                } else {
                    callback(this.responseJSON(200, {
                        type : "error",
                        message : "Impossible de modifier cet utilisateur."
                    }));
                }
            });
        } else {
            callback(this.responseJSON(403, {
                type : "error",
                message : "Permission requise pour effectuer cette action."
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
                verbose : "Permission requise pour afficher cette page.",
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
            let key = this._user.create(this._db, req.body.role);
            callback(this.responseJSON(200, {
                type : "success",
                message : "Clé <code>" + key + "</code> créée avec succès."
            }));
        } else {
            callback(this.responseJSON(403, {
                type : "error",
                message : "Permission requise pour effectuer cette action."
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
                        message : "Compte supprimé avec succès.",
                        redirect : "/account/list"
                    }));
                } else {
                    callback(this.responseJSON(200, {
                        type : "error",
                        message : "Impossible de modifier cet utilisateur."
                    }));
                }
            });
        } else {
            callback(this.responseJSON(403, {
                type : "error",
                message : "Permission requise pour effectuer cette action."
            }));
        }
    }

}
