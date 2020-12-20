module.exports = class {

    constructor(app, express, path, db, https) {
        this._app = app;
        this._express = express;
        this._path = path;
        this._db = db;
        this._https = https;
        this._initializeRoutes();
    }


    _initializeRoutes() {

        // setting static folder
        this._app.use(this._express.static(this._path.join(__dirname, "../static")));


        // "GET" pages

        let routeToRenderPages = {
            "/" : "exercise/practice",
            "/manage" : "exercise/list",
            "/manage/new" : "exercise/new",
            "/manage/edit/:id" : "exercise/edit",
            "/about" : "about/about",
            "/legal" : "about/legal"
        }

        for (let [route, renderPage] of Object.entries(routeToRenderPages)) {
            this._app.get(route, (req, res) => {
                res.render(renderPage);
            })
        }

    }
}
