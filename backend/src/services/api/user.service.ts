import bcrypt from "bcrypt";
import prisma from "../../config/prisma";
import ApiError from "../../utils/ApiError";
import generateToken from "../../utils/generateToken";
import { generateOtp } from "../../utils/generateOtp";
import { sendOtpEmail } from "../../config/mailer";

// ── Updated interface — postalCode is now a plain string ──
interface RegisterUserInput {
  name: string;
  email: string;
  password: string;
  phone: string;
  address: string;
  countryId: number;
  stateId: number;
  cityId: number;
  postalCode: string; // ✅ string
}

const registerUser = async (data: RegisterUserInput) => {
  const {
    name,
    email,
    password,
    phone,
    address,
    countryId,
    stateId,
    cityId,
    postalCode,
  } = data;

  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) throw new ApiError(400, "Email already exists");

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: {
      name,
      email,
      password: hashedPassword,
      phone,
      address,
      countryId: Number(countryId),
      stateId: Number(stateId),
      cityId: Number(cityId),
      postalCode, // ✅ plain string
    },
  });

  return { user };
};

interface LoginInput {
  email: string;
  password: string;
}

const sendSignupOtp = async (email: string) => {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) throw new ApiError(400, "Email already registered");

  const otp = generateOtp();

  await prisma.pendingVerification.upsert({
    where: { email },
    update: { otp, otpExpiry: new Date(Date.now() + 10 * 60 * 1000) },
    create: { email, otp, otpExpiry: new Date(Date.now() + 10 * 60 * 1000) },
  });

  await sendOtpEmail(email, otp, "User");
  return { message: "OTP sent to email" };
};

const verifySignupOtp = async (email: string, otp: string) => {
  const record = await prisma.pendingVerification.findUnique({
    where: { email },
  });

  if (!record) throw new ApiError(400, "OTP not sent. Please request again.");
  if (new Date() > record.otpExpiry)
    throw new ApiError(400, "OTP expired. Please request a new one.");
  if (record.otp !== otp)
    throw new ApiError(400, "Invalid OTP. Please try again.");

  await prisma.pendingVerification.delete({ where: { email } });
  return { message: "Email verified successfully", verified: true };
};

const loginUser = async (data: LoginInput) => {
  const { email, password } = data;

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw new ApiError(404, "User not found");
  if (user.role !== "USER") throw new ApiError(403, "Access denied");

  const match = await bcrypt.compare(password, user.password);
  if (!match) throw new ApiError(401, "Incorrect Password");

  const token = generateToken(user);
  return { data: { user, token } };
};

const getProfile = async (userId: number) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      address: true,
      phone: true,
      postalCode: true, // ✅ plain string
      country: {
        select: {
          id: true,
          name: true,
          isoCode: true,
          phoneCode: true,
          flag: true,
        },
      },
      state: { select: { id: true, name: true, isoCode: true } },
      city: { select: { id: true, name: true } },
    },
  });

  if (!user) throw new ApiError(404, "User not found");
  return user;
};

// ── Updated interface — postalCode is string ──
interface UpdateProfileInput {
  name?: string;
  phone?: string;
  address?: string;
  countryId?: number;
  stateId?: number;
  cityId?: number;
  postalCode?: string; // ✅ string
}

const updateProfile = async (userId: number, data: UpdateProfileInput) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new ApiError(404, "User not found");

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: {
      name: data.name ?? user.name,
      phone: data.phone ?? user.phone,
      address: data.address ?? user.address,
      postalCode: data.postalCode ?? user.postalCode, // ✅ string
      countryId: data.countryId ? Number(data.countryId) : user.countryId,
      stateId: data.stateId ? Number(data.stateId) : user.stateId,
      cityId: data.cityId ? Number(data.cityId) : user.cityId,
      updatedAt: new Date(),
    },
    select: {
      id: true,
      name: true,
      phone: true,
      address: true,
      postalCode: true, // ✅ plain string
      country: {
        select: {
          id: true,
          name: true,
          isoCode: true,
          phoneCode: true,
          flag: true,
        },
      },
      state: { select: { id: true, name: true, isoCode: true } },
      city: { select: { id: true, name: true } },
    },
  });

  return updatedUser;
};

const forgotPassword = async (email: string) => {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw new ApiError(404, "User not found");

  const otp = generateOtp();

  await prisma.user.update({
    where: { email },
    data: { otp, otpExpiry: new Date(Date.now() + 10 * 60 * 1000) },
  });

  await sendOtpEmail(email, otp, user.name);
  console.log(`OTP for ${email}: ${otp}`);
  return { message: "OTP sent to email" };
};

const verifyOtp = async (email: string, otp: string) => {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw new ApiError(404, "User not found");
  if (!user.otp || !user.otpExpiry)
    throw new ApiError(400, "OTP not generated, please request a new one");
  if (new Date() > user.otpExpiry)
    throw new ApiError(400, "OTP has expired, please request a new one");

  if (user.otp === otp) {
    return { status: 200, message: "OTP matched", success: true };
  } else {
    return { status: 400, message: "Invalid Otp", success: false };
  }
};

const updatePassword = async (
  email: string,
  otp: string,
  newPassword: string,
) => {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw new ApiError(404, "User not found");
  if (!otp || !newPassword)
    throw new ApiError(404, "OTP and New Password both are required");
  if (!user.otp || !user.otpExpiry)
    throw new ApiError(400, "OTP not generated, please request a new one");
  if (new Date() > user.otpExpiry)
    throw new ApiError(400, "OTP has expired, please request a new one");

  let hashedPassword;
  if (otp === user.otp) {
    hashedPassword = await bcrypt.hash(newPassword, 10);
  } else {
    throw new ApiError(400, "Wrong OTP");
  }

  await prisma.user.update({
    where: { email },
    data: { password: hashedPassword, otp: null, otpExpiry: null },
  });

  return {
    status: 200,
    success: true,
    message: "Password updated successfully",
  };
};

const resendOtp = async (email: string) => {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw new Error("User not found");

  const otp = generateOtp();

  await prisma.user.update({
    where: { email },
    data: { otp, otpExpiry: new Date(Date.now() + 10 * 60 * 1000) },
  });

  await sendOtpEmail(email, otp, user.name);
  console.log(`New OTP for ${email}: ${otp}`);
  return { message: "OTP re-sent to email" };
};

const changePassword = async (
  userId: number,
  oldPassword: string,
  newPassword: string,
) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new ApiError(404, "User not found");

  const match = await bcrypt.compare(oldPassword, user.password);
  if (!match) throw new ApiError(400, "Old password is incorrect");
  if (oldPassword === newPassword)
    throw new ApiError(400, "New password must be different from old password");

  const hashedPassword = await bcrypt.hash(newPassword, 10);
  await prisma.user.update({
    where: { id: userId },
    data: { password: hashedPassword },
  });
  return { message: "Password updated successfully" };
};

const deleteAccount = async (userId: number) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new ApiError(404, "User not found");
  await prisma.user.delete({ where: { id: userId } });
  return { message: "Account deleted successfully" };
};

export default {
  registerUser,
  loginUser,
  getProfile,
  updateProfile,
  forgotPassword,
  verifyOtp,
  updatePassword,
  resendOtp,
  changePassword,
  deleteAccount,
  sendSignupOtp,
  verifySignupOtp,
};
