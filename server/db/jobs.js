// server/db/jobs.js
const { db } = require("../lib/firebaseAdmin");
const { Job } = require("../models/job");
const { Application } = require("../models/application");

function toJsDate(value) {
  if (!value) return null;
  if (value instanceof Date) return value;
  const sec = value.seconds ?? value._seconds;
  if (typeof sec === "number") return new Date(sec * 1000);
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

function fromJobDoc(doc) {
  const data = doc.data();
  return new Job({
    id: doc.id,
    ...data,
    createdAt: toJsDate(data.createdAt),
    updatedAt: toJsDate(data.updatedAt),
    deadline: toJsDate(data.deadline),
  });
}

function fromAppDoc(doc) {
  const data = doc.data();
  return new Application({
    id: doc.id,
    ...data,
    createdAt: toJsDate(data.createdAt),
    updatedAt: toJsDate(data.updatedAt),
  });
}

async function createJob(recruiterId, payload) {
  const now = new Date();
  const deadline = payload.deadline ? new Date(payload.deadline) : null;

  const doc = {
    recruiterId,
    title: payload.title,
    company: payload.company,
    role: payload.role || "",
    salary: payload.salary || "",
    location: payload.location || "",
    salaryRange: payload.salaryRange || "",
    experience: payload.experience || "",
    deadline,
    description: payload.description || "",
    jdFilePath: payload.jdFilePath || "",
    requiredSkills: Array.isArray(payload.requiredSkills)
      ? payload.requiredSkills
      : String(payload.requiredSkills || "")
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
    openings: Number(payload.openings) || 1,
    status: payload.status || "OPEN",
    createdAt: now,
    updatedAt: now,
  };

  const ref = await db.collection("jobs").add(doc);
  const snap = await ref.get();
  return fromJobDoc(snap);
}

async function getOpenJobs() {
  const snap = await db
    .collection("jobs")
    .where("status", "==", "OPEN")
    .orderBy("createdAt", "desc")
    .get();
  return snap.docs.map(fromJobDoc);
}

async function getRecruiterJobs(recruiterId) {
  const snap = await db
    .collection("jobs")
    .where("recruiterId", "==", recruiterId)
    .orderBy("createdAt", "desc")
    .get();
  return snap.docs.map(fromJobDoc);
}

async function getJobById(id) {
  const doc = await db.collection("jobs").doc(id).get();
  if (!doc.exists) return null;
  return fromJobDoc(doc);
}

async function updateJob(id, updates) {
  const ref = db.collection("jobs").doc(id);
  const snap = await ref.get();
  if (!snap.exists) return null;

  const current = snap.data();
  const merged = {
    ...current,
    ...updates,
    updatedAt: new Date(),
  };

  if (updates.deadline) {
    merged.deadline = new Date(updates.deadline);
  }

  await ref.set(merged, { merge: true });
  const after = await ref.get();
  return fromJobDoc(after);
}

async function deleteJob(id) {
  await db.collection("jobs").doc(id).delete();
}

async function applyToJob(jobId, studentId) {
  const now = new Date();
  const appsRef = db.collection("applications");
  const existing = await appsRef
    .where("jobId", "==", jobId)
    .where("studentId", "==", studentId)
    .limit(1)
    .get();

  let ref;
  if (existing.empty) {
    ref = appsRef.doc();
    await ref.set({
      jobId,
      studentId,
      status: "APPLIED",
      createdAt: now,
      updatedAt: now,
    });
  } else {
    ref = existing.docs[0].ref;
    await ref.set(
      {
        status: "APPLIED",
        updatedAt: now,
      },
      { merge: true }
    );
  }

  const snap = await ref.get();
  return fromAppDoc(snap);
}

async function getCandidateApplications(studentId) {
  const appsSnap = await db
    .collection("applications")
    .where("studentId", "==", studentId)
    .orderBy("createdAt", "desc")
    .get();
  return appsSnap.docs.map(fromAppDoc);
}

async function getJobApplicants(jobId) {
  const appsSnap = await db
    .collection("applications")
    .where("jobId", "==", jobId)
    .orderBy("createdAt", "desc")
    .get();
  return appsSnap.docs.map(fromAppDoc);
}

module.exports = {
  createJob,
  getOpenJobs,
  getRecruiterJobs,
  getJobById,
  updateJob,
  deleteJob,
  applyToJob,
  getCandidateApplications,
  getJobApplicants,
};
