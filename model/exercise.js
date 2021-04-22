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
        for (let tag of tags) {
            if (tag !== "" && !formatted.includes(tag)) {
                tag = tag.toLowerCase();
                tag = tag.trim();
                tag = tag.replace(/[éèêëÉÈÊË]/g, "e");
                tag = tag.replace(/[àâäÀÂÄ]/g, "a");
                tag = tag.replace(/[îïÎÏ]/g, "i");
                tag = tag.replace(/[çÇ]/g, "c");
                formatted.push(tag);
            }
        }
        return formatted.sort();
    }


    /**
     * Gets all exercises that match all tags
     * @param {Object}              db              MongoClient
     * @param {Array.<string>}      tags            Tags to match
     * @param {string}              tagOperation    Tag operation filter : intersection or union
     * @param {function}            callback        Callback fct : callback(exercises)
     */
    static getExercises(db, tags, tagOperation, callback) {
        db.collection("exercises").find().toArray((err, res) => {
            let exercises = [];
            for (const json of res)
                if ((tagOperation === "INTERSECTION" && tags.every((i) => json.tags.includes(i))) ||
                    (tagOperation === "UNION" && tags.some((i) => json.tags.indexOf(i) >= 0)))
                    exercises.push(new Exercise(json._id, json.title, json.statement, json.response, json.time, json.tags));
            callback(exercises);
        });
    }

    /**
     * Gets an exercise by its id
     * @param {Object}              db              MongoClient
     * @param {Object}              mongodb         MongoDB
     * @param {string}              id              Exercise ID (_id from database)
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
     * Gets a random exercise, in tags, and not already done
     * @param {Object}              db              MongoClient
     * @param {Object}              mongodb         MongoDB
     * @param {Array.<string>}      tags            Array of tags for filtering
     * @param {string}              tagOperation    Tag operation filter : intersection or union
     * @param {Array.<string>}      done            Array of exercise id
     * @param {function}            callback        Callback fct : callback(exercise)
     */
    static getNextExercise(db, mongodb, tags, tagOperation, done, callback) {
        Exercise.getExercises(db, tags, tagOperation, (exercises) => {
            let pool = [];
            for (const exercise of exercises) {
                if (!done.includes(exercise.id.toString())) {
                    pool.push(exercise.id);
                }
            }
            Exercise.getExercise(db, mongodb, pool[Math.floor(Math.random() * pool.length)], (exercise) => {
                callback(exercise);
            });
        });
    }

    /**
     * Gets all distinct tags from all exercises
     * @param {Object}              db              MongoClient
     * @param {function}            callback        Callback fct : callback(tags)
     */
    static getTags(db, callback) {
        db.collection("exercises").distinct("tags", (err, res) => {
            callback(res);
        });
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
        };
    }

    /**
     * Translate array of exercise to a list of JSON
     * @param {Array.<Exercise>}    exercises       Exercises
     * @return {Array.<Object>}                     Exercises as JSONs
     */
    static toJSONs(exercises) {
        let jsons = [];
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
     * Deletes an exercise by id from database
     * @param {Object}              db              MongoClient
     * @param {Object}              mongodb         MongoDB
     * @param {string}              id              Exercise ID (_id from database)
     */
    static deleteExercise(db, mongodb, id) {
        db.collection("exercises").deleteOne({_id : mongodb.ObjectId(id)});
    }


    /**
     * Saves exercises (import) if not in database
     * @param {Object}              db              MongoClient
     * @param {Object}              mongodb         MongoDB
     * @param {Object}              exercises       Exercises as JSON
     */
    static importExercises(db, mongodb, exercises) {
        for (const exerciseJSON of exercises) {
            let exercise = new Exercise(exerciseJSON._id, exerciseJSON._title, exerciseJSON._statement, exerciseJSON._response, exerciseJSON._time, exerciseJSON._tags);
            exercise.save(db, mongodb, true, () => {});
        }
    }


    /**
     * Saves the exercise to the database
     * @param {Object}              db              MongoClient
     * @param {Object}              mongodb         MongoDB
     * @param {boolean}             forceInsert     True if force insert instead of update
     * @param {function}            callback        Callback fct : callback(id|null)
     * TODO Update exercises instead of inserting them if already in database
     */
    save(db, mongodb, forceInsert = false, callback) {

        if (this._id === -1 || forceInsert) {
            // insert
            let json = Exercise.toJSON(this);
            delete json.id;
            db.collection("exercises").insertOne(json, (err, res) => {
                callback(res.insertedId);
            });
        } else {
            //update
            let json = Exercise.toJSON(this);
            delete json.id;
            db.collection("exercises").updateOne(
                {_id : mongodb.ObjectId(this._id)},
                {$set : json}
            );
            callback(this._id);
        }
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

};
