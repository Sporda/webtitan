import Link from "next/link";
import { Github, Linkedin, Twitter } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t py-8">
      <div className="container mx-auto flex items-center justify-between px-4">
        <p className="text-white">
          &copy; {new Date().getFullYear()} WebTitan. Všechna práva vyhrazena.
        </p>
        <div className="flex space-x-4">
          <Link href="#" aria-label="GitHub">
            <Github />
          </Link>
          <Link
            href="https://www.linkedin.com/in/jan-%C5%A1porek-07a39168/"
            target="_blank"
            aria-label="LinkedIn"
          >
            <Linkedin />
          </Link>
          <Link href="#" aria-label="Twitter">
            <Twitter />
          </Link>
        </div>
      </div>
    </footer>
  );
}
