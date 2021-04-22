module.exports = class User {

    constructor(id = -1, username, passwd, role, status, key, exercisesDone) {
        this._id = id;
        this._username = username;
        this._passwd = passwd;
        this._role = role;      // MEMBER / ADMIN / OWNER
        this._status = status;  // SUSPENDED / PENDING_REGISTRATION / ALIVE
        this._key = key;        // Key used to register this account
        this._exercisesDone = exercisesDone;
    }


    /**
     * Translates an User to a JSON
     * @param {User}                user            User
     * @return {Object}                             User as JSON
     */
    static toJSON(user) {
        return {
            _id : user.id,
            username : user.username,
            passwd : user.passwd,
            role : user.role,
            status : user.status,
            key : user.key,
            exercisesDone : user.exercisesDone
        };
    }


    /**
     * Gets a user by its ID
     * @param {Object}              db              MongoClient
     * @param {Object}              mongodb         MongoDB
     * @param {string}              id              User ID
     * @param {function}            callback        Callback fct : callback(user)
     */
    static getUser(db, mongodb, id, callback) {
        db.collection("accounts").findOne({_id : mongodb.ObjectId(id)}, (err, res) => {
            if (res !== null) {
                callback(new User(res._id, res.username, res.passwd, res.role, res.status, res.key, res.exercisesDone));
            } else {
                callback(null);
            }
        });
    }

    /**
     * Gets a user by its username
     * @param {Object}              db              MongoClient
     * @param {string}              username        Username
     * @param {function}            callback        Callback fct : callback(user)
     */
    static getUserByName(db, username, callback) {
        db.collection("accounts").findOne({username: username}, (err, res) => {
            if (res !== null) {
                callback(new User(res._id, res.username, res.passwd, res.role, res.status, res.key, res.exercisesDone));
            } else {
                callback(null);
            }
        });
    }

    /**
     * Get user by key
     * @param {Object}              db              MongoClient
     * @param {string}              key             User unique key
     * @param {function}            callback        Callback fct : callback(user)
     */
    static getUserByKey(db, key, callback) {
        db.collection("accounts").findOne({key: key}, (err, res) => {
            if (res !== null) {
                callback(new User(res._id, res.username, res.passwd, res.role, res.status, res.key, res.exercisesDone));
            } else {
                callback(null);
            }
        });
    }

    /**
     * Gets all users
     * @param {Object}              db              MongoClient
     * @param {function}            callback        Callback fct : callback(users)
     */
    static getUsers(db, callback) {
        db.collection("accounts").find().toArray((err, res) => {
            let users = [];
            for (const json of res)
                users.push(new User(json._id, json.username, json.passwd, json.role, json.status, json.key, json.exercisesDone));
            callback(users);
        });
    }

    /**
     * Inserts a new "blank" user to the database
     * @param {Object}              db              MongoClient
     * @param {string}              role            User role
     * @param {function}            callback        Callback fct : callback(key)
     */
    static create(db, role, callback) {
        this._generateKey(db, (key) => {
            db.collection("accounts").insertOne({
                role : role,
                status : "PENDING_REGISTRATION",
                key : key
            });

            callback(key);
        });
    }

    /**
     * Creates a key
     * @param {Object}              db              MongoClient
     * @param {function}            callback        Callback fct : callback(key)
     * @private
     */
    static _generateKey(db, callback) {
        // Retrieve all keys
        db.collection("accounts").distinct("key", (err, keys) => {

            let key = "";
            const pool = ["Alpha", "Beta", "Gamma", "Delta", "Epsilon", "Zeta", "Eta", "Theta", "Iota", "Kappa", "Lambda",
                "Mu", "Nu", "Xi", "Omicron", "Pi", "Rho", "Sigma", "Tau", "Upsilon", "Phi", "Chi", "Psi", "Omega"];

            do {
                key = "";
                for (let i = 0 ; i < 4 ; i++) {
                    key += pool[Math.floor(Math.random()*pool.length)];
                }
            } while (keys.includes(key));

            callback(key);
        });
    }

    /**
     * Updates the user to the database
     * @param {Object}              db              MongoClient
     * @param {Object}              mongodb         MongoDB
     */
    update(db, mongodb) {
        if (this._id !== -1) {
            let json = User.toJSON(this);
            db.collection("accounts").updateOne(
                {_id : mongodb.ObjectId(this._id)},
                {$set : json}
            );
        }
    }

    /**
     * Delete the user from the database
     * @param {Object}              db              MongoClient
     * @param {Object}              mongodb         MongoDB
     */
    delete(db, mongodb) {
        if (this._id !== -1) {
            db.collection("accounts").deleteOne(
                {_id : mongodb.ObjectId(this._id)}
            );
        }
    }

    /**
     * Pushs exercises to exercises done by user
     * @param {Object}              db              MongoClient
     * @param {Object}              mongodb         MongoDB
     * @param {Object[]}            exercises       Exercises done to add
     */
    newExercisesDone(db, mongodb, exercises) {
        exercises = exercises.map(exercise => {
            return ({
                id : exercise.id,
                success : exercise.success,
                date : new Date()
            });
        });
        if (typeof this._exercisesDone === "undefined" || this._exercisesDone === null) {
            this._exercisesDone = [];
        }
        if (exercises !== []) {
            this._exercisesDone.push(exercises);
        }
        this.update(db, mongodb);
    }


    get id() {
        return this._id;
    }

    get username() {
        return this._username;
    }

    set username(username) {
        this._username = username;
    }

    get passwd() {
        return this._passwd;
    }

    set passwd(passwd) {
        this._passwd = passwd;
    }

    get role() {
        return this._role;
    }

    set role(role) {
        this._role = role;
    }

    get status() {
        return this._status;
    }

    set status(status) {
        this._status = status;
    }

    get key() {
        return this._key;
    }

    get exercisesDone() {
        return this._exercisesDone;
    }

    set exercisesDone(exercisesDone) {
        this._exercisesDone = exercisesDone;
    }

};
