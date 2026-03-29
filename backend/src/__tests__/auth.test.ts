import request from "supertest";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";
import app from "../app";
import { UserModel } from "../models/user.model";
import { OtpModel } from "../models/otp.model";
import { env } from "../config/env";

// Mock email service to avoid sending real emails
jest.mock("../services/email.service", () => ({
  sendOtpEmail: jest.fn().mockResolvedValue(undefined),
}));

let mongoServer: MongoMemoryServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

afterEach(async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
});

describe("POST /api/auth/login", () => {
  const validUser = {
    email: "test@example.com",
    password: "Test@1234",
    firstName: "Test",
    lastName: "User",
  };

  beforeEach(async () => {
    const hash = await bcrypt.hash(validUser.password, 10);
    await UserModel.create({ ...validUser, password: hash });
  });

  it("should login with valid credentials", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: validUser.email, password: validUser.password });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("token");
    expect(res.body.email).toBe(validUser.email);
    expect(res.body.firstName).toBe(validUser.firstName);
  });

  it("should return 401 for wrong password", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: validUser.email, password: "WrongPass@1" });

    expect(res.status).toBe(401);
    expect(res.body.error).toBe("Invalid credentials");
  });

  it("should return 401 for non-existent email", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "nobody@example.com", password: "Test@1234" });

    expect(res.status).toBe(401);
  });

  it("should return 400 when fields are missing", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: validUser.email });
    expect(res.status).toBe(400);
  });

  it("should return 403 for blocked user", async () => {
    await UserModel.findOneAndUpdate(
      { email: validUser.email },
      { isBlocked: true },
    );

    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: validUser.email, password: validUser.password });

    expect(res.status).toBe(403);
    expect(res.body.error).toContain("blocked");
  });
});

describe("POST /api/auth/send-otp", () => {
  it("should send OTP for new user", async () => {
    const res = await request(app).post("/api/auth/send-otp").send({
      email: "new@example.com",
      password: "Test@1234",
      firstName: "New",
      lastName: "User",
    });

    expect(res.status).toBe(200);
    expect(res.body.message).toContain("OTP sent");

    const otpRecord = await OtpModel.findOne({ email: "new@example.com" });
    expect(otpRecord).not.toBeNull();
  });

  it("should return 409 if email already registered", async () => {
    await UserModel.create({
      email: "existing@example.com",
      password: await bcrypt.hash("Test@1234", 10),
      firstName: "E",
      lastName: "U",
    });

    const res = await request(app).post("/api/auth/send-otp").send({
      email: "existing@example.com",
      password: "Test@1234",
      firstName: "E",
      lastName: "U",
    });

    expect(res.status).toBe(409);
  });

  it("should return 400 for weak password", async () => {
    const res = await request(app).post("/api/auth/send-otp").send({
      email: "weak@example.com",
      password: "weak",
      firstName: "W",
      lastName: "U",
    });

    expect(res.status).toBe(400);
  });

  it("should return 400 when fields are missing", async () => {
    const res = await request(app)
      .post("/api/auth/send-otp")
      .send({ email: "a@b.com" });
    expect(res.status).toBe(400);
  });
});

describe("POST /api/auth/verify-otp", () => {
  it("should create user on valid OTP", async () => {
    const hash = await bcrypt.hash("Test@1234", 10);
    await OtpModel.create({
      email: "verify@example.com",
      otp: "123456",
      password: hash,
      firstName: "V",
      lastName: "U",
    });

    const res = await request(app)
      .post("/api/auth/verify-otp")
      .send({ email: "verify@example.com", otp: "123456" });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty("token");

    const user = await UserModel.findOne({ email: "verify@example.com" });
    expect(user).not.toBeNull();
  });

  it("should return 400 for invalid OTP", async () => {
    const res = await request(app)
      .post("/api/auth/verify-otp")
      .send({ email: "verify@example.com", otp: "000000" });

    expect(res.status).toBe(400);
  });

  it("should return 400 when fields are missing", async () => {
    const res = await request(app)
      .post("/api/auth/verify-otp")
      .send({ email: "a@b.com" });
    expect(res.status).toBe(400);
  });
});

describe("POST /api/auth/forgot-password", () => {
  beforeEach(async () => {
    await UserModel.create({
      email: "forgot@example.com",
      password: await bcrypt.hash("Test@1234", 10),
      firstName: "F",
      lastName: "U",
    });
  });

  it("should send OTP for existing user", async () => {
    const res = await request(app)
      .post("/api/auth/forgot-password")
      .send({ email: "forgot@example.com" });

    expect(res.status).toBe(200);
    expect(res.body.message).toContain("OTP sent");
  });

  it("should return 404 for non-existent email", async () => {
    const res = await request(app)
      .post("/api/auth/forgot-password")
      .send({ email: "nobody@example.com" });

    expect(res.status).toBe(404);
  });

  it("should return 400 when email is missing", async () => {
    const res = await request(app).post("/api/auth/forgot-password").send({});
    expect(res.status).toBe(400);
  });
});

describe("POST /api/auth/reset-password", () => {
  beforeEach(async () => {
    await UserModel.create({
      email: "reset@example.com",
      password: await bcrypt.hash("Test@1234", 10),
      firstName: "R",
      lastName: "U",
    });
    await OtpModel.create({
      email: "reset@example.com",
      otp: "654321",
      password: "",
      firstName: "",
      lastName: "",
    });
  });

  it("should reset password with valid OTP", async () => {
    const res = await request(app).post("/api/auth/reset-password").send({
      email: "reset@example.com",
      otp: "654321",
      newPassword: "NewPass@1234",
    });

    expect(res.status).toBe(200);
    expect(res.body.message).toContain("reset successfully");
  });

  it("should return 400 for invalid OTP", async () => {
    const res = await request(app).post("/api/auth/reset-password").send({
      email: "reset@example.com",
      otp: "000000",
      newPassword: "NewPass@1234",
    });

    expect(res.status).toBe(400);
  });

  it("should return 400 for weak new password", async () => {
    const res = await request(app).post("/api/auth/reset-password").send({
      email: "reset@example.com",
      otp: "654321",
      newPassword: "weak",
    });

    expect(res.status).toBe(400);
  });
});

describe("PUT /api/auth/profile", () => {
  let token: string;

  beforeEach(async () => {
    const user = await UserModel.create({
      email: "profile@example.com",
      password: await bcrypt.hash("Test@1234", 10),
      firstName: "Old",
      lastName: "Name",
    });
    token = jwt.sign({ id: user._id, email: user.email }, env.JWT_SECRET, {
      expiresIn: "1h",
    });
  });

  it("should update profile with valid token", async () => {
    const res = await request(app)
      .put("/api/auth/profile")
      .set("Authorization", `Bearer ${token}`)
      .send({ firstName: "New", lastName: "Name" });

    expect(res.status).toBe(200);
    expect(res.body.firstName).toBe("New");
  });

  it("should return 401 without token", async () => {
    const res = await request(app)
      .put("/api/auth/profile")
      .send({ firstName: "New", lastName: "Name" });

    expect(res.status).toBe(401);
  });

  it("should return 400 when fields are missing", async () => {
    const res = await request(app)
      .put("/api/auth/profile")
      .set("Authorization", `Bearer ${token}`)
      .send({ firstName: "New" });

    expect(res.status).toBe(400);
  });
});

describe("PUT /api/auth/change-password", () => {
  let token: string;

  beforeEach(async () => {
    const user = await UserModel.create({
      email: "changepw@example.com",
      password: await bcrypt.hash("Test@1234", 10),
      firstName: "C",
      lastName: "P",
    });
    token = jwt.sign({ id: user._id, email: user.email }, env.JWT_SECRET, {
      expiresIn: "1h",
    });
  });

  it("should change password with correct current password", async () => {
    const res = await request(app)
      .put("/api/auth/change-password")
      .set("Authorization", `Bearer ${token}`)
      .send({ currentPassword: "Test@1234", newPassword: "NewPass@1234" });

    expect(res.status).toBe(200);
    expect(res.body.message).toContain("changed successfully");
  });

  it("should return 401 for wrong current password", async () => {
    const res = await request(app)
      .put("/api/auth/change-password")
      .set("Authorization", `Bearer ${token}`)
      .send({ currentPassword: "Wrong@1234", newPassword: "NewPass@1234" });

    expect(res.status).toBe(401);
  });

  it("should return 400 for weak new password", async () => {
    const res = await request(app)
      .put("/api/auth/change-password")
      .set("Authorization", `Bearer ${token}`)
      .send({ currentPassword: "Test@1234", newPassword: "weak" });

    expect(res.status).toBe(400);
  });
});

describe("GET /health", () => {
  it("should return ok status", async () => {
    const res = await request(app).get("/health");
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("ok");
  });
});
