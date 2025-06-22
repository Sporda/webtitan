"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/toast";
import "@/styles/contactSection.css";

const formSchema = z.object({
  name: z.string().min(2, "Jméno musí mít alespoň 2 znaky"),
  email: z.string().email("Neplatný email"),
  message: z.string().min(10, "Zpráva musí mít alespoň 10 znaků"),
});

export function ContactSection() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { addToast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      message: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(values),
      });

      const data = await response.json();

      if (response.ok) {
        addToast({
          title: "Úspěch!",
          description:
            "Zpráva byla úspěšně odeslána. Budeme vás kontaktovat co nejdříve.",
          type: "success",
        });

        // Vyčistit formulář
        form.reset();
      } else {
        addToast({
          title: "Chyba",
          description: data.error || "Došlo k chybě při odesílání zprávy.",
          type: "error",
        });
      }
    } catch (error) {
      console.error("Chyba při odesílání:", error);
      addToast({
        title: "Chyba připojení",
        description: "Nepodařilo se odeslat zprávu. Zkuste to prosím znovu.",
        type: "error",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section id="contact" className="bg-muted py-20">
      <div className="container mx-auto px-4">
        <h2 className="text-shadow-strong mb-8 text-center text-3xl font-bold text-white">
          Kontaktujte mě
        </h2>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="mx-auto max-w-md space-y-4"
          >
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input placeholder="Vaše jméno" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input type="email" placeholder="Váš email" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="message"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Textarea placeholder="Vaše zpráva" rows={8} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button
              type="submit"
              className="w-full border border-white"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Odesílám..." : "Odeslat zprávu"}
            </Button>
          </form>
        </Form>
      </div>
    </section>
  );
}
