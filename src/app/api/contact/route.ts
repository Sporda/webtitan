import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { checkContactFormRateLimit, getClientIP } from "@/lib/rate-limit";
import { sanitizeContactForm, detectSpam } from "@/lib/sanitize";

// Inicializace Resend klienta
const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const clientIP = getClientIP(request);
    if (!checkContactFormRateLimit(clientIP)) {
      return NextResponse.json(
        { error: "Příliš mnoho pokusů o odeslání. Zkuste to prosím později." },
        { status: 429 },
      );
    }

    const body = await request.json();

    // Sanitizace vstupů
    const sanitizedData = sanitizeContactForm(body);
    const { name, email, message } = sanitizedData;

    // Validace sanitizovaných dat
    if (!name || !email || !message) {
      return NextResponse.json(
        { error: "Všechna pole jsou povinná" },
        { status: 400 },
      );
    }

    if (name.length < 2) {
      return NextResponse.json(
        { error: "Jméno musí mít alespoň 2 znaky" },
        { status: 400 },
      );
    }

    if (message.length < 10) {
      return NextResponse.json(
        { error: "Zpráva musí mít alespoň 10 znaků" },
        { status: 400 },
      );
    }

    // Spam detekce
    if (detectSpam(sanitizedData)) {
      return NextResponse.json(
        { error: "Zpráva byla označena jako spam" },
        { status: 400 },
      );
    }

    // Kontrola RESEND_API_KEY
    if (!process.env.RESEND_API_KEY) {
      // V produkci by to mělo být správně nastavené
      return NextResponse.json({
        success: true,
        message: "Zpráva byla úspěšně odeslána (simulace)",
      });
    }

    // Odeslání emailu
    const { data, error } = await resend.emails.send({
      from: "WebTitan <kontakt@webtitan.cz>",
      to: ["sporek35@gmail.com"], // Tvůj Gmail
      replyTo: email,
      subject: `Nová zpráva z kontaktního formuláře - ${name}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #32e6f0;">Nová zpráva z WebTitan</h2>
          <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Jméno:</strong> ${name}</p>
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Zpráva:</strong></p>
            <div style="background: white; padding: 15px; border-radius: 4px; margin-top: 10px;">
              ${message.replace(/\n/g, "<br>")}
            </div>
          </div>
          <p style="color: #666; font-size: 12px;">
            Tento email byl odeslán z kontaktního formuláře na webtitan.cz
          </p>
        </div>
      `,
    });

    if (error) {
      console.error("❌ Chyba při odesílání emailu:", error);
      return NextResponse.json(
        { error: "Chyba při odesílání emailu" },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      message: "Zpráva byla úspěšně odeslána",
    });
  } catch (error) {
    console.error("❌ Chyba při zpracování požadavku:", error);
    return NextResponse.json(
      { error: "Interní chyba serveru" },
      { status: 500 },
    );
  }
}
