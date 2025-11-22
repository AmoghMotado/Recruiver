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
  const [education, setEducation] = useState([]);
  const [experience, setExperience] = useState([]);
  const [projects, setProjects] = useState([]);
  const [links, setLinks] = useState([]);

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

    total += 2;
    if (bio.headline?.trim()) filled += 1;
    if (bio.summary?.trim()) filled += 1;

    total += 1;
    if (skills.length > 0) filled += 1;

    total += 4;
    if (education.length > 0) filled += 1;
    if (experience.length > 0) filled += 1;
    if (projects.length > 0) filled += 1;
    if (links.length > 0) filled += 1;

    return Math.round((filled / Math.max(1, total)) * 100);
  }, [user, bio, skills, education, experience, projects, links]);

  const addSkill = (s) => {
    const v = s.trim();
    if (v && !skills.includes(v)) setSkills((prev) => [...prev, v]);
  };
  const removeSkill = (v) => setSkills((prev) => prev.filter((x) => x !== v));

  if (loading)
    return (
      <div className="bg-white rounded-xl p-8 border border-gray-200">
        <div className="text-lg font-semibold text-gray-900">Loading…</div>
      </div>
    );

  return (
    <div className="space-y-8 pb-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-gray-900">My Profile</h1>
          <p className="text-lg text-gray-600 mt-2">Build your professional profile</p>
        </div>
        <button 
          className="px-8 py-3 text-base font-bold text-white bg-gradient-to-r from-indigo-600 to-indigo-700 rounded-xl hover:shadow-lg transition"
          onClick={save} 
          disabled={saving}
        >
          {saving ? "Saving…" : "Save Profile"}
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <p className="text-red-800 font-medium">{error}</p>
        </div>
      )}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "300px 1fr",
          gap: 24,
        }}
      >
        {/* LEFT PANEL - SIDEBAR */}
        <aside className="bg-white rounded-xl border border-gray-200 p-8 h-fit sticky top-24">
          {/* Profile Card */}
          <div className="mb-8">
            <div className="flex items-center gap-4 mb-6">
              <div
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: "50%",
                  background: "linear-gradient(135deg, #4f46e5, #6366f1)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "white",
                  fontSize: 24,
                  fontWeight: "bold",
                }}
              >
                {(user.firstName || "C").charAt(0).toUpperCase()}
              </div>
              <div>
                <div className="font-bold text-lg text-gray-900">
                  {user.firstName || "Your Name"}
                </div>
                <div className="text-sm text-gray-600">Candidate</div>
              </div>
            </div>

            {/* Progress Circle */}
            <ProfileProgress value={completion} />
            <div className="text-center mt-3">
              <div className="text-sm text-gray-600 font-medium">
                {completion}% Complete
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Profile completeness
              </p>
            </div>
          </div>

          <hr className="border-gray-200 mb-6" />

          {/* Navigation */}
          <div className="space-y-2">
            {[
              { id: "personal", label: "Personal Details" },
              { id: "bio", label: "Bio" },
              { id: "skills", label: "Skills" },
              { id: "education", label: "Education" },
              { id: "experience", label: "Experience" },
              { id: "projects", label: "Projects" },
              { id: "links", label: "Links" },
            ].map((item) => (
              <NavItem
                key={item.id}
                text={item.label}
                id={item.id}
                active={activeSection === item.id}
                onClick={() => scrollToSection(item.id)}
              />
            ))}
          </div>
        </aside>

        {/* RIGHT CONTENT */}
        <main className="space-y-6">
          {/* PERSONAL DETAILS */}
          <section
            id="personal"
            ref={(el) => (sectionRefs.current.personal = el)}
            className="bg-white rounded-xl border border-gray-200 p-8"
          >
            <SectionHeader
              title="Personal Details"
              editing={!!editable.personal}
              onToggle={() => toggleEdit("personal")}
              showEdit={true}
            />
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3, 1fr)",
                gap: 20,
                marginTop: 24,
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
            className="bg-white rounded-xl border border-gray-200 p-8"
          >
            <SectionHeader
              title="Bio"
              editing={!!editable.bio}
              onToggle={() => toggleEdit("bio")}
              showEdit={true}
            />
            <div className="space-y-6 mt-6">
              <Field
                disabled={!editable.bio}
                label="Headline"
                placeholder="e.g., Senior Full Stack Developer"
                value={bio.headline}
                onChange={(v) => setBio({ ...bio, headline: v })}
              />
              <TextArea
                disabled={!editable.bio}
                label="Summary"
                placeholder="Tell us about yourself, your experience, and career goals"
                value={bio.summary}
                onChange={(v) => setBio({ ...bio, summary: v })}
              />
            </div>
          </section>

          {/* SKILLS */}
          <section
            id="skills"
            ref={(el) => (sectionRefs.current.skills = el)}
            className="bg-white rounded-xl border border-gray-200 p-8"
          >
            <SectionHeader
              title="Skills"
              editing={!!editable.skills}
              onToggle={() => toggleEdit("skills")}
              showEdit={true}
            />
            {editable.skills && (
              <div className="mt-6 mb-6">
                <SkillInput onAdd={addSkill} />
              </div>
            )}
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: 10,
              }}
            >
              {skills.map((s) => (
                <span
                  key={s}
                  className="chip"
                  style={{
                    background: "linear-gradient(135deg, #eef2ff, #f0f4ff)",
                    border: "1px solid #c7d2fe",
                    padding: "8px 14px",
                    borderRadius: "20px",
                    fontSize: "14px",
                    fontWeight: "600",
                    color: "#4f46e5",
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  {s}
                  {editable.skills && (
                    <button
                      onClick={() => removeSkill(s)}
                      style={{
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        fontSize: "18px",
                        color: "#4f46e5",
                        padding: "0",
                      }}
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
        </main>
      </div>
    </div>
  );
}

/* ---------- Reusable Components ---------- */

function SectionHeader({ title, editing, onToggle, showEdit = false }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
      }}
    >
      <h2 style={{ fontSize: 24, fontWeight: 700, color: "#111827" }}>
        {title}
      </h2>
      {showEdit && (
        <button
          onClick={onToggle}
          style={{
            padding: "8px 16px",
            borderRadius: "8px",
            border: "1px solid #e5e7eb",
            background: "#ffffff",
            color: "#4f46e5",
            fontWeight: "600",
            fontSize: "14px",
            cursor: "pointer",
            transition: "all 0.2s",
          }}
          onMouseEnter={(e) => {
            e.target.style.background = "#f3f4f6";
          }}
          onMouseLeave={(e) => {
            e.target.style.background = "#ffffff";
          }}
        >
          {editing ? "Done Editing" : "Edit"}
        </button>
      )}
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
    <label style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <span style={{ fontSize: "14px", fontWeight: "600", color: "#374151" }}>
        {label}
      </span>
      <input
        disabled={disabled}
        type={type}
        placeholder={placeholder}
        value={value || ""}
        onChange={(e) => onChange?.(e.target.value)}
        style={{
          width: "100%",
          padding: "12px 14px",
          borderRadius: 10,
          background: disabled ? "#f9fafb" : "#ffffff",
          border: "1px solid #e5e7eb",
          color: "#111827",
          fontSize: "14px",
          fontWeight: "500",
          opacity: disabled ? 0.6 : 1,
          transition: "border-color 0.2s",
        }}
      />
    </label>
  );
}

function TextArea({ label, value, onChange, placeholder, disabled = false }) {
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <span style={{ fontSize: "14px", fontWeight: "600", color: "#374151" }}>
        {label}
      </span>
      <textarea
        disabled={disabled}
        placeholder={placeholder}
        value={value || ""}
        onChange={(e) => onChange?.(e.target.value)}
        style={{
          width: "100%",
          padding: "12px 14px",
          borderRadius: 10,
          background: disabled ? "#f9fafb" : "#ffffff",
          border: "1px solid #e5e7eb",
          color: "#111827",
          fontSize: "14px",
          fontWeight: "500",
          opacity: disabled ? 0.6 : 1,
          resize: "vertical",
          minHeight: "120px",
        }}
      />
    </label>
  );
}

function Select({ label, value, onChange, options, disabled = false }) {
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <span style={{ fontSize: "14px", fontWeight: "600", color: "#374151" }}>
        {label}
      </span>
      <select
        disabled={disabled}
        value={value || ""}
        onChange={(e) => onChange?.(e.target.value)}
        style={{
          width: "100%",
          padding: "12px 14px",
          borderRadius: 10,
          background: disabled ? "#f9fafb" : "#ffffff",
          border: "1px solid #e5e7eb",
          color: "#111827",
          fontSize: "14px",
          fontWeight: "500",
          opacity: disabled ? 0.6 : 1,
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
    <div style={{ display: "flex", gap: 10 }}>
      <input
        value={val}
        onChange={(e) => setVal(e.target.value)}
        placeholder="Add a skill and press +"
        style={{
          flex: 1,
          padding: "12px 14px",
          borderRadius: 10,
          border: "1px solid #e5e7eb",
          background: "#ffffff",
          color: "#111827",
          fontSize: "14px",
          fontWeight: "500",
        }}
      />
      <button
        onClick={() => {
          onAdd(val);
          setVal("");
        }}
        style={{
          padding: "12px 20px",
          borderRadius: 10,
          border: "none",
          background: "linear-gradient(90deg, #4f46e5, #6366f1)",
          color: "white",
          fontSize: "14px",
          fontWeight: "600",
          cursor: "pointer",
          transition: "transform 0.1s",
        }}
        onMouseDown={(e) => {
          e.currentTarget.style.transform = "scale(0.98)";
        }}
        onMouseUp={(e) => {
          e.currentTarget.style.transform = "scale(1)";
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
      className="bg-white rounded-xl border border-gray-200 p-8"
    >
      <SectionHeader 
        title={title} 
        editing={!disabled} 
        onToggle={onToggle}
        showEdit={true}
      />
      <div style={{ display: "grid", gap: 20, marginTop: 24 }}>
        {(rows || []).map((row, idx) => (
          <div
            key={idx}
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              gap: 16,
              padding: 20,
              background: "#f9fafb",
              borderRadius: 12,
              border: "1px solid #e5e7eb",
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
              <div style={{ display: "flex", alignItems: "flex-end" }}>
                <button
                  onClick={() =>
                    setRows((prev) => prev.filter((_, i) => i !== idx))
                  }
                  style={{
                    padding: "10px 16px",
                    borderRadius: 8,
                    border: "1px solid #fee2e2",
                    background: "#fef2f2",
                    color: "#dc2626",
                    fontSize: "14px",
                    fontWeight: "600",
                    cursor: "pointer",
                    transition: "all 0.2s",
                  }}
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
          onClick={() => setRows([...(rows || []), { ...template }])}
          style={{
            marginTop: 16,
            padding: "12px 16px",
            borderRadius: 8,
            border: "2px dashed #d1d5db",
            background: "#ffffff",
            color: "#4f46e5",
            fontSize: "14px",
            fontWeight: "600",
            cursor: "pointer",
            transition: "all 0.2s",
          }}
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
      style={{
        width: "100%",
        textAlign: "left",
        borderRadius: 10,
        padding: "12px 14px",
        border: "none",
        background: active
          ? "linear-gradient(90deg, #4f46e5, #6366f1)"
          : "#f9fafb",
        color: active ? "#ffffff" : "#374151",
        fontSize: 14,
        fontWeight: active ? 700 : 600,
        transition: "all 0.2s",
        cursor: "pointer",
      }}
      onMouseEnter={(e) => {
        if (!active) {
          e.target.style.background = "#f3f4f6";
        }
      }}
      onMouseLeave={(e) => {
        if (!active) {
          e.target.style.background = "#f9fafb";
        }
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
        <linearGradient id="profileGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#4f46e5" />
          <stop offset="100%" stopColor="#6366f1" />
        </linearGradient>
      </defs>
      <text
        x="50%"
        y="50%"
        dominantBaseline="middle"
        textAnchor="middle"
        fontSize="24"
        fontWeight="800"
        fill="#111827"
      >
        {value}%
      </text>
    </svg>
  );
}

/* Attach per-page layout */
CandidateProfilePage.getLayout = (page) => (
  <Layout active="profile" role="CANDIDATE">
    {page}
  </Layout>
);

export default CandidateProfilePage;