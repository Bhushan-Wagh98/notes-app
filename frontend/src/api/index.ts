/**
 * @module api
 * @description Centralized API service for all REST calls to the backend.
 * Eliminates duplicated fetch logic and provides typed request helpers.
 */

/** Base URL resolved from environment variable, falls back to localhost for dev. */
const BASE_URL = import.meta.env.VITE_SERVER_URL || "http://localhost:8080";

/** Constructs Authorization header from a JWT token. */
const authHeader = (token: string) => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${token}`,
});

// ─── Auth Endpoints ──────────────────────────────────────────────────────────

export const authApi = {
  login: (email: string, password: string) =>
    fetch(`${BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    }),

  sendOtp: (data: { email: string; password: string; firstName: string; lastName: string }) =>
    fetch(`${BASE_URL}/api/auth/send-otp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }),

  verifyOtp: (email: string, otp: string) =>
    fetch(`${BASE_URL}/api/auth/verify-otp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, otp }),
    }),

  forgotPassword: (email: string) =>
    fetch(`${BASE_URL}/api/auth/forgot-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    }),

  resetPassword: (email: string, otp: string, newPassword: string) =>
    fetch(`${BASE_URL}/api/auth/reset-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, otp, newPassword }),
    }),

  updateProfile: (token: string, firstName: string, lastName: string) =>
    fetch(`${BASE_URL}/api/auth/profile`, {
      method: "PUT",
      headers: authHeader(token),
      body: JSON.stringify({ firstName, lastName }),
    }),

  changePassword: (token: string, currentPassword: string, newPassword: string) =>
    fetch(`${BASE_URL}/api/auth/change-password`, {
      method: "PUT",
      headers: authHeader(token),
      body: JSON.stringify({ currentPassword, newPassword }),
    }),
};

// ─── Notes Endpoints ─────────────────────────────────────────────────────────

export const notesApi = {
  getMyNotes: (token: string) =>
    fetch(`${BASE_URL}/api/notes/my-notes`, {
      headers: { Authorization: `Bearer ${token}` },
    }),

  toggleVisibility: (token: string, noteId: string, isPrivate: boolean) =>
    fetch(`${BASE_URL}/api/notes/${noteId}/visibility`, {
      method: "PATCH",
      headers: authHeader(token),
      body: JSON.stringify({ isPrivate }),
    }),

  toggleReadOnly: (token: string, noteId: string, isReadOnly: boolean) =>
    fetch(`${BASE_URL}/api/notes/${noteId}/read-only`, {
      method: "PATCH",
      headers: authHeader(token),
      body: JSON.stringify({ isReadOnly }),
    }),

  deleteNote: (token: string, noteId: string) =>
    fetch(`${BASE_URL}/api/notes/${noteId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    }),
};

// ─── Admin Endpoints ─────────────────────────────────────────────────────────

export const adminApi = {
  getUsers: (token: string) =>
    fetch(`${BASE_URL}/api/notes/admin/users`, {
      headers: { Authorization: `Bearer ${token}` },
    }),

  getUserNotes: (token: string, userId: string) =>
    fetch(`${BASE_URL}/api/notes/admin/users/${userId}/notes`, {
      headers: { Authorization: `Bearer ${token}` },
    }),

  getAnonymousNotes: (token: string) =>
    fetch(`${BASE_URL}/api/notes/admin/anonymous-notes`, {
      headers: { Authorization: `Bearer ${token}` },
    }),

  deleteUser: (token: string, userId: string) =>
    fetch(`${BASE_URL}/api/notes/admin/users/${userId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    }),

  deleteNote: (token: string, noteId: string) =>
    fetch(`${BASE_URL}/api/notes/admin/notes/${noteId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    }),

  toggleLock: (token: string, noteId: string) =>
    fetch(`${BASE_URL}/api/notes/admin/notes/${noteId}/toggle-lock`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${token}` },
    }),

  toggleAdmin: (token: string, userId: string) =>
    fetch(`${BASE_URL}/api/notes/admin/users/${userId}/toggle-admin`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${token}` },
    }),

  toggleBlock: (token: string, userId: string) =>
    fetch(`${BASE_URL}/api/notes/admin/users/${userId}/toggle-block`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${token}` },
    }),
};

/** The server base URL, exported for Socket.IO connection. */
export const SERVER_URL = BASE_URL;
