module.exports = (callback) => {

    const MongoClient = require("mongodb").MongoClient;

    MongoClient.connect(
        process.env.STUDIOUSHEXAMEMORY_MONGODB_URI,
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
