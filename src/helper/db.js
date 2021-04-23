module.exports = (callback) => {

    const MongoClient = require("mongodb").MongoClient;

    MongoClient.connect(
        `mongodb://${process.env.STUDIOUSHEXAMEMORY_MONGODB_USER}:${process.env.STUDIOUSHEXAMEMORY_MONGODB_PASSWORD}@localhost:27017/studious_hexa_memory`,
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
