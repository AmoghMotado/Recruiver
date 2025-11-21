// pages/recruiter/analytics.js
import DashboardLayout from "@/components/DashboardLayout";
import AnalyticsSummary from "../../components/recruiter/AnalyticsSummary";
import SkillsBarChart from "../../components/recruiter/SkillsBarChart";
import TrendsMiniChart from "../../components/recruiter/TrendsMiniChart";
import AIInsights from "../../components/recruiter/AIInsights";

function Analytics() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Analytics & AI</h1>

      <AnalyticsSummary />

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 space-y-6">
          <SkillsBarChart />
          <TrendsMiniChart />
        </div>
        <div className="space-y-6">
          <AIInsights />
          <div className="card">
            <h3 className="font-semibold mb-2">Next Steps</h3>
            <ul className="list-disc pl-5 text-sm space-y-2 opacity-90">
              <li>
                Compare candidate skills vs. JD requirements to find gaps.
              </li>
              <li>Auto-suggest top candidates for each open role.</li>
              <li>
                Predict time-to-fill per role using recent applicant trends.
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

Analytics.getLayout = function getLayout(page) {
  return (
    <DashboardLayout role="RECRUITER" active="analytics">
      {page}
    </DashboardLayout>
  );
};

export default Analytics;
