import Image from "next/image";
import { useState, useEffect } from "react";
import "@/styles/mainProfileCard.css";
import { StaticImageData } from "next/image";

interface MainProfileCardProps {
  image: StaticImageData;
  title: string;
  subtitle: string;
  description: string;
  onDownloadCV: () => void;
  onContact: () => void;
}

export const MainProfileCard = ({
  image,
  title,
  subtitle,
  description,
  onDownloadCV,
  onContact,
}: MainProfileCardProps) => {
  const subtitles = [
    "Full-stack JavaScript vývojář",
    "React & Next.js specialista",
    "Node.js & TypeScript expert",
    "DevOps & Server admin",
  ];

  const [currentSubtitleIndex, setCurrentSubtitleIndex] = useState(0);
  const [displayedText, setDisplayedText] = useState("");
  const [isTyping, setIsTyping] = useState(true);
  const [currentCharIndex, setCurrentCharIndex] = useState(0);

  useEffect(() => {
    const currentSubtitle = subtitles[currentSubtitleIndex];
    if (!currentSubtitle) return;

    if (isTyping) {
      if (currentCharIndex < currentSubtitle.length) {
        const timeout = setTimeout(() => {
          setDisplayedText(currentSubtitle.slice(0, currentCharIndex + 1));
          setCurrentCharIndex(currentCharIndex + 1);
        }, 100); // Rychlost psaní
        return () => clearTimeout(timeout);
      } else {
        // Pauza po dokončení psaní
        const timeout = setTimeout(() => {
          setIsTyping(false);
        }, 2000);
        return () => clearTimeout(timeout);
      }
    } else {
      if (currentCharIndex > 0) {
        const timeout = setTimeout(() => {
          setDisplayedText(currentSubtitle.slice(0, currentCharIndex - 1));
          setCurrentCharIndex(currentCharIndex - 1);
        }, 50); // Rychlost mazání
        return () => clearTimeout(timeout);
      } else {
        // Přechod na další subtitle
        const timeout = setTimeout(() => {
          setCurrentSubtitleIndex(
            (currentSubtitleIndex + 1) % subtitles.length,
          );
          setIsTyping(true);
        }, 500);
        return () => clearTimeout(timeout);
      }
    }
  }, [currentCharIndex, isTyping, currentSubtitleIndex]);

  return (
    <div className="card">
      <Image
        src={image}
        alt={title}
        width={280}
        height={300}
        className="object-cover"
        priority
      />

      <div className="card-content">
        <h2 className="text-white drop-shadow-lg">{title}</h2>
        <h3 className="text-white drop-shadow-lg">
          {displayedText}
          <span className="typing-cursor">|</span>
        </h3>
        <p className="text-white drop-shadow-lg">{description}</p>

        <div className="buttons">
          <button onClick={onContact} className="button-85">
            Kontaktujte mě
          </button>
        </div>
      </div>
    </div>
  );
};
