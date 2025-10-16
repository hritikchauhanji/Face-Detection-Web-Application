import { USER_COOKIE_EXPIRY } from "../constants.js";
import { User } from "../models/user.model.js";
import jwt from "jsonwebtoken";

const generateAccessTokenAndRefreshToken = async (userId) => {
  try {
    const user = await User.findById(userId);
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error) {
    res.status(500).json({
      message:
        error.message ||
        "Something went wrong while generating access and refresh Token.",
    });
  }
};

// user registration
const registerUser = async (req, res) => {
  const { name, email, password } = req.body;

  try {
    // validataion - not empty
    if ([name, email, password].some((field) => field?.trim() === "")) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // check if user already exists: email
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: "User already exists" });
    }

    // create user
    const user = await User.create({
      name,
      email,
      password,
    });

    // remove password
    const createdUser = await User.findById(user._id).select(
      "-password -refreshToken"
    );

    // check for user creation
    if (!createdUser) {
      return res
        .status(500)
        .json({ message: "Something went wrong while registering the user" });
    }

    res.status(200).json({
      createdUser,
      message: "User registration successful.",
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// user login
const loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    // if email is required
    if (!email) {
      return res.status(400).json({ message: "email is required" });
    }

    // find user
    const user = await User.findOne({ email });

    // find user is not exist
    if (!user) {
      return res.status(404).json({ message: "User is not exist" });
    }

    const isPasswordValid = await user.isPasswordCorrect(password);

    // check password valid
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid user credentials" });
    }

    const { accessToken, refreshToken } =
      await generateAccessTokenAndRefreshToken(user._id);

    const loggedInUser = await User.findById(user._id).select(
      "-password -refreshToken"
    );

    const options = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "None" : "Lax",
      maxAge: USER_COOKIE_EXPIRY,
    };

    return res.status(200).cookie("refreshToken", refreshToken, options).json({
      user: loggedInUser,
      accessToken,
      message: "Login successfull.",
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// user logout
const logoutUser = async (req, res) => {
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        refreshToken: "",
      },
    },
    { new: true }
  );

  const options = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "None" : "Lax",
  };

  return res
    .status(200)
    .clearCookie("refreshToken", options)
    .json({ message: "User Logged Out." });
};

// refreshAccessToken
const refreshAccessToken = async (req, res) => {
  const incomingRefreshToken = req.cookies?.refreshToken;

  if (!incomingRefreshToken) {
    res.status(401).json({ message: "Unautorized request" });
  }

  const decodedToken = jwt.verify(
    incomingRefreshToken,
    process.env.REFRESH_TOKEN_SECRET
  );

  const user = await User.findById(decodedToken._id);

  if (!user) {
    res.status(401).json({ message: "Invalid Refresh Token" });
  }

  if (incomingRefreshToken != user.refreshToken) {
    res.status(401).json({ message: "Refreshed token is expired or used" });
  }

  const { accessToken, refreshToken: newRefreshToken } =
    await generateAccessTokenAndRefreshToken(user._id);

  const options = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
  };

  return res.status(200).cookie("refreshToken", newRefreshToken, options).json({
    accessToken,
    message: "Access token refreshed",
  });
};

export { registerUser, loginUser, logoutUser, refreshAccessToken };
