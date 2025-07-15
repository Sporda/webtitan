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
  const [showResetPassword, setShowResetPassword] = useState(false);
  const router = useRouter();

  // Zkontrolovat, zda už existuje admin
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
          setShowResetPassword(true);
        }, 1000);
      }
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

  const forgotPasswordMutation = api.admin.forgotPassword.useMutation();

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    loginMutation.mutate({
      username: credentials.username,
      password: credentials.password,
    });
  };

  // Upravím handleResetPasswordSubmit, aby posílal pouze email na forgotPassword
  const handleForgotPasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    forgotPasswordMutation.mutate(
      { email: credentials.email },
      {
        onSuccess: () => {
          setShowResetPassword(false);
          setSuccess(
            "Pokud existuje účet, byl odeslán e-mail s odkazem na reset hesla.",
          );
          setCredentials((prev) => ({ ...prev, email: "" }));
        },
        onError: (error: any) => {
          setError(error.message || "Chyba při odesílání e-mailu");
        },
      },
    );
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md space-y-4 p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">
            {showResetPassword ? "Reset hesla" : "Admin Přihlášení"}
          </h1>
          <p className="mt-2 text-gray-600">
            {showResetPassword
              ? "Zadejte svůj email pro reset hesla"
              : "Přihlaste se do admin panelu"}
          </p>
        </div>
        {showResetPassword ? (
          // Reset Password Form
          <form onSubmit={handleForgotPasswordSubmit} className="space-y-4">
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
                disabled={forgotPasswordMutation.isPending}
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
                disabled={forgotPasswordMutation.isPending}
              >
                {forgotPasswordMutation.isPending
                  ? "Odesílání..."
                  : "Odeslat odkaz na reset hesla"}
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
                disabled={forgotPasswordMutation.isPending}
              >
                Zpět na přihlášení
              </Button>
            </div>
          </form>
        ) : (
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
      </Card>
    </div>
  );
}
