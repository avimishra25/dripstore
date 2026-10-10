const cloudinary = require('cloudinary').v2;
const multer = require('multer');
cloudinary.config({ cloud_name: process.env.CLOUDINARY_CLOUD_NAME, api_key: process.env.CLOUDINARY_API_KEY, api_secret: process.env.CLOUDINARY_API_SECRET });
const { state: demo } = require('../demo/runtime');
const receive = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 5, fields: 20, fieldSize: demo.enabled ? 7 * 1024 * 1024 : 20000 },
  fileFilter: (req, file, cb) => {
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.mimetype)) return cb(Object.assign(new Error('Upload JPG, PNG or WEBP images only'), { statusCode: 400 }));
    cb(null, true);
  },
});
const upload = {
  array: (field, max) => (req, res, next) => receive.array(field, max)(req, res, async error => {
    if (error) return next(error);
    if (require('../demo/runtime').state.enabled) {
      if ((req.files || []).some(file => file.size > 1024 * 1024)) return next(Object.assign(new Error('Demo images must be under 1 MB'), { statusCode: 400 }));
      req.files = (req.files || []).map(file => ({ path: 'data:' + file.mimetype + ';base64,' + file.buffer.toString('base64') }));
      return next();
    }
    const results = await Promise.allSettled((req.files || []).map(file => new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream({ folder: 'dripstore/products', resource_type: 'image', allowed_formats: ['jpg', 'jpeg', 'png', 'webp'], transformation: [{ width: 800, height: 800, crop: 'limit', quality: 'auto' }] }, (err, result) => err ? reject(err) : resolve({ path: result.secure_url, filename: result.public_id }));
      stream.end(file.buffer);
    })));
    const failed = results.find(r => r.status === 'rejected');
    const uploaded = results.filter(r => r.status === 'fulfilled').map(r => r.value);
    if (failed) {
      await Promise.allSettled(uploaded.map(file => cloudinary.uploader.destroy(file.filename)));
      return next(Object.assign(new Error('Image upload failed'), { statusCode: 400 }));
    }
    req.files = uploaded;
    next();
  }),
};
module.exports = { cloudinary, upload };
