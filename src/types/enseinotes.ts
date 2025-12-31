export type SchoolYearMode = 'semester' | 'trimester';

export type EvaluationType = 'interro' | 'devoir';

export type StudentStatus = 'active' | 'archived';

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
  minInterros: number;
  minDevoirs: number;
  formula: string; // e.g., "(MoyInterros * 1 + MoyDevoirs * 2) / 3"
  displayMode: 'numeric' | 'letter' | 'percentage';
  interroWeight: number; // Weight for interros in formula (default 1)
  devoirWeight: number; // Weight for devoirs in formula (default 2)
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
