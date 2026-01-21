import React from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { AppProvider } from "@/contexts/AppContext";
import Index from "./pages/Index";
import YearsPage from "./pages/YearsPage";
import ClassesPage from "./pages/ClassesPage";
import UnitsPage from "./pages/UnitsPage";
import GradesPage from "./pages/GradesPage";
import StudentsPage from "./pages/StudentsPage";
import SettingsPage from "./pages/SettingsPage";
import LoginPage from "./pages/LoginPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

// Protected route wrapper - must be used inside AuthProvider
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Chargement...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <AppProvider>{children}</AppProvider>;
};

// Public route wrapper (redirects to home if already logged in)
const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Chargement...</div>
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

// Routes component - separated to ensure it's rendered inside AuthProvider
const AppRoutes = () => (
  <Routes>
    <Route
      path="/login"
      element={
        <PublicRoute>
          <LoginPage />
        </PublicRoute>
      }
    />
    <Route
      path="/"
      element={
        <ProtectedRoute>
          <Index />
        </ProtectedRoute>
      }
    />
    <Route
      path="/years"
      element={
        <ProtectedRoute>
          <YearsPage />
        </ProtectedRoute>
      }
    />
    <Route
      path="/classes"
      element={
        <ProtectedRoute>
          <ClassesPage />
        </ProtectedRoute>
      }
    />
    <Route
      path="/units"
      element={
        <ProtectedRoute>
          <UnitsPage />
        </ProtectedRoute>
      }
    />
    <Route
      path="/grades"
      element={
        <ProtectedRoute>
          <GradesPage />
        </ProtectedRoute>
      }
    />
    <Route
      path="/students"
      element={
        <ProtectedRoute>
          <StudentsPage />
        </ProtectedRoute>
      }
    />
    <Route
      path="/settings"
      element={
        <ProtectedRoute>
          <SettingsPage />
        </ProtectedRoute>
      }
    />
    <Route path="*" element={<NotFound />} />
  </Routes>
);

// Inner app component that uses auth context
const AppWithAuth = () => {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem storageKey="enseinotes-theme">
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <AuthProvider>
          <AppWithAuth />
        </AuthProvider>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
