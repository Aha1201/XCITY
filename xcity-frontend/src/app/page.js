"use client";

import FeatureCard from "../components/FeatureCard";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { useWallet, useAnchorWallet } from "@solana/wallet-adapter-react";
import { useRouter } from "next/navigation";

const Home = () => {
  const { setVisible } = useWalletModal();
  const {
    publicKey, // 当前连接的账户公钥（未连接时为 null）
    wallet, // 当前连接的钱包对象（如 Phantom）
    connected, // 是否已连接（布尔值）
    connecting, // 是否正在连接中（布尔值）
    disconnecting, // 是否正在断开连接（布尔值）
    select, // 手动触发钱包选择弹窗的方法
    disconnect,
  } = useWallet();
  const router = useRouter();

  const showModalOrJoin = (value) => {
    if (connected) {
      router.push(`/${value}`);
    } else {
      setVisible(true);
    }
  };
  return (
    <main className="bg-[#f8f5ff]">
      <div className="container mx-auto px-4 py-12 text-center">
        <h1 className="text-4xl font-bold mb-4 text-gray-900">
          Decentralized Career Platform
        </h1>
        <p className="text-lg mb-8 text-gray-700">
          Connect with opportunities, earn tokens, and let AI find your perfect
          match
        </p>

        <div className="flex justify-center gap-4 mb-16">
          <button
            className="bg-[#5e43d8] text-white px-6 py-3 rounded-md hover:bg-[#4a3b8b] transition hover:cursor-pointer"
            onClick={() => showModalOrJoin("Candidate")}
          >
            Join as a candidate
          </button>
          <button
            className="border border-[#5e43d8] text-[#5e43d8] px-6 py-3 rounded-md hover:bg-gray-100 transition hover:cursor-pointer"
            onClick={() => showModalOrJoin("Employer")}
          >
            Join as an employer
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
          <FeatureCard
            icon="🔍"
            title="AI-Powered Matching"
            description="Our AI technology matches candidates with the perfect opportunities based on skills and experience."
          />
          <FeatureCard
            icon="📋"
            title="Token Rewards"
            description="Earn tokens for completing your profile, applying to jobs, and successful placements."
          />
          <FeatureCard
            icon="👤"
            title="Verified Profiles"
            description="Build trust with blockchain-verified credentials and work history."
          />
        </div>
      </div>
    </main>
  );
};

export default Home;
