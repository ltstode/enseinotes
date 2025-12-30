export type SchoolYearMode = 'semester' | 'trimester';

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
  formula: string;
  displayMode: 'numeric' | 'letter' | 'percentage';
}

export interface PedagogicalUnit {
  id: string;
  name: string;
  classRoomId: string;
  schoolYearId: string;
  rules: GradeRule;
  createdAt: Date;
}

export interface Evaluation {
  id: string;
  name: string;
  pedagogicalUnitId: string;
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
