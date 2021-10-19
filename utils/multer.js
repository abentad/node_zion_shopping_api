const multer = require('multer');
//multer
//will create a memory temp storage to store the buffers of the selected image file
//then multer will use that storage to upload a single image file in the signup route
const storage = multer.memoryStorage();
// const multerFilter = (req, file, cb) => {
//     console.log(file);
//     if(file.mimetype == 'image/png' || file.mimetype == 'image/jpeg' && file.size <= 5000000){
//             cb(null, true);
//     }else{
//         cb(null, false);
//     }
// }
// const upload = multer({ storage, fileFilter: multerFilter });
const upload = multer({ storage });


module.exports = upload;