import User from "../models/userModel.js";
import asyncHandler from "../middlewares/asyncHandler.js";
import bcrypt from "bcryptjs";
import createToken from "../utils/createToken.js";
// import generateSupabaseId from "../middlewares/generateSupabaseId.js";
// import crypto from "crypto";

// @desc    Register a new user
// @route   POST /api/users
// @access  Public
const createUser = asyncHandler(async (req, res) => {
  let { username, email, password } = req.body;

  // Normalize inputs
  email = email?.trim().toLowerCase();
  username = username?.trim();

  if (!username || !email || !password) {
    res.status(400);
    throw new Error("Please fill all required fields.");
  }

  const userExists = await User.findOne({ email });

  if (userExists) {
    res.status(400);
    throw new Error("User already exists with this email.");
  }

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  // Generate consistent Supabase ID based on email

  const newUser = new User({
    username,
    email,
    password: hashedPassword,
  });

  try {
    await newUser.save();

    // Set JWT cookie
    createToken(res, newUser._id);

    res.status(201).json({
      _id: newUser._id,
      username: newUser.username,
      email: newUser.email,
      isAdmin: newUser.isAdmin,
      supabaseId: newUser.supabaseId,
    });
  } catch (error) {
    console.error("User creation failed:", error.message);
    res.status(500);
    throw new Error("Something went wrong while creating the user.");
  }
});

// @desc    Login user & get token
// @route   POST /api/users/auth
// @access  Public
const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const normalizedEmail = email?.trim().toLowerCase();

  if (!normalizedEmail || !password) {
    res.status(400);
    throw new Error("Email and password are required.");
  }

  const existingUser = await User.findOne({ email: normalizedEmail });

  if (!existingUser) {
    res.status(401);
    throw new Error("Invalid email or password.");
  }

  const isPasswordValid = await bcrypt.compare(password, existingUser.password);

  if (!isPasswordValid) {
    res.status(401);
    throw new Error("Invalid email or password.");
  }

  createToken(res, existingUser._id);

  res.status(200).json({
    _id: existingUser._id,
    username: existingUser.username,
    email: existingUser.email,
    isAdmin: existingUser.isAdmin,
    supabaseId: existingUser.supabaseId,
  });
});

// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Private
const logoutCurrentUser = asyncHandler(async (req, res) => {
  res.cookie("jwt", "", {
    httpOnly: true,
    expires: new Date(0),
  });

  res.status(200).json({ message: "Logged out successfully." });
});

// @desc    Get all users
// @route   GET /api/users
// @access  Admin
const getAllUsers = asyncHandler(async (req, res) => {
  const users = await User.find({}).select("-password").lean();
  res.status(200).json(users);
});

// @desc    Get current user profile
// @route   GET /api/users/profile
// @access  Private
const getCurrentUserProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).lean();

  if (!user) {
    res.status(404);
    throw new Error("User not found.");
  }

  res.status(200).json({
    _id: user._id,
    username: user.username,
    email: user.email,
    isAdmin: user.isAdmin,
  });
});

// @desc    Update current user profile
// @route   PUT /api/users/profile
// @access  Private
const updateCurrentUserProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  if (!user) {
    res.status(404);
    throw new Error("User not found.");
  }

  user.username = req.body.username?.trim() || user.username;
  user.email = req.body.email?.trim().toLowerCase() || user.email;

  if (req.body.password) {
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(req.body.password, salt);
  }

  const updatedUser = await user.save();

  res.status(200).json({
    _id: updatedUser._id,
    username: updatedUser.username,
    email: updatedUser.email,
    isAdmin: updatedUser.isAdmin,
  });
});

// @desc    Delete user by ID
// @route   DELETE /api/users/:id
// @access  Admin
const deleteUserById = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    res.status(404);
    throw new Error("User not found.");
  }

  if (user.isAdmin) {
    res.status(403);
    throw new Error("Cannot delete an admin user.");
  }

  await User.deleteOne({ _id: user._id });

  res.status(200).json({ message: "User removed successfully." });
});

// @desc    Get user by ID
// @route   GET /api/users/:id
// @access  Admin
const getUserById = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).select("-password").lean();

  if (!user) {
    res.status(404);
    throw new Error("User not found.");
  }

  res.status(200).json(user);
});

// @desc    Update user by ID
// @route   PUT /api/users/:id
// @access  Admin
const updateUserById = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    res.status(404);
    throw new Error("User not found.");
  }

  user.username = req.body.username?.trim() || user.username;
  user.email = req.body.email?.trim().toLowerCase() || user.email;
  user.isAdmin = Boolean(req.body.isAdmin);

  const updatedUser = await user.save();

  res.status(200).json({
    _id: updatedUser._id,
    username: updatedUser.username,
    email: updatedUser.email,
    isAdmin: updatedUser.isAdmin,
  });
});

export {
  createUser,
  loginUser,
  logoutCurrentUser,
  getAllUsers,
  getCurrentUserProfile,
  updateCurrentUserProfile,
  deleteUserById,
  getUserById,
  updateUserById,
};
