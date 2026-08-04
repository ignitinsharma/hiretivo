export const SKILL_ALIASES: Record<string, string[]> = {
  'Node.js': ['nodejs', 'node js', 'node.js'],
  React: ['reactjs', 'react.js'],
  PostgreSQL: ['postgres', 'psql'],
  Kubernetes: ['k8s'],
  JavaScript: ['vanilla js', 'es6', 'es2015', 'es6+'],
  TypeScript: ['ts', 'typescript'],
  'CI/CD': ['cicd'],
  'Machine Learning': ['ml'],
  'Large Language Models': ['llm', 'llms'],
  'Retrieval-Augmented Generation': ['rag'],
  'Prompt Engineering': ['prompting', 'prompt design'],
  'AI Agents': ['agentic'],
  'Computer Vision': ['cv'],
  'Natural Language Processing': ['nlp'],
  'Data Visualization': ['dataviz'],
  'A/B Testing': ['ab testing', 'split testing'],
  'Distributed Systems': ['distributed computing'],
  Microservices: ['micro-services', 'microsservices'],
  Kotlin: ['kotlin'],
  SwiftUI: ['swift ui'],
  'React Native': ['reactnative'],
  'Tailwind CSS': ['tailwind'],
  'Vue.js': ['vuejs', 'vue'],
  Angular: ['angular', 'angular.js', 'angularjs'],
  Svelte: ['svelte'],
  WebAssembly: ['wasm'],
  Serverless: ['server-less'],
  Observability: ['o11y', 'opentelemetry'],
  Accessibility: ['a11y'],
  'REST API': ['restful', 'rest apis', 'rest api'],
  GraphQL: ['gql'],
  'Next.js': ['nextjs', 'next.js'],
  'GitHub Actions': ['github actions', 'gh actions'],
  Terraform: ['terraform', 'tf'],
  Docker: ['docker', 'containerization', 'container'],
};

function matchSkillName(name: string, lowerText: string, text: string): boolean {
  const aliasGroup = SKILL_ALIASES[name];
  if (aliasGroup) {
    for (const alias of aliasGroup) {
      if (lowerText.includes(alias)) return true;
    }
  }
  if (name.length < 4) {
    const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return new RegExp(`\\b${escaped}\\b`, 'i').test(text);
  }
  return lowerText.includes(name.toLowerCase());
}

export function extractSkillsFromText(
  text: string,
  skills: Array<{ id: string; name: string; aliases: string[] }>,
): string[] {
  const lowerText = text.toLowerCase();

  return skills
    .filter((skill) => {
      const namesToCheck = [skill.name, ...skill.aliases];
      return namesToCheck.some((name) => matchSkillName(name, lowerText, text));
    })
    .map((s) => s.name);
}
