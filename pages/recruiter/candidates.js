// pages/recruiter/candidates.js
import { useEffect, useMemo, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import CandidatesTable from "../../components/recruiter/CandidatesTable";

const LS_KEY = "recruiter.candidates";

const seed = [
  {
    id: crypto.randomUUID(),
    name: "Cameron Williamson",
    role: "Software Engineer",
    score: 85,
    status: "Applied",
    resumeUrl: "",
  },
  {
    id: crypto.randomUUID(),
    name: "Jenny Wilson",
    role: "Data Analyst",
    score: 82,
    status: "Under Review",
    resumeUrl: "",
  },
  {
    id: crypto.randomUUID(),
    name: "Ralph Edwards",
    role: "Software Engineer",
    score: 88,
    status: "Shortlisted",
    resumeUrl: "",
  },
  {
    id: crypto.randomUUID(),
    name: "Arjun Mehta",
    role: "DevOps Engineer",
    score: 76,
    status: "Applied",
    resumeUrl: "",
  },
  {
    id: crypto.randomUUID(),
    name: "Priya Nair",
    role: "Product Manager",
    score: 91,
    status: "Under Review",
    resumeUrl: "",
  },
];

function Candidates() {
  const [rows, setRows] = useState([]);
  const [filters, setFilters] = useState({
    q: "",
    status: "All",
    minScore: "",
  });
  const [selectedIds, setSelectedIds] = useState(new Set());

  // hydrate
  useEffect(() => {
    try {
      const raw = localStorage.getItem(LS_KEY);
      setRows(raw ? JSON.parse(raw) : seed);
    } catch {
      setRows(seed);
    }
  }, []);

  // persist on change
  useEffect(() => {
    try {
      localStorage.setItem(LS_KEY, JSON.stringify(rows));
    } catch {}
  }, [rows]);

  const setStatusForIds = (ids, status) => {
    setRows((curr) =>
      curr.map((c) => (ids.includes(c.id) ? { ...c, status } : c))
    );
  };

  const removeIds = (ids) => {
    setRows((curr) => curr.filter((c) => !ids.includes(c.id)));
  };

  const onToggle = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const onToggleAll = (visibleIds, checked) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (checked) {
        visibleIds.forEach((id) => next.add(id));
      } else {
        visibleIds.forEach((id) => next.delete(id));
      }
      return next;
    });
  };

  const onViewResume = (row) => {
    if (row.resumeUrl) {
      window.open(row.resumeUrl, "_blank");
    } else {
      alert(
        "No resume URL set for this candidate. (You can extend this to open a detailed profile page.)"
      );
    }
  };

  const onChangeStatus = (id, status) => {
    setRows((curr) => curr.map((c) => (c.id === id ? { ...c, status } : c)));
  };

  const onDelete = (id) => {
    if (!confirm("Delete this candidate?")) return;
    setRows((curr) => curr.filter((c) => c.id !== id));
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  };

  const onBulk = (action) => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;
    if (action === "shortlist") setStatusForIds(ids, "Shortlisted");
    if (action === "review") setStatusForIds(ids, "Under Review");
    if (action === "reject") setStatusForIds(ids, "Rejected");
    if (action === "delete") {
      if (!confirm(`Delete ${ids.length} selected candidate(s)?`)) return;
      removeIds(ids);
    }
    setSelectedIds(new Set());
  };

  const counts = useMemo(() => {
    const total = rows.length;
    const byStatus = rows.reduce(
      (acc, r) => {
        acc[r.status] = (acc[r.status] || 0) + 1;
        return acc;
      },
      { Applied: 0, "Under Review": 0, Shortlisted: 0, Rejected: 0 }
    );
    return { total, ...byStatus };
  }, [rows]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Candidates</h1>
        <div className="text-sm opacity-80">
          Total: <span className="font-semibold">{counts.total}</span> • Applied:{" "}
          {counts.Applied} • Review: {counts["Under Review"]} • Shortlisted:{" "}
          {counts.Shortlisted} • Rejected: {counts.Rejected}
        </div>
      </div>

      <CandidatesTable
        rows={rows}
        selectedIds={selectedIds}
        onToggle={onToggle}
        onToggleAll={onToggleAll}
        onViewResume={onViewResume}
        onChangeStatus={onChangeStatus}
        onDelete={onDelete}
        onBulk={onBulk}
        filters={filters}
        setFilters={setFilters}
      />
    </div>
  );
}

Candidates.getLayout = function getLayout(page) {
  return (
    <DashboardLayout role="RECRUITER" active="candidates">
      {page}
    </DashboardLayout>
  );
};

export default Candidates;
