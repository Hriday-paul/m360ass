import multer from "multer";
import path from "path";

export const file_upload_config = (destination: string) => {
    return multer.diskStorage({
        destination: function (req, file, cb) {
            cb(null, path.join('public', destination));
        },
        filename: function (req, file, cb) {
            //original name helps us to get the file extension
            cb(null, Date.now() + "-" + file.originalname);
        },
    })
}

export const image_Upload = multer({
    storage: file_upload_config("images"),
    limits: { fileSize: 1024 * 1024 * 50 /* 5 mb */ },
    fileFilter(req, file, cb) {
        // if file type valid
        if (['image/png', 'image/jpeg', 'image/jpg', 'image/webp'].includes(file.mimetype)) {
            cb(null, true)
        }
        else {
            cb(null, false);
            return cb(new Error('file type is not allowed'))
        }
    },
});