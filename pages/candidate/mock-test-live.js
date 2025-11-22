// pages/candidate/mock-test-live.js
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/router";
import Layout from "../../components/Layout";
import ProctoringCamera from "../../components/proctoring/ProctoringCamera";

const CATEGORY_LABELS = {
  quant: "Quantitative Aptitude",
  logical: "Logical Reasoning",
  verbal: "Verbal / Communication",
  programming: "Programming / Coding Concepts",
};

// ------------------------ QUESTION BANK ------------------------
// (exactly the same questions you already have)
const ALL_QUESTIONS = [
  // ---------- QUANT (20) ----------
  {
    id: "q1",
    category: "quant",
    q: "The average of 10, 20, 30, 40, 50 is:",
    options: ["25", "30", "35", "40"],
    correct: 1,
  },
  {
    id: "q2",
    category: "quant",
    q: "Find the next number in the series: 3, 9, 27, 81, ?",
    options: ["162", "243", "324", "108"],
    correct: 1,
  },
  {
    id: "q3",
    category: "quant",
    q: "A shopkeeper bought an article for ₹800 and sold it for ₹1000. Profit percentage is:",
    options: ["20%", "25%", "30%", "18%"],
    correct: 1,
  },
  {
    id: "q4",
    category: "quant",
    q: "The simple interest on ₹5000 at 8% per annum for 2 years is:",
    options: ["₹400", "₹600", "₹700", "₹800"],
    correct: 1,
  },
  {
    id: "q5",
    category: "quant",
    q: "What is the value of 9C2?",
    options: ["18", "36", "45", "72"],
    correct: 2,
  },
  {
    id: "q6",
    category: "quant",
    q: "If the ratio of boys to girls in a class is 3:2 and there are 30 students, how many boys?",
    options: ["12", "15", "18", "20"],
    correct: 2,
  },
  {
    id: "q7",
    category: "quant",
    q: "A train 180 m long crosses a pole in 9 seconds. Its speed is:",
    options: ["60 km/h", "64 km/h", "72 km/h", "80 km/h"],
    correct: 2,
  },
  {
    id: "q8",
    category: "quant",
    q: "If x : y = 3 : 5, then (x + y) : (x - y) equals:",
    options: ["8 : 2", "4 : 1", "1 : 4", "2 : 1"],
    correct: 1,
  },
  {
    id: "q9",
    category: "quant",
    q: "A can do a piece of work in 10 days and B in 15 days. Together they take:",
    options: ["6 days", "8 days", "9 days", "12 days"],
    correct: 1,
  },
  {
    id: "q10",
    category: "quant",
    q: "If 40% of a number is 32, the number is:",
    options: ["60", "70", "80", "90"],
    correct: 2,
  },
  {
    id: "q11",
    category: "quant",
    q: "The compound interest on ₹2000 at 10% p.a. for 2 years (annually) is:",
    options: ["₹200", "₹210", "₹220", "₹240"],
    correct: 1,
  },
  {
    id: "q12",
    category: "quant",
    q: "The value of (3/4) of 120 is:",
    options: ["80", "85", "90", "96"],
    correct: 0,
  },
  {
    id: "q13",
    category: "quant",
    q: "If perimeter of a square is 48 cm, its area is:",
    options: ["64 cm²", "81 cm²", "100 cm²", "144 cm²"],
    correct: 0,
  },
  {
    id: "q14",
    category: "quant",
    q: "What percent is 30 of 120?",
    options: ["15%", "20%", "22.5%", "25%"],
    correct: 1,
  },
  {
    id: "q15",
    category: "quant",
    q: "A man spends 2/5 of his salary and saves the rest. If he saves ₹9000, his salary is:",
    options: ["₹12,000", "₹15,000", "₹18,000", "₹22,500"],
    correct: 2,
  },
  {
    id: "q16",
    category: "quant",
    q: "The LCM of 8, 12 and 20 is:",
    options: ["40", "60", "120", "80"],
    correct: 2,
  },
  {
    id: "q17",
    category: "quant",
    q: "If 3x - 5 = 16, then x equals:",
    options: ["6", "7", "8", "9"],
    correct: 1,
  },
  {
    id: "q18",
    category: "quant",
    q: "The number of prime numbers between 10 and 30 is:",
    options: ["4", "5", "6", "7"],
    correct: 2,
  },
  {
    id: "q19",
    category: "quant",
    q: "If a circle has radius 7 cm, its circumference is (π = 22/7):",
    options: ["22 cm", "44 cm", "66 cm", "88 cm"],
    correct: 1,
  },
  {
    id: "q20",
    category: "quant",
    q: "If the selling price is ₹480 and profit is 20%, the cost price is:",
    options: ["₹360", "₹380", "₹400", "₹420"],
    correct: 2,
  },

  // ---------- LOGICAL (20) ----------
  {
    id: "l1",
    category: "logical",
    q: "Which of the following is the odd one out: Lion, Tiger, Leopard, Wolf?",
    options: ["Lion", "Tiger", "Leopard", "Wolf"],
    correct: 3,
  },
  {
    id: "l2",
    category: "logical",
    q: "If MONDAY is coded as NQPFCA, then FRIDAY is coded as:",
    options: ["GTPKCB", "GTHKCB", "HTPKCB", "GTPJCB"],
    correct: 0,
  },
  {
    id: "l3",
    category: "logical",
    q: "Find the missing term: 4, 9, 16, 25, ?",
    options: ["30", "32", "36", "49"],
    correct: 2,
  },
  {
    id: "l4",
    category: "logical",
    q: "All roses are flowers. Some flowers fade quickly. Which is true?",
    options: [
      "All roses fade quickly",
      "Some roses may fade quickly",
      "No roses fade quickly",
      "Roses are not flowers",
    ],
    correct: 1,
  },
  {
    id: "l5",
    category: "logical",
    q: "In a certain code, CAT = 3120. If C=3, A=1, T=20, what is DOG?",
    options: ["4157", "478", "4157", "4747"],
    correct: 0,
  },
  {
    id: "l6",
    category: "logical",
    q: "A is taller than B, B is taller than C, C is taller than D. Who is shortest?",
    options: ["A", "B", "C", "D"],
    correct: 3,
  },
  {
    id: "l7",
    category: "logical",
    q: "If today is Wednesday, the day after 63 days will be:",
    options: ["Monday", "Tuesday", "Wednesday", "Thursday"],
    correct: 2,
  },
  {
    id: "l8",
    category: "logical",
    q: "Which pair is related as HAND : FINGER?",
    options: ["Tree : Leaf", "Book : Page", "Table : Chair", "Car : Driver"],
    correct: 1,
  },
  {
    id: "l9",
    category: "logical",
    q: "A man faces East, then turns 90° clockwise, then 180° anticlockwise. Now he faces:",
    options: ["East", "West", "North", "South"],
    correct: 1,
  },
  {
    id: "l10",
    category: "logical",
    q: "Two mothers and two daughters went to a shop and bought three ice creams. Each had one. How is it possible?",
    options: [
      "One person did not eat",
      "One was a grandmother, mother and daughter",
      "They shared ice cream",
      "Shopkeeper made mistake",
    ],
    correct: 1,
  },
  {
    id: "l11",
    category: "logical",
    q: "If all squares are rectangles and some rectangles are circles, which is true?",
    options: [
      "Some squares are circles",
      "No squares are circles",
      "All rectangles are squares",
      "Data insufficient",
    ],
    correct: 3,
  },
  {
    id: "l12",
    category: "logical",
    q: "Find the odd one out: 16, 25, 36, 49, 54",
    options: ["25", "36", "49", "54"],
    correct: 3,
  },
  {
    id: "l13",
    category: "logical",
    q: "RAM is brother of SHYAM. SHYAM is brother of MEENA. MEENA is sister of KIRAN. How is RAM related to KIRAN?",
    options: ["Brother", "Sister", "Cousin", "Cannot be determined"],
    correct: 0,
  },
  {
    id: "l14",
    category: "logical",
    q: "If BLUE is coded as 4925 and PINK as 7398, then LINK is coded as:",
    options: ["5398", "3598", "3958", "9358"],
    correct: 1,
  },
  {
    id: "l15",
    category: "logical",
    q: "Find the next term: AB, BC, CD, DE, ?",
    options: ["EF", "FG", "GH", "AD"],
    correct: 0,
  },
  {
    id: "l16",
    category: "logical",
    q: "Statement: All engineers are intelligent. Some students are engineers. Conclusion?",
    options: [
      "All students are intelligent",
      "Some students are intelligent",
      "No student is intelligent",
      "None follow",
    ],
    correct: 1,
  },
  {
    id: "l17",
    category: "logical",
    q: "Which number will replace the question mark? 5, 11, 23, 47, ?",
    options: ["95", "92", "94", "99"],
    correct: 0,
  },
  {
    id: "l18",
    category: "logical",
    q: "In a row of students, Ravi is 10th from the left and 15th from the right. Number of students is:",
    options: ["23", "24", "25", "26"],
    correct: 2,
  },
  {
    id: "l19",
    category: "logical",
    q: "Choose the related pair: Bird : Nest :: Bee : ?",
    options: ["Hive", "Cage", "Hole", "Tree"],
    correct: 0,
  },
  {
    id: "l20",
    category: "logical",
    q: "Find the missing number: 6, 11, 21, 41, ?",
    options: ["61", "71", "81", "101"],
    correct: 1,
  },

  // ---------- VERBAL (20) ----------
  {
    id: "v1",
    category: "verbal",
    q: "Choose the correct synonym of HAPPY.",
    options: ["Sad", "Joyful", "Angry", "Lazy"],
    correct: 1,
  },
  {
    id: "v2",
    category: "verbal",
    q: "Choose the correctly spelled word.",
    options: ["Definately", "Definetely", "Definitely", "Definatly"],
    correct: 2,
  },
  {
    id: "v3",
    category: "verbal",
    q: "Fill in the blank: She ____ going to the meeting.",
    options: ["is", "are", "were", "be"],
    correct: 0,
  },
  {
    id: "v4",
    category: "verbal",
    q: "Pick the sentence with correct grammar.",
    options: [
      "He do not like tea.",
      "He does not likes tea.",
      "He does not like tea.",
      "He not like tea.",
    ],
    correct: 2,
  },
  {
    id: "v5",
    category: "verbal",
    q: "Choose the antonym of STRONG.",
    options: ["Powerful", "Weak", "Tough", "Solid"],
    correct: 1,
  },
  {
    id: "v6",
    category: "verbal",
    q: "Fill in the blank: They have been friends ____ childhood.",
    options: ["since", "for", "from", "by"],
    correct: 0,
  },
  {
    id: "v7",
    category: "verbal",
    q: 'Which option best completes the sentence? "If I ____ more time, I would learn Spanish."',
    options: ["have", "had", "will have", "am having"],
    correct: 1,
  },
  {
    id: "v8",
    category: "verbal",
    q: 'Choose the correct indirect speech: He said, "I am tired."',
    options: [
      "He said he is tired.",
      "He said that he was tired.",
      "He says he was tired.",
      "He told he is tired.",
    ],
    correct: 1,
  },
  {
    id: "v9",
    category: "verbal",
    q: "Choose the word that best fits: Her presentation was clear and ___.",
    options: ["confusing", "boring", "persuasive", "silent"],
    correct: 2,
  },
  {
    id: "v10",
    category: "verbal",
    q: "Pick the correct preposition: He is good ____ mathematics.",
    options: ["at", "in", "on", "with"],
    correct: 0,
  },
  {
    id: "v11",
    category: "verbal",
    q: "Choose the correct sentence.",
    options: [
      "Me and him went to the market.",
      "He and I went to the market.",
      "He and me went to the market.",
      "I and him went to market.",
    ],
    correct: 1,
  },
  {
    id: "v12",
    category: "verbal",
    q: "The phrase 'break the ice' means:",
    options: [
      "To start a conversation",
      "To cool down",
      "To break something",
      "To become angry",
    ],
    correct: 0,
  },
  {
    id: "v13",
    category: "verbal",
    q: "Choose the best word: She spoke in a very ____ tone during the interview.",
    options: ["rude", "polite", "silent", "angry"],
    correct: 1,
  },
  {
    id: "v14",
    category: "verbal",
    q: "Fill in: The manager asked if we ____ finish the work by Monday.",
    options: ["can", "could", "may", "might"],
    correct: 1,
  },
  {
    id: "v15",
    category: "verbal",
    q: "Choose the correct option: Communication should be clear and ___.",
    options: ["confused", "effective", "late", "lengthy"],
    correct: 1,
  },
  {
    id: "v16",
    category: "verbal",
    q: "Pick the sentence with correct punctuation.",
    options: [
      "Where are you, going?",
      "Where are you going.",
      "Where are you going?",
      "where are you going?",
    ],
    correct: 2,
  },
  {
    id: "v17",
    category: "verbal",
    q: "The word 'candidate' means:",
    options: [
      "Person applying for a job",
      "Person giving a job",
      "Person observing an exam",
      "Person checking papers",
    ],
    correct: 0,
  },
  {
    id: "v18",
    category: "verbal",
    q: "Choose the antonym of HONEST.",
    options: ["Sincere", "Truthful", "Dishonest", "Humble"],
    correct: 2,
  },
  {
    id: "v19",
    category: "verbal",
    q: "Fill in the blank: He apologized ____ being late.",
    options: ["to", "for", "on", "with"],
    correct: 1,
  },
  {
    id: "v20",
    category: "verbal",
    q: "Choose the word that best fits: Her email was short and ___.",
    options: ["unclear", "rude", "to the point", "late"],
    correct: 2,
  },

  // ---------- PROGRAMMING (20) ----------
  {
    id: "p1",
    category: "programming",
    q: "Which of the following is a compiled language?",
    options: ["Python", "Java", "JavaScript", "HTML"],
    correct: 1,
  },
  {
    id: "p2",
    category: "programming",
    q: "Which data structure works on FIFO (First In, First Out)?",
    options: ["Stack", "Queue", "Array", "Tree"],
    correct: 1,
  },
  {
    id: "p3",
    category: "programming",
    q: "What is the time complexity of binary search on a sorted array?",
    options: ["O(n)", "O(log n)", "O(n^2)", "O(1)"],
    correct: 1,
  },
  {
    id: "p4",
    category: "programming",
    q: "Which of the following is NOT a programming paradigm?",
    options: ["Object-Oriented", "Functional", "Procedural", "Photographic"],
    correct: 3,
  },
  {
    id: "p5",
    category: "programming",
    q: "Which of these best describes a 'variable'?",
    options: [
      "A fixed constant value",
      "A named storage location in memory",
      "A hardware device",
      "An operating system",
    ],
    correct: 1,
  },
  {
    id: "p6",
    category: "programming",
    q: "In most languages, arrays are:",
    options: ["Homogeneous", "Heterogeneous", "Always dynamic", "Always linked"],
    correct: 0,
  },
  {
    id: "p7",
    category: "programming",
    q: "Which one is used to handle unexpected errors in code?",
    options: ["Loop", "Condition", "Exception handling", "Comment"],
    correct: 2,
  },
  {
    id: "p8",
    category: "programming",
    q: "Which of these is NOT a valid HTTP method?",
    options: ["GET", "POST", "PULL", "DELETE"],
    correct: 2,
  },
  {
    id: "p9",
    category: "programming",
    q: "Which of these data structures is most suitable for implementing recursion?",
    options: ["Queue", "Stack", "HashMap", "Linked List"],
    correct: 1,
  },
  {
    id: "p10",
    category: "programming",
    q: "What does 'API' stand for?",
    options: [
      "Application Programming Interface",
      "Advanced Program Instruction",
      "Applied Program Internet",
      "Automated Process Integration",
    ],
    correct: 0,
  },
  {
    id: "p11",
    category: "programming",
    q: "Which sorting algorithm has average time complexity O(n log n)?",
    options: ["Bubble sort", "Quick sort", "Selection sort", "Insertion sort"],
    correct: 1,
  },
  {
    id: "p12",
    category: "programming",
    q: "In databases, SQL is used for:",
    options: [
      "Styling web pages",
      "Querying and managing data",
      "Rendering graphics",
      "Machine learning",
    ],
    correct: 1,
  },
  {
    id: "p13",
    category: "programming",
    q: "Which of these is a version control system?",
    options: ["Git", "JDK", "CPU", "CSS"],
    correct: 0,
  },
  {
    id: "p14",
    category: "programming",
    q: "What is the main purpose of an IDE?",
    options: [
      "To compile only Java code",
      "To provide an integrated environment to write, run and debug code",
      "To host websites",
      "To manage operating systems",
    ],
    correct: 1,
  },
  {
    id: "p15",
    category: "programming",
    q: "Which of the following is a NoSQL database?",
    options: ["MySQL", "PostgreSQL", "MongoDB", "Oracle"],
    correct: 2,
  },
  {
    id: "p16",
    category: "programming",
    q: "Which of these is a correct description of Big-O notation?",
    options: [
      "Measures exact runtime in seconds",
      "Describes upper bound of algorithm growth rate",
      "Counts number of lines of code",
      "Measures memory in bytes only",
    ],
    correct: 1,
  },
  {
    id: "p17",
    category: "programming",
    q: "What is the main advantage of using functions or methods?",
    options: [
      "They slow down code",
      "They avoid reusability",
      "They help reuse and organize code",
      "They remove all bugs",
    ],
    correct: 2,
  },
  {
    id: "p18",
    category: "programming",
    q: "Which of these is commonly used to represent 'true' or 'false'?",
    options: ["Integer", "Boolean", "String", "Array"],
    correct: 1,
  },
  {
    id: "p19",
    category: "programming",
    q: "Which of the following is used to style a web page?",
    options: ["HTML", "CSS", "SQL", "Python"],
    correct: 1,
  },
  {
    id: "p20",
    category: "programming",
    q: "Which of these best describes an algorithm?",
    options: [
      "A programming language",
      "A set of step-by-step instructions to solve a problem",
      "Hardware component",
      "A software license",
    ],
    correct: 1,
  },
];

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function buildRandomTest() {
  const quant = ALL_QUESTIONS.filter((q) => q.category === "quant");
  const logical = ALL_QUESTIONS.filter((q) => q.category === "logical");
  const verbal = ALL_QUESTIONS.filter((q) => q.category === "verbal");
  const programming = ALL_QUESTIONS.filter(
    (q) => q.category === "programming"
  );

  const pick = (arr, count) => shuffle(arr).slice(0, count);

  const selected = [
    ...pick(quant, 15),
    ...pick(logical, 15),
    ...pick(verbal, 15),
    ...pick(programming, 15),
  ];
  return shuffle(selected);
}

const STATUS = {
  UNVISITED: "unvisited",
  VISITED: "visited",
  ATTEMPTED: "attempted",
  SKIPPED: "skipped",
};

// 🔒 unified with Round-2 aptitude
const MAX_VIOLATIONS = 5;

function MockTestLiveInner() {
  const router = useRouter();
  const hasSubmittedRef = useRef(false);

  const [questions, setQuestions] = useState([]);
  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState({});
  const [status, setStatus] = useState([]);
  const [secondsLeft, setSecondsLeft] = useState(3600);
  const [violations, setViolations] = useState([]);
  const [violationCount, setViolationCount] = useState(0);

  // Hide chatbot if present
  useEffect(() => {
    let prevDisplay = "";
    let chatEl = null;
    try {
      chatEl = document.getElementById("chatbot-root");
      if (chatEl) {
        prevDisplay = chatEl.style.display;
        chatEl.style.display = "none";
      }
    } catch {}
    return () => {
      if (chatEl) chatEl.style.display = prevDisplay;
    };
  }, []);

  // Load / create question set + restore state
  useEffect(() => {
    try {
      const storedQs = JSON.parse(
        localStorage.getItem("mockTest.questions") || "null"
      );
      const storedAns = JSON.parse(
        localStorage.getItem("mockTest.answers") || "{}"
      );
      const storedStatus = JSON.parse(
        localStorage.getItem("mockTest.status") || "[]"
      );
      const storedTime = parseInt(
        localStorage.getItem("mockTest.timeLeft") || "3600",
        10
      );
      const storedViolations = JSON.parse(
        localStorage.getItem("mockTest.violations") || "[]"
      );

      let qs = storedQs;
      if (!Array.isArray(qs) || qs.length === 0) {
        qs = buildRandomTest();
        localStorage.setItem("mockTest.questions", JSON.stringify(qs));
      }

      setQuestions(qs);
      setAnswers(storedAns || {});
      if (Array.isArray(storedStatus) && storedStatus.length === qs.length) {
        setStatus(storedStatus);
      } else {
        setStatus(Array(qs.length).fill(STATUS.UNVISITED));
      }

      setSecondsLeft(Number.isNaN(storedTime) ? 3600 : storedTime);
      if (Array.isArray(storedViolations)) {
        setViolations(storedViolations);
        setViolationCount(storedViolations.length);
      }
    } catch {
      const qs = buildRandomTest();
      setQuestions(qs);
      setStatus(Array(qs.length).fill(STATUS.UNVISITED));
    }
  }, []);

  // Countdown timer
  useEffect(() => {
    if (!questions.length) return;

    const t = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(t);
          if (!hasSubmittedRef.current) handleSubmit(true, "TIME_UP");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [questions.length]);

  // Persist time
  useEffect(() => {
    try {
      localStorage.setItem("mockTest.timeLeft", String(secondsLeft));
    } catch {}
  }, [secondsLeft]);

  // unified violation logger
  const registerViolation = (source, reason) => {
    setViolations((prev) => {
      const updated = [...prev, { ts: Date.now(), source, reason }];
      try {
        localStorage.setItem(
          "mockTest.violations",
          JSON.stringify(updated)
        );
      } catch {}
      return updated;
    });
    setViolationCount((prev) => prev + 1);
  };

  // Anti-cheat: tab / window focus
  useEffect(() => {
    const handleVisibility = () => {
      if (document.hidden) {
        registerViolation("tab", "Tab hidden / switched away");
      }
    };
    const handleBlur = () => {
      registerViolation("tab", "Window blur (possible tab switch)");
    };

    window.addEventListener("blur", handleBlur);
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      window.removeEventListener("blur", handleBlur);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-submit on too many violations
  useEffect(() => {
    if (violationCount >= MAX_VIOLATIONS && !hasSubmittedRef.current) {
      handleSubmit(true, "VIOLATION_LIMIT");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [violationCount]);

  const question = useMemo(
    () => (questions.length ? questions[idx] : null),
    [questions, idx]
  );

  const mmss = useMemo(() => {
    const m = Math.floor(secondsLeft / 60)
      .toString()
      .padStart(2, "0");
    const s = (secondsLeft % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  }, [secondsLeft]);

  const updateStatus = (qIdx, newState) => {
    setStatus((prev) => {
      const copy = [...prev];
      if (copy[qIdx] !== STATUS.ATTEMPTED || newState === STATUS.ATTEMPTED) {
        copy[qIdx] = newState;
      }
      try {
        localStorage.setItem("mockTest.status", JSON.stringify(copy));
      } catch {}
      return copy;
    });
  };

  const selectOption = (optIndex) => {
    if (!question) return;
    const newAns = { ...answers, [question.id]: optIndex };
    setAnswers(newAns);
    try {
      localStorage.setItem("mockTest.answers", JSON.stringify(newAns));
    } catch {}
    updateStatus(idx, STATUS.ATTEMPTED);
  };

  const goNext = () => {
    if (!questions.length) return;
    const next = Math.min(idx + 1, questions.length - 1);
    if (next !== idx) {
      updateStatus(next, STATUS.VISITED);
      setIdx(next);
    }
  };

  const goPrev = () => {
    const prev = Math.max(idx - 1, 0);
    if (prev !== idx) {
      updateStatus(prev, STATUS.VISITED);
      setIdx(prev);
    }
  };

  const skip = () => {
    updateStatus(idx, STATUS.SKIPPED);
    goNext();
  };

  const handleSubmit = (auto = false, reason = null) => {
    if (!questions.length) return;
    if (hasSubmittedRef.current) return;
    hasSubmittedRef.current = true;

    let correct = 0;
    const byCategory = {
      quant: { total: 0, correct: 0 },
      logical: { total: 0, correct: 0 },
      verbal: { total: 0, correct: 0 },
      programming: { total: 0, correct: 0 },
    };

    questions.forEach((q) => {
      if (!byCategory[q.category]) {
        byCategory[q.category] = { total: 0, correct: 0 };
      }
      byCategory[q.category].total += 1;
      const ans = answers[q.id];
      if (typeof ans === "number" && q.correct === ans) {
        correct += 1;
        byCategory[q.category].correct += 1;
      }
    });

    const total = questions.length;
    const pct = Math.round((correct / total) * 100);
    const attempted = Object.keys(answers).length;
    const skipped = status.filter((s) => s === STATUS.SKIPPED).length;

    try {
      localStorage.setItem("mockTest.score", String(pct));
      localStorage.setItem(
        "mockTest.summary",
        JSON.stringify({
          total,
          correct,
          attempted,
          skipped,
          autoSubmitted: auto,
          autoReason: reason,
          byCategory,
          violations,
        })
      );
      localStorage.removeItem("mockTest.timeLeft");
    } catch {}

    router.push("/candidate/mock-test-result");
  };

  // mark first question visited
  useEffect(() => {
    if (
      questions.length &&
      status.length === questions.length &&
      status[0] === STATUS.UNVISITED
    ) {
      updateStatus(0, STATUS.VISITED);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [questions.length, status.length]);

  if (!question) {
    return (
      <Layout role="CANDIDATE" active="mock-test">
        <div className="bg-white rounded-xl border border-gray-200 p-8">
          <p className="text-lg text-gray-600 font-medium">
            Loading questions…
          </p>
        </div>
      </Layout>
    );
  }

  const selected = answers[question.id];

  return (
    <div className="space-y-6 pb-8">
      {/* Exam Overview & Proctoring Status */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">
            Mock Proctored Exam
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            Sections: Quantitative Aptitude, Logical Reasoning, Verbal /
            Communication, Programming / Coding Concepts
          </p>
          <p className="text-sm text-gray-600">
            Total Questions:{" "}
            <span className="font-semibold">{questions.length}</span> | Time:{" "}
            <span className="font-semibold">60 minutes</span>
          </p>
        </div>

        <div className="flex flex-col md:flex-row items-end md:items-center gap-4">
          <div className="text-right">
            <div
              className={`text-2xl font-bold font-mono ${
                secondsLeft < 60 ? "text-red-600" : "text-indigo-600"
              }`}
            >
              {mmss}
            </div>
            <div className="text-xs text-gray-500">
              Violations:{" "}
              <span
                className={
                  violationCount > 0
                    ? "text-red-600 font-semibold"
                    : "font-semibold"
                }
              >
                {violationCount}/{MAX_VIOLATIONS}
              </span>
            </div>
          </div>

          <ProctoringCamera
            maxViolations={MAX_VIOLATIONS}
            onViolation={({ reason, type }) =>
              registerViolation(type || "camera", reason)
            }
          />
        </div>
      </div>

      {violationCount > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
          <p className="text-sm text-yellow-900">
            ⚠️ <strong>Proctoring Notice:</strong> We detected{" "}
            <span className="font-semibold">{violationCount}</span> attention /
            tab-switch violation{violationCount > 1 ? "s" : ""}. Repeated
            violations may lead to auto-submission of your test.
          </p>
        </div>
      )}

      {/* Question */}
      <div className="bg-white rounded-xl border border-gray-200 p-8">
        <div className="flex items-start justify-between gap-8">
          <div>
            <p className="text-sm font-semibold text-indigo-600 uppercase tracking-wide">
              {CATEGORY_LABELS[question.category] || "Question"}
            </p>
            <h2 className="text-3xl font-bold text-gray-900 mt-1">
              Question {idx + 1} of {questions.length}
            </h2>
            <p className="text-base text-gray-600 mt-3">{question.q}</p>
          </div>
        </div>
      </div>

      {/* Options */}
      <div className="bg-white rounded-xl border border-gray-200 p-8">
        <div className="space-y-3 mb-8">
          {question.options.map((opt, i) => {
            const active = i === selected;
            return (
              <button
                key={i}
                onClick={() => selectOption(i)}
                className={`w-full text-left px-6 py-4 rounded-lg border-2 transition-all font-semibold text-lg ${
                  active
                    ? "bg-indigo-50 border-indigo-400 text-indigo-900"
                    : "bg-gray-50 border-gray-200 text-gray-900 hover:border-indigo-200"
                }`}
              >
                <span className="inline-block w-8 h-8 rounded-full mr-4 text-center font-bold text-base">
                  {String.fromCharCode(65 + i)}
                </span>
                {opt}
              </button>
            );
          })}
        </div>

        {/* Controls */}
        <div className="flex gap-4 justify-between">
          <button
            onClick={goPrev}
            disabled={idx === 0}
            className="px-6 py-3 rounded-lg font-bold border-2 border-gray-300 text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            ← Previous
          </button>

          <div className="flex gap-3">
            <button
              onClick={skip}
              className="px-6 py-3 rounded-lg font-bold border-2 border-orange-300 text-orange-700 hover:bg-orange-50 transition-all"
            >
              ⊘ Skip
            </button>
            {idx < questions.length - 1 ? (
              <button
                onClick={goNext}
                className="px-6 py-3 rounded-lg font-bold text-white bg-gradient-to-r from-indigo-600 to-indigo-700 hover:shadow-lg transition-all"
              >
                Next →
              </button>
            ) : (
              <button
                onClick={() => handleSubmit(false, "MANUAL_SUBMIT")}
                className="px-6 py-3 rounded-lg font-bold text-white bg-gradient-to-r from-emerald-600 to-emerald-700 hover:shadow-lg transition-all"
              >
                ✓ Submit
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Navigator */}
      <div className="bg-white rounded-xl border border-gray-200 p-8">
        <h3 className="text-lg font-bold text-gray-900 mb-4">
          Question Navigator
        </h3>
        <div className="flex flex-wrap gap-2 mb-4">
          {questions.map((q, i) => {
            const s = status[i] || STATUS.UNVISITED;
            let bgColor = "bg-gray-300";
            if (s === STATUS.VISITED) bgColor = "bg-blue-500";
            if (s === STATUS.ATTEMPTED) bgColor = "bg-emerald-500";
            if (s === STATUS.SKIPPED) bgColor = "bg-orange-500";
            const active =
              i === idx ? "ring-2 ring-offset-2 ring-indigo-500" : "";
            return (
              <button
                key={q.id}
                onClick={() => {
                  updateStatus(i, STATUS.VISITED);
                  setIdx(i);
                }}
                className={`w-10 h-10 rounded-lg font-bold text-white transition-all ${bgColor} ${active}`}
                title={`${CATEGORY_LABELS[q.category]} - ${s}`}
              >
                {i + 1}
              </button>
            );
          })}
        </div>
        <div className="flex flex-wrap gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-gray-300" />
            <span className="text-gray-600">Not Visited</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-blue-500" />
            <span className="text-gray-600">Visited</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-emerald-500" />
            <span className="text-gray-600">Attempted</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-orange-500" />
            <span className="text-gray-600">Skipped</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function MockTestLive(pageProps) {
  return (
    <Layout role="CANDIDATE" active="mock-test">
      <MockTestLiveInner {...pageProps} />
    </Layout>
  );
}
