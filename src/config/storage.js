module.exports = (multer, path, callback) => {
    callback(multer.diskStorage({
        destination: (req, file, cb) => {
            cb(null, "src/uploads/");
        },
        filename: (req, file, cb) => {
            cb(null, file.fieldname + path.extname(file.originalname));
        }
    }));
};
