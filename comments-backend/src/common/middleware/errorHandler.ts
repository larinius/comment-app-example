import type { ErrorRequestHandler } from "express";

const errorHandler: ErrorRequestHandler = (err, req, res, next) => {
  console.error(err?.stack || err?.message || "Unknown error");
  res.status(500).json({
    error: {
      message: err?.message || "Internal Server Error",
    },
  });
};

export default errorHandler;
