"use client";
import React from "react";
import dynamic from "next/dynamic";
import Image from "next/image";
import { useRouter } from "next/navigation";

const WalletButton = dynamic(() => import("@/components/WalletButton"), {
  ssr: false,
});

const Navbar = () => {
  const router = useRouter();
  return (
    <nav className="flex justify-between items-center px-6 py-4 bg-white">
      <div
        className="flex items-center hover:cursor-pointer"
        onClick={() => router.push("/")}
      >
        <Image
          src="/logo.svg"
          alt="XCITY"
          width={30}
          height={30}
          className="mr-2"
        />
        <span className="text-xl font-bold text-[#4a3b8b]">CareerDAO</span>
      </div>
      <div className="flex">
        {/* <Link href="/jobs" className="text-gray-700 hover:text-gray-900">
        Jobs
      </Link> */}
        {/* <button className="bg-[#5e43d8] text-white px-4 py-2 rounded-md hover:bg-[#4a3b8b] transition">
        Select Wallet
      </button> */}
        <WalletButton />
      </div>
    </nav>
  );
};

export default Navbar;
