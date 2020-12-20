module.exports = class Exercise {

    constructor(id = -1, title, statement, response, time, tags) {
        this._id = id;
        this._title = title;
        this._statement = statement;
        this._response = response;
        this._time = time;
        this._tags = tags;
    }


    /**
     * Formats argument to match with exercise time requirements
     * @param {number}              time            Time, in seconds
     * @return {number}                             Formatted time
     */
    static formatTime(time) {
        if (!isNaN(time) && !isNaN(parseInt(time))) {
            time = Math.min(Math.max(parseInt(time), 0), 14400);
        } else {
            time = 0;
        }
        return time;
    }

    /**
     * Formats argument to match with exercise time requirements
     * @param {Array.<string>}      tags            Tags
     * @return {Array.<string>}                     Formatted tags
     */
    static formatTags(tags) {
        let formatted = [];
        for (const tag of tags)
            if (tag !== "")
                formatted.push(tag.toLowerCase().trim());
        return formatted;
    }


    /**
     * Gets all exercises that match all tags
     * @param {Object}              db              MongoClient
     * @param {Array.<string>}      tags            Tags to match
     * @param {function}            callback        Callback fct : callback(exercises)
     */
    static getExercises(db, tags, callback) {
        //TODO add filter by tags
        db.collection("exercises").find().toArray((err, res) => {
            let exercises = [];
            for (const json of res)
                exercises.push(new Exercise(json._id, json.title, json.statement, json.response, json.time, json.tags));
            callback(exercises);
        });
    }

    /**
     * Gets an exercise by its id
     * @param {Object}              db              MongoClient
     * @param {Object}              mongodb         MongoDB
     * @param {number}              id              Exercise ID (_id from database)
     * @param {function}            callback        Callback fct : callback(exercise)
     */
    static getExercise(db, mongodb, id, callback) {
        db.collection("exercises").findOne({_id: mongodb.ObjectId(id)}, (err, res) => {
            if (res !== null) {
                callback(new Exercise(res._id, res.title, res.statement, res.response, res.time, res.tags));
            } else {
                callback(null);
            }
        });
    }

    /**
     * Gets all distinct tags from all exercises
     * @return {Array.<string>}                     Tags
     */
    static getTags() {
        //TODO getTags
        return ["ptsi", "geometrie", "analyse", "algebre", "facile", "moyen", "difficile"];
    }


    /**
     * Translates an exercise to a JSON
     * @param {Exercise}            exercise        Exercise
     * @return {Object}                             Exercise as JSON
     */
    static toJSON(exercise) {
        return {
            id : exercise.id,
            title : exercise.title,
            statement : exercise.statement,
            response : exercise.response,
            time : exercise.time,
            tags : exercise.tags
        }
    }

    /**
     * Translate array of exercise to a list of JSON
     * @param {Array.<Exercise>}    exercises       Exercises
     * @return {Array.<Object>}                     Exercises as JSONs
     */
    static toJSONs(exercises) {
        let jsons = []
        for (const exercise of exercises)
            jsons.push(Exercise.toJSON(exercise));
        return jsons;
    }

    /**
     * Translate JSON to an exercise
     * @param {Object}              json            JSON Exercise
     * @return {Object}                             Exercise
     */
    static toExercise(json) {
        return new this(json.id, json.title, json.statement, json.response, json.time, json.tags);
    }


    /**
     * Saves the exercise to the database
     * @param {Object}              db              MongoClient
     * @return {boolean}                            true if success
     */
    saveExercise(db) {
        let json = Exercise.toJSON(this);
        delete json.id;
        db.collection("exercises").insertOne(json);
        return true; //TODO validate exercise before insert
    }


    get id() {
        return this._id;
    }

    get title() {
        return this._title;
    }

    get statement() {
        return this._statement;
    }

    get response() {
        return this._response;
    }

    get time() {
        return this._time;
    }

    get tags() {
        return this._tags;
    }

}
