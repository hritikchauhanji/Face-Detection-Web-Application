import { Router } from "express";
import {
  loginUser,
  logoutUser,
  refreshAccessToken,
  registerUser,
} from "../controllers/user.controller.js";
import { validate } from "../validator/validate.js";
import { body } from "express-validator";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

// register route
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

// login route
router
  .route("/login")
  .post(
    [body("email").isEmail().withMessage("Email format: abcd@example.com")],
    validate,
    loginUser
  );

// logout route
router.route("/logout").post(verifyJWT, logoutUser);

// refresh token
router.route("/refresh-token").post(refreshAccessToken);

export default router;
