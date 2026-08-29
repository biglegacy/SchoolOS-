import { ExaminationResult } from '../types';

export interface GradeInfo {
  grade: 'A' | 'B+' | 'B' | 'C' | 'D' | 'E' | 'F';
  remark: string;
  points: number;
}

/**
 * Standard Ghana GES / WAEC Grading System for Basic & Secondary Education
 */
export const calculateGhanaGrade = (score: number): GradeInfo => {
  const rounded = Math.round(score);
  if (rounded >= 80) return { grade: 'A', remark: 'Exemplary', points: 1 };
  if (rounded >= 75) return { grade: 'B+', remark: 'Very Good', points: 2 };
  if (rounded >= 70) return { grade: 'B', remark: 'Good', points: 3 };
  if (rounded >= 60) return { grade: 'C', remark: 'Credit', points: 4 };
  if (rounded >= 50) return { grade: 'D', remark: 'Pass', points: 5 };
  if (rounded >= 45) return { grade: 'E', remark: 'Weak Pass', points: 6 };
  return { grade: 'F', remark: 'Fail', points: 9 };
};

export const getGESGrade = (score: number): 'A' | 'B+' | 'B' | 'C' | 'D' | 'E' | 'F' => {
  return calculateGhanaGrade(score).grade;
};

export const getGradeRemarks = (grade: string): string => {
  switch (grade) {
    case 'A': return 'Exemplary';
    case 'B+': return 'Very Good';
    case 'B': return 'Good';
    case 'C': return 'Credit';
    case 'D': return 'Pass';
    case 'E': return 'Weak Pass';
    default: return 'Fail';
  }
};

export const calculateTotalScore = (classScore: number, examScore: number): number => {
  // Class score is max 30, Exam score is max 70 (Ghana GES standard 30/70 formula)
  const total = Number(classScore || 0) + Number(examScore || 0);
  return Math.min(100, Math.max(0, Math.round(total * 10) / 10));
};

/**
 * Computes ranks and positions for a list of student results in a subject/exam
 */
export const calculatePositions = (results: ExaminationResult[]): ExaminationResult[] => {
  const sorted = [...results].sort((a, b) => b.totalScore - a.totalScore);
  const count = sorted.length;
  
  return sorted.map((res, index) => {
    let position = index + 1;
    // Handle ties
    if (index > 0 && res.totalScore === sorted[index - 1].totalScore) {
      position = sorted[index - 1].position || index + 1;
    }
    return {
      ...res,
      position,
      totalStudents: count,
    };
  });
};

/**
 * Computes standard teacher comments based on overall score
 */
export const generateTeacherRemark = (average: number): string => {
  if (average >= 80) return 'Outstanding academic performance! Keep up the brilliant effort.';
  if (average >= 70) return 'Very good performance. Shows high commitment to learning.';
  if (average >= 60) return 'Good progress made this term. Capable of higher attainment.';
  if (average >= 50) return 'Satisfactory effort, but needs more focus in challenging subjects.';
  if (average >= 45) return 'A fair attempt. More regular revision and practice needed.';
  return 'Below required standard. Intensive remedial support and home study advised.';
};

export const generateHeadTeacherRemark = (average: number, promoted: boolean, nextClass?: string): string => {
  if (promoted && nextClass) {
    if (average >= 70) return `Commendable results. Promoted to ${nextClass} with honours.`;
    return `Promoted to ${nextClass}. Encourage active reading during the holidays.`;
  }
  if (!promoted) {
    return 'To repeat current class to strengthen fundamental competencies.';
  }
  if (average >= 70) return 'Impressive work. An asset to the school community.';
  return 'Adequate term work. Expected to work harder next academic term.';
};
