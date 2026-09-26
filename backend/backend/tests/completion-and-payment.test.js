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

/** Applies, accepts, and fully signs the agreement for one student on a job. */
const onboardStudent = async (business, student, job) => {
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

  return { applicationId, agreementId };
};

describe("Work completion — single-student job", () => {
  it("blocks a completion request before the agreement is fully signed", async () => {
    const business = await createBusiness();
    const student = await createStudent();
    const job = await createJob(business);

    const applyRes = await request(app).post(`/api/v1/applications/${job._id}`).set(authHeader(student));
    await request(app)
      .patch(`/api/v1/applications/${applyRes.body.data._id}/respond`)
      .set(authHeader(business))
      .send({ decision: "accepted" });

    const res = await request(app)
      .patch(`/api/v1/applications/${applyRes.body.data._id}/complete`)
      .set(authHeader(student));

    expect(res.status).toBe(400);
  });

  it("completes both the application and the job once the sole student's work is approved", async () => {
    const business = await createBusiness();
    const student = await createStudent();
    const job = await createJob(business, { requiredStudents: 1 });
    const { applicationId } = await onboardStudent(business, student, job);

    const completeRes = await request(app)
      .patch(`/api/v1/applications/${applicationId}/complete`)
      .set(authHeader(student));
    expect(completeRes.status).toBe(200);

    const approveRes = await request(app)
      .patch(`/api/v1/applications/${applicationId}/approve-completion`)
      .set(authHeader(business));
    expect(approveRes.status).toBe(200);
    expect(approveRes.body.data.status).toBe("completed");

    const updatedJob = await Job.findById(job._id);
    expect(updatedJob.status).toBe("completed");
  });
});

describe("Work completion — multi-student job", () => {
  it("does NOT complete the job until every accepted student is individually approved", async () => {
    const business = await createBusiness();
    const studentA = await createStudent();
    const studentB = await createStudent();
    const job = await createJob(business, { requiredStudents: 2 });

    const a = await onboardStudent(business, studentA, job);
    await onboardStudent(business, studentB, job); // student B stays in progress

    await request(app).patch(`/api/v1/applications/${a.applicationId}/complete`).set(authHeader(studentA));
    const approveA = await request(app)
      .patch(`/api/v1/applications/${a.applicationId}/approve-completion`)
      .set(authHeader(business));

    expect(approveA.status).toBe(200);
    expect(approveA.body.data.status).toBe("completed"); // this student's own assignment is done

    const jobAfterOneApproval = await Job.findById(job._id);
    // The job itself must remain active — one student finishing doesn't finish the job.
    expect(jobAfterOneApproval.status).toBe("active");
  });

  it("completes the job once ALL accepted students are approved", async () => {
    const business = await createBusiness();
    const studentA = await createStudent();
    const studentB = await createStudent();
    const job = await createJob(business, { requiredStudents: 2 });

    const a = await onboardStudent(business, studentA, job);
    const b = await onboardStudent(business, studentB, job);

    await request(app).patch(`/api/v1/applications/${a.applicationId}/complete`).set(authHeader(studentA));
    await request(app)
      .patch(`/api/v1/applications/${a.applicationId}/approve-completion`)
      .set(authHeader(business));

    let job1 = await Job.findById(job._id);
    expect(job1.status).toBe("active");

    await request(app).patch(`/api/v1/applications/${b.applicationId}/complete`).set(authHeader(studentB));
    await request(app)
      .patch(`/api/v1/applications/${b.applicationId}/approve-completion`)
      .set(authHeader(business));

    const job2 = await Job.findById(job._id);
    expect(job2.status).toBe("completed");
  });
});

describe("Payment confirmation", () => {
  const approveCompletedApplication = async (business, student, job) => {
    const { applicationId, agreementId } = await onboardStudent(business, student, job);
    await request(app).patch(`/api/v1/applications/${applicationId}/complete`).set(authHeader(student));
    await request(app)
      .patch(`/api/v1/applications/${applicationId}/approve-completion`)
      .set(authHeader(business));
    return { applicationId, agreementId };
  };

  it("cannot be initialized before the student's work is approved", async () => {
    const business = await createBusiness();
    const student = await createStudent();
    const job = await createJob(business);
    const { agreementId } = await onboardStudent(business, student, job); // not completed yet

    const res = await request(app).post(`/api/v1/payments/${agreementId}`).set(authHeader(business));
    expect(res.status).toBe(400);
  });

  it("lets both parties confirm exactly once each, and only fully confirms after both do", async () => {
    const business = await createBusiness();
    const student = await createStudent();
    const job = await createJob(business, { requiredStudents: 1 });
    const { agreementId } = await approveCompletedApplication(business, student, job);

    const initRes = await request(app).post(`/api/v1/payments/${agreementId}`).set(authHeader(business));
    expect(initRes.status).toBe(200);
    const paymentId = initRes.body.data._id;

    const businessConfirm = await request(app)
      .patch(`/api/v1/payments/${paymentId}/confirm`)
      .set(authHeader(business));
    expect(businessConfirm.status).toBe(200);
    expect(businessConfirm.body.data.isFullyConfirmed).toBe(false);

    // Business cannot confirm a second time.
    const businessConfirmAgain = await request(app)
      .patch(`/api/v1/payments/${paymentId}/confirm`)
      .set(authHeader(business));
    expect(businessConfirmAgain.status).toBe(400);

    const studentConfirm = await request(app)
      .patch(`/api/v1/payments/${paymentId}/confirm`)
      .set(authHeader(student));
    expect(studentConfirm.status).toBe(200);
    expect(studentConfirm.body.data.isFullyConfirmed).toBe(true);
  });

  it("does not complete the job or bump the job's completion counters", async () => {
    const business = await createBusiness();
    const student = await createStudent();
    const job = await createJob(business, { requiredStudents: 1 });
    const { agreementId } = await approveCompletedApplication(business, student, job);

    const jobBeforePayment = await Job.findById(job._id);
    expect(jobBeforePayment.status).toBe("completed"); // already completed by approval, not payment

    const initRes = await request(app).post(`/api/v1/payments/${agreementId}`).set(authHeader(business));
    const paymentId = initRes.body.data._id;
    await request(app).patch(`/api/v1/payments/${paymentId}/confirm`).set(authHeader(business));
    await request(app).patch(`/api/v1/payments/${paymentId}/confirm`).set(authHeader(student));

    const jobAfterPayment = await Job.findById(job._id);
    expect(jobAfterPayment.status).toBe("completed"); // unchanged by payment confirmation
  });
});
