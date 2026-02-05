import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Student, Evaluation, Grade, Period, PedagogicalUnit, ClassRoom, SchoolYear } from '@/types/enseinotes';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface StudentReportData {
  student: Student;
  rank: number | null;
  totalStudents: number;
  interroGrades: { evaluation: Evaluation; value: number | null }[];
  devoirGrades: { evaluation: Evaluation; value: number | null }[];
  moyInterros: number | null;
  moyDevoirs: number | null;
  moyFinale: number | null;
  classAverage: number | null;
  appreciation?: string;
}

interface ReportContext {
  unit: PedagogicalUnit;
  classroom: ClassRoom;
  schoolYear: SchoolYear;
  period: Period;
  teacherName: string;
}

// Helper to get appreciation based on grade
const getAppreciation = (average: number | null): string => {
  if (average === null) return 'Non évaluable';
  if (average >= 18) return 'Excellent travail, félicitations !';
  if (average >= 16) return 'Très bon travail, continuez ainsi.';
  if (average >= 14) return 'Bon travail, ensemble satisfaisant.';
  if (average >= 12) return 'Travail assez bon, quelques efforts à fournir.';
  if (average >= 10) return 'Travail passable, des progrès à réaliser.';
  if (average >= 8) return 'Travail insuffisant, efforts nécessaires.';
  return 'Travail très insuffisant, un sursaut est attendu.';
};

// Generate a single student bulletin
export const generateStudentBulletin = (
  data: StudentReportData,
  context: ReportContext
): jsPDF => {
  const doc = new jsPDF('p', 'mm', 'a4');
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 15;
  let y = margin;

  // Header
  doc.setFillColor(99, 179, 237); // Primary blue
  doc.rect(0, 0, pageWidth, 40, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text('BULLETIN DE NOTES', pageWidth / 2, 18, { align: 'center' });
  
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text(`${context.period.name} - ${context.schoolYear.name}`, pageWidth / 2, 30, { align: 'center' });
  
  y = 50;

  // Student Info Box
  doc.setTextColor(31, 31, 31);
  doc.setFillColor(247, 250, 252);
  doc.roundedRect(margin, y, pageWidth - 2 * margin, 35, 3, 3, 'F');
  
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text(`${data.student.lastName} ${data.student.firstName}`, margin + 8, y + 12);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 100, 100);
  doc.text(`Classe: ${context.classroom.name}`, margin + 8, y + 22);
  doc.text(`Matière: ${context.unit.name}`, margin + 8, y + 30);
  
  // Ranking badge
  if (data.rank) {
    const rankX = pageWidth - margin - 30;
    doc.setFillColor(data.rank <= 3 ? 251 : 237, data.rank <= 3 ? 211 : 242, data.rank <= 3 ? 141 : 255);
    doc.roundedRect(rankX, y + 5, 25, 25, 2, 2, 'F');
    doc.setTextColor(31, 31, 31);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text(`${data.rank}`, rankX + 12.5, y + 16, { align: 'center' });
    doc.setFontSize(7);
    doc.text(`/ ${data.totalStudents}`, rankX + 12.5, y + 24, { align: 'center' });
  }
  
  y += 45;

  // Grades Table - Interros
  if (data.interroGrades.length > 0) {
    doc.setTextColor(99, 179, 237);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('INTERROGATIONS', margin, y);
    y += 5;

    const interroData = data.interroGrades.map(ig => [
      ig.evaluation.name,
      ig.value !== null ? `${ig.value}` : '-',
      `/ ${ig.evaluation.maxScore}`,
      `Coef. ${ig.evaluation.coefficient}`
    ]);
    
    interroData.push([
      { content: 'Moyenne Interrogations', styles: { fontStyle: 'bold' } },
      { content: data.moyInterros !== null ? data.moyInterros.toFixed(2) : '-', styles: { fontStyle: 'bold' } },
      '/ 20',
      ''
    ] as any);

    autoTable(doc, {
      startY: y,
      head: [['Évaluation', 'Note', 'Barème', 'Coefficient']],
      body: interroData,
      theme: 'striped',
      headStyles: { fillColor: [99, 179, 237], textColor: 255, fontStyle: 'bold' },
      styles: { fontSize: 9, cellPadding: 3 },
      columnStyles: {
        0: { cellWidth: 60 },
        1: { cellWidth: 25, halign: 'center' },
        2: { cellWidth: 25, halign: 'center' },
        3: { cellWidth: 30, halign: 'center' }
      },
      margin: { left: margin, right: margin }
    });
    
    y = (doc as any).lastAutoTable.finalY + 10;
  }

  // Grades Table - Devoirs
  if (data.devoirGrades.length > 0) {
    doc.setTextColor(237, 100, 166);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('DEVOIRS', margin, y);
    y += 5;

    const devoirData = data.devoirGrades.map(dg => [
      dg.evaluation.name,
      dg.value !== null ? `${dg.value}` : '-',
      `/ ${dg.evaluation.maxScore}`,
      `Coef. ${dg.evaluation.coefficient}`
    ]);
    
    devoirData.push([
      { content: 'Moyenne Devoirs', styles: { fontStyle: 'bold' } },
      { content: data.moyDevoirs !== null ? data.moyDevoirs.toFixed(2) : '-', styles: { fontStyle: 'bold' } },
      '/ 20',
      ''
    ] as any);

    autoTable(doc, {
      startY: y,
      head: [['Évaluation', 'Note', 'Barème', 'Coefficient']],
      body: devoirData,
      theme: 'striped',
      headStyles: { fillColor: [237, 100, 166], textColor: 255, fontStyle: 'bold' },
      styles: { fontSize: 9, cellPadding: 3 },
      columnStyles: {
        0: { cellWidth: 60 },
        1: { cellWidth: 25, halign: 'center' },
        2: { cellWidth: 25, halign: 'center' },
        3: { cellWidth: 30, halign: 'center' }
      },
      margin: { left: margin, right: margin }
    });
    
    y = (doc as any).lastAutoTable.finalY + 10;
  }

  // Final Average Box
  doc.setFillColor(56, 161, 105); // Success green
  doc.roundedRect(margin, y, pageWidth - 2 * margin, 25, 3, 3, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('MOYENNE GÉNÉRALE', margin + 10, y + 10);
  
  doc.setFontSize(18);
  doc.text(
    data.moyFinale !== null ? `${data.moyFinale.toFixed(2)} / 20` : 'Non calculable',
    pageWidth - margin - 10,
    y + 16,
    { align: 'right' }
  );
  
  if (data.classAverage !== null) {
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(`Moyenne de classe: ${data.classAverage.toFixed(2)}`, margin + 10, y + 20);
  }
  
  y += 35;

  // Appreciation
  doc.setTextColor(31, 31, 31);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('APPRÉCIATION', margin, y);
  y += 6;
  
  doc.setFillColor(247, 250, 252);
  doc.roundedRect(margin, y, pageWidth - 2 * margin, 20, 3, 3, 'F');
  
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(10);
  doc.setTextColor(60, 60, 60);
  doc.text(data.appreciation || getAppreciation(data.moyFinale), margin + 5, y + 12);
  
  y += 30;

  // Footer
  doc.setDrawColor(200, 200, 200);
  doc.line(margin, y, pageWidth - margin, y);
  y += 8;
  
  doc.setTextColor(120, 120, 120);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text(`Émis le ${format(new Date(), 'dd MMMM yyyy', { locale: fr })}`, margin, y);
  doc.text(`Enseignant: ${context.teacherName}`, pageWidth - margin, y, { align: 'right' });
  
  doc.setFontSize(7);
  doc.text('EnseiNotes - Système de gestion des notes', pageWidth / 2, y + 6, { align: 'center' });

  return doc;
};

// Generate bulletins for all students in a period
export const generateClassBulletins = (
  students: Student[],
  evaluations: Evaluation[],
  grades: Grade[],
  context: ReportContext,
  calculateTypeAverage: (studentId: string, evals: Evaluation[]) => number | null,
  calculateFinalAverage: (studentId: string) => number | null,
  studentRankings: Record<string, number | null>,
  customAppreciations?: Record<string, string>
): void => {
  const doc = new jsPDF('p', 'mm', 'a4');
  const interros = evaluations.filter(e => e.type === 'interro');
  const devoirs = evaluations.filter(e => e.type === 'devoir');
  
  // Calculate class average
  const allAverages = students
    .map(s => calculateFinalAverage(s.id))
    .filter((a): a is number => a !== null);
  const classAverage = allAverages.length > 0 
    ? allAverages.reduce((a, b) => a + b, 0) / allAverages.length 
    : null;

  students.forEach((student, index) => {
    if (index > 0) doc.addPage();

    const studentData: StudentReportData = {
      student,
      rank: studentRankings[student.id],
      totalStudents: students.length,
      interroGrades: interros.map(e => ({
        evaluation: e,
        value: grades.find(g => g.studentId === student.id && g.evaluationId === e.id)?.value ?? null
      })),
      devoirGrades: devoirs.map(e => ({
        evaluation: e,
        value: grades.find(g => g.studentId === student.id && g.evaluationId === e.id)?.value ?? null
      })),
      moyInterros: calculateTypeAverage(student.id, interros),
      moyDevoirs: calculateTypeAverage(student.id, devoirs),
      moyFinale: calculateFinalAverage(student.id),
      classAverage,
      appreciation: customAppreciations?.[student.id]
    };

    // Copy content from single bulletin to multi-page doc
    const singleDoc = generateStudentBulletin(studentData, context);
    const pageData = singleDoc.output('arraybuffer');
    
    // For multi-page, we regenerate inline
    generateBulletinPage(doc, studentData, context);
  });

  // Download the PDF
  const periodName = context.period.name.replace(/\s+/g, '_');
  const className = context.classroom.name.replace(/\s+/g, '_');
  doc.save(`Bulletins_${className}_${periodName}.pdf`);
};

// Helper to generate a single page in a multi-page document
const generateBulletinPage = (
  doc: jsPDF,
  data: StudentReportData,
  context: ReportContext
): void => {
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 15;
  let y = margin;

  // Header
  doc.setFillColor(99, 179, 237);
  doc.rect(0, 0, pageWidth, 40, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text('BULLETIN DE NOTES', pageWidth / 2, 18, { align: 'center' });
  
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text(`${context.period.name} - ${context.schoolYear.name}`, pageWidth / 2, 30, { align: 'center' });
  
  y = 50;

  // Student Info Box
  doc.setTextColor(31, 31, 31);
  doc.setFillColor(247, 250, 252);
  doc.roundedRect(margin, y, pageWidth - 2 * margin, 35, 3, 3, 'F');
  
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text(`${data.student.lastName} ${data.student.firstName}`, margin + 8, y + 12);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 100, 100);
  doc.text(`Classe: ${context.classroom.name}`, margin + 8, y + 22);
  doc.text(`Matière: ${context.unit.name}`, margin + 8, y + 30);
  
  if (data.rank) {
    const rankX = pageWidth - margin - 30;
    doc.setFillColor(data.rank <= 3 ? 251 : 237, data.rank <= 3 ? 211 : 242, data.rank <= 3 ? 141 : 255);
    doc.roundedRect(rankX, y + 5, 25, 25, 2, 2, 'F');
    doc.setTextColor(31, 31, 31);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text(`${data.rank}`, rankX + 12.5, y + 16, { align: 'center' });
    doc.setFontSize(7);
    doc.text(`/ ${data.totalStudents}`, rankX + 12.5, y + 24, { align: 'center' });
  }
  
  y += 45;

  // Interros Table
  if (data.interroGrades.length > 0) {
    doc.setTextColor(99, 179, 237);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('INTERROGATIONS', margin, y);
    y += 5;

    const interroData = data.interroGrades.map(ig => [
      ig.evaluation.name,
      ig.value !== null ? `${ig.value}` : '-',
      `/ ${ig.evaluation.maxScore}`,
      `Coef. ${ig.evaluation.coefficient}`
    ]);
    
    interroData.push([
      'Moyenne Interrogations',
      data.moyInterros !== null ? data.moyInterros.toFixed(2) : '-',
      '/ 20',
      ''
    ]);

    autoTable(doc, {
      startY: y,
      head: [['Évaluation', 'Note', 'Barème', 'Coefficient']],
      body: interroData,
      theme: 'striped',
      headStyles: { fillColor: [99, 179, 237], textColor: 255, fontStyle: 'bold' },
      styles: { fontSize: 9, cellPadding: 3 },
      margin: { left: margin, right: margin }
    });
    
    y = (doc as any).lastAutoTable.finalY + 10;
  }

  // Devoirs Table
  if (data.devoirGrades.length > 0) {
    doc.setTextColor(237, 100, 166);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('DEVOIRS', margin, y);
    y += 5;

    const devoirData = data.devoirGrades.map(dg => [
      dg.evaluation.name,
      dg.value !== null ? `${dg.value}` : '-',
      `/ ${dg.evaluation.maxScore}`,
      `Coef. ${dg.evaluation.coefficient}`
    ]);
    
    devoirData.push([
      'Moyenne Devoirs',
      data.moyDevoirs !== null ? data.moyDevoirs.toFixed(2) : '-',
      '/ 20',
      ''
    ]);

    autoTable(doc, {
      startY: y,
      head: [['Évaluation', 'Note', 'Barème', 'Coefficient']],
      body: devoirData,
      theme: 'striped',
      headStyles: { fillColor: [237, 100, 166], textColor: 255, fontStyle: 'bold' },
      styles: { fontSize: 9, cellPadding: 3 },
      margin: { left: margin, right: margin }
    });
    
    y = (doc as any).lastAutoTable.finalY + 10;
  }

  // Final Average
  doc.setFillColor(56, 161, 105);
  doc.roundedRect(margin, y, pageWidth - 2 * margin, 25, 3, 3, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('MOYENNE GÉNÉRALE', margin + 10, y + 10);
  
  doc.setFontSize(18);
  doc.text(
    data.moyFinale !== null ? `${data.moyFinale.toFixed(2)} / 20` : 'Non calculable',
    pageWidth - margin - 10,
    y + 16,
    { align: 'right' }
  );
  
  if (data.classAverage !== null) {
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(`Moyenne de classe: ${data.classAverage.toFixed(2)}`, margin + 10, y + 20);
  }
  
  y += 35;

  // Appreciation
  doc.setTextColor(31, 31, 31);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('APPRÉCIATION', margin, y);
  y += 6;
  
  doc.setFillColor(247, 250, 252);
  doc.roundedRect(margin, y, pageWidth - 2 * margin, 20, 3, 3, 'F');
  
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(10);
  doc.setTextColor(60, 60, 60);
  doc.text(getAppreciation(data.moyFinale), margin + 5, y + 12);
  
  y += 30;

  // Footer
  doc.setDrawColor(200, 200, 200);
  doc.line(margin, y, pageWidth - margin, y);
  y += 8;
  
  doc.setTextColor(120, 120, 120);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text(`Émis le ${format(new Date(), 'dd MMMM yyyy', { locale: fr })}`, margin, y);
  doc.text(`Enseignant: ${context.teacherName}`, pageWidth - margin, y, { align: 'right' });
  
  doc.setFontSize(7);
  doc.text('EnseiNotes - Système de gestion des notes', pageWidth / 2, y + 6, { align: 'center' });
};
