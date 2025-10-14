import { User } from "../models/user.model.js";

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
    const createdUser = await User.findById(user._id).select("-password");

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

    const loggedInUser = await User.findById(user._id).select("-password");

    return res.status(200).json({
      loggedInUser,
      message: "Login successfull.",
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export { registerUser, loginUser };
