// pages/api/mock-test/questionBank.js

// Simple in-memory store for attempts and results
const attemptStore = {
  // [attemptId]: { userId, questions, createdAt, submittedAt, scores, violations }
};

function createQuestion(idBase, category, count) {
  const questions = [];
  for (let i = 1; i <= count; i++) {
    questions.push({
      id: `${category}-${idBase + i}`,
      category,
      question: `${category.toUpperCase()} Question ${i}`,
      options: [
        "Option A",
        "Option B",
        "Option C",
        "Option D",
      ],
      correctIndex: i % 4, // just to have some answer pattern
    });
  }
  return questions;
}

// 30+ questions per category
const quantQuestions = createQuestion(0, "quant", 30);
const logicalQuestions = createQuestion(0, "logical", 30);
const verbalQuestions = createQuestion(0, "verbal", 30);
const programmingQuestions = createQuestion(0, "programming", 30);

function shuffle(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// pick N random questions from a category
function pickRandomQuestions(categoryArray, count) {
  return shuffle(categoryArray).slice(0, count);
}

// Very basic "auth": in real app pull from session / JWT
function getUserId(req) {
  // Try header first
  if (req.headers["x-user-id"]) return String(req.headers["x-user-id"]);
  // Fallback demo user
  return "demo-user";
}

function createAttempt(userId) {
  const quant = pickRandomQuestions(quantQuestions, 15);
  const logical = pickRandomQuestions(logicalQuestions, 15);
  const verbal = pickRandomQuestions(verbalQuestions, 15);
  const programming = pickRandomQuestions(programmingQuestions, 15);

  const questions = [
    ...quant,
    ...logical,
    ...verbal,
    ...programming,
  ].map((q, index) => ({
    ...q,
    number: index + 1,
  }));

  const attemptId = `${userId}-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 8)}`;

  attemptStore[attemptId] = {
    userId,
    questions,
    createdAt: Date.now(),
    submittedAt: null,
    scores: null,
    violations: {
      attention: 0,
      tabSwitch: 0,
    },
  };

  return { attemptId, questions };
}

function scoreAttempt(attempt, answers) {
  let totalCorrect = 0;
  let totalQuestions = attempt.questions.length;

  const sectionScores = {
    quant: { correct: 0, total: 0 },
    logical: { correct: 0, total: 0 },
    verbal: { correct: 0, total: 0 },
    programming: { correct: 0, total: 0 },
  };

  const answerMap = {};
  answers.forEach((ans) => {
    answerMap[ans.questionId] = ans.selectedIndex;
  });

  attempt.questions.forEach((q) => {
    const userIdx = answerMap[q.id];
    const isCorrect = userIdx === q.correctIndex;

    if (!sectionScores[q.category]) {
      sectionScores[q.category] = { correct: 0, total: 0 };
    }

    sectionScores[q.category].total += 1;
    if (isCorrect) {
      sectionScores[q.category].correct += 1;
      totalCorrect += 1;
    }
  });

  const percent = Math.round((totalCorrect / totalQuestions) * 100);

  return {
    totalCorrect,
    totalQuestions,
    percent,
    sectionScores,
  };
}

function recordViolations(attemptId, data) {
  const attempt = attemptStore[attemptId];
  if (!attempt) return;

  const { attentionIncrement = 0, tabSwitchIncrement = 0 } = data;
  attempt.violations.attention += attentionIncrement;
  attempt.violations.tabSwitch += tabSwitchIncrement;
}

module.exports = {
  attemptStore,
  createAttempt,
  getUserId,
  scoreAttempt,
  recordViolations,
};
