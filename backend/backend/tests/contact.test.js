const request = require("supertest");
const app = require("../src/app");
const testDb = require("./utils/testDb");
const ContactMessage = require("../src/models/ContactMessage");

beforeAll(async () => {
  await testDb.connect();
});

afterEach(async () => {
  await testDb.clearDatabase();
});

afterAll(async () => {
  await testDb.closeDatabase();
});

describe("POST /api/v1/contact", () => {
  it("accepts a valid message with no authentication required", async () => {
    const res = await request(app).post("/api/v1/contact").send({
      name: "Priya Sharma",
      email: "priya@example.com",
      message: "Hi, I had a question about how job payments work on NearPin.",
    });

    expect(res.status).toBe(201);
    expect(res.body.data.id).toEqual(expect.any(String));

    const saved = await ContactMessage.findById(res.body.data.id);
    expect(saved).not.toBeNull();
    expect(saved.status).toBe("new");
    expect(saved.email).toBe("priya@example.com");
  });

  it("rejects a message with a missing name", async () => {
    const res = await request(app).post("/api/v1/contact").send({
      email: "priya@example.com",
      message: "Hi, I had a question about how job payments work on NearPin.",
    });

    expect(res.status).toBe(400);
    const saved = await ContactMessage.find();
    expect(saved).toHaveLength(0);
  });

  it("rejects an invalid email address", async () => {
    const res = await request(app).post("/api/v1/contact").send({
      name: "Priya Sharma",
      email: "not-an-email",
      message: "Hi, I had a question about how job payments work on NearPin.",
    });

    expect(res.status).toBe(400);
  });

  it("rejects a message shorter than the minimum length", async () => {
    const res = await request(app).post("/api/v1/contact").send({
      name: "Priya Sharma",
      email: "priya@example.com",
      message: "Too short",
    });

    expect(res.status).toBe(400);
  });
});
