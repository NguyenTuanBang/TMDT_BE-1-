import multer from "multer";

// Dùng memoryStorage vì bạn định upload lên Cloudinary
const storage = multer.memoryStorage();

// Hàm kiểm tra định dạng file
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const extname = allowedTypes.test(
    file.originalname.toLowerCase().split(".").pop()
  );
  const mimetype = allowedTypes.test(file.mimetype);

  if (extname && mimetype) {
    cb(null, true);
  } else {
    cb(new Error("Chỉ chấp nhận file hình ảnh (.jpg, .jpeg, .png, .gif, .webp)"), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // giới hạn 5MB
  },
});

export default upload;
