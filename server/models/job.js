// server/models/job.js

/**
 * Plain JS description of a Job document.
 * This is just for type/reference – no Firestore logic here.
 */

class Job {
  constructor({
    id = null,
    recruiterId,
    title,
    company,
    role = "",
    salary = "",
    location = "",
    salaryRange = "",
    experience = "",
    deadline = null,
    description = "",
    jdFilePath = "",
    requiredSkills = [],
    openings = 1,
    status = "OPEN",
    createdAt = null,
    updatedAt = null,
  }) {
    this.id = id;
    this.recruiterId = recruiterId;
    this.title = title;
    this.company = company;
    this.role = role;
    this.salary = salary;
    this.location = location;
    this.salaryRange = salaryRange;
    this.experience = experience;
    this.deadline = deadline;
    this.description = description;
    this.jdFilePath = jdFilePath;
    this.requiredSkills = requiredSkills;
    this.openings = openings;
    this.status = status;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }
}

module.exports = { Job };
