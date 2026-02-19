import React, { useState, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { 
  Download, 
  MessageCircle, 
  Mail, 
  Check, 
  Copy, 
  Share2,
  FileText,
  User,
  BookOpen
} from 'lucide-react';
import { Student, PedagogicalUnit, Period, SchoolYear, ClassRoom } from '@/types/enseinotes';
import { generateStudentBulletin } from '@/services/pdfService';
import { toast } from 'sonner';
import { useApp } from '@/contexts/AppContext';
import { useAuth } from '@/contexts/AuthContext';

interface MagicShareDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  student: Student;
  unit: PedagogicalUnit;
  availableUnits: PedagogicalUnit[];
  allPeriods: Period[];
  classroom: Pick<ClassRoom, 'name'> | undefined;
  schoolYear: SchoolYear | undefined;
  teacherName: string;
  calculateAverage: (studentId: string, unitId: string) => number | null;
  classStudents: Student[];
}

const MagicShareDialog: React.FC<MagicShareDialogProps> = ({
  open,
  onOpenChange,
  student,
  unit,
  availableUnits,
  allPeriods,
  classroom,
  schoolYear,
  calculateAverage,
  classStudents,
}) => {
  const [copiedType, setCopiedType] = useState<'whatsapp' | 'email' | null>(null);
  const [selectedUnitId, setSelectedUnitId] = useState<string>(unit.id);

  const { evaluations: allEvaluations, grades: allGrades } = useApp();
  const { teacher } = useAuth();

  const teacherFirstName = teacher?.firstName ?? '';
  const teacherLastName = teacher?.lastName ?? '';
  const classroomName = classroom?.name ?? 'Classe';

  const selectedUnit = useMemo(
    () => availableUnits.find(u => u.id === selectedUnitId) ?? unit,
    [selectedUnitId, availableUnits, unit]
  );

  const activePeriod = useMemo(() => {
    const unitPeriods = allPeriods.filter(p => p.pedagogicalUnitId === selectedUnitId);
    return unitPeriods.find(p => p.status === 'active') ?? unitPeriods[0];
  }, [allPeriods, selectedUnitId]);

  // ── Evaluations & grades for the selected unit/period ──
  const unitEvaluations = useMemo(() => {
    if (!activePeriod) return [];
    return allEvaluations.filter(
      e => e.pedagogicalUnitId === selectedUnitId && e.periodId === activePeriod.id
    );
  }, [allEvaluations, selectedUnitId, activePeriod]);

  const interros = useMemo(() => unitEvaluations.filter(e => e.type === 'interro'), [unitEvaluations]);
  const devoirs = useMemo(() => unitEvaluations.filter(e => e.type === 'devoir'), [unitEvaluations]);

  const interroGrades = useMemo(() => interros.map(e => ({
    evaluation: e,
    value: allGrades.find(g => g.studentId === student.id && g.evaluationId === e.id)?.value ?? null,
  })), [interros, allGrades, student.id]);

  const devoirGrades = useMemo(() => devoirs.map(e => ({
    evaluation: e,
    value: allGrades.find(g => g.studentId === student.id && g.evaluationId === e.id)?.value ?? null,
  })), [devoirs, allGrades, student.id]);

  // ── Averages ──
  const calcTypeAvg = (gradesList: typeof interroGrades) => {
    const valid = gradesList.filter(g => g.value !== null);
    if (valid.length === 0) return null;
    let totalW = 0, totalC = 0;
    valid.forEach(({ evaluation, value }) => {
      totalW += (value! / evaluation.maxScore) * 20 * evaluation.coefficient;
      totalC += evaluation.coefficient;
    });
    return totalC > 0 ? Math.round((totalW / totalC) * 100) / 100 : null;
  };

  const moyInterros = useMemo(() => calcTypeAvg(interroGrades), [interroGrades]);
  const moyDevoirs = useMemo(() => calcTypeAvg(devoirGrades), [devoirGrades]);

  const moyFinale = useMemo(
    () => calculateAverage(student.id, selectedUnitId),
    [calculateAverage, student.id, selectedUnitId]
  );

  // Class average
  const classAverage = useMemo(() => {
    const activeStudents = classStudents.filter(s => s.status === 'active');
    const avgs = activeStudents.map(s => calculateAverage(s.id, selectedUnitId)).filter((a): a is number => a !== null);
    return avgs.length > 0 ? Math.round((avgs.reduce((a, b) => a + b, 0) / avgs.length) * 100) / 100 : null;
  }, [classStudents, calculateAverage, selectedUnitId]);

  // ── Rank ──
  const rankInfo = useMemo(() => {
    const activeStudents = classStudents.filter(s => s.status === 'active');
    const withAvg = activeStudents
      .map(s => ({ id: s.id, lastName: s.lastName, firstName: s.firstName, avg: calculateAverage(s.id, selectedUnitId) ?? -1 }))
      .filter(s => s.avg >= 0)
      .sort((a, b) => {
        if (b.avg !== a.avg) return b.avg - a.avg;
        const lc = a.lastName.localeCompare(b.lastName, 'fr');
        return lc !== 0 ? lc : a.firstName.localeCompare(b.firstName, 'fr');
      });

    const rankings: Record<string, { rank: number; isExAequo: boolean }> = {};
    withAvg.forEach((s, i) => {
      if (i > 0 && s.avg === withAvg[i - 1].avg) {
        const prevRank = rankings[withAvg[i - 1].id];
        prevRank.isExAequo = true;
        rankings[s.id] = { rank: prevRank.rank, isExAequo: true };
      } else {
        rankings[s.id] = { rank: i + 1, isExAequo: false };
      }
    });

    const mine = rankings[student.id];
    if (!mine) return null;
    return { rank: mine.rank, isExAequo: mine.isExAequo, total: withAvg.length };
  }, [calculateAverage, student.id, selectedUnitId, classStudents]);

  // ── Signature ──
  const signature = `${teacherFirstName} ${teacherLastName}, Prof de ${selectedUnit.name}, ${classroomName}`;

  // ── PDF Download (full bulletin) ──
  const handleDownloadPDF = () => {
    if (!activePeriod || !schoolYear) {
      toast.error('Aucune période disponible pour cette matière.');
      return;
    }

    const reportData = {
      student,
      rank: rankInfo ? { rank: rankInfo.rank, isExAequo: rankInfo.isExAequo } : null,
      totalStudents: rankInfo?.total ?? classStudents.filter(s => s.status === 'active').length,
      interroGrades,
      devoirGrades,
      moyInterros,
      moyDevoirs,
      moyFinale,
      classAverage,
    };

    const context = {
      unit: selectedUnit,
      classroom: classroom ?? { name: 'Classe' },
      schoolYear,
      period: activePeriod,
      teacherName: `${teacherFirstName} ${teacherLastName}`,
    };

    const doc = generateStudentBulletin(reportData, context);
    doc.save(`Bulletin_${student.lastName}_${selectedUnit.name}.pdf`);
    toast.success('Bulletin complet généré !');
  };

  // ── WhatsApp message ──
  const getWhatsAppMessage = () => {
    const periodName = activePeriod?.name ?? 'la période';
    const moyenne = moyFinale !== null ? moyFinale.toFixed(2) : '-';
    const rang = rankInfo
      ? ` — Rang : ${rankInfo.rank}${rankInfo.isExAequo ? 'e ex æquo' : 'e'} sur ${rankInfo.total}`
      : '';

    const interroLines = interroGrades.length > 0
      ? `\n📝 Interrogations :\n${interroGrades.map(g => `  • ${g.evaluation.name} : ${g.value !== null ? g.value : '-'}/${g.evaluation.maxScore}`).join('\n')}\n  ➜ Moy. Interros : *${moyInterros !== null ? moyInterros.toFixed(2) : '-'}/20*`
      : '';

    const devoirLines = devoirGrades.length > 0
      ? `\n📝 Devoirs :\n${devoirGrades.map(g => `  • ${g.evaluation.name} : ${g.value !== null ? g.value : '-'}/${g.evaluation.maxScore}`).join('\n')}\n  ➜ Moy. Devoirs : *${moyDevoirs !== null ? moyDevoirs.toFixed(2) : '-'}/20*`
      : '';

    return `Bonjour,\n\nVoici le bilan de *${student.firstName} ${student.lastName}* en *${selectedUnit.name}* pour *${periodName}* :${interroLines}${devoirLines}\n\n📊 *Moyenne Générale : ${moyenne}/20*${rang}${classAverage !== null ? `\n📈 Moyenne de classe : ${classAverage.toFixed(2)}/20` : ''}\n\nBonne réception.\n— ${signature}`;
  };

  // ── Email message ──
  const getEmailMessage = () => {
    const periodName = activePeriod?.name ?? 'la période';
    const moyenne = moyFinale !== null ? moyFinale.toFixed(2) : '-';
    const rang = rankInfo
      ? `\nClassement : ${rankInfo.rank}${rankInfo.isExAequo ? 'e ex æquo' : 'e'} sur ${rankInfo.total} élèves`
      : '';

    const interroSection = interroGrades.length > 0
      ? `\nInterrogations :\n${interroGrades.map(g => `  - ${g.evaluation.name} : ${g.value !== null ? g.value : 'Non noté'}/${g.evaluation.maxScore}`).join('\n')}\n  Moyenne Interrogations : ${moyInterros !== null ? moyInterros.toFixed(2) : '-'}/20`
      : '';

    const devoirSection = devoirGrades.length > 0
      ? `\nDevoirs :\n${devoirGrades.map(g => `  - ${g.evaluation.name} : ${g.value !== null ? g.value : 'Non noté'}/${g.evaluation.maxScore}`).join('\n')}\n  Moyenne Devoirs : ${moyDevoirs !== null ? moyDevoirs.toFixed(2) : '-'}/20`
      : '';

    return `Bonjour,\n\nVeuillez trouver ci-dessous le bilan scolaire de ${student.firstName} ${student.lastName} pour la matière ${selectedUnit.name} (${periodName}) :\n${interroSection}${devoirSection}\n\nMoyenne Générale : ${moyenne}/20${rang}${classAverage !== null ? `\nMoyenne de la classe : ${classAverage.toFixed(2)}/20` : ''}\n\nCordialement,\n${signature}`;
  };

  const handleCopy = (type: 'whatsapp' | 'email') => {
    const text = type === 'whatsapp' ? getWhatsAppMessage() : getEmailMessage();
    navigator.clipboard.writeText(text);
    setCopiedType(type);
    toast.success('Message copié dans le presse-papier !');
    setTimeout(() => setCopiedType(null), 2000);
  };

  const avgColor = moyFinale === null
    ? 'text-muted-foreground'
    : moyFinale >= 10
      ? 'text-emerald-600 dark:text-emerald-400'
      : 'text-rose-500';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[460px] rounded-2xl border-none shadow-2xl p-0 overflow-hidden bg-card">

        {/* ── Header ── */}
        <div className="bg-primary/5 p-7 pb-5 text-center relative">
          <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center mx-auto mb-3 border border-primary/20">
            <Share2 className="text-primary" size={28} />
          </div>
          <DialogTitle className="text-xl font-semibold tracking-tight">Magic Share</DialogTitle>
          <DialogDescription className="mt-1.5 text-muted-foreground text-sm">
            Partagez le bilan complet de{' '}
            <span className="font-semibold text-foreground">
              {student.lastName} {student.firstName}
            </span>
          </DialogDescription>

          <div className="absolute top-4 right-4 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold uppercase tracking-wider">
            <Check size={9} strokeWidth={3} />
            Prêt
          </div>
        </div>

        <div className="p-6 space-y-4">

          {/* ── Sélecteur de matière ── */}
          {availableUnits.length > 1 && (
            <div>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <BookOpen size={10} />
                Matière
              </p>
              <div className="flex flex-wrap gap-2">
                {availableUnits.map(u => (
                  <button
                    key={u.id}
                    onClick={() => setSelectedUnitId(u.id)}
                    className={[
                      'px-3 py-1.5 rounded-lg text-xs font-medium border transition-all duration-150',
                      selectedUnitId === u.id
                        ? 'bg-primary text-primary-foreground border-primary shadow-sm shadow-primary/20'
                        : 'bg-secondary/50 text-muted-foreground border-border/50 hover:border-primary/40 hover:text-foreground'
                    ].join(' ')}
                  >
                    {u.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ── Carte stats ── */}
          <div className="bg-secondary/30 rounded-xl p-4 border border-border/40 flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-background flex items-center justify-center border border-border/50 text-muted-foreground shadow-sm shrink-0">
              <User size={18} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider truncate">
                Moyenne {selectedUnit.name}
              </p>
              <div className="flex items-baseline gap-1">
                <span className={`text-2xl font-bold ${avgColor}`}>
                  {moyFinale !== null ? moyFinale.toFixed(2) : '—'}
                </span>
                <span className="text-xs text-muted-foreground font-medium">/ 20</span>
              </div>
            </div>
            {rankInfo && (
              <div className="text-right shrink-0">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Rang</p>
                <p className="text-sm font-bold text-primary">
                  {rankInfo.rank}{rankInfo.isExAequo ? 'e' : 'e'}
                  <span className="text-[10px] text-muted-foreground font-normal ml-0.5">
                    /{rankInfo.total}
                  </span>
                </p>
              </div>
            )}
          </div>

          {/* ── Actions ── */}
          <div className="grid grid-cols-1 gap-2.5">
            <Button
              onClick={handleDownloadPDF}
              variant="outline"
              className="h-14 rounded-xl justify-start px-5 border-border/60 hover:border-primary/40 hover:bg-primary/5 group"
            >
              <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary mr-3.5 group-hover:scale-110 transition-transform shrink-0">
                <FileText size={18} />
              </div>
              <div className="text-left">
                <p className="text-sm font-semibold">Télécharger le Bulletin Complet</p>
                <p className="text-[10px] text-muted-foreground">PDF avec toutes les notes détaillées</p>
              </div>
              <Download size={16} className="ml-auto text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
            </Button>

            <Button
              onClick={() => handleCopy('whatsapp')}
              variant="outline"
              className="h-14 rounded-xl justify-start px-5 border-border/60 hover:border-emerald-500/40 hover:bg-emerald-500/5 group"
            >
              <div className="w-9 h-9 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-600 mr-3.5 group-hover:scale-110 transition-transform shrink-0">
                <MessageCircle size={18} />
              </div>
              <div className="text-left">
                <p className="text-sm font-semibold">Copier message WhatsApp</p>
                <p className="text-[10px] text-muted-foreground">Bilan complet avec notes et signature</p>
              </div>
              {copiedType === 'whatsapp'
                ? <Check size={16} className="ml-auto text-emerald-500 shrink-0" />
                : <Copy size={16} className="ml-auto text-muted-foreground group-hover:text-emerald-500 transition-colors shrink-0" />}
            </Button>

            <Button
              onClick={() => handleCopy('email')}
              variant="outline"
              className="h-14 rounded-xl justify-start px-5 border-border/60 hover:border-blue-500/40 hover:bg-blue-500/5 group"
            >
              <div className="w-9 h-9 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-600 mr-3.5 group-hover:scale-110 transition-transform shrink-0">
                <Mail size={18} />
              </div>
              <div className="text-left">
                <p className="text-sm font-semibold">Copier message E-mail</p>
                <p className="text-[10px] text-muted-foreground">Bilan professionnel avec signature</p>
              </div>
              {copiedType === 'email'
                ? <Check size={16} className="ml-auto text-blue-500 shrink-0" />
                : <Copy size={16} className="ml-auto text-muted-foreground group-hover:text-blue-500 transition-colors shrink-0" />}
            </Button>
          </div>
        </div>

        {/* ── Footer ── */}
        <div className="bg-muted/40 px-6 py-3 text-center border-t border-border/20">
          <p className="text-[9px] text-muted-foreground uppercase tracking-widest font-bold">
            EnseiNotes Magic Connectivity
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MagicShareDialog;
