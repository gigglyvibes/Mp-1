const request = require("supertest");
const app = require("../src/app");
const testDb = require("./utils/testDb");
const { createStudent, createBusiness, createJob, authHeader } = require("./utils/factories");
const Job = require("../src/models/Job");

beforeAll(async () => {
  await testDb.connect();
});

afterEach(async () => {
  await testDb.clearDatabase();
});

afterAll(async () => {
  await testDb.closeDatabase();
});

/** Applies a student to a job and has the business accept them; returns the application id. */
const acceptedApplicationFor = async (business, student, job) => {
  const applyRes = await request(app).post(`/api/v1/applications/${job._id}`).set(authHeader(student));
  await request(app)
    .patch(`/api/v1/applications/${applyRes.body.data._id}/respond`)
    .set(authHeader(business))
    .send({ decision: "accepted" });
  return applyRes.body.data._id;
};

describe("Digital work agreement signing", () => {
  it("is not fully accepted until both parties sign", async () => {
    const business = await createBusiness();
    const student = await createStudent();
    const job = await createJob(business);
    const applicationId = await acceptedApplicationFor(business, student, job);

    const agreementRes = await request(app)
      .get(`/api/v1/agreements/application/${applicationId}`)
      .set(authHeader(student));
    const agreementId = agreementRes.body.data._id;
    expect(agreementRes.body.data.isFullyAccepted).toBe(false);

    const businessSign = await request(app)
      .patch(`/api/v1/agreements/${agreementId}/sign`)
      .set(authHeader(business))
      .send({ fullName: "Owner Name" });
    expect(businessSign.status).toBe(200);
    expect(businessSign.body.data.isFullyAccepted).toBe(false);

    const studentSign = await request(app)
      .patch(`/api/v1/agreements/${agreementId}/sign`)
      .set(authHeader(student))
      .send({ fullName: student.name });
    expect(studentSign.status).toBe(200);
    expect(studentSign.body.data.isFullyAccepted).toBe(true);
  });

  it("rejects a second signature from the same party", async () => {
    const business = await createBusiness();
    const student = await createStudent();
    const job = await createJob(business);
    const applicationId = await acceptedApplicationFor(business, student, job);

    const agreementRes = await request(app)
      .get(`/api/v1/agreements/application/${applicationId}`)
      .set(authHeader(student));
    const agreementId = agreementRes.body.data._id;

    await request(app)
      .patch(`/api/v1/agreements/${agreementId}/sign`)
      .set(authHeader(business))
      .send({ fullName: "Owner Name" });

    const duplicate = await request(app)
      .patch(`/api/v1/agreements/${agreementId}/sign`)
      .set(authHeader(business))
      .send({ fullName: "Owner Name" });

    expect(duplicate.status).toBe(400);
  });

  it("activates the job only once every accepted student's agreement is fully signed", async () => {
    const business = await createBusiness();
    const studentA = await createStudent();
    const studentB = await createStudent();
    const job = await createJob(business, { requiredStudents: 2 });

    const appIdA = await acceptedApplicationFor(business, studentA, job);
    const appIdB = await acceptedApplicationFor(business, studentB, job);

    const agreementA = (
      await request(app).get(`/api/v1/agreements/application/${appIdA}`).set(authHeader(studentA))
    ).body.data;
    const agreementB = (
      await request(app).get(`/api/v1/agreements/application/${appIdB}`).set(authHeader(studentB))
    ).body.data;

    // Fully sign only student A's agreement.
    await request(app)
      .patch(`/api/v1/agreements/${agreementA._id}/sign`)
      .set(authHeader(business))
      .send({ fullName: "Owner Name" });
    await request(app)
      .patch(`/api/v1/agreements/${agreementA._id}/sign`)
      .set(authHeader(studentA))
      .send({ fullName: studentA.name });

    let updatedJob = await Job.findById(job._id);
    expect(updatedJob.status).toBe("published"); // not active yet — B hasn't signed

    // Now fully sign student B's agreement too.
    await request(app)
      .patch(`/api/v1/agreements/${agreementB._id}/sign`)
      .set(authHeader(business))
      .send({ fullName: "Owner Name" });
    await request(app)
      .patch(`/api/v1/agreements/${agreementB._id}/sign`)
      .set(authHeader(studentB))
      .send({ fullName: studentB.name });

    updatedJob = await Job.findById(job._id);
    expect(updatedJob.status).toBe("active");
  });

  it("refuses to let a stranger view or sign someone else's agreement", async () => {
    const business = await createBusiness();
    const student = await createStudent();
    const outsider = await createStudent();
    const job = await createJob(business);
    const applicationId = await acceptedApplicationFor(business, student, job);

    const agreementRes = await request(app)
      .get(`/api/v1/agreements/application/${applicationId}`)
      .set(authHeader(student));
    const agreementId = agreementRes.body.data._id;

    const res = await request(app)
      .patch(`/api/v1/agreements/${agreementId}/sign`)
      .set(authHeader(outsider))
      .send({ fullName: "Outsider" });

    expect(res.status).toBe(403);
  });
});
