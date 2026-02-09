export type SchoolYearMode = 'semester' | 'trimester';

export type EvaluationType = 'interro' | 'devoir';

export type StudentStatus = 'active' | 'archived';

export type PeriodType = 'semester' | 'trimester' | 'custom';

export interface Teacher {
  id: string;
  email: string;
  passwordHash: string;
  firstName: string;
  lastName: string;
  createdAt: Date;
}

export interface SchoolYear {
  id: string;
  name: string;
  mode: SchoolYearMode;
  createdAt: Date;
  isActive: boolean;
}

export interface Student {
  id: string;
  firstName: string;
  lastName: string;
  studentId: string;
  status: StudentStatus;
}

export interface ClassRoom {
  id: string;
  name: string;
  schoolYearId: string;
  students: Student[];
  createdAt: Date;
}

export interface GradeRule {
  coefficient: number;
  coefficientEnabled: boolean;
  expectedInterros: number;
  expectedDevoirs: number;
  formula: string;
  displayMode: 'numeric' | 'letter' | 'percentage';
  interroWeight: number;
  devoirWeight: number;
}

export interface Period {
  id: string;
  name: string;
  pedagogicalUnitId: string;
  periodType: PeriodType;
  order: number;
  expectedDevoirs: number;
  expectedInterros: number;
  status: 'active' | 'locked' | 'completed';
  startDate?: Date;
  endDate?: Date;
  createdAt: Date;
}

export type CustomEventType = 'reunion' | 'conseil' | 'formation' | 'sortie' | 'autre';

export interface CustomCalendarEvent {
  id: string;
  title: string;
  description?: string;
  date: Date;
  endDate?: Date;
  eventType: CustomEventType;
  createdAt: Date;
}

export interface PedagogicalUnit {
  id: string;
  name: string;
  classRoomId: string;
  schoolYearId: string;
  rules: GradeRule;
  // Period system for this unit
  periodSystem: 'semester' | 'trimester' | 'none';
  createdAt: Date;
}

export interface Evaluation {
  id: string;
  name: string;
  pedagogicalUnitId: string;
  periodId: string; // Required - always linked to a period
  type: EvaluationType;
  coefficient: number;
  maxScore: number;
  date: Date;
}

export interface GradeHistory {
  value: number;
  modifiedAt: Date;
  reason: string;
}

export interface Grade {
  id: string;
  studentId: string;
  evaluationId: string;
  value: number;
  history: GradeHistory[];
  isLocked: boolean;
  createdAt: Date;
  modifiedAt?: Date;
}

export interface DashboardStats {
  totalYears: number;
  totalClasses: number;
  totalStudents: number;
  totalUnits: number;
}

// Data structure stored per teacher
export interface TeacherData {
  schoolYears: SchoolYear[];
  classRooms: ClassRoom[];
  pedagogicalUnits: PedagogicalUnit[];
  periods: Period[];
  evaluations: Evaluation[];
  grades: Grade[];
  customEvents: CustomCalendarEvent[];
  activeYearId: string | null;
  savedUnits: string[];
}
