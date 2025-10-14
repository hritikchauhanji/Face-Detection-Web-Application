import { validationResult } from "express-validator";

export const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const formattedErrors = errors.array().map((err) => ({
      field: err.path || err.nestedErrors?.[0]?.location || "unknown",
      message: err.msg,
    }));

    return res.status(422).json({
      success: false,
      message: "Validation error",
      errors: formattedErrors,
    });
  }

  next();
};
