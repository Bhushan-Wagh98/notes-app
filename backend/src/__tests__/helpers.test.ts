import { validatePassword, generateOtp } from "../utils/helpers";

describe("helpers", () => {
  describe("generateOtp", () => {
    it("should return a 6-digit string", () => {
      const otp = generateOtp();
      expect(otp).toMatch(/^\d{6}$/);
    });

    it("should return different values on multiple calls", () => {
      const otps = new Set(Array.from({ length: 10 }, () => generateOtp()));
      expect(otps.size).toBeGreaterThan(1);
    });
  });

  describe("validatePassword", () => {
    it("should return null for a valid password", () => {
      expect(validatePassword("Test@1234")).toBeNull();
    });

    it("should reject password without uppercase", () => {
      expect(validatePassword("test@1234")).not.toBeNull();
    });

    it("should reject password without lowercase", () => {
      expect(validatePassword("TEST@1234")).not.toBeNull();
    });

    it("should reject password without digit", () => {
      expect(validatePassword("Test@abcd")).not.toBeNull();
    });

    it("should reject password without special character", () => {
      expect(validatePassword("Test12345")).not.toBeNull();
    });

    it("should reject password shorter than 8 characters", () => {
      expect(validatePassword("Te@1")).not.toBeNull();
    });
  });
});
