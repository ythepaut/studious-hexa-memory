module.exports = (multer, path, callback) => {
    callback(multer.diskStorage({
        destination: function(req, file, cb) {
            cb(null, "uploads/");
        },
        filename: function(req, file, cb) {
            cb(null, file.fieldname + path.extname(file.originalname));
        }
    }));

};
