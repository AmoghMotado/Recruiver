import { useRouter } from "next/router";
import { useEffect } from "react";
import Layout from "../../components/Layout";

export default function ChooseLevel() {
  const router = useRouter();

  useEffect(() => {
    const nextRoute = localStorage.getItem("recruiver.next.route");
    if (!nextRoute) router.replace("/candidate/resume-ats");
  }, [router]);

  const chooseCareerLevel = (level) => {
    localStorage.setItem("recruiver.career.level", level);
    const nextRoute = localStorage.getItem("recruiver.next.route") || "/candidate/resume-ats";
    router.push(nextRoute);
  };

  const opts = [
    { level: "entry", title: "Entry-level", desc: "0–2 years experience" },
    { level: "mid", title: "Mid-level", desc: "3–7 years experience" },
    { level: "senior", title: "Senior-level", desc: "8+ years experience" },
  ];

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="card">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-semibold">Choose Career Level</h3>
          <button className="btn ghost" onClick={() => router.push("/candidate/resume-ats")}>
            Close
          </button>
        </div>
        <p className="text-sm opacity-80 mb-4">
          Select the level that best matches your experience.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {opts.map((o) => (
            <div key={o.level} className="card border border-white/10">
              <div className="font-semibold">{o.title}</div>
              <div className="text-sm opacity-75 mt-1">{o.desc}</div>
              <button className="btn primary mt-4" onClick={() => chooseCareerLevel(o.level)}>
                CHOOSE
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

ChooseLevel.getLayout = function getLayout(page) {
  return (
    <Layout role="CANDIDATE" active="resume">
      {page}
    </Layout>
  );
};
