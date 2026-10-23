/** @type {import('next').NextConfig} */
module.exports = {
  reactStrictMode: true,
  poweredByHeader: false,
  async redirects() {
    return [
      { source: "/login", destination: "/", permanent: true },
      { source: "/recruiter/notifications", destination: "/recruiter/dashboard", permanent: true },
      { source: "/recruiter/upload-jd", destination: "/recruiter/job-profiles", permanent: true },
    ];
  },
};
