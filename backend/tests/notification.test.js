const request = require("supertest");
const app = require("../src/app");
const testDb = require("./utils/testDb");
const { createStudent, authHeader } = require("./utils/factories");
const Notification = require("../src/models/Notification");

beforeAll(async () => {
  await testDb.connect();
});

afterEach(async () => {
  await testDb.clearDatabase();
});

afterAll(async () => {
  await testDb.closeDatabase();
});

describe("GET /api/v1/notifications", () => {
  it("does not crash and returns a paginated shape (regression for the missing page/limit read)", async () => {
    const student = await createStudent();

    const res = await request(app).get("/api/v1/notifications").set(authHeader(student));

    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({ items: [], total: 0, unreadCount: 0, page: 1, limit: 20 });
  });

  it("clamps limit to the 1-50 bound instead of erroring", async () => {
    const student = await createStudent();

    const res = await request(app)
      .get("/api/v1/notifications")
      .query({ limit: 500 })
      .set(authHeader(student));

    expect(res.status).toBe(200);
    expect(res.body.data.limit).toBe(50);
  });

  it("only returns the authenticated user's own notifications", async () => {
    const student = await createStudent();
    const otherStudent = await createStudent();

    await Notification.create({
      recipient: otherStudent._id,
      type: "APPLICATION_ACCEPTED",
      title: "Not yours",
      message: "This belongs to someone else.",
    });

    const res = await request(app).get("/api/v1/notifications").set(authHeader(student));

    expect(res.status).toBe(200);
    expect(res.body.data.items).toHaveLength(0);
  });
});

describe("PATCH /api/v1/notifications/:id/read", () => {
  it("marks the caller's own notification as read", async () => {
    const student = await createStudent();
    const notification = await Notification.create({
      recipient: student._id,
      type: "APPLICATION_ACCEPTED",
      title: "Your application was accepted",
      message: "Good news!",
    });

    const res = await request(app)
      .patch(`/api/v1/notifications/${notification._id}/read`)
      .set(authHeader(student));

    expect(res.status).toBe(200);
    expect(res.body.data.isRead).toBe(true);
  });

  it("404s when marking a notification that isn't the caller's", async () => {
    const student = await createStudent();
    const otherStudent = await createStudent();
    const notification = await Notification.create({
      recipient: otherStudent._id,
      type: "APPLICATION_ACCEPTED",
      title: "Not yours",
      message: "This belongs to someone else.",
    });

    const res = await request(app)
      .patch(`/api/v1/notifications/${notification._id}/read`)
      .set(authHeader(student));

    expect(res.status).toBe(404);
  });
});
