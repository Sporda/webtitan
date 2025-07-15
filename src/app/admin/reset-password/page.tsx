"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { api } from "@/trpc/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";

const ResetPasswordPage = () => {
  const [form, setForm] = useState({
    newPassword: "",
    confirmPassword: "",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";

  const resetPasswordMutation = api.admin.resetPassword.useMutation({
    onSuccess: () => {
      setSuccess("Heslo bylo úspěšně změněno. Nyní se můžete přihlásit.");
      setError("");
      setSubmitted(true);
    },
    onError: (err) => {
      setError(err.message || "Chyba při změně hesla");
      setSuccess("");
    },
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    if (!token) {
      setError("Chybí token pro reset hesla.");
      return;
    }
    resetPasswordMutation.mutate({
      token,
      newPassword: form.newPassword,
      confirmPassword: form.confirmPassword,
    });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md space-y-4 p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">Obnova hesla</h1>
          <p className="mt-2 text-gray-600">
            Zadejte nové heslo. Odkaz je platný pouze jednou.
          </p>
        </div>
        {submitted ? (
          <div className="space-y-4 text-center">
            <div className="rounded border border-green-200 bg-green-50 p-3 text-green-700">
              {success}
            </div>
            <Button
              className="w-full"
              onClick={() => router.push("/admin")}
              aria-label="Přejít na přihlášení"
            >
              Přejít na přihlášení
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="newPassword">Nové heslo *</Label>
              <Input
                id="newPassword"
                name="newPassword"
                type="password"
                value={form.newPassword}
                onChange={handleChange}
                required
                minLength={6}
                aria-label="Nové heslo"
                autoComplete="new-password"
                disabled={resetPasswordMutation.isPending}
              />
            </div>
            <div>
              <Label htmlFor="confirmPassword">Potvrdit nové heslo *</Label>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                value={form.confirmPassword}
                onChange={handleChange}
                required
                minLength={6}
                aria-label="Potvrdit nové heslo"
                autoComplete="new-password"
                disabled={resetPasswordMutation.isPending}
              />
            </div>
            {error && (
              <div className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-600">
                {error}
              </div>
            )}
            <Button
              type="submit"
              className="w-full"
              disabled={resetPasswordMutation.isPending}
              aria-label="Změnit heslo"
            >
              {resetPasswordMutation.isPending
                ? "Odesílání..."
                : "Změnit heslo"}
            </Button>
          </form>
        )}
      </Card>
    </div>
  );
};

export default ResetPasswordPage;
