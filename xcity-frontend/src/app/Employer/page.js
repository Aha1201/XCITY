"use client";
import { useWallet } from "@solana/wallet-adapter-react";
import { useRouter } from "next/navigation";
import React, { useState } from "react";
import { 
  Connection, 
  PublicKey, 
  Keypair,
  SystemProgram
  } 
  from '@solana/web3.js';
  import { useConnection, useWallet } from "@solana/wallet-adapter-react";
  import * as anchor from "@coral-xyz/anchor";
  import { Xcity } from '../../target/types/xcity';
  import { Program } from "@coral-xyz/anchor";

const page = () => {
  const [formData, setFormData] = useState({
    jobHash: "",
    jobUrl: "",
  });

  const router = useRouter();
  const { publicKey } = useWallet();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("提交的职位数据:", formData);
    handlePostJob(formData.jobHash, formData.jobUrl);
    // 和合约函数交互，将企业数据上传
    // 上传成功后跳转认证页，页面有多个候选人列表，每一个候选人都有确认和拒绝两个按钮
    router.push("./Verify");
  };

  const handlePostJob = async (jdHash, jdUrl) => {
    const XCITY_SEED = "xcity";
    const IDENTITY_SEED = "identity";
    const JOB_DESCRIPTION_SEED = "job_description";

    const { publicKey, wallet } = useWallet();
    const { connection } = useConnection();
    const keypair =  Keypair.generate();

    const provider = new anchor.AnchorProvider(connection, wallet, {
        commitment: 'finalized'
    });
    anchor.setProvider(provider);
    const program = anchor.workspace.Xcity as Program<Xcity>;

    const idKey = PublicKey.findProgramAddressSync(
        [Buffer.from(IDENTITY_SEED), publicKey.toBuffer()],
        program.programId
    )[0];

    const xcityKey = PublicKey.findProgramAddressSync(
        [Buffer.from(XCITY_SEED)],
        program.programId
    )[0];



    const idInfo = await connection.getAccountInfo(idKey);

    if (!idInfo) {
      
        return;
    }

    const xcityAcct = await program.account.xcity.fetch(xcityKey);

    const identityAcct = await program.account.identity.fetch(idKey);
    console.log(`identityAcct: ${JSON.stringify(identityAcct)}`);

    const orderId = (identityAcct.publishNum + 1).toString();

    const jdKey = PublicKey.findProgramAddressSync(
        [Buffer.from(JOB_DESCRIPTION_SEED), Buffer.from(orderId), publicKey.toBuffer()],
        program.programId
    )[0];

    await program.methods.createJobDescription(jdHash, jdUrl)
        .accounts({
            payer: publicKey,
            identity: idKey,
            xcity: xcityKey,
            jobDescription: jdKey,
            rewardMintToken: xcityAcct.rewardMintToken,
            rewardTokenAccount: identityAcct.rewardTokenAccount,
            rewardMintAuthority: xcityAcct.rewardMintAuthority,
            tokenProgram: TOKEN_2022_PROGRAM_ID,
            systemProgram: SystemProgram.programId,
        })
        .rpc();



  }


  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-3xl mx-auto bg-white rounded-lg shadow-sm p-8">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center">
            <div className="text-[#4a3b8b] mr-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                />
              </svg>
            </div>
            <h1 className="text-2xl font-bold">Company Dashboard</h1>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label
              htmlFor="jobHash"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Job Hash
            </label>
            <input
              type="text"
              id="jobHash"
              name="jobHash"
              value={formData.jobHash}
              onChange={handleChange}
              className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-[#5e43d8]"
            />
          </div>

          <div className="mb-4">
            <label
              htmlFor="jobUrl"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Job Url
            </label>
            <input
              type="text"
              id="jobUrl"
              name="jobUrl"
              value={formData.jobUrl}
              onChange={handleChange}
              className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-[#5e43d8]"
            />
          </div>

          <div className="flex flex-row-reverse mt-3">
            <button
              type="submit"
              className="bg-[#5e43d8] text-white px-4 py-2 rounded flex items-center hover:bg-[#4a3b8b] transition hover:cursor-pointer"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 mr-2"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
                  clipRule="evenodd"
                />
              </svg>
              Post Job
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default page;
