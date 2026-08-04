import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL is not set');
}

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

const SKILLS = [
  // Engineering (38)
  { name: 'React', slug: 'react', category: 'Engineering' },
  { name: 'TypeScript', slug: 'typescript', category: 'Engineering' },
  { name: 'JavaScript', slug: 'javascript', category: 'Engineering' },
  { name: 'Node.js', slug: 'node-js', category: 'Engineering' },
  { name: 'Python', slug: 'python', category: 'Engineering' },
  { name: 'Go', slug: 'go', category: 'Engineering' },
  { name: 'Rust', slug: 'rust', category: 'Engineering' },
  { name: 'Java', slug: 'java', category: 'Engineering' },
  { name: 'C++', slug: 'c-plus-plus', category: 'Engineering' },
  { name: 'C#', slug: 'c-sharp', category: 'Engineering' },
  { name: 'Ruby', slug: 'ruby', category: 'Engineering' },
  { name: 'Scala', slug: 'scala', category: 'Engineering' },
  { name: 'Kotlin', slug: 'kotlin', category: 'Engineering' },
  { name: 'Swift', slug: 'swift', category: 'Engineering' },
  { name: 'PHP', slug: 'php', category: 'Engineering' },
  { name: 'Next.js', slug: 'next-js', category: 'Engineering' },
  { name: 'GraphQL', slug: 'graphql', category: 'Engineering' },
  { name: 'REST API', slug: 'rest-api', category: 'Engineering' },
  { name: 'HTML', slug: 'html', category: 'Engineering' },
  { name: 'CSS', slug: 'css', category: 'Engineering' },
  { name: 'Tailwind CSS', slug: 'tailwind-css', category: 'Engineering' },
  { name: 'Vue.js', slug: 'vue-js', category: 'Engineering' },
  { name: 'Angular', slug: 'angular', category: 'Engineering' },
  { name: 'Svelte', slug: 'svelte', category: 'Engineering' },
  { name: 'React Native', slug: 'react-native', category: 'Engineering' },
  { name: 'SwiftUI', slug: 'swiftui', category: 'Engineering' },
  { name: 'PostgreSQL', slug: 'postgresql', category: 'Engineering' },
  { name: 'MySQL', slug: 'mysql', category: 'Engineering' },
  { name: 'MongoDB', slug: 'mongodb', category: 'Engineering' },
  { name: 'Redis', slug: 'redis', category: 'Engineering' },
  { name: 'Docker', slug: 'docker', category: 'Engineering' },
  { name: 'Kubernetes', slug: 'kubernetes', category: 'Engineering' },
  { name: 'AWS', slug: 'aws', category: 'Engineering' },
  { name: 'Git', slug: 'git', category: 'Engineering' },
  { name: 'System Design', slug: 'system-design', category: 'Engineering' },
  { name: 'Microservices', slug: 'microservices', category: 'Engineering' },
  { name: 'Distributed Systems', slug: 'distributed-systems', category: 'Engineering' },
  { name: 'WebAssembly', slug: 'webassembly', category: 'Engineering' },

  // Testing & Quality (8)
  { name: 'Jest', slug: 'jest', category: 'Testing & Quality' },
  { name: 'Playwright', slug: 'playwright', category: 'Testing & Quality' },
  { name: 'Cypress', slug: 'cypress', category: 'Testing & Quality' },
  { name: 'Vitest', slug: 'vitest', category: 'Testing & Quality' },
  { name: 'Unit Testing', slug: 'unit-testing', category: 'Testing & Quality' },
  { name: 'Integration Testing', slug: 'integration-testing', category: 'Testing & Quality' },
  { name: 'E2E Testing', slug: 'e2e-testing', category: 'Testing & Quality' },
  { name: 'Debugging', slug: 'debugging', category: 'Testing & Quality' },

  // Developer Tooling (10)
  { name: 'Webpack', slug: 'webpack', category: 'Developer Tooling' },
  { name: 'Vite', slug: 'vite', category: 'Developer Tooling' },
  { name: 'Turborepo', slug: 'turborepo', category: 'Developer Tooling' },
  { name: 'ESLint', slug: 'eslint', category: 'Developer Tooling' },
  { name: 'Prettier', slug: 'prettier', category: 'Developer Tooling' },
  { name: 'Bash', slug: 'bash', category: 'Developer Tooling' },
  { name: 'Shell Scripting', slug: 'shell-scripting', category: 'Developer Tooling' },
  { name: 'Performance Optimization', slug: 'performance-optimization', category: 'Developer Tooling' },
  { name: 'Observability', slug: 'observability', category: 'Developer Tooling' },
  { name: 'Accessibility', slug: 'accessibility', category: 'Developer Tooling' },

  // AI / ML / LLM (16)
  { name: 'Machine Learning', slug: 'machine-learning', category: 'AI / ML / LLM' },
  { name: 'Large Language Models', slug: 'large-language-models', category: 'AI / ML / LLM' },
  { name: 'Prompt Engineering', slug: 'prompt-engineering', category: 'AI / ML / LLM' },
  { name: 'AI Agents', slug: 'ai-agents', category: 'AI / ML / LLM' },
  { name: 'RAG', slug: 'rag', category: 'AI / ML / LLM' },
  { name: 'PyTorch', slug: 'pytorch', category: 'AI / ML / LLM' },
  { name: 'TensorFlow', slug: 'tensorflow', category: 'AI / ML / LLM' },
  { name: 'LangChain', slug: 'langchain', category: 'AI / ML / LLM' },
  { name: 'OpenAI API', slug: 'openai-api', category: 'AI / ML / LLM' },
  { name: 'Fine-tuning', slug: 'fine-tuning', category: 'AI / ML / LLM' },
  { name: 'NLP', slug: 'nlp', category: 'AI / ML / LLM' },
  { name: 'Computer Vision', slug: 'computer-vision', category: 'AI / ML / LLM' },
  { name: 'Vector Databases', slug: 'vector-databases', category: 'AI / ML / LLM' },
  { name: 'Model Evaluation', slug: 'model-evaluation', category: 'AI / ML / LLM' },
  { name: 'AI Safety', slug: 'ai-safety', category: 'AI / ML / LLM' },
  { name: 'GPU Computing', slug: 'gpu-computing', category: 'AI / ML / LLM' },

  // Design (12)
  { name: 'Figma', slug: 'figma', category: 'Design' },
  { name: 'UI Design', slug: 'ui-design', category: 'Design' },
  { name: 'UX Design', slug: 'ux-design', category: 'Design' },
  { name: 'Interaction Design', slug: 'interaction-design', category: 'Design' },
  { name: 'Design Systems', slug: 'design-systems', category: 'Design' },
  { name: 'Prototyping', slug: 'prototyping', category: 'Design' },
  { name: 'User Research', slug: 'user-research', category: 'Design' },
  { name: 'Wireframing', slug: 'wireframing', category: 'Design' },
  { name: 'Illustration', slug: 'illustration', category: 'Design' },
  { name: 'Motion Design', slug: 'motion-design', category: 'Design' },
  { name: 'Brand Identity', slug: 'brand-identity', category: 'Design' },
  { name: 'Design Thinking', slug: 'design-thinking', category: 'Design' },

  // Marketing (10)
  { name: 'SEO', slug: 'seo', category: 'Marketing' },
  { name: 'Content Marketing', slug: 'content-marketing', category: 'Marketing' },
  { name: 'Email Marketing', slug: 'email-marketing', category: 'Marketing' },
  { name: 'Paid Ads', slug: 'paid-ads', category: 'Marketing' },
  { name: 'Social Media Marketing', slug: 'social-media-marketing', category: 'Marketing' },
  { name: 'Growth Hacking', slug: 'growth-hacking', category: 'Marketing' },
  { name: 'Analytics', slug: 'analytics', category: 'Marketing' },
  { name: 'Copywriting', slug: 'copywriting', category: 'Marketing' },
  { name: 'Brand Strategy', slug: 'brand-strategy', category: 'Marketing' },
  { name: 'Market Research', slug: 'market-research', category: 'Marketing' },

  // Data (12)
  { name: 'SQL', slug: 'sql', category: 'Data' },
  { name: 'Data Analysis', slug: 'data-analysis', category: 'Data' },
  { name: 'Data Visualization', slug: 'data-visualization', category: 'Data' },
  { name: 'Pandas', slug: 'pandas', category: 'Data' },
  { name: 'NumPy', slug: 'numpy', category: 'Data' },
  { name: 'Power BI', slug: 'power-bi', category: 'Data' },
  { name: 'Tableau', slug: 'tableau', category: 'Data' },
  { name: 'Statistics', slug: 'statistics', category: 'Data' },
  { name: 'Apache Spark', slug: 'apache-spark', category: 'Data' },
  { name: 'ETL Pipelines', slug: 'etl-pipelines', category: 'Data' },
  { name: 'dbt', slug: 'dbt', category: 'Data' },
  { name: 'BigQuery', slug: 'bigquery', category: 'Data' },
  { name: 'Kafka', slug: 'kafka', category: 'Data' },
  { name: 'Snowflake', slug: 'snowflake', category: 'Data' },
  { name: 'Apache Flink', slug: 'apache-flink', category: 'Data' },
  { name: 'Hadoop', slug: 'hadoop', category: 'Data' },

  // DevOps & Infrastructure (14)
  { name: 'CI/CD', slug: 'ci-cd', category: 'DevOps & Infrastructure' },
  { name: 'Terraform', slug: 'terraform', category: 'DevOps & Infrastructure' },
  { name: 'Ansible', slug: 'ansible', category: 'DevOps & Infrastructure' },
  { name: 'Linux', slug: 'linux', category: 'DevOps & Infrastructure' },
  { name: 'Nginx', slug: 'nginx', category: 'DevOps & Infrastructure' },
  { name: 'Networking', slug: 'networking', category: 'DevOps & Infrastructure' },
  { name: 'Cloud Architecture', slug: 'cloud-architecture', category: 'DevOps & Infrastructure' },
  { name: 'GCP', slug: 'gcp', category: 'DevOps & Infrastructure' },
  { name: 'Azure', slug: 'azure', category: 'DevOps & Infrastructure' },
  { name: 'GitHub Actions', slug: 'github-actions', category: 'DevOps & Infrastructure' },
  { name: 'Helm', slug: 'helm', category: 'DevOps & Infrastructure' },
  { name: 'Prometheus', slug: 'prometheus', category: 'DevOps & Infrastructure' },
  { name: 'Grafana', slug: 'grafana', category: 'DevOps & Infrastructure' },
  { name: 'Serverless', slug: 'serverless', category: 'DevOps & Infrastructure' },

  // Security & Identity (6)
  { name: 'Security', slug: 'security', category: 'Security & Identity' },
  { name: 'OAuth', slug: 'oauth', category: 'Security & Identity' },
  { name: 'SSO', slug: 'sso', category: 'Security & Identity' },
  { name: 'RBAC', slug: 'rbac', category: 'Security & Identity' },
  { name: 'Encryption', slug: 'encryption', category: 'Security & Identity' },
  { name: 'Application Security', slug: 'application-security', category: 'Security & Identity' },

  // Product (11)
  { name: 'Product Strategy', slug: 'product-strategy', category: 'Product' },
  { name: 'Roadmapping', slug: 'roadmapping', category: 'Product' },
  { name: 'Agile', slug: 'agile', category: 'Product' },
  { name: 'Scrum', slug: 'scrum', category: 'Product' },
  { name: 'User Stories', slug: 'user-stories', category: 'Product' },
  { name: 'A/B Testing', slug: 'ab-testing', category: 'Product' },
  { name: 'Product Analytics', slug: 'product-analytics', category: 'Product' },
  { name: 'Stakeholder Management', slug: 'stakeholder-management', category: 'Product' },
  { name: 'Prioritization', slug: 'prioritization', category: 'Product' },
  { name: 'OKRs', slug: 'okrs', category: 'Product' },
  { name: 'Competitive Analysis', slug: 'competitive-analysis', category: 'Product' },

  // Other (10)
  { name: 'Project Management', slug: 'project-management', category: 'Other' },
  { name: 'Technical Writing', slug: 'technical-writing', category: 'Other' },
  { name: 'Customer Success', slug: 'customer-success', category: 'Other' },
  { name: 'Sales', slug: 'sales', category: 'Other' },
  { name: 'Finance', slug: 'finance', category: 'Other' },
  { name: 'Legal', slug: 'legal', category: 'Other' },
  { name: 'Operations', slug: 'operations', category: 'Other' },
  { name: 'HR', slug: 'hr', category: 'Other' },
  { name: 'Leadership', slug: 'leadership', category: 'Other' },
  { name: 'Communication', slug: 'communication', category: 'Other' },
];

const SYSTEM_USER_ID = 'system-ats-user';

async function main() {
  const result = await prisma.skill.createMany({
    data: SKILLS,
    skipDuplicates: true,
  });
  console.log(`Seeded ${result.count} skills (${SKILLS.length} total, duplicates skipped)`);

  // Seed alias for Apache Spark — canonical name won't match bare "Spark" in JD text
  await prisma.skill.upsert({
    where: { name: 'Apache Spark' },
    create: { name: 'Apache Spark', slug: 'apache-spark', category: 'Data', aliases: ['spark'] },
    update: { aliases: ['spark'] },
  });
  console.log('Apache Spark alias seeded: spark');

  // Ghost user required by Job.recruiterId FK — all ATS-imported jobs are owned by this row.
  await prisma.user.upsert({
    where: { id: SYSTEM_USER_ID },
    create: {
      id: SYSTEM_USER_ID,
      name: 'ATS System',
      email: 'system@hiretivo.com',
      isAdmin: true,
    },
    update: {},
  });
  console.log(`System ATS user ensured: ${SYSTEM_USER_ID}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
