// Symmetry data for OrbitMatch. Every entry is an equivalence class ("orbit") of surface strings
// that mean the same thing to a human reader. Edit these tables, not the engine, to improve matching.
// Aliases are stored already normalized (lowercase, single spaces, no punctuation).

export interface Concept { id: string; aliases: string[]; }

export const SKILL_CONCEPTS: Concept[] = [
  { id: "data analysis", aliases: ["data analysis", "data analytics", "data analyst", "analysing data", "analyzing data", "data analysis skills", "statistical analysis", "data handling"] },
  { id: "excel", aliases: ["excel", "ms excel", "microsoft excel", "spreadsheets", "spreadsheet", "google sheets"] },
  { id: "sql", aliases: ["sql", "mysql", "postgresql", "postgres", "databases", "database management"] },
  { id: "javascript", aliases: ["javascript", "js", "typescript", "ecmascript", "node js", "nodejs", "react", "reactjs", "react js"] },
  { id: "python", aliases: ["python", "python programming", "py"] },
  { id: "software development", aliases: ["software development", "software engineering", "programming", "coding", "web development", "app development", "full stack development"] },
  { id: "communication", aliases: ["communication", "communications", "communication skills", "written communication", "verbal communication", "public speaking", "presentation skills", "interpersonal skills"] },
  { id: "research", aliases: ["research", "research skills", "desk research", "field research", "literature review", "qualitative research", "quantitative research", "research methods"] },
  { id: "report writing", aliases: ["report writing", "writing reports", "technical writing", "report drafting", "documentation", "writing"] },
  { id: "leadership", aliases: ["leadership", "team leadership", "leading teams", "team lead", "people management"] },
  { id: "programme coordination", aliases: ["programme coordination", "program coordination", "project coordination", "programme management", "program management", "project management", "programme support", "program support", "project support", "project planning"] },
  { id: "administration", aliases: ["administration", "office administration", "administrative support", "admin support", "secretarial"] },
  { id: "bookkeeping", aliases: ["bookkeeping", "book keeping", "accounting", "accounts", "quickbooks", "financial reporting", "tally"] },
  { id: "financial modelling", aliases: ["financial modelling", "financial modeling", "financial planning", "budgeting", "financial analysis"] },
  { id: "monitoring and evaluation", aliases: ["monitoring and evaluation", "monitoring", "m e", "m and e", "me", "impact evaluation", "evaluation", "monitoring evaluation"] },
  { id: "digital literacy", aliases: ["digital literacy", "computer literacy", "ict skills", "computer skills", "ms office", "microsoft office"] },
  { id: "it support", aliases: ["information technology", "it support", "systems administration", "system administration", "network administration", "helpdesk", "technical support"] },
  { id: "cybersecurity", aliases: ["cybersecurity", "cyber security", "information security", "infosec"] },
  { id: "data management", aliases: ["data management", "data entry", "data collection", "data cleaning", "data quality"] },
  { id: "proposal writing", aliases: ["proposal writing", "grant writing", "grant proposals", "concept notes", "fundraising"] },
  { id: "entrepreneurship", aliases: ["entrepreneurship", "business development", "business strategy", "startup", "business planning"] },
  { id: "market research", aliases: ["market research", "market analysis", "market information"] },
  { id: "procurement", aliases: ["procurement", "supply chain management", "supply chain", "logistics", "contract management"] },
  { id: "agronomy", aliases: ["agronomy", "crop management", "crop production", "farm management", "soil management", "agriculture extension"] },
  { id: "community engagement", aliases: ["community engagement", "community mobilisation", "community mobilization", "community outreach", "community service", "volunteering", "outreach"] },
  { id: "social media", aliases: ["social media", "social media management", "content creation", "digital marketing", "copywriting", "copy editing"] },
  { id: "event logistics", aliases: ["event logistics", "event planning", "events management", "event coordination"] },
  { id: "teamwork", aliases: ["teamwork", "collaboration", "team player", "working in teams"] },
  { id: "organization", aliases: ["organization", "organisation", "organizational skills", "time management", "planning"] },
  { id: "academic excellence", aliases: ["academic excellence", "academic performance", "high gpa", "first class"] },
];

// Symmetric soft links between different concepts: the orbit of "nearly the same skill".
export const SKILL_RELATIONS: Array<[string, string, number]> = [
  ["data analysis", "excel", 0.5], ["data analysis", "sql", 0.5], ["data analysis", "data management", 0.6],
  ["data analysis", "research", 0.35], ["excel", "data management", 0.4], ["excel", "bookkeeping", 0.3],
  ["javascript", "software development", 0.7], ["python", "software development", 0.7], ["javascript", "python", 0.4],
  ["sql", "data management", 0.4], ["report writing", "communication", 0.4], ["report writing", "research", 0.3],
  ["programme coordination", "administration", 0.4], ["programme coordination", "leadership", 0.3],
  ["programme coordination", "monitoring and evaluation", 0.4], ["programme coordination", "event logistics", 0.4],
  ["bookkeeping", "financial modelling", 0.5], ["it support", "cybersecurity", 0.4], ["it support", "digital literacy", 0.5],
  ["proposal writing", "report writing", 0.5], ["entrepreneurship", "market research", 0.4], ["procurement", "administration", 0.3],
  ["community engagement", "communication", 0.3], ["social media", "communication", 0.5], ["organization", "administration", 0.4],
  ["teamwork", "leadership", 0.3], ["monitoring and evaluation", "research", 0.4], ["monitoring and evaluation", "data analysis", 0.4],
];

export const FIELD_CONCEPTS: Concept[] = [
  { id: "computer science", aliases: ["computer science", "computing", "cs", "software engineering", "information technology", "it", "information systems", "computer engineering", "informatics"] },
  { id: "data science", aliases: ["data science", "statistics", "applied statistics", "artificial intelligence", "mathematics", "actuarial science"] },
  { id: "business", aliases: ["business administration", "business", "commerce", "management", "business management", "supply chain management", "procurement"] },
  { id: "economics", aliases: ["economics", "development economics", "agricultural economics", "applied economics"] },
  { id: "finance", aliases: ["finance", "accounting", "banking", "banking and finance", "finance and accounting"] },
  { id: "public health", aliases: ["public health", "nursing", "medicine", "community health", "health sciences", "clinical medicine"] },
  { id: "agriculture", aliases: ["agriculture", "agribusiness", "agronomy", "agricultural science", "crop science", "animal science"] },
  { id: "environment", aliases: ["environmental science", "ecology", "natural sciences", "environmental management", "forestry", "sustainable development", "natural resource management", "geography"] },
  { id: "social sciences", aliases: ["social sciences", "sociology", "social work", "social work and social administration", "development studies", "anthropology", "psychology", "international relations", "public administration", "political science"] },
  { id: "communications", aliases: ["journalism", "communications", "mass communication", "media studies", "public relations", "media"] },
  { id: "education", aliases: ["education", "teaching", "education science"] },
  { id: "law", aliases: ["law", "legal studies"] },
  { id: "engineering", aliases: ["engineering", "civil engineering", "electrical engineering", "mechanical engineering"] },
];

export const FIELD_RELATIONS: Array<[string, string, number]> = [
  ["computer science", "data science", 0.6], ["data science", "economics", 0.4], ["economics", "finance", 0.7], ["finance", "business", 0.7],
  ["economics", "business", 0.5], ["economics", "agriculture", 0.4], ["public health", "social sciences", 0.5], ["social sciences", "communications", 0.4],
  ["social sciences", "education", 0.4], ["social sciences", "economics", 0.4], ["social sciences", "business", 0.3], ["agriculture", "environment", 0.6],
  ["computer science", "engineering", 0.4], ["public health", "data science", 0.3], ["social sciences", "law", 0.3], ["computer science", "business", 0.25],
];

// Location hierarchy: child -> parent. Siblings inherit partial credit through a shared parent.
export const LOCATION_PARENT: Record<string, string> = {
  kampala: "central", wakiso: "central", mukono: "central", entebbe: "central", matugga: "central", masaka: "central",
  jinja: "eastern", mbale: "eastern", tororo: "eastern", busia: "eastern", iganga: "eastern", soroti: "eastern",
  gulu: "northern", lira: "northern", arua: "northern", kitgum: "northern",
  mbarara: "western", "fort portal": "western", kabale: "western", kasese: "western", hoima: "western",
  central: "uganda", eastern: "uganda", northern: "uganda", western: "uganda",
};
// Short-hop travel pairs treated as one commuting zone.
export const COMMUTE_ZONES: string[][] = [["kampala", "wakiso", "mukono", "entebbe", "matugga"], ["jinja", "iganga"]];
