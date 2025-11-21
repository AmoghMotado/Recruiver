// components/Footer.js
import Link from "next/link";

export default function Footer({ basePath = "" }) {
  const prefix = basePath || "";
  return (
    <div className="flex flex-col items-center gap-2 text-xs sm:text-sm text-gray-500 py-4">
      <div>
        © 2025 Recruiver ·{" "}
        <Link href={`${prefix}/terms`} className="small-link">
          Terms
        </Link>{" "}
        ·{" "}
        <Link href={`${prefix}/privacy`} className="small-link">
          Privacy
        </Link>
      </div>
    </div>
  );
}
