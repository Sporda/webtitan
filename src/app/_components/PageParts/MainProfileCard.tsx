import Image from "next/image";
import "@/styles/mainProfileCard.css";
import { StaticImageData } from "next/image";
interface MainProfileCardProps {
  image: StaticImageData;
  title: string;
  subtitle: string;
  description: string;
  onDownloadCV: () => void;
  onFollow: () => void;
}

export const MainProfileCard = ({
  image,
  title,
  subtitle,
  description,
  onDownloadCV,
  onFollow,
}: MainProfileCardProps) => {
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
        <h2>{title}</h2>
        <h3>{subtitle}</h3>
        <p>{description}</p>

        <div className="buttons">
          <button onClick={onDownloadCV}>Profil</button>
          <button onClick={onFollow} className="primary">
            Follow
          </button>
        </div>
      </div>
    </div>
  );
};
