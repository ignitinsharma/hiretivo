export interface ResumeContact {
  email: string;
  location: string;
  websiteUrl: string;
  linkedinUrl: string;
  githubUrl: string;
}

export interface ResumeSkillGroup {
  category: string;
  skills: string[];
}

export interface ResumeExperience {
  title: string;
  company: string;
  startDate: string;
  endDate: string;
  isCurrent: boolean;
  bullets: string[];
}

export interface ResumeEducation {
  institution: string;
  degree: string;
  major: string;
  graduationDate: string;
}

export interface ResumeCertification {
  name: string;
  issuer: string;
  issueDate: string;
}

export interface ResumeProject {
  title: string;
  url: string;
  description: string;
}

export interface ResumeDocument {
  fullName: string;
  headline: string;
  contact: ResumeContact;
  summary: string;
  skillGroups: ResumeSkillGroup[];
  experience: ResumeExperience[];
  education: ResumeEducation[];
  certifications: ResumeCertification[];
  projects: ResumeProject[];
}
