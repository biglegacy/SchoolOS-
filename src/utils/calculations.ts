import { ExaminationResult } from '../types';

export interface GradeInfo {
  grade: 'A' | 'B+' | 'B' | 'C' | 'D' | 'E' | 'F';
  remark: string;
  points: number;
}

/**
 * Standard Ghana GES / WAEC Grading System for Basic & Secondary Education
 * Supports normalizing scores when assessment max total is not 100 (e.g. 30/50 = 80 total).
 */
export const calculateGhanaGrade = (score: number, maxScore: number = 100): GradeInfo => {
  const percentage = maxScore && maxScore > 0 && maxScore !== 100 
    ? (score / maxScore) * 100 
    : score;
  const rounded = Math.round(percentage);
  if (rounded >= 80) return { grade: 'A', remark: 'Exemplary', points: 1 };
  if (rounded >= 75) return { grade: 'B+', remark: 'Very Good', points: 2 };
  if (rounded >= 70) return { grade: 'B', remark: 'Good', points: 3 };
  if (rounded >= 60) return { grade: 'C', remark: 'Credit', points: 4 };
  if (rounded >= 50) return { grade: 'D', remark: 'Pass', points: 5 };
  if (rounded >= 45) return { grade: 'E', remark: 'Weak Pass', points: 6 };
  return { grade: 'F', remark: 'Fail', points: 9 };
};

export const getGESGrade = (score: number, maxScore: number = 100): 'A' | 'B+' | 'B' | 'C' | 'D' | 'E' | 'F' => {
  return calculateGhanaGrade(score, maxScore).grade;
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

/**
 * Calculates total score given class SBA score and Exam score.
 * Respects school's custom sbaMaxScore (e.g. 30, 50, 40) and examMaxScore (e.g. 70, 50, 60, 50).
 */
export const calculateTotalScore = (
  classScore: number, 
  examScore: number, 
  sbaMax: number = 30, 
  examMax: number = 70
): number => {
  const safeClass = Math.max(0, Math.min(sbaMax, Number(classScore || 0)));
  const safeExam = Math.max(0, Math.min(examMax, Number(examScore || 0)));
  const total = safeClass + safeExam;
  const maxTotal = sbaMax + examMax;
  return Math.min(maxTotal, Math.max(0, Math.round(total * 10) / 10));
};

export const calculatePercentage = (
  classScore: number, 
  examScore: number, 
  sbaMax: number = 30, 
  examMax: number = 70
): number => {
  const total = calculateTotalScore(classScore, examScore, sbaMax, examMax);
  const maxTotal = (sbaMax + examMax) || 100;
  return Math.min(100, Math.max(0, Math.round((total / maxTotal) * 100 * 10) / 10));
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
