import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { GraduationCap, Loader2, Sparkles, User, Mail, Lock } from 'lucide-react';
import { cn } from '@/lib/utils';

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login, register } = useAuth();
  const { toast } = useToast();

  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  // Form fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (isLogin) {
        const result = await login(email, password);
        if (result.success) {
          toast({
            title: 'Bon retour ! ✨',
            description: 'Heureux de vous revoir sur EnseiNotes.',
          });
          navigate('/');
        } else {
          toast({
            title: 'Échec de connexion',
            description: result.error,
            variant: 'destructive',
          });
        }
      } else {
        const result = await register(email, password, firstName, lastName);
        if (result.success) {
          toast({
            title: 'Compte créé avec succès 🚀',
            description: 'Bienvenue dans la communauté EnseiNotes !',
          });
          navigate('/');
        } else {
          toast({
            title: "Erreur d'inscription",
            description: result.error,
            variant: 'destructive',
          });
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4 overflow-hidden bg-white">
      {/* Abstract Background Ornaments */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-soft-blue blur-[120px] rounded-full opacity-60"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-soft-purple blur-[120px] rounded-full opacity-60"></div>
      <div className="absolute top-[20%] right-[10%] w-[20%] h-[20%] bg-soft-pink blur-[100px] rounded-full opacity-40"></div>
      
      <div className="w-full max-w-md relative z-10 animate-fade-in">
        <div className="text-center mb-8 flex flex-col items-center">
            <div className="p-4 bg-white/80 backdrop-blur-md rounded-[2rem] shadow-xl border border-white/40 mb-4 animate-float">
               <GraduationCap className="h-12 w-12 text-primary" />
            </div>
            <h1 className="text-4xl font-black tracking-tighter text-foreground">
                Ensei<span className="text-primary font-serif italic">Notes</span>
            </h1>
            <p className="text-muted-foreground font-medium mt-2">L'excellence au service de votre enseignement.</p>
        </div>

        <Card className="apple-card border-none shadow-2xl overflow-hidden bg-white/80 backdrop-blur-2xl">
          <div className="h-2 w-full bg-gradient-to-r from-primary via-info to-primary"></div>
          <CardHeader className="text-center pb-2">
            <CardTitle className="text-2xl font-black tracking-tight">
              {isLogin ? 'Ravis de vous revoir' : 'Rejoindre EnseiNotes'}
            </CardTitle>
            <CardDescription className="font-medium">
              {isLogin
                ? 'Entrez vos identifiants pour continuer'
                : 'Commencez votre expérience dès maintenant'}
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-5">
              {!isLogin && (
                <div className="grid grid-cols-2 gap-4 animate-fade-in">
                  <div className="space-y-2">
                    <Label htmlFor="firstName" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Prénom</Label>
                    <div className="relative">
                        <User className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="firstName"
                          placeholder="Jean"
                          value={firstName}
                          onChange={(e) => setFirstName(e.target.value)}
                          required={!isLogin}
                          disabled={isLoading}
                          className="h-12 pl-10 rounded-xl bg-secondary/30 border-none focus:bg-white transition-all transition-duration-300"
                        />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Nom</Label>
                    <Input
                      id="lastName"
                      placeholder="DUPONT"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      required={!isLogin}
                      disabled={isLoading}
                      className="h-12 rounded-xl bg-secondary/30 border-none focus:bg-white transition-all transition-duration-300"
                    />
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Email professionnel</Label>
                <div className="relative">
                    <Mail className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="enseignant@ecole.fr"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      disabled={isLoading}
                      className="h-12 pl-10 rounded-xl bg-secondary/30 border-none focus:bg-white transition-all transition-duration-300"
                    />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between ml-1">
                  <Label htmlFor="password" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Mot de passe</Label>
                  {isLogin && (
                    <button type="button" className="text-[10px] font-bold text-primary hover:underline">Oublié ?</button>
                  )}
                </div>
                <div className="relative">
                    <Lock className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      minLength={4}
                      disabled={isLoading}
                      className="h-12 pl-10 rounded-xl bg-secondary/30 border-none focus:bg-white transition-all transition-duration-300"
                    />
                </div>
              </div>

              <Button type="submit" className="w-full h-12 rounded-2xl font-black text-lg shadow-xl shadow-primary/20 hover:scale-[1.02] transition-all" disabled={isLoading}>
                {isLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <>
                    {isLogin ? 'Se connecter' : 'Créer mon compte'}
                    <Sparkles className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </form>

            <div className="mt-8 text-center">
              <button
                type="button"
                onClick={toggleMode}
                className="text-sm font-bold text-muted-foreground hover:text-primary transition-colors flex items-center justify-center gap-2 mx-auto"
                disabled={isLoading}
              >
                {isLogin
                  ? "Pas encore membre ? Inscrivez-vous"
                  : 'Déjà un compte ? Connectez-vous'}
              </button>
            </div>
          </CardContent>
        </Card>
        
        <p className="text-center mt-8 text-[10px] font-bold text-muted-foreground/40 uppercase tracking-[0.2em]">
            © 2024 EnseiNotes — Designed for Educators
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
