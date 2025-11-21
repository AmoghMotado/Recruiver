// components/candidate/JobCard.jsx
import Link from "next/link";

export default function JobCard({ job }) {
  if (!job) return null;

  const {
    id,
    title,
    company,
    location,
    experience,
    stack,
    salaryRange,
  } = job;

  const tags = [];
  if (location) tags.push(location);
  if (experience) tags.push(experience);
  if (stack) tags.push(stack.split(",")[0]);

  return (
    <article className="card p-4 flex flex-col gap-3">
      <div>
        <h3 className="text-base sm:text-lg font-semibold text-gray-900">
          {title || "Job title"}
        </h3>
        <p className="text-sm text-gray-500 mt-0.5">
          {company || "Company"} {salaryRange && <>· {salaryRange}</>}
        </p>
      </div>

      {tags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {tags.map((tag) => (
            <span key={tag} className="pill">
              {tag}
            </span>
          ))}
        </div>
      )}

      <div className="mt-2 flex items-center justify-between gap-3">
        <Link
          href={`/candidate/job-profiles?id=${id ?? ""}`}
          className="text-xs sm:text-sm font-semibold text-indigo-600 hover:text-indigo-700"
        >
          View details
        </Link>
        <Link
          href={`/candidate/job-profiles?id=${id ?? ""}#apply`}
          className="btn-apply text-xs sm:text-sm"
        >
          Apply
        </Link>
      </div>
    </article>
  );
}
