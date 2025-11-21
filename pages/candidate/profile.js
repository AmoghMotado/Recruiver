// pages/candidate/profile.js
import { useEffect, useState, useRef, useMemo } from "react";
import Layout from "@/components/Layout";

const SECTION_ORDER = [
  "personal",
  "bio",
  "skills",
  "education",
  "experience",
  "projects",
  "links",
];

function CandidateProfilePage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // User basics (User table)
  const [user, setUser] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    dob: "",
    gender: "",
  });

  // CandidateProfile fields
  const [bio, setBio] = useState({ headline: "", summary: "" });
  const [skills, setSkills] = useState([]);

  // JSON sections
  const [education, setEducation] = useState([]); // [{school, degree, start, end, details}]
  const [experience, setExperience] = useState([]); // [{company, role, start, end, details}]
  const [projects, setProjects] = useState([]); // [{title, tech, link, details}]
  const [links, setLinks] = useState([]); // [{label, url}]

  // Smooth-scroll + active tracking
  const [activeSection, setActiveSection] = useState("personal");
  const sectionRefs = useRef({});

  function scrollToSection(id) {
    const el = sectionRefs.current[id];
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  useEffect(() => {
    const obs = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (visible[0]?.target?.id) setActiveSection(visible[0].target.id);
      },
      {
        root: null,
        rootMargin: "-20% 0px -60% 0px",
        threshold: [0, 0.25, 0.5, 0.75, 1],
      }
    );
    SECTION_ORDER.forEach((id) => {
      const el = sectionRefs.current[id];
      if (el) obs.observe(el);
    });
    return () => obs.disconnect();
  }, []);

  // Load profile
  useEffect(() => {
    (async function load() {
      try {
        setLoading(true);
        const res = await fetch("/api/profile/candidate");
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data?.message || "Failed to load profile");

        const u = data.user || {};
        const c = data.candidate || {};
        setUser({
          firstName: u.firstName || "",
          lastName: u.lastName || "",
          email: u.email || "",
          phone: u.phone || "",
          dob: u.dob ? String(u.dob).slice(0, 10) : "",
          gender: u.gender || "",
        });
        setBio({
          headline: c.headline || "",
          summary: c.summary || "",
        });
        setSkills(Array.isArray(c.skills) ? c.skills : []);
        setEducation(Array.isArray(c.education) ? c.education : []);
        setExperience(Array.isArray(c.experience) ? c.experience : []);
        setProjects(Array.isArray(c.projects) ? c.projects : []);
        setLinks(Array.isArray(c.links) ? c.links : []);
        setError("");
      } catch (e) {
        setError(e.message || "Load failed");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Save profile
  const save = async () => {
    try {
      setSaving(true);
      setError("");
      const payload = {
        user: { ...user },
        candidate: {
          headline: bio.headline,
          summary: bio.summary,
          skills,
          education,
          experience,
          projects,
          links,
        },
      };
      const res = await fetch("/api/profile/candidate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.message || "Failed to save profile");
      alert("Profile saved");
    } catch (e) {
      setError(e.message || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  // Section edit toggles
  const [editable, setEditable] = useState({
    personal: true,
    bio: true,
    skills: true,
    education: true,
    experience: true,
    projects: true,
    links: true,
  });
  const toggleEdit = (key) =>
    setEditable((p) => ({
      ...p,
      [key]: !p[key],
    }));

  // Completion % (progress circle)
  const completion = useMemo(() => {
    let filled = 0,
      total = 0;
    // personal details
    const personalFields = [
      "firstName",
      "lastName",
      "email",
      "phone",
      "dob",
      "gender",
    ];
    total += personalFields.length;
    filled += personalFields.filter(
      (k) => String(user[k] || "").trim().length > 0
    ).length;

    // bio
    total += 2; // headline, summary
    if (bio.headline?.trim()) filled += 1;
    if (bio.summary?.trim()) filled += 1;

    // skills
    total += 1;
    if (skills.length > 0) filled += 1;

    // education/experience/projects/links — count as 1 each if at least one row present
    total += 4;
    if (education.length > 0) filled += 1;
    if (experience.length > 0) filled += 1;
    if (projects.length > 0) filled += 1;
    if (links.length > 0) filled += 1;

    return Math.round((filled / Math.max(1, total)) * 100);
  }, [user, bio, skills, education, experience, projects, links]);

  // helpers for skills
  const addSkill = (s) => {
    const v = s.trim();
    if (v && !skills.includes(v)) setSkills((prev) => [...prev, v]);
  };
  const removeSkill = (v) => setSkills((prev) => prev.filter((x) => x !== v));

  if (loading) return <div className="card" style={{ padding: 20 }}>Loading…</div>;

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "280px 1fr",
        gap: 24,
      }}
    >
      {/* LEFT PANEL (sticky & full-height) */}
      <aside
        className="card"
        style={{
          padding: 20,
          position: "sticky",
          top: 24,
          alignSelf: "flex-start",
          height: "calc(100vh - 48px)",
          overflowY: "auto",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            marginBottom: 16,
          }}
        >
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: "50%",
              background: "rgba(79,70,229,0.08)",
            }}
          />
          <div>
            <div style={{ fontWeight: 700 }}>
              {user.firstName || "Your Name"}
            </div>
            <div style={{ color: "var(--muted)", fontSize: 12 }}>Candidate</div>
          </div>
        </div>

        {/* Progress circle with brand blue */}
        <ProfileProgress value={completion} />
        <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 6 }}>
          Profile completeness
        </div>

        <hr
          style={{
            borderColor: "rgba(229,231,235,0.8)",
            margin: "12px 0 16px",
          }}
        />

        <div style={{ display: "grid", gap: 8 }}>
          <NavItem
            text="Personal Details"
            id="personal"
            active={activeSection === "personal"}
            onClick={() => scrollToSection("personal")}
          />
          <NavItem
            text="Bio"
            id="bio"
            active={activeSection === "bio"}
            onClick={() => scrollToSection("bio")}
          />
          <NavItem
            text="Skills"
            id="skills"
            active={activeSection === "skills"}
            onClick={() => scrollToSection("skills")}
          />
          <NavItem
            text="Education"
            id="education"
            active={activeSection === "education"}
            onClick={() => scrollToSection("education")}
          />
          <NavItem
            text="Experience"
            id="experience"
            active={activeSection === "experience"}
            onClick={() => scrollToSection("experience")}
          />
          <NavItem
            text="Projects"
            id="projects"
            active={activeSection === "projects"}
            onClick={() => scrollToSection("projects")}
          />
          <NavItem
            text="Links"
            id="links"
            active={activeSection === "links"}
            onClick={() => scrollToSection("links")}
          />
        </div>
      </aside>

      {/* RIGHT CONTENT */}
      <main style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        {error && (
          <div
            className="card"
            style={{
              padding: 12,
              border: "1px solid rgba(248,113,113,0.4)",
              background: "rgba(248,113,113,0.06)",
            }}
          >
            {error}
          </div>
        )}

        {/* PERSONAL DETAILS */}
        <section
          id="personal"
          ref={(el) => (sectionRefs.current.personal = el)}
          className="card section-anchor"
          style={{ padding: 22 }}
        >
          <SectionHeader
            title="Personal Details"
            editing={!!editable.personal}
            onToggle={() => toggleEdit("personal")}
          />
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3,1fr)",
              gap: 14,
              marginTop: 14,
            }}
          >
            <Field
              disabled={!editable.personal}
              label="First Name"
              value={user.firstName}
              onChange={(v) => setUser({ ...user, firstName: v })}
            />
            <Field
              disabled={!editable.personal}
              label="Last Name"
              value={user.lastName}
              onChange={(v) => setUser({ ...user, lastName: v })}
            />
            <Field
              disabled={!editable.personal}
              label="Email"
              value={user.email}
              onChange={(v) => setUser({ ...user, email: v })}
            />
            <Field
              disabled={!editable.personal}
              label="Phone"
              value={user.phone}
              onChange={(v) => setUser({ ...user, phone: v })}
            />
            <Field
              disabled={!editable.personal}
              label="Date of Birth"
              type="date"
              value={user.dob}
              onChange={(v) => setUser({ ...user, dob: v })}
            />
            <Select
              disabled={!editable.personal}
              label="Gender"
              value={user.gender}
              onChange={(v) => setUser({ ...user, gender: v })}
              options={["Male", "Female", "Other"]}
            />
          </div>
        </section>

        {/* BIO */}
        <section
          id="bio"
          ref={(el) => (sectionRefs.current.bio = el)}
          className="card section-anchor"
          style={{ padding: 22 }}
        >
          <SectionHeader
            title="Bio"
            editing={!!editable.bio}
            onToggle={() => toggleEdit("bio")}
          />
          <Field
            disabled={!editable.bio}
            label="Headline"
            placeholder="e.g., Frontend Developer"
            value={bio.headline}
            onChange={(v) => setBio({ ...bio, headline: v })}
          />
          <TextArea
            disabled={!editable.bio}
            label="Summary"
            placeholder="Tell us about yourself"
            value={bio.summary}
            onChange={(v) => setBio({ ...bio, summary: v })}
          />
        </section>

        {/* SKILLS */}
        <section
          id="skills"
          ref={(el) => (sectionRefs.current.skills = el)}
          className="card section-anchor"
          style={{ padding: 22 }}
        >
          <SectionHeader
            title="Skills"
            editing={!!editable.skills}
            onToggle={() => toggleEdit("skills")}
          />
          {editable.skills && <SkillInput onAdd={addSkill} />}
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 8,
              marginTop: 10,
            }}
          >
            {skills.map((s) => (
              <span key={s} className="chip">
                {s}
                {editable.skills && (
                  <button
                    className="btn tiny ghost"
                    onClick={() => removeSkill(s)}
                  >
                    ×
                  </button>
                )}
              </span>
            ))}
          </div>
        </section>

        {/* EDUCATION */}
        <ListSection
          id="education"
          innerRef={(el) => (sectionRefs.current.education = el)}
          title="Education"
          rows={education}
          setRows={setEducation}
          disabled={!editable.education}
          onToggle={() => toggleEdit("education")}
          template={{
            school: "",
            degree: "",
            start: "",
            end: "",
            details: "",
          }}
          columns={[
            { key: "school", label: "School/University" },
            { key: "degree", label: "Degree" },
            { key: "start", label: "Start", type: "date" },
            { key: "end", label: "End", type: "date" },
            { key: "details", label: "Details" },
          ]}
        />

        {/* EXPERIENCE */}
        <ListSection
          id="experience"
          innerRef={(el) => (sectionRefs.current.experience = el)}
          title="Experience"
          rows={experience}
          setRows={setExperience}
          disabled={!editable.experience}
          onToggle={() => toggleEdit("experience")}
          template={{
            company: "",
            role: "",
            start: "",
            end: "",
            details: "",
          }}
          columns={[
            { key: "company", label: "Company" },
            { key: "role", label: "Role" },
            { key: "start", label: "Start", type: "date" },
            { key: "end", label: "End", type: "date" },
            { key: "details", label: "Details" },
          ]}
        />

        {/* PROJECTS */}
        <ListSection
          id="projects"
          innerRef={(el) => (sectionRefs.current.projects = el)}
          title="Projects"
          rows={projects}
          setRows={setProjects}
          disabled={!editable.projects}
          onToggle={() => toggleEdit("projects")}
          template={{ title: "", tech: "", link: "", details: "" }}
          columns={[
            { key: "title", label: "Title" },
            { key: "tech", label: "Tech Stack" },
            { key: "link", label: "Link" },
            { key: "details", label: "Details" },
          ]}
        />

        {/* LINKS */}
        <ListSection
          id="links"
          innerRef={(el) => (sectionRefs.current.links = el)}
          title="Links"
          rows={links}
          setRows={setLinks}
          disabled={!editable.links}
          onToggle={() => toggleEdit("links")}
          template={{ label: "", url: "" }}
          columns={[
            { key: "label", label: "Label (e.g., GitHub, LinkedIn)" },
            { key: "url", label: "URL" },
          ]}
        />

        {/* Footer actions */}
        <div
          style={{
            display: "flex",
            gap: 10,
            justifyContent: "flex-end",
          }}
        >
          <button className="btn primary" onClick={save} disabled={saving}>
            {saving ? "Saving…" : "Save Profile"}
          </button>
        </div>
      </main>
    </div>
  );
}

/* ---------- Reusable bits ---------- */

function SectionHeader({ title, editing, onToggle }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
      }}
    >
      <h2 style={{ fontSize: 18, fontWeight: 800 }}>{title}</h2>
      <button className="btn ghost" onClick={onToggle}>
        {editing ? "Lock" : "Edit"}
      </button>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  disabled = false,
}) {
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <span style={{ opacity: 0.9 }}>{label}</span>
      <input
        disabled={disabled}
        type={type}
        placeholder={placeholder}
        value={value || ""}
        onChange={(e) => onChange?.(e.target.value)}
        style={{
          width: "100%",
          padding: 12,
          borderRadius: 10,
          background: "#ffffff",
          border: "1px solid #e5e7eb",
          color: "inherit",
        }}
      />
    </label>
  );
}

function TextArea({
  label,
  value,
  onChange,
  placeholder,
  disabled = false,
}) {
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <span style={{ opacity: 0.9 }}>{label}</span>
      <textarea
        disabled={disabled}
        placeholder={placeholder}
        value={value || ""}
        onChange={(e) => onChange?.(e.target.value)}
        style={{
          width: "100%",
          padding: 12,
          borderRadius: 10,
          background: "#ffffff",
          border: "1px solid #e5e7eb",
          color: "inherit",
          resize: "vertical",
        }}
      />
    </label>
  );
}

function Select({ label, value, onChange, options, disabled = false }) {
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <span style={{ opacity: 0.9 }}>{label}</span>
      <select
        disabled={disabled}
        value={value || ""}
        onChange={(e) => onChange?.(e.target.value)}
        style={{
          width: "100%",
          padding: 12,
          borderRadius: 10,
          background: "#ffffff",
          border: "1px solid #e5e7eb",
          color: "inherit",
        }}
      >
        <option value="">Select…</option>
        {options?.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </label>
  );
}

function SkillInput({ onAdd }) {
  const [val, setVal] = useState("");
  return (
    <div style={{ display: "flex", gap: 8 }}>
      <input
        value={val}
        onChange={(e) => setVal(e.target.value)}
        placeholder="Add a skill and press +"
        className="input"
        style={{ flex: 1 }}
      />
      <button
        className="btn"
        onClick={() => {
          onAdd(val);
          setVal("");
        }}
      >
        + Add
      </button>
    </div>
  );
}

function ListSection({
  id,
  innerRef,
  title,
  rows,
  setRows,
  template,
  columns,
  disabled = false,
  onToggle,
}) {
  return (
    <section
      id={id}
      ref={innerRef}
      className="card section-anchor"
      style={{ padding: 22 }}
    >
      <SectionHeader title={title} editing={!disabled} onToggle={onToggle} />
      <div style={{ display: "grid", gap: 14, marginTop: 14 }}>
        {(rows || []).map((row, idx) => (
          <div
            key={idx}
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, 1fr)",
              gap: 12,
            }}
          >
            {columns.map((c) => (
              <Field
                key={c.key}
                type={c.type || "text"}
                disabled={disabled}
                label={c.label}
                value={row[c.key] || ""}
                onChange={(v) => {
                  if (disabled) return;
                  const copy = [...rows];
                  copy[idx] = { ...copy[idx], [c.key]: v };
                  setRows(copy);
                }}
              />
            ))}
            {!disabled && (
              <div style={{ display: "flex", alignItems: "end" }}>
                <button
                  className="btn ghost"
                  onClick={() =>
                    setRows((prev) => prev.filter((_, i) => i !== idx))
                  }
                >
                  Remove
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {!disabled && (
        <button
          className="btn ghost"
          onClick={() => setRows([...(rows || []), { ...template }])}
        >
          + Add {title.slice(0, -1)}
        </button>
      )}
    </section>
  );
}

function NavItem({ text, id, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`nav-pill ${active ? "active" : ""}`}
      style={{
        textAlign: "left",
        borderRadius: 12,
        padding: "10px 12px",
        border: "1px solid rgba(224,231,255,0.9)",
        background: active
          ? "linear-gradient(90deg, var(--brand), var(--brand-soft))"
          : "#f9fafb",
        color: active ? "#ffffff" : "var(--text)",
        boxShadow: active
          ? "0 10px 24px rgba(79,70,229,0.35)"
          : "none",
        fontSize: 13,
        fontWeight: 600,
        transition: "background .2s, box-shadow .2s, color .2s, transform .08s",
      }}
    >
      {text}
    </button>
  );
}

function ProfileProgress({ value = 0 }) {
  const size = 120;
  const stroke = 10;
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const dash = (circ * Math.min(100, Math.max(0, value))) / 100;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        stroke="#e5e7eb"
        strokeWidth={stroke}
        fill="none"
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        stroke="url(#profileGrad)"
        strokeWidth={stroke}
        strokeDasharray={`${dash} ${circ - dash}`}
        strokeLinecap="round"
        fill="none"
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
      <defs>
        <linearGradient
          id="profileGrad"
          x1="0%"
          y1="0%"
          x2="100%"
          y2="0%"
        >
          <stop offset="0%" stopColor="var(--brand)" />
          <stop offset="100%" stopColor="var(--brand-soft)" />
        </linearGradient>
      </defs>
      <text
        x="50%"
        y="50%"
        dominantBaseline="middle"
        textAnchor="middle"
        fontSize="20"
        fontWeight="800"
        fill="#111827"
      >
        {value}%
      </text>
    </svg>
  );
}

/* ✅ Attach per-page layout so the sidebar/topbar render */
CandidateProfilePage.getLayout = (page) => (
  <Layout active="profile" role="CANDIDATE">
    {page}
  </Layout>
);

export default CandidateProfilePage;
