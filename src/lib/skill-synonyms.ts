/*
 * skill-synonyms
 * Canonical slug resolution for skill normalization.
 * Prevents duplicate Skill rows when users type aliases (JS, js, javascript → javascript).
 * All canonical targets match slugs in prisma/seed.ts.
 *
 * Alias slugs are what slugifySkillInput() produces from user input:
 * lowercase, spaces→hyphens, special chars handled (+ → plus, # → sharp).
 */

const SKILL_SYNONYMS: Record<string, string> = {

  // ─── JavaScript ───────────────────────────────────────────────────────────
  'js':                         'javascript',
  'es6':                        'javascript',
  'es2015':                     'javascript',
  'es2016':                     'javascript',
  'es2017':                     'javascript',
  'es2018':                     'javascript',
  'es2019':                     'javascript',
  'es2020':                     'javascript',
  'es2021':                     'javascript',
  'es2022':                     'javascript',
  'es2023':                     'javascript',
  'esnext':                     'javascript',
  'ecmascript':                 'javascript',
  'vanilla-js':                 'javascript',
  'vanillajs':                  'javascript',

  // ─── TypeScript ───────────────────────────────────────────────────────────
  'ts':                         'typescript',

  // ─── Node.js ──────────────────────────────────────────────────────────────
  'node':                       'node-js',
  'nodejs':                     'node-js',
  'node-js':                    'node-js',         // idempotent

  // ─── Python ───────────────────────────────────────────────────────────────
  'py':                         'python',
  'python3':                    'python',
  'py3':                        'python',
  'python-3':                   'python',

  // ─── Go ───────────────────────────────────────────────────────────────────
  'golang':                     'go',
  'go-lang':                    'go',

  // ─── Rust ─────────────────────────────────────────────────────────────────
  'rust-lang':                  'rust',

  // ─── Java ─────────────────────────────────────────────────────────────────
  'java-programming':           'java',

  // ─── C++ ──────────────────────────────────────────────────────────────────
  'cpp':                        'c-plus-plus',
  'cxx':                        'c-plus-plus',
  'cplusplus':                  'c-plus-plus',
  'c-plus-plus':                'c-plus-plus',     // idempotent

  // ─── C# ───────────────────────────────────────────────────────────────────
  'csharp':                     'c-sharp',
  'c-sharp':                    'c-sharp',         // idempotent
  'cs':                         'c-sharp',

  // ─── React ────────────────────────────────────────────────────────────────
  'reactjs':                    'react',
  'react-js':                   'react',

  // ─── Next.js ──────────────────────────────────────────────────────────────
  'nextjs':                     'next-js',
  'next-js':                    'next-js',         // idempotent

  // ─── GraphQL ──────────────────────────────────────────────────────────────
  'gql':                        'graphql',
  'graphql-api':                'graphql',

  // ─── REST API ─────────────────────────────────────────────────────────────
  'rest':                       'rest-api',
  'restful':                    'rest-api',
  'rest-api':                   'rest-api',        // idempotent
  'restapi':                    'rest-api',
  'rest-apis':                  'rest-api',
  'http-api':                   'rest-api',

  // ─── PostgreSQL ───────────────────────────────────────────────────────────
  'postgres':                   'postgresql',
  'psql':                       'postgresql',
  'pg':                         'postgresql',

  // ─── MySQL ────────────────────────────────────────────────────────────────
  'mysqldb':                    'mysql',
  'mysql-database':             'mysql',

  // ─── MongoDB ──────────────────────────────────────────────────────────────
  'mongo':                      'mongodb',

  // ─── Kubernetes ───────────────────────────────────────────────────────────
  'k8s':                        'kubernetes',
  'kube':                       'kubernetes',

  // ─── AWS ──────────────────────────────────────────────────────────────────
  'amazon-web-services':        'aws',
  'aws-cloud':                  'aws',

  // ─── Git ──────────────────────────────────────────────────────────────────
  'github':                     'git',
  'gitlab':                     'git',
  'source-control':             'git',
  'version-control':            'git',

  // ─── System Design ────────────────────────────────────────────────────────
  'systems-design':             'system-design',
  'system-architecture':        'system-design',
  'high-level-design':          'system-design',

  // ─── Terraform ────────────────────────────────────────────────────────────
  'tf':                         'terraform',
  'terraform-iac':              'terraform',

  // ─── CI/CD ────────────────────────────────────────────────────────────────
  'cicd':                       'ci-cd',
  'ci-cd':                      'ci-cd',           // idempotent
  'continuous-integration':     'ci-cd',
  'continuous-delivery':        'ci-cd',
  'continuous-deployment':      'ci-cd',
  'jenkins':                    'ci-cd',
  'github-actions':             'ci-cd',
  'gitlab-ci':                  'ci-cd',
  'circleci':                   'ci-cd',

  // ─── Linux ────────────────────────────────────────────────────────────────
  'linux-administration':       'linux',
  'ubuntu':                     'linux',
  'debian':                     'linux',
  'redhat':                     'linux',
  'rhel':                       'linux',
  'centos':                     'linux',

  // ─── Monitoring ───────────────────────────────────────────────────────────
  'prometheus':                 'monitoring',
  'grafana':                    'monitoring',
  'datadog':                    'monitoring',
  'system-monitoring':          'monitoring',
  'infrastructure-monitoring':  'monitoring',

  // ─── Logging ──────────────────────────────────────────────────────────────
  'log-management':             'logging',
  'elk-stack':                  'logging',
  'logstash':                   'logging',
  'centralized-logging':        'logging',

  // ─── Security ─────────────────────────────────────────────────────────────
  'cybersecurity':              'security',
  'infosec':                    'security',
  'appsec':                     'security',
  'application-security':       'security',
  'information-security':       'security',
  'network-security':           'security',

  // ─── Cloud Architecture ───────────────────────────────────────────────────
  'cloud-infrastructure':       'cloud-architecture',
  'cloud-computing':            'cloud-architecture',

  // ─── Machine Learning ─────────────────────────────────────────────────────
  'ml':                         'machine-learning',
  'ai':                         'machine-learning',
  'deep-learning':              'machine-learning',
  'neural-networks':            'machine-learning',
  'artificial-intelligence':    'machine-learning',
  'ai-ml':                      'machine-learning',

  // ─── SQL ──────────────────────────────────────────────────────────────────
  'structured-query-language':  'sql',

  // ─── Data Analysis ────────────────────────────────────────────────────────
  'data-analytics':             'data-analysis',
  'exploratory-analysis':       'data-analysis',
  'statistical-analysis':       'data-analysis',

  // ─── Data Visualization ───────────────────────────────────────────────────
  'data-viz':                   'data-visualization',
  'dataviz':                    'data-visualization',
  'visualization':              'data-visualization',

  // ─── Power BI ─────────────────────────────────────────────────────────────
  'powerbi':                    'power-bi',
  'power-bi':                   'power-bi',        // idempotent
  'microsoft-power-bi':         'power-bi',

  // ─── Statistics ───────────────────────────────────────────────────────────
  'stats':                      'statistics',
  'statistical-methods':        'statistics',

  // ─── UI Design ────────────────────────────────────────────────────────────
  'user-interface':             'ui-design',
  'interface-design':           'ui-design',
  'visual-design':              'ui-design',

  // ─── UX Design ────────────────────────────────────────────────────────────
  'ux':                         'ux-design',
  'user-experience':            'ux-design',
  'experience-design':          'ux-design',

  // ─── Interaction Design ───────────────────────────────────────────────────
  'ixd':                        'interaction-design',
  'user-interaction':           'interaction-design',

  // ─── Design Systems ───────────────────────────────────────────────────────
  'design-system':              'design-systems',  // singular → plural

  // ─── Wireframing ──────────────────────────────────────────────────────────
  'wireframe':                  'wireframing',
  'wireframes':                 'wireframing',

  // ─── Adobe XD ─────────────────────────────────────────────────────────────
  'adobexd':                    'adobe-xd',
  'xd':                         'adobe-xd',
  'adobe-experience-design':    'adobe-xd',

  // ─── Motion Design ────────────────────────────────────────────────────────
  'motion-graphics':            'motion-design',
  'ui-animation':               'motion-design',

  // ─── Brand Identity ───────────────────────────────────────────────────────
  'visual-identity':            'brand-identity',
  'brand-design':               'brand-identity',

  // ─── SEO ──────────────────────────────────────────────────────────────────
  'search-engine-optimization': 'seo',
  'search-optimization':        'seo',
  'technical-seo':              'seo',

  // ─── Paid Ads ─────────────────────────────────────────────────────────────
  'ppc':                        'paid-ads',
  'pay-per-click':              'paid-ads',
  'google-ads':                 'paid-ads',
  'paid-advertising':           'paid-ads',
  'paid-search':                'paid-ads',
  'sem':                        'paid-ads',

  // ─── Social Media Marketing ───────────────────────────────────────────────
  'smm':                        'social-media-marketing',
  'social-media':               'social-media-marketing',
  'social-marketing':           'social-media-marketing',

  // ─── Growth Hacking ───────────────────────────────────────────────────────
  'growth':                     'growth-hacking',
  'growth-marketing':           'growth-hacking',
  'growth-strategy':            'growth-hacking',
  'user-acquisition':           'growth-hacking',

  // ─── Analytics ────────────────────────────────────────────────────────────
  'google-analytics':           'analytics',
  'web-analytics':              'analytics',
  'ga':                         'analytics',

  // ─── Agile ────────────────────────────────────────────────────────────────
  'agile-methodology':          'agile',
  'agile-development':          'agile',
  'agile-process':              'agile',

  // ─── Scrum ────────────────────────────────────────────────────────────────
  'scrum-framework':            'scrum',
  'scrum-methodology':          'scrum',

  // ─── A/B Testing ──────────────────────────────────────────────────────────
  'a-b-testing':                'ab-testing',
  'split-testing':              'ab-testing',
  'ab-testing':                 'ab-testing',      // idempotent
  'experiment-testing':         'ab-testing',

  // ─── OKRs ─────────────────────────────────────────────────────────────────
  'okr':                        'okrs',
  'objectives-and-key-results': 'okrs',

  // ─── Prioritization ───────────────────────────────────────────────────────
  'prioritisation':             'prioritization',  // British spelling

  // ─── Roadmapping ──────────────────────────────────────────────────────────
  'roadmap':                    'roadmapping',
  'product-roadmap':            'roadmapping',

  // ─── Competitive Analysis ─────────────────────────────────────────────────
  'competitor-analysis':        'competitive-analysis',
  'competitive-intelligence':   'competitive-analysis',
  'competitive-research':       'competitive-analysis',

  // ─── HR ───────────────────────────────────────────────────────────────────
  'human-resources':            'hr',
  'people-ops':                 'hr',
  'people-operations':          'hr',

  // ─── Operations ───────────────────────────────────────────────────────────
  'ops':                        'operations',
  'business-operations':        'operations',

  // ─── Technical Writing ────────────────────────────────────────────────────
  'technical-documentation':    'technical-writing',
  'api-documentation':          'technical-writing',
  'documentation':              'technical-writing',
  'technical-docs':             'technical-writing',
  'tech-writing':               'technical-writing',

  // ─── Leadership ───────────────────────────────────────────────────────────
  'team-leadership':            'leadership',
  'people-leadership':          'leadership',
  'executive-leadership':       'leadership',

  // ─── Project Management ───────────────────────────────────────────────────
  'pm':                         'project-management',
  'project-planning':           'project-management',
  'project-coordination':       'project-management',
};

/*
 * slugifySkillInput
 * Converts raw user input into a normalized URL-safe slug.
 * Handles special characters: C++ → c-plus-plus, C# → c-sharp.
 * Returns a codepoint-based fallback for edge-case empty results.
 */
export function slugifySkillInput(name: string): string {
  const normalized = name.trim().replace(/\s+/g, ' ');
  const slug = normalized
    .toLowerCase()
    .replace(/\+/g, ' plus ')
    .replace(/#/g, ' sharp ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  return slug || `skill-${Array.from(normalized)
    .map((ch) => ch.codePointAt(0)?.toString(36) ?? '')
    .filter(Boolean)
    .join('-')}`;
}

/*
 * resolveCanonicalSlug
 * Maps an input slug to its canonical form via the synonym dictionary.
 * Returns the input unchanged when no synonym is found.
 */
export function resolveCanonicalSlug(slug: string): string {
  return SKILL_SYNONYMS[slug] ?? slug;
}
