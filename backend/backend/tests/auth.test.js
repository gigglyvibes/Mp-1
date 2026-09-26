const request = require("supertest");
const app = require("../src/app");
const testDb = require("./utils/testDb");
const { createStudent, authHeader } = require("./utils/factories");

beforeAll(async () => {
  await testDb.connect();
});

afterEach(async () => {
  await testDb.clearDatabase();
});

afterAll(async () => {
  await testDb.closeDatabase();
});

describe("POST /api/v1/auth/login", () => {
  it("logs in with a correct email + password", async () => {
    await createStudent({ email: "login-student@test.com", password: "Password123" });

    const res = await request(app)
      .post("/api/v1/auth/login")
      .send({ identifier: "login-student@test.com", password: "Password123" });

    expect(res.status).toBe(200);
    expect(res.body.data.accessToken).toEqual(expect.any(String));
    expect(res.body.data.user.email).toBe("login-student@test.com");
    // The safe object must never leak the password hash.
    expect(res.body.data.user.password).toBeUndefined();
  });

  it("rejects an incorrect password", async () => {
    await createStudent({ email: "wrong-pass@test.com", password: "Password123" });

    const res = await request(app)
      .post("/api/v1/auth/login")
      .send({ identifier: "wrong-pass@test.com", password: "WrongPassword1" });

    expect(res.status).toBe(401);
  });

  it("rejects a login for an unknown identifier", async () => {
    const res = await request(app)
      .post("/api/v1/auth/login")
      .send({ identifier: "nobody@test.com", password: "Password123" });

    expect(res.status).toBe(401);
  });
});

describe("GET /api/v1/auth/me", () => {
  it("requires a bearer token", async () => {
    const res = await request(app).get("/api/v1/auth/me");
    expect(res.status).toBe(401);
  });

  it("returns the authenticated user's own profile", async () => {
    const student = await createStudent({ email: "me@test.com" });

    const res = await request(app).get("/api/v1/auth/me").set(authHeader(student));

    expect(res.status).toBe(200);
    expect(res.body.data.email).toBe("me@test.com");
    expect(res.body.data.documents).toBeUndefined(); // sensitive field stripped
  });

  it("rejects a token for a suspended account", async () => {
    const student = await createStudent({ email: "suspended@test.com", isSuspended: true });

    const res = await request(app).get("/api/v1/auth/me").set(authHeader(student));

    expect(res.status).toBe(403);
  });
});
