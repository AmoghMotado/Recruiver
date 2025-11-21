// server/ats/skills.js

const CATEGORIES = {
  languages: [
    "javascript",
    "typescript",
    "python",
    "java",
    "c",
    "c++",
    "c#",
    "go",
    "rust",
    "ruby",
    "php",
    "kotlin",
    "swift",
    "scala",
    "r",
  ],
  webFrameworks: [
    "react",
    "reactjs",
    "next",
    "nextjs",
    "vue",
    "nuxt",
    "angular",
    "svelte",
    "express",
    "fastify",
    "nestjs",
    "django",
    "flask",
    "spring",
    "spring boot",
    "laravel",
    "rails",
  ],
  databases: [
    "mysql",
    "postgresql",
    "postgres",
    "mongodb",
    "redis",
    "sqlite",
    "dynamodb",
    "elasticsearch",
    "cassandra",
  ],
  cloud: [
    "aws",
    "azure",
    "gcp",
    "google cloud",
    "firebase",
    "heroku",
    "digitalocean",
    "vercel",
    "netlify",
  ],
  devops: [
    "docker",
    "kubernetes",
    "k8s",
    "jenkins",
    "github actions",
    "gitlab ci",
    "ci/cd",
    "terraform",
    "ansible",
  ],
  data: [
    "pandas",
    "numpy",
    "scikit-learn",
    "sklearn",
    "tensorflow",
    "pytorch",
    "keras",
    "power bi",
    "tableau",
    "excel",
    "sql",
    "hadoop",
    "spark",
  ],
  tools: [
    "git",
    "github",
    "gitlab",
    "jira",
    "confluence",
    "figma",
    "postman",
    "swagger",
    "rest",
    "graphql",
  ],
};

const ALL_SKILLS = Object.entries(CATEGORIES).flatMap(([category, list]) =>
  list.map((name) => ({ name, category }))
);

/**
 * Extracts skills into a structured taxonomy from free text
 */
function extractSkills(text = "") {
  const lower = text.toLowerCase();
  const hitsByCategory = {};
  const flat = new Set();

  for (const { name, category } of ALL_SKILLS) {
    const pattern = new RegExp(`\\b${escapeRegex(name)}\\b`, "i");
    if (pattern.test(lower)) {
      if (!hitsByCategory[category]) hitsByCategory[category] = new Set();
      hitsByCategory[category].add(name);
      flat.add(name);
    }
  }

  const categories = {};
  for (const [cat, set] of Object.entries(hitsByCategory)) {
    categories[cat] = Array.from(set);
  }

  return {
    flat: Array.from(flat),
    categories,
  };
}

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

module.exports = {
  CATEGORIES,
  extractSkills,
};
