// Utility for evaluating and selecting the 5 Curriculum Core Competencies
// Based on actual student marks, curriculum subjects, and academic engagement

export interface CoreCompetencyEvaluation {
  id: string;
  name: string;
  domain: string;
  domainCode: 'STEM' | 'LANG' | 'COG' | 'CIVIC' | 'PERS';
  score: number;
  level: 'Exemplary' | 'Proficient' | 'Competent' | 'Developing' | 'Emerging';
  levelNumber: 4 | 3 | 2 | 1 | 0;
  diagnosticRemark: string;
  relevantSubject?: string;
}

interface SubjectScoreMap {
  subjectName: string;
  percentage: number;
  grade: string;
}

/**
 * Normalizes subject names for domain matching
 */
const cleanSubject = (name: string): string => {
  return (name || '').toLowerCase().trim();
};

/**
 * Returns level and numeric descriptor based on 0-100 score
 */
const getAttainmentDetails = (score: number) => {
  if (score >= 80) {
    return { level: 'Exemplary' as const, levelNumber: 4 as const };
  }
  if (score >= 70) {
    return { level: 'Proficient' as const, levelNumber: 3 as const };
  }
  if (score >= 60) {
    return { level: 'Competent' as const, levelNumber: 2 as const };
  }
  if (score >= 50) {
    return { level: 'Developing' as const, levelNumber: 1 as const };
  }
  return { level: 'Emerging' as const, levelNumber: 0 as const };
};

/**
 * Deterministically evaluates and selects exactly 5 core competencies
 * based on the student's actual grades, subjects, and attendance.
 */
export const evaluateStudentCompetencies = (
  subjects: Array<{
    subjectName: string;
    classScore?: number;
    examScore?: number;
    totalScore?: number;
    grade?: string;
  }>,
  overallAverage: number,
  attendancePercentage: number | null
): CoreCompetencyEvaluation[] => {
  const normSubjects: SubjectScoreMap[] = subjects.map(s => {
    const total = s.totalScore ?? ((s.classScore || 0) + (s.examScore || 0));
    return {
      subjectName: s.subjectName || '',
      percentage: total,
      grade: s.grade || '',
    };
  });

  const findSubject = (keywords: string[]): SubjectScoreMap | undefined => {
    return normSubjects.find(s => {
      const lower = cleanSubject(s.subjectName);
      return keywords.some(k => lower.includes(k));
    });
  };

  const mathSubj = findSubject(['math', 'numeracy', 'algebra', 'arithmetic']);
  const scienceSubj = findSubject(['science', 'integrated science', 'natural science', 'biology', 'physics', 'chemistry']);
  const englishSubj = findSubject(['english', 'language arts', 'grammar', 'reading', 'literature']);
  const ghLangSubj = findSubject(['twi', 'fante', 'ga', 'ewe', 'dagbani', 'ghanaian language']);
  const socialSubj = findSubject(['social studies', 'social', 'our world', 'owop', 'history', 'citizenship']);
  const rmeSubj = findSubject(['rme', 'religious', 'moral']);
  const ictSubj = findSubject(['computing', 'ict', 'computer', 'information']);
  const creativeSubj = findSubject(['creative arts', 'art', 'design', 'drawing', 'craft', 'career tech']);

  const attendanceScore = attendancePercentage !== null ? attendancePercentage : overallAverage;
  const effectiveAverage = overallAverage > 0 ? overallAverage : 65;

  const candidates: CoreCompetencyEvaluation[] = [];

  // 1. DOMAIN: STEM / Numeracy
  if (mathSubj) {
    const score = Math.round(mathSubj.percentage);
    const { level, levelNumber } = getAttainmentDetails(score);
    let remark = 'Applies mathematical logic and structured calculations to solve problems with precision.';
    if (score >= 80) remark = 'Exemplary numerical dexterity; solves complex multi-step problems with speed and precision.';
    else if (score >= 70) remark = 'Proficient in foundational mathematical principles, calculations, and problem formulation.';
    else if (score >= 60) remark = 'Demonstrates competent computation skills; responds well to guided mathematical exercises.';
    else if (score >= 50) remark = 'Developing basic numerical fluency; consistent practice with calculations recommended.';
    else remark = 'Requires foundational reinforcement in core numerical operations and problem interpretation.';

    candidates.push({
      id: 'comp_qns',
      name: 'Quantitative & Numeracy Skills',
      domain: 'STEM & Mathematical Reasoning',
      domainCode: 'STEM',
      score,
      level,
      levelNumber,
      diagnosticRemark: remark,
      relevantSubject: mathSubj.subjectName,
    });
  } else {
    const score = Math.round(effectiveAverage);
    const { level, levelNumber } = getAttainmentDetails(score);
    candidates.push({
      id: 'comp_arl',
      name: 'Analytical Reasoning & Logic',
      domain: 'Cognitive & Analytical Reasoning',
      domainCode: 'STEM',
      score,
      level,
      levelNumber,
      diagnosticRemark: 'Demonstrates methodical inquiry and logical deduction across academic coursework.',
    });
  }

  // 2. DOMAIN: Linguistic / Communication
  if (englishSubj || ghLangSubj) {
    const primeLang = englishSubj || ghLangSubj!;
    const score = Math.round(primeLang.percentage);
    const { level, levelNumber } = getAttainmentDetails(score);
    let remark = 'Expresses thoughts articulately with sound grammar and active communicative listening.';
    if (score >= 80) remark = 'Exceptional linguistic flair, reading fluency, and articulate oral and written composition.';
    else if (score >= 70) remark = 'Strong communicative competence; articulates ideas with clarity and coherent structure.';
    else if (score >= 60) remark = 'Competent comprehension and communication; makes positive contributions during class interactions.';
    else if (score >= 50) remark = 'Developing language fluency; regular reading of literature is strongly encouraged.';
    else remark = 'Needs focused coaching in reading comprehension, vocabulary development, and expression.';

    candidates.push({
      id: 'comp_cc',
      name: 'Communication & Collaboration',
      domain: 'Linguistic & Communicative Arts',
      domainCode: 'LANG',
      score,
      level,
      levelNumber,
      diagnosticRemark: remark,
      relevantSubject: primeLang.subjectName,
    });
  } else {
    const score = Math.round(effectiveAverage);
    const { level, levelNumber } = getAttainmentDetails(score);
    candidates.push({
      id: 'comp_cc',
      name: 'Communication & Collaboration',
      domain: 'Linguistic & Communicative Arts',
      domainCode: 'LANG',
      score,
      level,
      levelNumber,
      diagnosticRemark: 'Collaborates effectively with peers and communicates classroom ideas with clarity.',
    });
  }

  // 3. DOMAIN: Cognitive / Problem Solving / Science
  if (scienceSubj) {
    const score = Math.round(scienceSubj.percentage);
    const { level, levelNumber } = getAttainmentDetails(score);
    let remark = 'Exhibits keen scientific curiosity and methodical problem analysis.';
    if (score >= 80) remark = 'Mastery of scientific inquiry; displays acute critical thinking and experimental acumen.';
    else if (score >= 70) remark = 'Consistently applies scientific methods and analytical reasoning to understand phenomena.';
    else if (score >= 60) remark = 'Understands core scientific principles and applies concepts to real-world scenarios.';
    else if (score >= 50) remark = 'Developing analytical inquiry; encouraged to ask deeper investigative questions.';
    else remark = 'Benefiting from structured guided experiments to consolidate scientific concepts.';

    candidates.push({
      id: 'comp_ctps',
      name: 'Critical Thinking & Problem Solving',
      domain: 'Cognitive & Empirical Inquiry',
      domainCode: 'COG',
      score,
      level,
      levelNumber,
      diagnosticRemark: remark,
      relevantSubject: scienceSubj.subjectName,
    });
  } else if (ictSubj) {
    const score = Math.round(ictSubj.percentage);
    const { level, levelNumber } = getAttainmentDetails(score);
    candidates.push({
      id: 'comp_dl',
      name: 'Digital Literacy & Computational Thinking',
      domain: 'Technological & Information Literacy',
      domainCode: 'COG',
      score,
      level,
      levelNumber,
      diagnosticRemark: 'Applies digital tools and systematic computational logic to navigate modern learning systems.',
      relevantSubject: ictSubj.subjectName,
    });
  } else if (creativeSubj) {
    const score = Math.round(creativeSubj.percentage);
    const { level, levelNumber } = getAttainmentDetails(score);
    candidates.push({
      id: 'comp_ic',
      name: 'Innovation & Creativity',
      domain: 'Design & Expressive Innovation',
      domainCode: 'COG',
      score,
      level,
      levelNumber,
      diagnosticRemark: 'Demonstrates imaginative originality, innovative approach to tasks, and expressive craft.',
      relevantSubject: creativeSubj.subjectName,
    });
  } else {
    const score = Math.round((effectiveAverage + (mathSubj?.percentage || effectiveAverage)) / 2);
    const { level, levelNumber } = getAttainmentDetails(score);
    candidates.push({
      id: 'comp_ctps',
      name: 'Critical Thinking & Problem Solving',
      domain: 'Cognitive & Problem Solving',
      domainCode: 'COG',
      score,
      level,
      levelNumber,
      diagnosticRemark: 'Synthesizes information effectively to address academic exercises with critical insight.',
    });
  }

  // 4. DOMAIN: Civic / Cultural / Social
  if (socialSubj || rmeSubj) {
    const primeSocial = socialSubj || rmeSubj!;
    const score = Math.round(primeSocial.percentage);
    const { level, levelNumber } = getAttainmentDetails(score);
    let remark = 'Appreciates cultural heritage, societal ethics, and responsible citizenship.';
    if (score >= 80) remark = 'Exemplary civic consciousness; demonstrates mature awareness of community and cultural values.';
    else if (score >= 70) remark = 'Displays thoughtful understanding of national identity, community governance, and ethics.';
    else if (score >= 60) remark = 'Competent appreciation of societal norms, historical heritage, and civic duties.';
    else if (score >= 50) remark = 'Developing awareness of community roles; actively engaging in social education.';
    else remark = 'Steadily building knowledge of national history, environment, and moral values.';

    candidates.push({
      id: 'comp_cigc',
      name: 'Cultural Identity & Global Citizenship',
      domain: 'Socio-Cultural & Civic Awareness',
      domainCode: 'CIVIC',
      score,
      level,
      levelNumber,
      diagnosticRemark: remark,
      relevantSubject: primeSocial.subjectName,
    });
  } else {
    const score = Math.round((effectiveAverage + attendanceScore) / 2);
    const { level, levelNumber } = getAttainmentDetails(score);
    candidates.push({
      id: 'comp_cer',
      name: 'Civic Engagement & Responsibility',
      domain: 'Socio-Cultural & Civic Awareness',
      domainCode: 'CIVIC',
      score,
      level,
      levelNumber,
      diagnosticRemark: 'Demonstrates high moral responsibility, respect for school regulations, and community awareness.',
    });
  }

  // 5. DOMAIN: Personal Development & Leadership
  // Evaluated from combined academic discipline and attendance / punctuality
  const personalScore = Math.round((effectiveAverage * 0.6) + (attendanceScore * 0.4));
  const { level: persLevel, levelNumber: persLevelNum } = getAttainmentDetails(personalScore);
  let persRemark = 'Displays commendable self-discipline, resilience, and positive leadership among peers.';
  if (personalScore >= 80) {
    persRemark = 'Exemplary leadership, punctuality, and self-motivation; serves as a positive role model in class.';
  } else if (personalScore >= 70) {
    persRemark = 'Consistently punctual, disciplined, and proactive in carrying out assigned responsibilities.';
  } else if (personalScore >= 60) {
    persRemark = 'Shows steady personal accountability, cooperative conduct, and willingness to assist classmates.';
  } else if (personalScore >= 50) {
    persRemark = 'Capable of greater initiative and focus; encouragement from home will boost self-confidence.';
  } else {
    persRemark = 'Requires closer monitoring and encouragement to build consistent study habits and self-direction.';
  }

  candidates.push({
    id: 'comp_pdl',
    name: 'Personal Development & Leadership',
    domain: 'Personal Character & Leadership',
    domainCode: 'PERS',
    score: personalScore,
    level: persLevel,
    levelNumber: persLevelNum,
    diagnosticRemark: persRemark,
  });

  // Ensure exactly 5 distinct domain competencies are returned
  return candidates.slice(0, 5);
};
