import Link from "next/link";
import Image from "next/image";
export function Header() {
  return (
    <header className="border-b">
      <div className="container mx-auto flex items-center justify-between px-4 py-4">
        <div className="flex items-center gap-2">
          <Link href="/">
            <Image
              src="/webtitanLogo_32px.png"
              alt="WebTitan"
              width={32}
              height={32}
            />
          </Link>
          <Link href="/" className="text-2xl font-bold">
            WebTitan
          </Link>
        </div>
        <nav>
          <ul className="flex space-x-4">
            <li>
              <Link href="#about" className="hover:underline">
                O mně
              </Link>
            </li>
            <li>
              <Link href="#skills" className="hover:underline">
                Technologie
              </Link>
            </li>
            <li>
              <Link href="#projects" className="hover:underline">
                Projekty
              </Link>
            </li>
            <li>
              <Link href="#contact" className="hover:underline">
                Kontakt
              </Link>
            </li>
          </ul>
        </nav>
      </div>
    </header>
  );
}
