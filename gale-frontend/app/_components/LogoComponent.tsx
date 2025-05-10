import Link from "next/link";
import Image from "next/image";

const LogoComponent = () => {
  return (
    <div className="flex items-center justify-center">
      <Link href="/" className="cursor-pointer">
        <Image
          src="/light-logo-noname.png"
          alt="Logo da Loja (versão clara)"
          width={60}
          height={60}
          className="mx-auto animate-float transition-transform duration-300 hover:animate-bounce"
        />
      </Link>
    </div>
  );
};

export default LogoComponent;
