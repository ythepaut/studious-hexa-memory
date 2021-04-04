module.exports = class {

    constructor(fs, path) {
        this._fs = fs;
        this._path = path;
        this._langs = {};
        this._loadLanguageFiles();
    }


    /**
     * Returns all translation from a specific language
     * @param {string}              lang            Language to load (e.g. EN)
     * @return {Object}                             Lang translations
     */
    getTranslations(lang) {
        return (lang && this._langs[lang]) ? this._langs[lang] : this._langs["FR"];
    }


    /**
     * Returns all languages currently supported
     * @return {Object[]}                           Lang list (e.g. [{iso: "EN", language: "English"},
     *                                                               {iso: "FR", language: "Français"}])
     */
    getSupportedLanguages() {
        let languages = [];
        for (const lang in this._langs)
            languages.push(this._langs[lang].config)
        return languages;
    }


    /**
     * Loads language files from /config/lang
     * @return {Object}                             Loaded translations as a dictionary
     * @private
     */
    _loadLanguageFiles() {
        this._fs.readdir(this._path.join(__dirname, "../../config/lang"), (err, files) => {
            if (err) {
                console.error("Erreur au chargement des fichiers langue : ");
                console.error(err);
                return {};
            }

            for (const file of files) {
                const path = this._path.join(__dirname, "../../config/lang/", file);
                this._fs.access(path, this._fs.constants.F_OK, (err) => {
                    if (err) {
                        console.error("Erreur au chargement du fichiers langue " + file + " :");
                        console.error(err);
                    } else {
                        this._fs.readFile(path, "utf8", (err, data) => {
                            if (err) {
                                console.error("Erreur à la lecture du fichiers langue " + file + " :");
                                console.error(err);
                            } else {
                                const parsed = JSON.parse(data);
                                this._langs[parsed.config.iso] = parsed;
                            }
                        });
                    }
                });
            }
        });
    }

}
