module.exports = class {

    constructor(app, express, path, db, mongodb) {
        this._app = app;
        this._express = express;
        this._path = path;
        this._validation = require("./validation");
        this._validator = require("express-joi-validation").createValidator({
            passError: true
        });

        this._logic = new (require("./logic"))(db, mongodb, path);

        this._initializeRoutes();
    }


    _initializeRoutes() {

        /////////////////////////////////////////
        // setting static folder
        this._app.use(this._express.static(this._path.join(__dirname, "../static")));

        /////////////////////////////////////////
        // Start / Practice / End pages

        // practice page
        this._app.get("/", (req, res) => {
            this._logic.handlePractice(req, (response) => {
                this._sendResponse(req, res, response);
            });
        });

        // start/end practice + next exercise
        this._app.post("/", (req, res) => {
            this._logic.handlePracticeSubmission(req, (response) => {
                this._sendResponse(req, res, response);
            });
        });


        /////////////////////////////////////////
        // About pages

        // about page
        this._app.get("/about", (req, res) => {
            this._sendResponse(req, res, this._logic.responseView(200, "about/about", {
                user : req.session.user
            }));
        });

        // legal page
        this._app.get("/legal", (req, res) => {
            this._sendResponse(req, res, this._logic.responseView(200, "about/legal", {
                user : req.session.user
            }));
        });


        /////////////////////////////////////////
        // Miscellaneous

        // language choice
        this._app.post("/lang", this._validator.body(this._validation.formChangeLang), (req, res) => {
            this._logic.handleChangeLanguageSubmission(req, (response) => {
                this._sendResponse(req, res, response);
            });
        });


        /////////////////////////////////////////
        // Login/register page

        // logging in
        this._app.post("/account/login", this._validator.body(this._validation.formLoginSchema), (req, res) => {
            this._logic.handleAccountLogin(req, (response) => {
                this._sendResponse(req, res, response);
            });
        });

        // registering
        this._app.post("/account/register", this._validator.body(this._validation.formRegisterSchema), (req, res) => {
            this._logic.handleAccountRegister(req, (response) => {
                this._sendResponse(req, res, response);
            });
        });

        // login page
        this._app.use((req, res, next) => {
            this._logic.handleAccountLoggedInVerification(req, next, (response) => {
                this._sendResponse(req, res, response);
            });
        });

        // account status verification
        this._app.use((req, res, next) => {
            this._logic.handleAccountStatusVerification(req, next, (response) => {
                this._sendResponse(req, res, response);
            });
        });


        //-------------------------------------------------------------
        // LOGIN REQUIRED BEYOND THIS MARK
        //-------------------------------------------------------------


        /////////////////////////////////////////
        // Exercise management

        // list of exercises
        this._app.get("/exercise/list", (req, res) => {
            this._logic.handleExerciseList(req, (response) => {
                this._sendResponse(req, res, response);
            });
        });

        // new exercise
        this._app.get("/exercise/new", (req, res) => {
            this._logic.handleExerciseNew(req, (response) => {
                this._sendResponse(req, res, response);
            });
        });
        this._app.post("/exercise/new", this._validator.body(this._validation.formNewExerciseSchema), (req, res) => {
            this._logic.handleExerciseNewSubmission(req, (response) => {
                this._sendResponse(req, res, response);
            });
        });

        // edit exercise
        this._app.get("/exercise/edit/:id", this._validator.params(this._validation.dbIdSchema), (req, res) => {
            this._logic.handleExerciseEdit(req, (response) => {
                this._sendResponse(req, res, response);
            });
        });
        this._app.post("/exercise/edit", this._validator.body(this._validation.formEditExerciseSchema), (req, res) => {
            this._logic.handleExerciseEditSubmission(req, (response) => {
                this._sendResponse(req, res, response);
            });
        });

        // delete exercise
        this._app.post("/exercise/delete", this._validator.body(this._validation.dbIdSchema), (req, res) => {
            this._logic.handleExerciseDelete(req, (response) => {
                this._sendResponse(req, res, response);
            });
        });

        // clone exercise
        this._app.post("/exercise/clone", this._validator.body(this._validation.dbIdSchema), (req, res) => {
            this._logic.handleExerciseClone(req, (response) => {
                this._sendResponse(req, res, response);
            });
        });

        // export exercises
        this._app.get("/exercise/export", (req, res) => {
            this._logic.handleExerciseExport(req, res);
        });

        // import exercises
        this._app.get("/exercise/import", (req, res) => {
            this._logic.handleExerciseImport(req, (response) => {
                this._sendResponse(req, res, response);
            });
        });
        this._app.post("/exercise/import", (req, res) => {
            this._logic.handleExerciseImportSubmission(req, res, (response) => {
                this._sendResponse(req, res, response);
            });
        });


        /////////////////////////////////////////
        // Account management

        // profile page
        this._app.get("/account/me", (req, res) => {
            this._sendResponse(req, res, this._logic.responseView(200, "account/profile", {
                user : req.session.user
            }));
        });
        this._app.post("/account/edit", this._validator.body(this._validation.formEditProfile), (req, res) => {
            this._logic.handleAccountEditSubmission(req, (response) => {
                this._sendResponse(req, res, response);
            });
        });

        // account list
        this._app.get("/account/list", (req, res) => {
            this._logic.handleAccountList(req, (response) => {
                this._sendResponse(req, res, response);
            });
        });

        // create account key
        this._app.post("/account/new", this._validator.body(this._validation.formNewKey), (req, res) => {
            this._logic.handleAccountNewSubmission(req, (response) => {
                this._sendResponse(req, res, response);
            });
        });

        // delete account
        this._app.post("/account/delete", this._validator.body(this._validation.dbIdSchema), (req, res) => {
            this._logic.handleAccountDeleteSubmission(req, (response) => {
                this._sendResponse(req, res, response);
            });
        });

        // edit account
        this._app.post("/account/adminedit", this._validator.body(this._validation.formEditUser), (req, res) => {
            this._logic.handleAccountAdminEditSubmission(req, (response) => {
                this._sendResponse(req, res, response);
            });
        });

        // log out
        this._app.get("/account/logout", (req, res) => {
            this._logic.handleAccountLogout(req, (response) => {
                this._sendResponse(req, res, response);
            });
        });


        /////////////////////////////////////////
        // error pages

        // 400 - Form validation error
        this._app.use((err, req, res, next) => {
            if (err && err.error && err.error.isJoi) {
                if (req.method === "POST") {
                    this._sendResponse(req, res, this._logic.responseJSON(
                        400,
                        {type: "error", message: "Requête ou formulaire invalide. Veuillez vérifier les champs et réessayez."}
                    ));
                } else {
                    this._sendResponse(req, res, this._logic.responseView(
                        400,
                        "error",
                        {verbose : "Requête ou formulaire invalide. Veuillez vérifier les champs et réessayez.", user : req.session.user}
                    ));
                }
                console.error(err.error.toString());
            } else {
                next(err);
            }
        });

        // 403 - Form tampered with
        this._app.use((err, req, res, next) => {
            if (err && err.code === "EBADCSRFTOKEN") {
                if (req.method === "POST") {
                    this._sendResponse(req, res, this._logic.responseJSON(
                        403,
                        {type: "error", message: "Session invalide."}
                    ));
                } else {
                    this._sendResponse(req, res, this._logic.responseView(
                        403,
                        "error",
                        {verbose : "Session invalide.", user : req.session.user}
                    ));
                }
            } else {
                next(err);
            }
        });

        // 404 - No route
        this._app.use((req, res) => {
            this._sendResponse(req, res, this._logic.responseView(
                404,
                "error",
                {verbose : "Cette page n'éxiste pas.", user : req.session.user}
            ));
        });

    }

    /**
     * Sends a response to the client
     * @param {Object}              req             Express request
     * @param {Object}              res             Express response
     * @param {Object}              response        Response object containing data to send
     * @private
     */
    _sendResponse(req, res, response) {
        if (response.type === "json") {
            res.status(response.code).send(JSON.stringify(response.data));
        } else if (response.type === "view") {
            response.data.supportedLangs = this._logic.language.getSupportedLanguages();
            response.data.lang = this._logic.language.getTranslations(req.session.lang);
            response.data.csrf = req.csrfToken;
            res.status(response.code).render(response.view, response.data);
        } else if (response.type === "redirection") {
            res.redirect(response.target);
        }
    }
};
