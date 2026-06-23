// ============================================================
// KLE Platform — Type Definitions
// ============================================================

export type PriorityLevel = 'critical' | 'high' | 'medium' | 'low';
export type ObjectiveStatus = 'active' | 'monitoring' | 'closed';
export type InteractionType = 'meeting' | 'call' | 'event' | 'interview' | 'informal';
export type ReceptivityLevel = 'very_high' | 'high' | 'moderate' | 'low' | 'hostile';
export type AttitudeType = 'cooperative' | 'neutral' | 'reserved' | 'defensive' | 'hostile';
export type UserRole = 'analista' | 'autoridad';
export type AuthorityRequestType =
  | 'new-report'
  | 'report-update'
  | 'sociocultural-update'
  | 'behavior-update'
  | 'full-dossier';
export type AuthorityRequestStatus = 'pending' | 'drafting' | 'review' | 'done';
export type InteractionRating = 1 | 2 | 3 | 4 | 5;

export interface Objective {
  id: string;
  fullName: string;
  title: string;
  organization: string;
  country: string;
  project: string;
  priority: PriorityLevel;
  status: ObjectiveStatus;
  photoUrl?: string;
  biography: string;
  personalInterests: string[];
  professionalInterests: string[];
  analystNotes: string;
  createdAt: string;
  updatedAt: string;
}

export interface Interaction {
  id: string;
  objectiveId: string;
  date: string;
  location: string;
  type: InteractionType;
  analyst: string;
  topicsDiscussed: string[];
  attitude: AttitudeType;
  receptivity: ReceptivityLevel;
  detectedInterests: string[];
  risksAlerts: string[];
  nextSteps: string[];
  observations: string;
  createdAt: string;
}

export interface DocumentItem {
  id: string;
  objectiveId: string;
  name: string;
  type: 'document' | 'note' | 'report' | 'questionnaire' | 'evaluation' | 'file';
  description: string;
  dateUploaded: string;
  size: string;
  category: string;
}

export interface PersonalityAnalysis {
  objectiveId: string;
  executiveSummary: string;
  personalityProfile: string;
  socioculturalInterests: string;
  motivations: string;
  connectionPoints: string;
  communicationRisks: string;
  recommendations: string;
}

export interface AIMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  objectiveId?: string;
}

export interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  icon: string;
  sections: string[];
}

export interface Project {
  id: string;
  name: string;
  description: string;
  status: 'active' | 'completed' | 'archived';
  objectiveCount: number;
}

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

export interface AuthorityRequest {
  id: string;
  title: string;
  description: string;
  objectiveId: string;
  priority: PriorityLevel;
  dueDate: string;
  type: AuthorityRequestType;
  status: AuthorityRequestStatus;
  createdAt: string;
}

export interface AuthorityEvaluation {
  id: string;
  objectiveId: string;
  date: string;
  location: string;
  plannedObjective: string;
  actualResult: string;
  rating: InteractionRating;
  observations: string;
  createdAt: string;
}
