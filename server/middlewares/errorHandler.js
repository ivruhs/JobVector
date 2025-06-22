// middlewares/errorHandler.js

import multer from "multer";

const errorHandler = (error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({ message: "File size too large" });
    }
  }

  if (error.message === "Only PDF files are allowed") {
    return res.status(400).json({ message: "Only PDF files are allowed" });
  }

  console.error(error.stack || error.message || error);
  res.status(500).json({ message: "Something went wrong!" });
};

export default errorHandler;
