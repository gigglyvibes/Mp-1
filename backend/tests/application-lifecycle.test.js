const request = require("supertest");
const app = require("../src/app");
const testDb = require("./utils/testDb");
const { createStudent, createBusiness, createJob, authHeader } = require("./utils/factories");
const Job = require("../src/models/Job");
const Application = require("../src/models/Application");

beforeAll(async () => {
  await testDb.connect();
});

afterEach(async () => {
  await testDb.clearDatabase();
});

afterAll(async () => {
  await testDb.closeDatabase();
});

describe("POST /api/v1/applications/:jobId (apply)", () => {
  it("lets a verified student apply to a published job", async () => {
    const business = await createBusiness();
    const student = await createStudent();
    const job = await createJob(business);

    const res = await request(app)
      .post(`/api/v1/applications/${job._id}`)
      .set(authHeader(student))
      .send({ coverNote: "I can start right away." });

    expect(res.status).toBe(201);
    expect(res.body.data.status).toBe("applied");
  });

  it("blocks a duplicate application to the same job", async () => {
    const business = await createBusiness();
    const student = await createStudent();
    const job = await createJob(business);

    await request(app).post(`/api/v1/applications/${job._id}`).set(authHeader(student));
    const res = await request(app).post(`/api/v1/applications/${job._id}`).set(authHeader(student));

    expect(res.status).toBe(409);
  });

  it("rejects an application to a job that is not published", async () => {
    const business = await createBusiness();
    const student = await createStudent();
    const job = await createJob(business, { status: "draft" });

    const res = await request(app).post(`/api/v1/applications/${job._id}`).set(authHeader(student));
    expect(res.status).toBe(400);
  });
});

describe("PATCH /api/v1/applications/:id/respond (accept/reject)", () => {
  const acceptApplication = async (business, student, job) => {
    const applyRes = await request(app)
      .post(`/api/v1/applications/${job._id}`)
      .set(authHeader(student));
    return request(app)
      .patch(`/api/v1/applications/${applyRes.body.data._id}/respond`)
      .set(authHeader(business))
      .send({ decision: "accepted" });
  };

  it("accepts an applied student and increments the job's accepted count", async () => {
    const business = await createBusiness();
    const student = await createStudent();
    const job = await createJob(business, { requiredStudents: 2 });

    const res = await acceptApplication(business, student, job);

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe("accepted");
    const updatedJob = await Job.findById(job._id);
    expect(updatedJob.acceptedStudentsCount).toBe(1);
  });

  it("refuses to accept beyond the job's required student capacity", async () => {
    const business = await createBusiness();
    const job = await createJob(business, { requiredStudents: 1 });
    const studentA = await createStudent();
    const studentB = await createStudent();

    const firstAccept = await acceptApplication(business, studentA, job);
    expect(firstAccept.status).toBe(200);

    const secondAccept = await acceptApplication(business, studentB, job);
    expect(secondAccept.status).toBe(400);

    const updatedJob = await Job.findById(job._id);
    expect(updatedJob.acceptedStudentsCount).toBe(1);
  });

  it("never lets concurrent accept requests exceed requiredStudents (atomic slot reservation)", async () => {
    const business = await createBusiness();
    const job = await createJob(business, { requiredStudents: 1 });
    const studentA = await createStudent();
    const studentB = await createStudent();

    const applyA = await request(app).post(`/api/v1/applications/${job._id}`).set(authHeader(studentA));
    const applyB = await request(app).post(`/api/v1/applications/${job._id}`).set(authHeader(studentB));

    // Fire both accept requests at (roughly) the same time.
    const [resA, resB] = await Promise.all([
      request(app)
        .patch(`/api/v1/applications/${applyA.body.data._id}/respond`)
        .set(authHeader(business))
        .send({ decision: "accepted" }),
      request(app)
        .patch(`/api/v1/applications/${applyB.body.data._id}/respond`)
        .set(authHeader(business))
        .send({ decision: "accepted" }),
    ]);

    const statuses = [resA.status, resB.status].sort();
    expect(statuses).toEqual([200, 400]);

    const updatedJob = await Job.findById(job._id);
    expect(updatedJob.acceptedStudentsCount).toBe(1);
  });
});

describe("PATCH /api/v1/applications/:id/withdraw", () => {
  it("allows a student to withdraw an accepted application before the job start date", async () => {
    const business = await createBusiness();
    const student = await createStudent();
    // Starts 3 days from now (factory default) — well before the cutoff.
    const job = await createJob(business, { requiredStudents: 1 });

    const applyRes = await request(app).post(`/api/v1/applications/${job._id}`).set(authHeader(student));
    await request(app)
      .patch(`/api/v1/applications/${applyRes.body.data._id}/respond`)
      .set(authHeader(business))
      .send({ decision: "accepted" });

    const res = await request(app)
      .patch(`/api/v1/applications/${applyRes.body.data._id}/withdraw`)
      .set(authHeader(student));

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe("withdrawn");

    const updatedJob = await Job.findById(job._id);
    expect(updatedJob.acceptedStudentsCount).toBe(0);
  });

  it("blocks withdrawal on/after the job's start date", async () => {
    const business = await createBusiness();
    const student = await createStudent();
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const job = await createJob(business, {
      startDateTime: yesterday,
      endDateTime: new Date(Date.now() + 60 * 60 * 1000),
    });

    const application = await Application.create({
      job: job._id,
      student: student._id,
      business: business._id,
      status: "applied",
      distanceKm: 0,
    });

    const res = await request(app)
      .patch(`/api/v1/applications/${application._id}/withdraw`)
      .set(authHeader(student));

    expect(res.status).toBe(400);
  });
});

describe("PATCH /api/v1/applications/:id/respond (business removal)", () => {
  it("lets a business remove an accepted student before the job start date", async () => {
    const business = await createBusiness();
    const student = await createStudent();
    const job = await createJob(business);

    const applyRes = await request(app).post(`/api/v1/applications/${job._id}`).set(authHeader(student));
    await request(app)
      .patch(`/api/v1/applications/${applyRes.body.data._id}/respond`)
      .set(authHeader(business))
      .send({ decision: "accepted" });

    const res = await request(app)
      .patch(`/api/v1/applications/${applyRes.body.data._id}/respond`)
      .set(authHeader(business))
      .send({ decision: "removed" });

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe("removed");

    const updatedJob = await Job.findById(job._id);
    expect(updatedJob.acceptedStudentsCount).toBe(0);
  });

  it("blocks removal of a student on/after the job start date", async () => {
    const business = await createBusiness();
    const student = await createStudent();
    const startsSoon = new Date(Date.now() + 500); // effectively "now"
    const job = await createJob(business, {
      startDateTime: startsSoon,
      endDateTime: new Date(Date.now() + 60 * 60 * 1000),
    });

    const application = await Application.create({
      job: job._id,
      student: student._id,
      business: business._id,
      status: "accepted",
      distanceKm: 0,
    });
    await Job.findByIdAndUpdate(job._id, { $inc: { acceptedStudentsCount: 1 } });

    // Let the clock pass the start time.
    await new Promise((resolve) => setTimeout(resolve, 600));

    const res = await request(app)
      .patch(`/api/v1/applications/${application._id}/respond`)
      .set(authHeader(business))
      .send({ decision: "removed" });

    expect(res.status).toBe(400);
  });
});
