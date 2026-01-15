import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Teacher } from '@/types/enseinotes';

interface AuthContextType {
  teacher: Teacher | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (email: string, password: string, firstName: string, lastName: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  updateProfile: (firstName: string, lastName: string, email: string) => Promise<{ success: boolean; error?: string }>;
  updatePassword: (currentPassword: string, newPassword: string) => Promise<{ success: boolean; error?: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TEACHERS_STORAGE_KEY = 'enseinotes_teachers';
const CURRENT_TEACHER_KEY = 'enseinotes_current_teacher';

// Simple hash function for local storage (not cryptographically secure, but fine for local use)
const simpleHash = (str: string): string => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return hash.toString(36);
};

const getStoredTeachers = (): Teacher[] => {
  try {
    const data = localStorage.getItem(TEACHERS_STORAGE_KEY);
    if (!data) return [];
    return JSON.parse(data).map((t: Teacher) => ({
      ...t,
      createdAt: new Date(t.createdAt),
    }));
  } catch {
    return [];
  }
};

const saveTeachers = (teachers: Teacher[]) => {
  localStorage.setItem(TEACHERS_STORAGE_KEY, JSON.stringify(teachers));
};

const generateId = () => {
  return `${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [teacher, setTeacher] = useState<Teacher | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check for existing session on mount
  useEffect(() => {
    const storedTeacherId = localStorage.getItem(CURRENT_TEACHER_KEY);
    if (storedTeacherId) {
      const teachers = getStoredTeachers();
      const foundTeacher = teachers.find(t => t.id === storedTeacherId);
      if (foundTeacher) {
        setTeacher(foundTeacher);
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    const normalizedEmail = email.trim().toLowerCase();
    const teachers = getStoredTeachers();
    const foundTeacher = teachers.find(t => t.email === normalizedEmail);

    if (!foundTeacher) {
      return { success: false, error: 'Aucun compte trouvé avec cet email' };
    }

    const passwordHash = simpleHash(password);
    if (foundTeacher.passwordHash !== passwordHash) {
      return { success: false, error: 'Mot de passe incorrect' };
    }

    setTeacher(foundTeacher);
    localStorage.setItem(CURRENT_TEACHER_KEY, foundTeacher.id);
    return { success: true };
  };

  const register = async (
    email: string,
    password: string,
    firstName: string,
    lastName: string
  ): Promise<{ success: boolean; error?: string }> => {
    const normalizedEmail = email.trim().toLowerCase();
    const teachers = getStoredTeachers();

    // Check if email already exists
    if (teachers.some(t => t.email === normalizedEmail)) {
      return { success: false, error: 'Un compte existe déjà avec cet email' };
    }

    // Validate inputs
    if (!email.includes('@')) {
      return { success: false, error: 'Email invalide' };
    }
    if (password.length < 4) {
      return { success: false, error: 'Le mot de passe doit contenir au moins 4 caractères' };
    }
    if (!firstName.trim() || !lastName.trim()) {
      return { success: false, error: 'Prénom et nom requis' };
    }

    const newTeacher: Teacher = {
      id: generateId(),
      email: normalizedEmail,
      passwordHash: simpleHash(password),
      firstName: firstName.trim().charAt(0).toUpperCase() + firstName.trim().slice(1).toLowerCase(),
      lastName: lastName.trim().toUpperCase(),
      createdAt: new Date(),
    };

    const updatedTeachers = [...teachers, newTeacher];
    saveTeachers(updatedTeachers);

    setTeacher(newTeacher);
    localStorage.setItem(CURRENT_TEACHER_KEY, newTeacher.id);
    return { success: true };
  };

  const logout = () => {
    setTeacher(null);
    localStorage.removeItem(CURRENT_TEACHER_KEY);
  };

  const updateProfile = async (
    firstName: string,
    lastName: string,
    email: string
  ): Promise<{ success: boolean; error?: string }> => {
    if (!teacher) {
      return { success: false, error: 'Non connecté' };
    }

    const normalizedEmail = email.trim().toLowerCase();
    const teachers = getStoredTeachers();

    // Check if email already exists (and it's not the current user)
    if (teachers.some(t => t.email === normalizedEmail && t.id !== teacher.id)) {
      return { success: false, error: 'Un autre compte utilise déjà cet email' };
    }

    const updatedTeacher: Teacher = {
      ...teacher,
      firstName: firstName.charAt(0).toUpperCase() + firstName.slice(1).toLowerCase(),
      lastName: lastName.toUpperCase(),
      email: normalizedEmail,
    };

    const updatedTeachers = teachers.map(t => 
      t.id === teacher.id ? updatedTeacher : t
    );
    saveTeachers(updatedTeachers);
    setTeacher(updatedTeacher);

    return { success: true };
  };

  const updatePassword = async (
    currentPassword: string,
    newPassword: string
  ): Promise<{ success: boolean; error?: string }> => {
    if (!teacher) {
      return { success: false, error: 'Non connecté' };
    }

    const currentHash = simpleHash(currentPassword);
    if (teacher.passwordHash !== currentHash) {
      return { success: false, error: 'Mot de passe actuel incorrect' };
    }

    const teachers = getStoredTeachers();
    const updatedTeacher: Teacher = {
      ...teacher,
      passwordHash: simpleHash(newPassword),
    };

    const updatedTeachers = teachers.map(t => 
      t.id === teacher.id ? updatedTeacher : t
    );
    saveTeachers(updatedTeachers);
    setTeacher(updatedTeacher);

    return { success: true };
  };

  return (
    <AuthContext.Provider
      value={{
        teacher,
        isAuthenticated: !!teacher,
        isLoading,
        login,
        register,
        logout,
        updateProfile,
        updatePassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
