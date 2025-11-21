import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/router";
import Layout from "../../components/Layout";

// Simple bank (front-end only). We'll shuffle once per session.
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
  const [secondsLeft, setSecondsLeft] = useState(600); // 10 minutes

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
        setStreamErr(
          "Camera preview unavailable. You can continue the test, but enable permissions in browser for best experience."
        );
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [order.length]);

  if (!question) {
    return (
      <div className="card">
        <div>Loading questions…</div>
      </div>
    );
  }

  const selected = answers[question.bankIndex];

  return (
    <div className="space-y-6">
      {/* Top controls */}
      <div className="card flex flex-col items-center gap-3">
        <div className="flex items-center gap-4">
          <div className="rounded-lg overflow-hidden bg-black/30">
            <video ref={videoRef} autoPlay muted playsInline className="w-40 h-24 object-cover" />
          </div>
          <div className="text-sm">
            <div className="text-center text-2xl font-semibold">{mmss}</div>
            <div className="opacity-70 text-center">Time Remaining</div>
          </div>
        </div>
        {streamErr && <div className="text-xs text-yellow-300">{streamErr}</div>}
      </div>

      {/* Question panel */}
      <div className="card">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-sm opacity-70">Question {idx + 1} of {order.length}</div>
            <h3 className="text-lg font-semibold mt-1">{question.q}</h3>
          </div>
          <div className="flex items-center gap-2">
            <button className="btn outline" onClick={goPrev} disabled={idx === 0}>
              Previous
            </button>
            {idx < order.length - 1 ? (
              <>
                <button className="btn ghost" onClick={skip}>Skip</button>
                <button className="btn primary" onClick={goNext}>Next</button>
              </>
            ) : (
              <button className="btn primary" onClick={() => handleSubmit(false)}>
                Submit
              </button>
            )}
          </div>
        </div>

        <div className="mt-4 grid gap-3">
          {question.options.map((opt, i) => {
            const active = i === selected;
            return (
              <button
                key={i}
                onClick={() => selectOption(i)}
                className={`text-left card transition ${
                  active ? "ring-2 ring-sky-400" : "hover:bg-white/5"
                }`}
              >
                <div className="font-medium">{String.fromCharCode(65 + i)}.</div>
                <div className="opacity-90">{opt}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Navigator */}
      <div className="card">
        <h4 className="font-semibold mb-3">Questions</h4>
        <div className="flex flex-wrap gap-2">
          {order.map((_, i) => {
            const s = status[i] || STATUS.UNVISITED;
            let color = "bg-gray-600";
            if (s === STATUS.VISITED) color = "bg-sky-500";
            if (s === STATUS.ATTEMPTED) color = "bg-emerald-500";
            if (s === STATUS.SKIPPED) color = "bg-orange-500";
            const active = i === idx ? "ring-2 ring-white/70" : "";
            return (
              <button
                key={i}
                className={`w-9 h-9 rounded-md text-sm font-semibold ${active}`}
                onClick={() => {
                  updateStatus(i, STATUS.VISITED);
                  setIdx(i);
                }}
                title={s}
              >
                <span
                  className={`inline-flex items-center justify-center w-full h-full rounded-md ${color}`}
                >
                  {i + 1}
                </span>
              </button>
            );
          })}
        </div>
        <div className="mt-3 text-xs opacity-75 flex gap-4">
          <span><span className="inline-block w-3 h-3 bg-gray-600 rounded-sm mr-1" />Unvisited</span>
          <span><span className="inline-block w-3 h-3 bg-sky-500 rounded-sm mr-1" />Visited</span>
          <span><span className="inline-block w-3 h-3 bg-emerald-500 rounded-sm mr-1" />Attempted</span>
          <span><span className="inline-block w-3 h-3 bg-orange-500 rounded-sm mr-1" />Skipped</span>
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
