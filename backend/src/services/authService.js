import { supabaseAdmin } from '../config/database.js';
import { hashPassword, comparePassword } from '../utils/crypto.js';
import { generateAccessToken, generateRefreshToken } from '../utils/jwt.js';
import logger from '../config/logger.js';

export async function registerUser(userData) {
  const { email, password, name, phone } = userData;

  try {
    // Check if user already exists
    const { data: existingUser } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('email', email)
      .is('deleted_at', null)
      .single();

    if (existingUser) {
      throw new Error('User already exists');
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Create user
    const { data: user, error } = await supabaseAdmin
      .from('users')
      .insert([
        {
          email,
          password_hash: passwordHash,
          name,
          phone: phone || null,
          role: 'user',
          is_active: true,
        },
      ])
      .select()
      .single();

    if (error) {
      throw error;
    }

    logger.info('User registered successfully', { userId: user.id, email });

    // Generate tokens
    const accessToken = generateAccessToken({ userId: user.id, email: user.email, role: user.role });
    const refreshToken = generateRefreshToken({ userId: user.id });

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
      tokens: {
        accessToken,
        refreshToken,
      },
    };
  } catch (error) {
    logger.error('Registration error:', error);
    throw error;
  }
}

export async function loginUser(email, password) {
  try {
    // Get user
    const { data: user, error } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('email', email)
      .is('deleted_at', null)
      .single();

    if (error || !user) {
      throw new Error('Invalid credentials');
    }

    if (!user.is_active) {
      throw new Error('Account is inactive');
    }

    // Verify password
    const isValidPassword = await comparePassword(password, user.password_hash);

    if (!isValidPassword) {
      throw new Error('Invalid credentials');
    }

    // Update last login
    await supabaseAdmin
      .from('users')
      .update({ last_login_at: new Date().toISOString() })
      .eq('id', user.id);

    logger.info('User logged in successfully', { userId: user.id, email });

    // Generate tokens
    const accessToken = generateAccessToken({ userId: user.id, email: user.email, role: user.role });
    const refreshToken = generateRefreshToken({ userId: user.id });

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
      tokens: {
        accessToken,
        refreshToken,
      },
    };
  } catch (error) {
    logger.error('Login error:', error);
    throw error;
  }
}

export async function getUserProfile(userId) {
  try {
    const { data: user, error } = await supabaseAdmin
      .from('users')
      .select('id, email, name, phone, role, created_at, last_login_at')
      .eq('id', userId)
      .is('deleted_at', null)
      .single();

    if (error || !user) {
      throw new Error('User not found');
    }

    return user;
  } catch (error) {
    logger.error('Get profile error:', error);
    throw error;
  }
}

export async function updateUserProfile(userId, updates) {
  try {
    const { data: user, error } = await supabaseAdmin
      .from('users')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId)
      .select('id, email, name, phone, role')
      .single();

    if (error) {
      throw error;
    }

    logger.info('User profile updated', { userId });

    return user;
  } catch (error) {
    logger.error('Update profile error:', error);
    throw error;
  }
}

export async function changePassword(userId, currentPassword, newPassword) {
  try {
    // Get user
    const { data: user, error } = await supabaseAdmin
      .from('users')
      .select('password_hash')
      .eq('id', userId)
      .single();

    if (error || !user) {
      throw new Error('User not found');
    }

    // Verify current password
    const isValidPassword = await comparePassword(currentPassword, user.password_hash);

    if (!isValidPassword) {
      throw new Error('Current password is incorrect');
    }

    // Hash new password
    const newPasswordHash = await hashPassword(newPassword);

    // Update password
    await supabaseAdmin
      .from('users')
      .update({
        password_hash: newPasswordHash,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId);

    logger.info('Password changed successfully', { userId });

    return true;
  } catch (error) {
    logger.error('Change password error:', error);
    throw error;
  }
}

export default {
  registerUser,
  loginUser,
  getUserProfile,
  updateUserProfile,
  changePassword,
};
