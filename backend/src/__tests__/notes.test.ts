import request from "supertest";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";
import app from "../app";
import { UserModel } from "../models/user.model";
import { DocumentModel } from "../models/document.model";
import { env } from "../config/env";

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

async function createUserAndToken(
  overrides: Partial<{
    email: string;
    isAdmin: boolean;
    isBlocked: boolean;
  }> = {},
) {
  const user = await UserModel.create({
    email: overrides.email || "user@example.com",
    password: await bcrypt.hash("Test@1234", 10),
    firstName: "Test",
    lastName: "User",
    isAdmin: overrides.isAdmin || false,
    isBlocked: overrides.isBlocked || false,
  });
  const id = (user._id as string).toString();
  const token = jwt.sign({ id, email: user.email }, env.JWT_SECRET, {
    expiresIn: "1h",
  });
  return { user, id, token };
}

describe("GET /api/notes/my-notes", () => {
  it("should return notes owned by the user", async () => {
    const { id, token } = await createUserAndToken();
    await DocumentModel.create({
      _id: "note-1",
      data: "hello",
      ownerId: id,
      title: "My Note",
    });
    await DocumentModel.create({
      _id: "note-2",
      data: "other",
      ownerId: "someone-else",
      title: "Other",
    });

    const res = await request(app)
      .get("/api/notes/my-notes")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0]._id).toBe("note-1");
  });

  it("should return 401 without token", async () => {
    const res = await request(app).get("/api/notes/my-notes");
    expect(res.status).toBe(401);
  });
});

describe("PATCH /api/notes/:id/read-only", () => {
  it("should toggle read-only for own note", async () => {
    const { id, token } = await createUserAndToken();
    await DocumentModel.create({ _id: "note-ro", data: "", ownerId: id });

    const res = await request(app)
      .patch("/api/notes/note-ro/read-only")
      .set("Authorization", `Bearer ${token}`)
      .send({ isReadOnly: true });

    expect(res.status).toBe(200);
    expect(res.body.isReadOnly).toBe(true);
  });

  it("should return 403 for locked note", async () => {
    const { id, token } = await createUserAndToken();
    await DocumentModel.create({
      _id: "note-locked",
      data: "",
      ownerId: id,
      isLocked: true,
    });

    const res = await request(app)
      .patch("/api/notes/note-locked/read-only")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(403);
  });

  it("should return 403 for other user's note", async () => {
    const { token } = await createUserAndToken();
    await DocumentModel.create({
      _id: "note-other",
      data: "",
      ownerId: "other-user-id",
    });

    const res = await request(app)
      .patch("/api/notes/note-other/read-only")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(403);
  });

  it("should return 404 for non-existent note", async () => {
    const { token } = await createUserAndToken();

    const res = await request(app)
      .patch("/api/notes/non-existent/read-only")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(404);
  });
});

describe("PATCH /api/notes/:id/visibility", () => {
  it("should toggle visibility for own note", async () => {
    const { id, token } = await createUserAndToken();
    await DocumentModel.create({ _id: "note-vis", data: "", ownerId: id });

    const res = await request(app)
      .patch("/api/notes/note-vis/visibility")
      .set("Authorization", `Bearer ${token}`)
      .send({ isPrivate: true });

    expect(res.status).toBe(200);
    expect(res.body.isPrivate).toBe(true);
  });
});

describe("DELETE /api/notes/:id", () => {
  it("should delete own note", async () => {
    const { id, token } = await createUserAndToken();
    await DocumentModel.create({ _id: "note-del", data: "", ownerId: id });

    const res = await request(app)
      .delete("/api/notes/note-del")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    const doc = await DocumentModel.findById("note-del");
    expect(doc).toBeNull();
  });

  it("should return 403 for other user's note", async () => {
    const { token } = await createUserAndToken();
    await DocumentModel.create({
      _id: "note-other-del",
      data: "",
      ownerId: "other-id",
    });

    const res = await request(app)
      .delete("/api/notes/note-other-del")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(403);
  });

  it("should return 403 for locked note", async () => {
    const { id, token } = await createUserAndToken();
    await DocumentModel.create({
      _id: "note-lock-del",
      data: "",
      ownerId: id,
      isLocked: true,
    });

    const res = await request(app)
      .delete("/api/notes/note-lock-del")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(403);
  });
});

describe("Admin routes", () => {
  it("should return 403 for non-admin user", async () => {
    const { token } = await createUserAndToken();

    const res = await request(app)
      .get("/api/notes/admin/users")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(403);
  });

  it("GET /admin/users should return users for admin", async () => {
    const { token } = await createUserAndToken({
      email: "admin@example.com",
      isAdmin: true,
    });
    await UserModel.create({
      email: "regular@example.com",
      password: await bcrypt.hash("Test@1234", 10),
      firstName: "R",
      lastName: "U",
    });

    const res = await request(app)
      .get("/api/notes/admin/users")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.length).toBeGreaterThanOrEqual(1);
  });

  it("GET /admin/anonymous-notes should return unowned notes", async () => {
    const { token } = await createUserAndToken({
      email: "admin2@example.com",
      isAdmin: true,
    });
    await DocumentModel.create({
      _id: "anon-note",
      data: "",
      ownerId: null,
      title: "Anon",
    });

    const res = await request(app)
      .get("/api/notes/admin/anonymous-notes")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
  });

  it("DELETE /admin/notes/:noteId should delete any note", async () => {
    const { token } = await createUserAndToken({
      email: "admin3@example.com",
      isAdmin: true,
    });
    await DocumentModel.create({
      _id: "admin-del",
      data: "",
      ownerId: "someone",
    });

    const res = await request(app)
      .delete("/api/notes/admin/notes/admin-del")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
  });

  it("PATCH /admin/notes/:noteId/toggle-lock should toggle lock", async () => {
    const { token } = await createUserAndToken({
      email: "admin4@example.com",
      isAdmin: true,
    });
    await DocumentModel.create({ _id: "lock-note", data: "", isLocked: false });

    const res = await request(app)
      .patch("/api/notes/admin/notes/lock-note/toggle-lock")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.isLocked).toBe(true);
  });

  it("PATCH /admin/users/:userId/toggle-block should toggle block", async () => {
    const { token } = await createUserAndToken({
      email: "admin5@example.com",
      isAdmin: true,
    });
    const target = await UserModel.create({
      email: "blockme@example.com",
      password: await bcrypt.hash("Test@1234", 10),
      firstName: "B",
      lastName: "U",
    });

    const res = await request(app)
      .patch(`/api/notes/admin/users/${target._id}/toggle-block`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.isBlocked).toBe(true);
  });

  it("DELETE /admin/users/:userId should delete user and their notes", async () => {
    const { token } = await createUserAndToken({
      email: "admin6@example.com",
      isAdmin: true,
    });
    const target = await UserModel.create({
      email: "deleteme@example.com",
      password: await bcrypt.hash("Test@1234", 10),
      firstName: "D",
      lastName: "U",
    });
    await DocumentModel.create({
      _id: "user-note",
      data: "",
      ownerId: (target._id as string).toString(),
    });

    const res = await request(app)
      .delete(`/api/notes/admin/users/${target._id}`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    const user = await UserModel.findById(target._id);
    expect(user).toBeNull();
    const note = await DocumentModel.findById("user-note");
    expect(note).toBeNull();
  });
});
