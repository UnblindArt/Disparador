import * as authService from '../services/authService.js';
import { asyncHandler } from '../middlewares/errorHandler.js';

export const register = asyncHandler(async (req, res) => {
  const result = await authService.registerUser(req.body);

  res.status(201).json({
    success: true,
    data: result,
  });
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const result = await authService.loginUser(email, password);

  res.json({
    success: true,
    data: result,
  });
});

export const getProfile = asyncHandler(async (req, res) => {
  const user = await authService.getUserProfile(req.user.id);

  res.json({
    success: true,
    data: user,
  });
});

export const updateProfile = asyncHandler(async (req, res) => {
  const user = await authService.updateUserProfile(req.user.id, req.body);

  res.json({
    success: true,
    data: user,
  });
});

export const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  await authService.changePassword(req.user.id, currentPassword, newPassword);

  res.json({
    success: true,
    message: 'Password changed successfully',
  });
});

export default {
  register,
  login,
  getProfile,
  updateProfile,
  changePassword,
};
