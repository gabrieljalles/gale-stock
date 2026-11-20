import Link from "next/link";
import Image from "next/image";

interface LogoComponentProps {
  /** Lado da imagem em px. Telas com formulário longo pedem menos. */
  size?: number;
}

const LogoComponent = ({ size = 60 }: LogoComponentProps) => {
  return (
    <div className="flex items-center justify-center">
      <Link href="/" className="cursor-pointer">
        <Image
          src="/light-logo-noname.png"
          alt="Logo da Loja (versão clara)"
          width={size}
          height={size}
          className="mx-auto animate-float"
        />
      </Link>
    </div>
  );
};

export default LogoComponent;
