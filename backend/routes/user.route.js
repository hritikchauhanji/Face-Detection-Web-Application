import { Router } from "express";
import { registerUser } from "../controllers/user.controller.js";
import { validate } from "../validator/validate.js";
import { body } from "express-validator";

const router = Router();

router.route("/register").post(
  [
    body("name")
      .isLength({ min: 3 })
      .withMessage("Username must be at least 3 characters long"),
    body("email").isEmail().withMessage("Email format: abcd@example.com"),
    body("password")
      .matches(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/
      )
      .withMessage(
        "Password must be 8+ chars, with upper, lower, number & special char"
      ),
  ],
  validate,
  registerUser
);

export default router;
