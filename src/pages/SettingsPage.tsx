import React, { useState } from 'react';
import { useTheme } from 'next-themes';
import AppLayout from '@/components/layout/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { useAuth } from '@/contexts/AuthContext';
import { useApp } from '@/contexts/AppContext';
import { useUserPreferences } from '@/contexts/UserPreferencesContext';
import { useToast } from '@/hooks/use-toast';
import { User, Download, Upload, Shield, Save, Palette, Sun, Moon, Monitor, Zap, Minimize2, Maximize2 } from 'lucide-react';

const SettingsPage: React.FC = () => {
  const { teacher, updateProfile, updatePassword } = useAuth();
  const { exportData, importData } = useApp();
  const { reducedMotion, setReducedMotion, uiDensity, setUIDensity } = useUserPreferences();
  const { toast } = useToast();
  const { theme, setTheme } = useTheme();

  const [firstName, setFirstName] = useState(teacher?.firstName || '');
  const [lastName, setLastName] = useState(teacher?.lastName || '');
  const [email, setEmail] = useState(teacher?.email || '');
  
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  const handleUpdateProfile = async () => {
    if (!firstName.trim() || !lastName.trim() || !email.trim()) {
      toast({
        title: 'Erreur',
        description: 'Tous les champs sont obligatoires',
        variant: 'destructive',
      });
      return;
    }

    setIsUpdatingProfile(true);
    const result = await updateProfile(firstName.trim(), lastName.trim(), email.trim());
    setIsUpdatingProfile(false);

    if (result.success) {
      toast({
        title: 'Profil mis à jour',
        description: 'Vos informations ont été enregistrées',
      });
    } else {
      toast({
        title: 'Erreur',
        description: result.error || 'Impossible de mettre à jour le profil',
        variant: 'destructive',
      });
    }
  };

  const handleUpdatePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast({
        title: 'Erreur',
        description: 'Tous les champs sont obligatoires',
        variant: 'destructive',
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({
        title: 'Erreur',
        description: 'Les mots de passe ne correspondent pas',
        variant: 'destructive',
      });
      return;
    }

    if (newPassword.length < 6) {
      toast({
        title: 'Erreur',
        description: 'Le nouveau mot de passe doit contenir au moins 6 caractères',
        variant: 'destructive',
      });
      return;
    }

    setIsUpdatingPassword(true);
    const result = await updatePassword(currentPassword, newPassword);
    setIsUpdatingPassword(false);

    if (result.success) {
      toast({
        title: 'Mot de passe mis à jour',
        description: 'Votre mot de passe a été modifié avec succès',
      });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } else {
      toast({
        title: 'Erreur',
        description: result.error || 'Impossible de modifier le mot de passe',
        variant: 'destructive',
      });
    }
  };

  const handleExportData = () => {
    const data = exportData();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `enseinotes-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: 'Export réussi',
      description: 'Vos données ont été exportées dans un fichier JSON',
    });
  };

  const handleImportData = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      const result = importData(content);

      if (result.success) {
        toast({
          title: 'Import réussi',
          description: 'Vos données ont été importées avec succès',
        });
      } else {
        toast({
          title: 'Erreur d\'import',
          description: result.error || 'Le fichier n\'est pas valide',
          variant: 'destructive',
        });
      }
    };
    reader.readAsText(file);
    
    // Reset input
    event.target.value = '';
  };

  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto space-y-6">
        <div>
          <h1 className="font-display text-h1 mb-2">Paramètres</h1>
          <p className="text-muted-foreground">
            Gérez votre profil et vos données
          </p>
        </div>

        {/* Profile Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User size={20} />
              Profil
            </CardTitle>
            <CardDescription>
              Modifiez vos informations personnelles
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">Prénom</Label>
                <Input
                  id="firstName"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="Votre prénom"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Nom</Label>
                <Input
                  id="lastName"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Votre nom"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="votre@email.com"
              />
            </div>
            <Button onClick={handleUpdateProfile} disabled={isUpdatingProfile}>
              <Save size={16} className="mr-2" />
              {isUpdatingProfile ? 'Enregistrement...' : 'Enregistrer les modifications'}
            </Button>
          </CardContent>
        </Card>

        {/* Password Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield size={20} />
              Sécurité
            </CardTitle>
            <CardDescription>
              Modifiez votre mot de passe
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="currentPassword">Mot de passe actuel</Label>
              <Input
                id="currentPassword"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="newPassword">Nouveau mot de passe</Label>
                <Input
                  id="newPassword"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirmer le mot de passe</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                />
              </div>
            </div>
            <Button onClick={handleUpdatePassword} disabled={isUpdatingPassword} variant="outline">
              <Shield size={16} className="mr-2" />
              {isUpdatingPassword ? 'Modification...' : 'Modifier le mot de passe'}
            </Button>
          </CardContent>
        </Card>

        {/* Appearance Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette size={20} />
              Apparence
            </CardTitle>
            <CardDescription>
              Personnalisez l'apparence de l'application
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Theme selection */}
            <div className="space-y-2">
              <Label>Thème</Label>
              <p className="text-sm text-muted-foreground mb-3">
                Choisissez le thème qui vous convient le mieux
              </p>
              <div className="grid grid-cols-3 gap-3">
                <Button
                  variant={theme === 'light' ? 'default' : 'outline'}
                  onClick={() => setTheme('light')}
                  className="flex flex-col items-center gap-2 h-auto py-4"
                >
                  <Sun size={20} />
                  <span className="text-xs">Clair</span>
                </Button>
                <Button
                  variant={theme === 'dark' ? 'default' : 'outline'}
                  onClick={() => setTheme('dark')}
                  className="flex flex-col items-center gap-2 h-auto py-4"
                >
                  <Moon size={20} />
                  <span className="text-xs">Sombre</span>
                </Button>
                <Button
                  variant={theme === 'system' ? 'default' : 'outline'}
                  onClick={() => setTheme('system')}
                  className="flex flex-col items-center gap-2 h-auto py-4"
                >
                  <Monitor size={20} />
                  <span className="text-xs">Système</span>
                </Button>
              </div>
            </div>

            <Separator />

            {/* Reduced Motion */}
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label htmlFor="reduced-motion" className="flex items-center gap-2">
                  <Zap size={16} />
                  Réduire les animations
                </Label>
                <p className="text-sm text-muted-foreground">
                  Désactive les animations pour améliorer le confort en classe
                </p>
              </div>
              <Switch
                id="reduced-motion"
                checked={reducedMotion}
                onCheckedChange={setReducedMotion}
              />
            </div>

            <Separator />

            {/* UI Density */}
            <div className="space-y-2">
              <Label>Densité de l'interface</Label>
              <p className="text-sm text-muted-foreground mb-3">
                Ajustez l'espacement pour afficher plus ou moins de contenu
              </p>
              <div className="grid grid-cols-2 gap-3">
                <Button
                  variant={uiDensity === 'comfortable' ? 'default' : 'outline'}
                  onClick={() => setUIDensity('comfortable')}
                  className="flex flex-col items-center gap-2 h-auto py-4"
                >
                  <Maximize2 size={20} />
                  <span className="text-xs">Confortable</span>
                </Button>
                <Button
                  variant={uiDensity === 'compact' ? 'default' : 'outline'}
                  onClick={() => setUIDensity('compact')}
                  className="flex flex-col items-center gap-2 h-auto py-4"
                >
                  <Minimize2 size={20} />
                  <span className="text-xs">Compact</span>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Data Export/Import Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download size={20} />
              Données
            </CardTitle>
            <CardDescription>
              Exportez ou importez vos données pour les sauvegarder ou les transférer
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 p-4 border rounded-lg space-y-3">
                <h4 className="font-medium">Exporter les données</h4>
                <p className="text-sm text-muted-foreground">
                  Téléchargez toutes vos données (années, classes, élèves, notes) dans un fichier JSON.
                </p>
                <Button onClick={handleExportData} variant="outline" className="w-full">
                  <Download size={16} className="mr-2" />
                  Exporter en JSON
                </Button>
              </div>
              <div className="flex-1 p-4 border rounded-lg space-y-3">
                <h4 className="font-medium">Importer des données</h4>
                <p className="text-sm text-muted-foreground">
                  Restaurez vos données à partir d'un fichier de sauvegarde JSON.
                </p>
                <div className="relative">
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleImportData}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                  <Button variant="outline" className="w-full">
                    <Upload size={16} className="mr-2" />
                    Importer depuis JSON
                  </Button>
                </div>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              ⚠️ L'import remplacera toutes vos données actuelles. Assurez-vous de faire une sauvegarde avant.
            </p>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
};

export default SettingsPage;
