const request = require("supertest");
const app = require("../src/app");
const testDb = require("./utils/testDb");
const { createStudent, createBusiness, createJob, authHeader } = require("./utils/factories");

beforeAll(async () => {
  await testDb.connect();
});

afterEach(async () => {
  await testDb.clearDatabase();
});

afterAll(async () => {
  await testDb.closeDatabase();
});

describe("UPI Profile & Payment Guards", () => {
  it("PATCH /students/profile rejects blank and bad UPI IDs and accepts normalized valid UPI ID", async () => {
    const student = await createStudent();

    // 1. upiId "" -> 400
    const emptyRes = await request(app)
      .patch("/api/v1/students/profile")
      .set(authHeader(student))
      .send({ upiId: "" });
    expect(emptyRes.status).toBe(400);

    // 2. upiId "bad" -> 400
    const badRes = await request(app)
      .patch("/api/v1/students/profile")
      .set(authHeader(student))
      .send({ upiId: "bad" });
    expect(badRes.status).toBe(400);

    // 3. upiId " Rahul@OKSBI " -> 200 and stored value is "rahul@oksbi"
    const validRes = await request(app)
      .patch("/api/v1/students/profile")
      .set(authHeader(student))
      .send({ upiId: " Rahul@OKSBI " });
    expect(validRes.status).toBe(200);
    expect(validRes.body.data.upiId).toBe("rahul@oksbi");

    // Double-check via GET /api/v1/students/profile
    const getRes = await request(app)
      .get("/api/v1/students/profile")
      .set(authHeader(student));
    expect(getRes.status).toBe(200);
    expect(getRes.body.data.upiId).toBe("rahul@oksbi");
  });

  it("Business confirmPayment with paymentMethod 'upi' when student's upiId is empty -> 400; with 'cash' -> 200", async () => {
    const business = await createBusiness();
    const student = await createStudent({ upiId: "temp@oksbi" });
    const job = await createJob(business, { requiredStudents: 1 });

    // Onboard student through agreement
    const applyRes = await request(app).post(`/api/v1/applications/${job._id}`).set(authHeader(student));
    const applicationId = applyRes.body.data._id;

    await request(app)
      .patch(`/api/v1/applications/${applicationId}/respond`)
      .set(authHeader(business))
      .send({ decision: "accepted" });

    const agreementRes = await request(app)
      .get(`/api/v1/agreements/application/${applicationId}`)
      .set(authHeader(student));
    const agreementId = agreementRes.body.data._id;

    await request(app)
      .patch(`/api/v1/agreements/${agreementId}/sign`)
      .set(authHeader(business))
      .send({ fullName: "Owner Name" });
    await request(app)
      .patch(`/api/v1/agreements/${agreementId}/sign`)
      .set(authHeader(student))
      .send({ fullName: student.name });

    // Complete & approve work
    await request(app).patch(`/api/v1/applications/${applicationId}/complete`).set(authHeader(student));
    await request(app)
      .patch(`/api/v1/applications/${applicationId}/approve-completion`)
      .set(authHeader(business));

    // Initialize payment confirmation
    const initRes = await request(app).post(`/api/v1/payments/${agreementId}`).set(authHeader(business));
    expect(initRes.status).toBe(200);
    const paymentId = initRes.body.data._id;

    // Simulate student having cleared upiId directly in DB (to test defensive guard on confirmation)
    const Student = require("../src/models/Student");
    await Student.findByIdAndUpdate(student._id, { $set: { upiId: "" } });

    // Business tries to confirm with paymentMethod "upi"
    const upiConfirmRes = await request(app)
      .patch(`/api/v1/payments/${paymentId}/confirm`)
      .set(authHeader(business))
      .send({ paymentMethod: "upi", upiReference: "123456789012" });
    expect(upiConfirmRes.status).toBe(400);
    expect(upiConfirmRes.body.message).toMatch(/valid UPI ID/i);

    // Business confirms with paymentMethod "cash" -> 200
    const cashConfirmRes = await request(app)
      .patch(`/api/v1/payments/${paymentId}/confirm`)
      .set(authHeader(business))
      .send({ paymentMethod: "cash" });
    expect(cashConfirmRes.status).toBe(200);
    expect(cashConfirmRes.body.data.paymentMethod).toBe("cash");
    expect(cashConfirmRes.body.data.businessConfirmation.confirmed).toBe(true);
  });
});
