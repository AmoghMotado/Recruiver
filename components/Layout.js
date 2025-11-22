import { useRouter } from "next/router";
import DashboardLayout from "./DashboardLayout";
import Footer from "./Footer";
import ChatWidget from "./ChatWidget";

const HIDE_ON = [
  "/",
  "/auth/select-role",
  "/auth/forgot",
  "/auth/register-candidate",
  "/auth/register-recruiter",
];

export default function Layout(props) {
  const { children, role = "CANDIDATE", active } = props;
  const router = useRouter();
  const pathname = router.pathname || "/";
  const roleSafe = String(role || "CANDIDATE").toUpperCase();
  const isCandidate = roleSafe === "CANDIDATE";

  // Auth / marketing pages – no header/sidebar chrome
  if (HIDE_ON.includes(pathname)) {
    return (
      <div className="min-h-screen flex flex-col">
        <main className="flex-1">{children}</main>
        <footer className="app-footer">
          <Footer basePath={isCandidate ? "/candidate" : "/recruiter"} />
        </footer>
        <ChatWidget />
      </div>
    );
  }

  // All app pages share the same dashboard shell
  return (
    <DashboardLayout role={roleSafe} active={active}>
      {children}
    </DashboardLayout>
  );
}
