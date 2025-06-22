// Sanitizace textu proti XSS
export function sanitizeText(text: string): string {
  if (typeof text !== "string") {
    return "";
  }

  return text
    .replace(/[<>]/g, "") // Odstranění < a >
    .replace(/javascript:/gi, "") // Odstranění javascript: protokolu
    .replace(/on\w+=/gi, "") // Odstranění event handlerů
    .trim()
    .slice(0, 1000); // Maximální délka
}

// Sanitizace emailu
export function sanitizeEmail(email: string): string {
  if (typeof email !== "string") {
    return "";
  }

  // Základní email regex
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const sanitized = email.trim().toLowerCase();

  if (!emailRegex.test(sanitized)) {
    return "";
  }

  return sanitized;
}

// Validace a sanitizace formulářových dat
export function sanitizeContactForm(data: {
  name: string;
  email: string;
  message: string;
}) {
  return {
    name: sanitizeText(data.name),
    email: sanitizeEmail(data.email),
    message: sanitizeText(data.message),
  };
}

// Detekce spamu
export function detectSpam(data: {
  name: string;
  email: string;
  message: string;
}): boolean {
  const { name, email, message } = data;
  const combined = `${name} ${email} ${message}`.toLowerCase();

  // Spam indikátory
  const spamIndicators = [
    "viagra",
    "casino",
    "loan",
    "credit",
    "buy now",
    "click here",
    "free money",
    "make money fast",
    "weight loss",
    "diet pills",
    "http://",
    "https://",
    "www.",
    ".com",
    ".org",
    ".net",
  ];

  // Kontrola spam indikátorů
  const spamCount = spamIndicators.filter((indicator) =>
    combined.includes(indicator),
  ).length;

  // Příliš mnoho odkazů
  const linkCount = (combined.match(/https?:\/\/|www\./g) || []).length;

  // Příliš krátká zpráva (pravděpodobně spam)
  if (message.length < 10) {
    return true;
  }

  // Příliš mnoho spam indikátorů nebo odkazů
  if (spamCount > 2 || linkCount > 1) {
    return true;
  }

  return false;
}
