import multer from "multer";
import path from "path";

// Configuración de almacenamiento de archivos
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "upload-images/"); // Carpeta donde se guardarán las imágenes
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`); // Nombre único
  }
});

// Filtro para aceptar solo imágenes
const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname);
  if (ext !== ".jpg" && ext !== ".jpeg" && ext !== ".png" && ext !== ".gif") {
    return cb(new Error("Solo se permiten imágenes en formato JPG, JPEG, PNG o GIF"), false);
  }
  cb(null, true);
};

// Inicializar Multer con configuración
const upload = multer({ storage, fileFilter });

export default upload;
