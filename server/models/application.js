// server/models/application.js

class Application {
  constructor({
    id = null,
    jobId,
    studentId,
    status = "APPLIED",
    createdAt = null,
    updatedAt = null,
  }) {
    this.id = id;
    this.jobId = jobId;
    this.studentId = studentId;
    this.status = status;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }
}

module.exports = { Application };
