import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import multer from 'multer';
import path from 'path';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => {
    const nameBase  = path.basename(file.originalname, path.extname(file.originalname));
    const cleanName = nameBase.replace(/[^a-zA-Z0-9._-]/g, '_');
    return {
      folder:        `clinica/pacientes/${req.params.id}`,
      resource_type: 'image',
      public_id:     `${Date.now()}-${cleanName}`,
    };
  },
});

// Solo imágenes — JPG y PNG
const fileFilter = (req, file, cb) => {
  const permitidos = ['image/jpeg', 'image/png', 'image/jpg'];
  permitidos.includes(file.mimetype)
    ? cb(null, true)
    : cb(new Error('Solo se permiten imágenes JPG y PNG.'), false);
};

export const upload = multer({ storage, fileFilter, limits: { fileSize: 10 * 1024 * 1024 } });
export { cloudinary };