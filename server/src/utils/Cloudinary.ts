import { v2 as cloudinary } from "cloudinary";
import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage = new CloudinaryStorage({
  cloudinary,
  params: (req, file) => {
    const username = req.user?.firstName || "anon";
    const ext = file.mimetype.split("/")[1]; // png / jpg …

    const public_id = [
      "hackathon_posters",
      username,
      Date.now().toString(),
    ].join("_");

    return {
      folder: "hackathon_posters",
      public_id,
      format: ext,
      allowed_formats: ["jpg", "jpeg", "png", "webp"],
      overwrite: false,
    };
  },
});

export const upload = multer({ storage });

export default cloudinary;
