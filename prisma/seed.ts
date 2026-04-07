import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL is not set');
}

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

const SKILLS = [
  // Engineering (22)
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
  { name: 'Next.js', slug: 'next-js', category: 'Engineering' },
  { name: 'GraphQL', slug: 'graphql', category: 'Engineering' },
  { name: 'REST API', slug: 'rest-api', category: 'Engineering' },
  { name: 'PostgreSQL', slug: 'postgresql', category: 'Engineering' },
  { name: 'MySQL', slug: 'mysql', category: 'Engineering' },
  { name: 'MongoDB', slug: 'mongodb', category: 'Engineering' },
  { name: 'Redis', slug: 'redis', category: 'Engineering' },
  { name: 'Docker', slug: 'docker', category: 'Engineering' },
  { name: 'Kubernetes', slug: 'kubernetes', category: 'Engineering' },
  { name: 'AWS', slug: 'aws', category: 'Engineering' },
  { name: 'Git', slug: 'git', category: 'Engineering' },
  { name: 'System Design', slug: 'system-design', category: 'Engineering' },

  // Design (12)
  { name: 'Figma', slug: 'figma', category: 'Design' },
  { name: 'UI Design', slug: 'ui-design', category: 'Design' },
  { name: 'UX Design', slug: 'ux-design', category: 'Design' },
  { name: 'Interaction Design', slug: 'interaction-design', category: 'Design' },
  { name: 'Design Systems', slug: 'design-systems', category: 'Design' },
  { name: 'Prototyping', slug: 'prototyping', category: 'Design' },
  { name: 'User Research', slug: 'user-research', category: 'Design' },
  { name: 'Wireframing', slug: 'wireframing', category: 'Design' },
  { name: 'Adobe XD', slug: 'adobe-xd', category: 'Design' },
  { name: 'Illustration', slug: 'illustration', category: 'Design' },
  { name: 'Motion Design', slug: 'motion-design', category: 'Design' },
  { name: 'Brand Identity', slug: 'brand-identity', category: 'Design' },

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

  // Data (10)
  { name: 'SQL', slug: 'sql', category: 'Data' },
  { name: 'Python', slug: 'python-data', category: 'Data' },
  { name: 'Data Analysis', slug: 'data-analysis', category: 'Data' },
  { name: 'Machine Learning', slug: 'machine-learning', category: 'Data' },
  { name: 'Data Visualization', slug: 'data-visualization', category: 'Data' },
  { name: 'Pandas', slug: 'pandas', category: 'Data' },
  { name: 'NumPy', slug: 'numpy', category: 'Data' },
  { name: 'Power BI', slug: 'power-bi', category: 'Data' },
  { name: 'Tableau', slug: 'tableau', category: 'Data' },
  { name: 'Statistics', slug: 'statistics', category: 'Data' },

  // DevOps (10)
  { name: 'CI/CD', slug: 'ci-cd', category: 'DevOps' },
  { name: 'Terraform', slug: 'terraform', category: 'DevOps' },
  { name: 'Ansible', slug: 'ansible', category: 'DevOps' },
  { name: 'Linux', slug: 'linux', category: 'DevOps' },
  { name: 'Nginx', slug: 'nginx', category: 'DevOps' },
  { name: 'Monitoring', slug: 'monitoring', category: 'DevOps' },
  { name: 'Logging', slug: 'logging', category: 'DevOps' },
  { name: 'Security', slug: 'security', category: 'DevOps' },
  { name: 'Networking', slug: 'networking', category: 'DevOps' },
  { name: 'Cloud Architecture', slug: 'cloud-architecture', category: 'DevOps' },

  // Product (11)
  { name: 'Product Strategy', slug: 'product-strategy', category: 'Product' },
  { name: 'Roadmapping', slug: 'roadmapping', category: 'Product' },
  { name: 'Agile', slug: 'agile', category: 'Product' },
  { name: 'Scrum', slug: 'scrum', category: 'Product' },
  { name: 'User Stories', slug: 'user-stories', category: 'Product' },
  { name: "A/B Testing", slug: 'ab-testing', category: 'Product' },
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

async function main() {
  const result = await prisma.skill.createMany({
    data: SKILLS,
    skipDuplicates: true,
  });
  console.log(`Seeded ${result.count} skills (${SKILLS.length} total, duplicates skipped)`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
