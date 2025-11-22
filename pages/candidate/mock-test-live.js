// pages/candidate/mock-test-live.js (Updated version)
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/router";
import Layout from "../../components/Layout";

const QUESTION_BANK = [
  {
    q: "If the average of five numbers is 24, and the sum of four numbers is 92, what is the fifth number?",
    options: ["20", "28", "24", "26"],
    correct: 2,
  },
  {
    q: "Find the next number in the series: 2, 6, 12, 20, 30, ?",
    options: ["40", "42", "44", "46"],
    correct: 1,
  },
  {
    q: "If x : y = 3 : 5, then (x + y) : (x - y) equals?",
    options: ["8 : 2", "1 : 4", "4 : 1", "Cannot be determined"],
    correct: 2,
  },
  {
    q: "A train running at 60 km/h crosses a pole in 30 seconds. The length of the train is:",
    options: ["250 m", "300 m", "450 m", "500 m"],
    correct: 1,
  },
  {
    q: "Which of the following is always true for prime numbers greater than 3?",
    options: ["They are even", "They are of the form 6k±1", "They are multiples of 3", "They are composite"],
    correct: 1,
  },
  {
    q: "The ratio 45:60 reduces to:",
    options: ["3:4", "2:3", "4:3", "5:6"],
    correct: 0,
  },
  {
    q: "If the simple interest on ₹5000 at 8% for 2 years is:",
    options: ["₹600", "₹700", "₹800", "₹900"],
    correct: 2,
  },
  {
    q: "What is the value of 9C2 ?",
    options: ["36", "72", "45", "90"],
    correct: 2,
  },
  {
    q: "If A completes a work in 10 days and B in 15 days, together they take:",
    options: ["6 days", "25 days", "8 days", "12 days"],
    correct: 2,
  },
  {
    q: "The average of 10, 20, 30, 40, 50 is:",
    options: ["25", "30", "35", "40"],
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

const STATUS = {
  UNVISITED: "unvisited",
  VISITED: "visited",
  ATTEMPTED: "attempted",
  SKIPPED: "skipped",
};

export default function MockTestLive() {
  const router = useRouter();
  const videoRef = useRef(null);
  const [streamErr, setStreamErr] = useState("");
  const [order, setOrder] = useState([]);
  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState({});
  const [status, setStatus] = useState([]);
  const [secondsLeft, setSecondsLeft] = useState(600);

  useEffect(() => {
    let savedOrder = null;
    try {
      savedOrder = JSON.parse(localStorage.getItem("mockTest.order") || "null");
    } catch {}
    if (!savedOrder) {
      const idxs = Array.from({ length: QUESTION_BANK.length }, (_, i) => i);
      const shuffled = shuffle(idxs);
      savedOrder = shuffled;
      localStorage.setItem("mockTest.order", JSON.stringify(shuffled));
    }
    setOrder(savedOrder);
    setStatus(savedOrder.map(() => STATUS.UNVISITED));
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
      } catch (e) {
        setStreamErr("Camera unavailable. You can continue the test.");
      }
    })();
    return () => {
      const v = videoRef.current;
      const s = v && v.srcObject;
      if (s && s.getTracks) s.getTracks().forEach((t) => t.stop());
    };
  }, []);

  useEffect(() => {
    const t = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          clearInterval(t);
          handleSubmit(true);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, []);

  const question = useMemo(() => {
    if (!order.length) return null;
    const bankIndex = order[idx];
    return { ...QUESTION_BANK[bankIndex], bankIndex };
  }, [order, idx]);

  const mmss = useMemo(() => {
    const m = Math.floor(secondsLeft / 60)
      .toString()
      .padStart(2, "0");
    const s = (secondsLeft % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  }, [secondsLeft]);

  const selectOption = (optIndex) => {
    const newAns = { ...answers, [question.bankIndex]: optIndex };
    setAnswers(newAns);
    try {
      localStorage.setItem("mockTest.answers", JSON.stringify(newAns));
    } catch {}
    updateStatus(idx, STATUS.ATTEMPTED);
  };

  const updateStatus = (qIdx, newState) => {
    setStatus((prev) => {
      const copy = [...prev];
      if (copy[qIdx] !== STATUS.ATTEMPTED) {
        copy[qIdx] = newState;
      }
      try {
        localStorage.setItem("mockTest.status", JSON.stringify(copy));
      } catch {}
      return copy;
    });
  };

  const goNext = () => {
    const next = Math.min(idx + 1, order.length - 1);
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

  const handleSubmit = (auto = false) => {
    let correct = 0;
    order.forEach((bankIndex) => {
      const ans = answers[bankIndex];
      if (typeof ans === "number" && QUESTION_BANK[bankIndex].correct === ans) correct += 1;
    });
    const total = order.length;
    const pct = Math.round((correct / total) * 100);

    const visited = status.filter((s) => s !== STATUS.UNVISITED).length;
    const attempted = Object.keys(answers).length;
    const skipped = status.filter((s) => s === STATUS.SKIPPED).length;

    try {
      localStorage.setItem("mockTest.score", String(pct));
      localStorage.setItem(
        "mockTest.summary",
        JSON.stringify({ total, correct, visited, attempted, skipped, autoSubmitted: auto })
      );
    } catch {}
    router.push("/candidate/mock-test-result");
  };

  useEffect(() => {
    if (order.length) {
      updateStatus(0, STATUS.VISITED);
    }
  }, [order.length]);

  if (!question) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-8">
        <p className="text-lg text-gray-600 font-medium">Loading questions…</p>
      </div>
    );
  }

  const selected = answers[question.bankIndex];

  return (
    <div className="space-y-6 pb-8">
      {/* Header with Timer & Video */}
      <div className="bg-white rounded-xl border border-gray-200 p-8">
        <div className="flex items-center justify-between gap-8">
          <div>
            <h2 className="text-3xl font-bold text-gray-900">
              Question {idx + 1} of {order.length}
            </h2>
            <p className="text-base text-gray-600 mt-2">{question.q}</p>
          </div>

          <div className="flex flex-col items-center gap-3 flex-shrink-0">
            <div className="rounded-lg overflow-hidden bg-black w-32 h-24">
              <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-cover" />
            </div>
            <div className={`text-3xl font-bold font-mono ${secondsLeft < 60 ? "text-red-600" : "text-indigo-600"}`}>
              {mmss}
            </div>
            {streamErr && <div className="text-xs text-yellow-600 text-center">{streamErr}</div>}
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
            {idx < order.length - 1 ? (
              <button
                onClick={goNext}
                className="px-6 py-3 rounded-lg font-bold text-white bg-gradient-to-r from-indigo-600 to-indigo-700 hover:shadow-lg transition-all"
              >
                Next →
              </button>
            ) : (
              <button
                onClick={() => handleSubmit(false)}
                className="px-6 py-3 rounded-lg font-bold text-white bg-gradient-to-r from-emerald-600 to-emerald-700 hover:shadow-lg transition-all"
              >
                ✓ Submit
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Question Navigator */}
      <div className="bg-white rounded-xl border border-gray-200 p-8">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Question Navigator</h3>
        <div className="flex flex-wrap gap-2 mb-4">
          {order.map((_, i) => {
            const s = status[i] || STATUS.UNVISITED;
            let bgColor = "bg-gray-300";
            if (s === STATUS.VISITED) bgColor = "bg-blue-500";
            if (s === STATUS.ATTEMPTED) bgColor = "bg-emerald-500";
            if (s === STATUS.SKIPPED) bgColor = "bg-orange-500";
            const active = i === idx ? "ring-2 ring-offset-2 ring-indigo-500" : "";
            return (
              <button
                key={i}
                onClick={() => {
                  updateStatus(i, STATUS.VISITED);
                  setIdx(i);
                }}
                className={`w-10 h-10 rounded-lg font-bold text-white transition-all ${bgColor} ${active}`}
                title={s}
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

MockTestLive.getLayout = function getLayout(page) {
  return (
    <Layout role="CANDIDATE" active="mock-test">
      {page}
    </Layout>
  );
};