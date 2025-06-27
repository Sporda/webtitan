"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/trpc/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";

export default function AdminLoginPage() {
  const [credentials, setCredentials] = useState({
    username: "",
    password: "",
    email: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showCreateAdmin, setShowCreateAdmin] = useState(false);
  const [showResetPassword, setShowResetPassword] = useState(false);
  const router = useRouter();

  // Zkontrolovat, zda už existuje admin
  const { data: hasAdminData } = api.admin.hasAdmin.useQuery();

  const loginMutation = api.admin.login.useMutation({
    onSuccess: (data) => {
      setSuccess("Přihlášení úspěšné, přesměrovávám...");

      // Nastavíme cookie na client-side pokud máme token
      if (data.sessionToken) {
        document.cookie = `admin-session=${data.sessionToken}; path=/; max-age=86400; SameSite=Lax`;
      }

      // Pokusíme se o redirect
      setTimeout(() => {
        window.location.href = "/admin/dashboard";
      }, 1000);
    },
    onError: (error) => {
      setError(error.message || "Chyba při přihlašování");
      // Pokud admin neexistuje, nabídneme vytvoření prvního
      if (error.message?.includes("Neplatné přihlašovací údaje")) {
        setTimeout(() => {
          setShowCreateAdmin(true);
        }, 1000);
      }
    },
  });

  const createFirstAdminMutation = api.admin.createFirstAdmin.useMutation({
    onSuccess: () => {
      setShowCreateAdmin(false);
      setError("");
      setSuccess("První admin byl úspěšně vytvořen! Nyní se můžete přihlásit.");
    },
    onError: (error) => {
      setError(error.message || "Chyba při vytváření admin účtu");
    },
  });

  const resetPasswordMutation = api.admin.resetPassword.useMutation({
    onSuccess: () => {
      setShowResetPassword(false);
      setError("");
      setSuccess("Heslo bylo úspěšně resetováno! Můžete se nyní přihlásit.");
      setCredentials((prev) => ({
        ...prev,
        newPassword: "",
        confirmPassword: "",
        email: "",
      }));
    },
    onError: (error) => {
      setError(error.message || "Chyba při resetování hesla");
    },
  });

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    loginMutation.mutate({
      username: credentials.username,
      password: credentials.password,
    });
  };

  const handleCreateAdminSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    createFirstAdminMutation.mutate({
      username: credentials.username,
      password: credentials.password,
      email: credentials.email || undefined,
    });
  };

  const handleResetPasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    resetPasswordMutation.mutate({
      username: credentials.username,
      email: credentials.email,
      newPassword: credentials.newPassword,
      confirmPassword: credentials.confirmPassword,
    });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md space-y-4 p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">
            {showCreateAdmin
              ? "Vytvořit prvního admina"
              : showResetPassword
                ? "Reset hesla"
                : "Admin Přihlášení"}
          </h1>
          <p className="mt-2 text-gray-600">
            {showCreateAdmin
              ? "Vytvořte první admin účet pro správu webu"
              : showResetPassword
                ? "Zadejte své uživatelské jméno a email pro reset hesla"
                : "Přihlaste se do admin panelu"}
          </p>
        </div>

        {!showCreateAdmin && !showResetPassword && (
          // Login Form
          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div>
              <Label htmlFor="username">Uživatelské jméno</Label>
              <Input
                id="username"
                type="text"
                value={credentials.username}
                onChange={(e) =>
                  setCredentials((prev) => ({
                    ...prev,
                    username: e.target.value,
                  }))
                }
                required
                disabled={loginMutation.isPending}
              />
            </div>

            <div>
              <Label htmlFor="password">Heslo</Label>
              <Input
                id="password"
                type="password"
                value={credentials.password}
                onChange={(e) =>
                  setCredentials((prev) => ({
                    ...prev,
                    password: e.target.value,
                  }))
                }
                required
                disabled={loginMutation.isPending}
              />
            </div>

            {error && (
              <div className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-600">
                {error}
              </div>
            )}

            {success && (
              <div className="rounded border border-green-200 bg-green-50 p-3 text-sm text-green-600">
                {success}
              </div>
            )}

            <Button
              type="submit"
              className="w-full"
              disabled={loginMutation.isPending}
            >
              {loginMutation.isPending ? "Přihlašování..." : "Přihlásit se"}
            </Button>

            <div className="space-y-2 text-center">
              {!hasAdminData?.hasAdmin && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowCreateAdmin(true)}
                  className="text-sm"
                >
                  Vytvořit prvního admina
                </Button>
              )}

              <div>
                <Button
                  type="button"
                  variant="link"
                  onClick={() => setShowResetPassword(true)}
                  className="text-xs text-gray-500"
                >
                  Zapomenuté heslo?
                </Button>
              </div>
            </div>
          </form>
        )}

        {showResetPassword && (
          // Reset Password Form
          <form onSubmit={handleResetPasswordSubmit} className="space-y-4">
            <div>
              <Label htmlFor="reset-username">Uživatelské jméno *</Label>
              <Input
                id="reset-username"
                type="text"
                value={credentials.username}
                onChange={(e) =>
                  setCredentials((prev) => ({
                    ...prev,
                    username: e.target.value,
                  }))
                }
                required
                disabled={resetPasswordMutation.isPending}
              />
            </div>

            <div>
              <Label htmlFor="reset-email">Email *</Label>
              <Input
                id="reset-email"
                type="email"
                value={credentials.email}
                onChange={(e) =>
                  setCredentials((prev) => ({
                    ...prev,
                    email: e.target.value,
                  }))
                }
                required
                disabled={resetPasswordMutation.isPending}
              />
            </div>

            <div>
              <Label htmlFor="new-password">Nové heslo *</Label>
              <Input
                id="new-password"
                type="password"
                value={credentials.newPassword}
                onChange={(e) =>
                  setCredentials((prev) => ({
                    ...prev,
                    newPassword: e.target.value,
                  }))
                }
                required
                minLength={6}
                disabled={resetPasswordMutation.isPending}
              />
            </div>

            <div>
              <Label htmlFor="confirm-password">Potvrdit nové heslo *</Label>
              <Input
                id="confirm-password"
                type="password"
                value={credentials.confirmPassword}
                onChange={(e) =>
                  setCredentials((prev) => ({
                    ...prev,
                    confirmPassword: e.target.value,
                  }))
                }
                required
                minLength={6}
                disabled={resetPasswordMutation.isPending}
              />
            </div>

            {error && (
              <div className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-600">
                {error}
              </div>
            )}

            {success && (
              <div className="rounded border border-green-200 bg-green-50 p-3 text-sm text-green-600">
                {success}
              </div>
            )}

            <div className="space-y-2">
              <Button
                type="submit"
                className="w-full"
                disabled={resetPasswordMutation.isPending}
              >
                {resetPasswordMutation.isPending
                  ? "Resetování..."
                  : "Resetovat heslo"}
              </Button>

              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowResetPassword(false);
                  setError("");
                  setSuccess("");
                }}
                className="w-full"
                disabled={resetPasswordMutation.isPending}
              >
                Zpět na přihlášení
              </Button>
            </div>
          </form>
        )}

        {showCreateAdmin && (
          // Create First Admin Form
          <form onSubmit={handleCreateAdminSubmit} className="space-y-4">
            <div>
              <Label htmlFor="new-username">Uživatelské jméno *</Label>
              <Input
                id="new-username"
                type="text"
                value={credentials.username}
                onChange={(e) =>
                  setCredentials((prev) => ({
                    ...prev,
                    username: e.target.value,
                  }))
                }
                required
                minLength={3}
                disabled={createFirstAdminMutation.isPending}
              />
            </div>

            <div>
              <Label htmlFor="new-admin-password">Heslo *</Label>
              <Input
                id="new-admin-password"
                type="password"
                value={credentials.password}
                onChange={(e) =>
                  setCredentials((prev) => ({
                    ...prev,
                    password: e.target.value,
                  }))
                }
                required
                minLength={6}
                disabled={createFirstAdminMutation.isPending}
              />
            </div>

            <div>
              <Label htmlFor="admin-email">Email (volitelný)</Label>
              <Input
                id="admin-email"
                type="email"
                value={credentials.email}
                onChange={(e) =>
                  setCredentials((prev) => ({
                    ...prev,
                    email: e.target.value,
                  }))
                }
                disabled={createFirstAdminMutation.isPending}
              />
            </div>

            {error && (
              <div className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-600">
                {error}
              </div>
            )}

            {success && (
              <div className="rounded border border-green-200 bg-green-50 p-3 text-sm text-green-600">
                {success}
              </div>
            )}

            <div className="space-y-2">
              <Button
                type="submit"
                className="w-full"
                disabled={createFirstAdminMutation.isPending}
              >
                {createFirstAdminMutation.isPending
                  ? "Vytváření..."
                  : "Vytvořit admin účet"}
              </Button>

              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowCreateAdmin(false);
                  setError("");
                  setSuccess("");
                }}
                className="w-full"
                disabled={createFirstAdminMutation.isPending}
              >
                Zpět na přihlášení
              </Button>
            </div>
          </form>
        )}
      </Card>
    </div>
  );
}
