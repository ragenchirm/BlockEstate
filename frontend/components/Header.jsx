import { ConnectButton } from "@rainbow-me/rainbowkit";

const Header = () => {
  return (
    <div className="flex justify-between items-center w-full p-5 bg-[#706C61]">
      <div>BockEstate&copy;</div>
      <div>
        <ConnectButton />
      </div>
    </div>
  );
};

export default Header;
