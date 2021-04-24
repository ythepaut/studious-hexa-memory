module.exports = (uri, callback) => {

    const MongoClient = require("mongodb").MongoClient;
    MongoClient.connect(
        uri,
        {useUnifiedTopology : true},
        (err, client) => {
            if (err) {
                console.error("Erreur de connexion à la base : ");
                console.error(err);
                callback(null);
            } else {
                callback(client.db("studious_hexa_memory"));
            }
        }
    );
};
