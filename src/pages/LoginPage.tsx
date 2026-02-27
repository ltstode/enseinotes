import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import {
  GraduationCap, Loader2, Sparkles, User, Mail, Lock,
  BookOpen, ClipboardList, Users, CalendarDays, BarChart3,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTheme } from 'next-themes';

/* ── Inline input component (hardcoded light colors) ──────────────────── */

const AuthInput: React.FC<
  React.InputHTMLAttributes<HTMLInputElement> & { icon: React.ReactNode }
> = ({ icon, className, ...props }) => (
  <div className="relative">
    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: '#9ca3af' }}>
      {icon}
    </span>
    <input
      {...props}
      className={cn(
        'w-full h-[48px] pl-10 pr-4 rounded-xl text-sm font-medium outline-none transition-all duration-200',
        className,
      )}
      style={{
        backgroundColor: '#ffffff',
        border: '1.5px solid #e5e7eb',
        color: '#111827',
        ...props.style,
      }}
      onFocus={(e) => {
        e.target.style.borderColor = '#7c3aed';
        e.target.style.boxShadow = '0 0 0 3px rgba(124,58,237,0.08)';
        props.onFocus?.(e);
      }}
      onBlur={(e) => {
        e.target.style.borderColor = '#e5e7eb';
        e.target.style.boxShadow = 'none';
        props.onBlur?.(e);
      }}
    />
  </div>
);

/* ── Badge (Chariow Style) ───────────────────────────────────────────── */

const Badge: React.FC<{ icon: React.ReactNode; label: string; iconBg: string; iconColor: string }> = ({ 
  icon, label, iconBg, iconColor 
}) => (
  <span className="inline-flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-[13px] font-semibold bg-white shadow-sm border border-gray-100 flex-nowrap shrink-0 transition-all hover:scale-[1.02]">
    <span className="flex items-center justify-center w-6 h-6 rounded-md shrink-0" style={{ backgroundColor: iconBg, color: iconColor }} aria-hidden="true">
      {React.cloneElement(icon as React.ReactElement, { size: 14 })}
    </span>
    <span style={{ color: '#1f2937' }}>{label}</span>
  </span>
);

/* ── LoginPage ────────────────────────────────────────────────────────── */

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login, register } = useAuth();
  const { toast } = useToast();

  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');

  // Force light mode
  const { setTheme } = useTheme();
  const previousTheme = useRef<string | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem('enseinotes-theme') || 'system';
    previousTheme.current = stored;
    setTheme('light');
    return () => { if (previousTheme.current) setTheme(previousTheme.current); };
  }, [setTheme]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      if (isLogin) {
        const r = await login(email, password);
        if (r.success) {
          toast({ title: 'Bon retour ! ✨', description: 'Heureux de vous revoir sur EnseiNotes.' });
          navigate('/');
        } else {
          toast({ title: 'Échec de connexion', description: r.error, variant: 'destructive' });
        }
      } else {
        const r = await register(email, password, firstName, lastName);
        if (r.success) {
          toast({ title: 'Compte créé avec succès 🚀', description: 'Bienvenue dans la communauté EnseiNotes !' });
          navigate('/');
        } else {
          toast({ title: "Erreur d'inscription", description: r.error, variant: 'destructive' });
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex flex-col lg:flex-row overflow-x-hidden font-poppins"
      style={{ backgroundColor: '#ffffff' }}
    >
      {/* ══════ LEFT BRANDING PANEL (Surcouche / Floating Card) ══════ */}
      <div className="relative hidden lg:flex lg:w-[46%] xl:w-[44%] flex-col justify-between overflow-hidden m-4 rounded-[32px] shadow-2xl shrink-0">
        {/* BG gradient - more vibrant and deep */}
        <div className="absolute inset-0 bg-gradient-to-br from-[hsl(262,85%,58%)] via-[hsl(250,75%,52%)] to-[hsl(215,85%,55%)]" />
        
        {/* Soft glows - subtle animation for lower battery hit / performance */}
        <div className="absolute top-[5%] left-[-10%] w-[70%] h-[70%] bg-white/[0.08] blur-[100px] rounded-full" />
        <div className="absolute bottom-[-5%] right-[-10%] w-[60%] h-[60%] bg-white/[0.06] blur-[120px] rounded-full" />

        {/* Decorative Grid */}
        <div
          className="absolute inset-0 opacity-[0.05]"
          style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '32px 32px' }}
          aria-hidden="true"
        />

        {/* Brand/Logo at top */}
        <div className="relative z-10 px-10 xl:px-12 pt-10">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-white/15 backdrop-blur-md rounded-xl border border-white/20">
                <GraduationCap className="h-6 w-6 text-white" />
              </div>
              <span className="text-white text-lg font-extrabold tracking-tight">EnseiNotes</span>
            </div>
        </div>

        {/* Main Branding Content */}
        <div className="relative z-10 flex flex-col justify-center flex-1 px-10 xl:px-12 py-12">
          <h2 className="text-white text-fluid-h1 font-extrabold leading-[1.2] tracking-tight mb-5 drop-shadow-sm">
            Gérez vos notes
            <br />
            <span className="text-white/70">avec excellence</span>
          </h2>

          <p className="text-white/60 text-fluid-body font-normal max-w-[300px] mb-10 leading-relaxed tracking-normal">
            L'outil pensé par et pour les enseignants. Saisie rapide, bulletins PDF, suivi en temps réel.
          </p>

          <div className="flex flex-wrap gap-2.5 max-w-[420px]">
            <Badge icon={<BookOpen />} label="Notes" iconBg="#fef9c3" iconColor="#ca8a04" />
            <Badge icon={<ClipboardList />} label="Bulletins" iconBg="#eff6ff" iconColor="#2563eb" />
            <Badge icon={<Users />} label="Élèves" iconBg="#fdf2f8" iconColor="#db2777" />
            <Badge icon={<CalendarDays />} label="Périodes" iconBg="#f0fdf4" iconColor="#16a34a" />
            <Badge icon={<BarChart3 />} label="Statistiques" iconBg="#f5f3ff" iconColor="#7c3aed" />
          </div>
        </div>

        {/* Footer */}
        <div className="relative z-10 px-10 xl:px-12 pb-8">
          <p className="text-white/30 text-[10px] font-semibold uppercase tracking-[0.1em]">
            © {new Date().getFullYear()} EnseiNotes
          </p>
        </div>
      </div>

      {/* ══════ RIGHT FORM PANEL ══════ */}
      <div
        className="flex-1 flex flex-col items-center justify-center px-6 sm:px-12 lg:px-20 xl:px-28 py-6 lg:py-10"
      >
        <div className="w-full max-w-[400px]">
          {/* Mobile Head - Compact Horizontal Layout */}
          <div className="lg:hidden flex flex-col items-center mb-6">
            <div className="flex items-center gap-2.5 mb-1.5">
              <div className="p-2 rounded-xl shadow-lg shadow-purple-100/30" style={{ backgroundColor: '#f5f3ff' }}>
                <GraduationCap className="h-6 w-6 text-primary" aria-hidden="true" />
              </div>
              <h1 className="text-xl font-extrabold tracking-tighter" style={{ color: '#111827' }}>
                Ensei<span className="text-primary font-serif italic">Notes</span>
              </h1>
            </div>
            <p className="text-[11px] font-normal text-gray-500 tracking-normal uppercase">L'excellence au service de l'enseignement</p>
          </div>

          {/* Desktop small label */}
          <div className="hidden lg:flex items-center gap-2 mb-5">
            <div className="p-1.5 rounded-lg" style={{ backgroundColor: '#f5f3ff' }}>
              <GraduationCap className="h-4 w-4 text-primary" aria-hidden="true" />
            </div>
            <span className="text-[12px] font-bold uppercase tracking-wider text-gray-500">Authentification</span>
          </div>

          {/* Title - Fluid typography */}
          <h2 className="text-fluid-h2 font-extrabold tracking-tight mb-3 leading-tight" style={{ color: '#111827' }}>
            {isLogin ? 'Se connecter' : 'Créer un compte'}
          </h2>

          {/* Toggle */}
          <p className="text-[13px] font-normal mb-8 lg:mb-10 text-gray-500 tracking-normal">
            {isLogin ? (
              <>Pas encore de compte ?{' '}
                <button type="button" onClick={() => setIsLogin(false)} className="text-primary hover:underline font-bold" disabled={isLoading} aria-label="Passer à la création de compte">Créer un compte</button>
              </>
            ) : (
              <>Déjà utilisateur ?{' '}
                <button type="button" onClick={() => setIsLogin(true)} className="text-primary hover:underline font-bold" disabled={isLoading} aria-label="Passer à la connexion">Connectez-vous ici</button>
              </>
            )}
          </p>

          {/* Separator - Higher contrast */}
          <div className="flex items-center gap-4 mb-6 lg:mb-8">
            <div className="flex-1 h-px" style={{ backgroundColor: '#e5e7eb' }} />
            <span className="text-[11px] font-bold uppercase tracking-tight text-gray-500 whitespace-nowrap">
              {isLogin ? 'Connexion' : 'Inscription'}
            </span>
            <div className="flex-1 h-px" style={{ backgroundColor: '#e5e7eb' }} />
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {!isLogin && (
              <div className="grid grid-cols-2 gap-4 animate-fade-in">
                <div className="space-y-2">
                  <label htmlFor="firstName" className="text-[12px] font-medium text-gray-500 tracking-normal ml-1">
                    Prénom <span className="text-red-500" aria-hidden="true">*</span>
                  </label>
                  <AuthInput icon={<User size={16} />} id="firstName" placeholder="Jean" value={firstName} onChange={(e) => setFirstName(e.target.value)} required disabled={isLoading} />
                </div>
                <div className="space-y-2">
                  <label htmlFor="lastName" className="text-[12px] font-medium text-gray-500 tracking-normal ml-1">
                    Nom <span className="text-red-500" aria-hidden="true">*</span>
                  </label>
                  <AuthInput icon={<User size={16} />} id="lastName" placeholder="DUPONT" value={lastName} onChange={(e) => setLastName(e.target.value)} required disabled={isLoading} />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <label htmlFor="email" className="text-[12px] font-medium text-gray-500 tracking-normal ml-1">
                Adresse email <span className="text-red-500" aria-hidden="true">*</span>
              </label>
              <AuthInput icon={<Mail size={16} />} id="email" type="email" placeholder="enseignant@ecole.fr" value={email} onChange={(e) => setEmail(e.target.value)} required disabled={isLoading} />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between ml-1">
                <label htmlFor="password" className="text-[12px] font-medium text-gray-500 tracking-normal">
                  Mot de passe <span className="text-red-500" aria-hidden="true">*</span>
                </label>
                {isLogin && (
                  <button type="button" className="text-[11px] font-bold text-primary hover:underline uppercase tracking-wider">Oublié ?</button>
                )}
              </div>
              <AuthInput icon={<Lock size={16} />} id="password" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={4} disabled={isLoading} />
            </div>

            {/* Submit Button - Elevated and Pilled */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full h-[54px] rounded-full font-bold text-[16px] flex items-center justify-center gap-3 transition-all duration-300 hover:opacity-90 active:scale-[0.97] disabled:opacity-50 mt-4 shadow-lg shadow-purple-500/15"
              style={{ backgroundColor: '#7c3aed', color: '#ffffff' }}
            >
              {isLoading ? (
                <Loader2 className="h-6 w-6 animate-spin" />
              ) : (
                <>
                  {isLogin ? 'Se connecter' : 'Créer un compte'}
                  <Sparkles className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          {/* Mobile Footer with Badges */}
          <div className="lg:hidden mt-8">
            <div className="flex flex-wrap justify-center gap-2 mb-8">
              <Badge icon={<BookOpen />} label="Notes" iconBg="#fef9c3" iconColor="#ca8a04" />
              <Badge icon={<ClipboardList />} label="Bulletins" iconBg="#eff6ff" iconColor="#2563eb" />
              <Badge icon={<Users />} label="Élèves" iconBg="#fdf2f8" iconColor="#db2777" />
              <Badge icon={<CalendarDays />} label="Périodes" iconBg="#f0fdf4" iconColor="#16a34a" />
              <Badge icon={<BarChart3 />} label="Statistiques" iconBg="#f5f3ff" iconColor="#7c3aed" />
            </div>
            <p className="text-center text-[10px] font-bold uppercase tracking-[0.25em] text-gray-400">
              © {new Date().getFullYear()} EnseiNotes
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
