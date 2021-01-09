module.exports = class User {

    constructor(id = -1, username, passwd, role, status, key) {
        this._id = id;
        this._username = username;
        this._passwd = passwd;
        this._role = role;      // MEMBER / ADMIN / OWNER
        this._status = status;  // SUSPENDED / PENDING_REGISTRATION / ALIVE
        this._key = key;        // Key used to register this account
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
            key : user.key
        }
    }


    /**
     * Gets a user by its username
     * @param {Object}              db              MongoClient
     * @param {string}              username        Username
     * @param {function}            callback        Callback fct : callback(user)
     */
    static getUser(db, username, callback) {
        db.collection("accounts").findOne({username: username}, (err, res) => {
            if (res !== null) {
                callback(new User(res._id, res.username, res.passwd, res.role, res.status, res.key));
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
                callback(new User(res._id, res.username, res.passwd, res.role, res.status, res.key));
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
                users.push(new User(json._id, json.username, json.passwd, json.role, json.status, json.key));
            callback(users);
        });
    }

    /**
     * Inserts a new "blank" user to the database
     * @param {Object}              db              MongoClient
     * @param {string}              role            User role
     * @return {string}             key             Registration key
     */
    static create(db, role) {
        let key = this._generateKey(db);
        db.collection("accounts").insertOne({
            role : role,
            status : "PENDING_REGISTRATION",
            key : key
        });
        return key;
    }

    /**
     * Creates a key
     * @param {Object}              db              MongoClient
     * @return {string}                             New register key
     * @private
     */
    static _generateKey(db) {
        let pool = ["Alpha", "Beta", "Gamma", "Delta", "Epsilon", "Zeta", "Eta", "Theta", "Iota", "Kappa", "Lambda",
            "Mu", "Nu", "Xi", "Omicron", "Pi", "Rho", "Sigma", "Tau", "Upsilon", "Phi", "Chi", "Psi", "Omega"];
        let key = "";
        for (let i = 0 ; i < 4 ; i++) {
            key += pool[Math.floor(Math.random()*pool.length)];
        }
        return key;
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

};
