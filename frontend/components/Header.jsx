import { ConnectButton } from "@rainbow-me/rainbowkit";
import Link from "next/link"

const Header = () => {
  return (
    <div className="flex justify-between items-center w-full p-5 bg-[#706C61]">
      <Link href="/" >BockEstate&copy;</Link>
      <div>
        <ConnectButton />
      </div>
    </div>
  );
};

export default Header;
