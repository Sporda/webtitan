import Link from "next/link";

export function Header() {
  return (
    <header className="border-b">
      <div className="container mx-auto flex items-center justify-between px-4 py-4">
        <Link href="/" className="text-2xl font-bold">
          WebTitan
        </Link>
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
