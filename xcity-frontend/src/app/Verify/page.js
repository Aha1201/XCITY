"use client";
import { useWallet } from "@solana/wallet-adapter-react";
import React from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import * as anchor from "@coral-xyz/anchor";
import { Xcity } from '../../target/types/xcity';
import { Program } from "@coral-xyz/anchor";
import { 
  Connection, 
  PublicKey, 
  Keypair,
  SystemProgram
  } 
  from '@solana/web3.js';

const page = () => {
  const { publicKey } = useWallet();

  // 此处是mock数据，正常应与合约交互拿到数据
  const candidates = [
    {
      id: 1,
      title: "Senior Frontend Developer",
      company: "TechCorp",
      location: "Remote",
      salary: "$120k - $150k",
      description: "Looking for an experienced frontend developer...",
      tokens: 500,
      postedDays: 2,
    },
  ];

  // 点击确认触发，传入对应id
  const handleConfirm = (id) => {
    handleVerify(id);
  };

  // 点击拒绝触发，传入对应id
  const handleRefuse = (id) => {
    handleVerify(id);
  };

  const handleVerify = async (id) => {

    const XCITY_SEED = "xcity";
    const IDENTITY_SEED = "identity";
    const ROLE_SEED = "role";
    const talentPubKey = new PublicKey("4JQHcHj7FSmyQ8NzNzVt2RqPDnaQxNLu6tSNb3Bormeh");

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
            console.log(`idInfo not found`);
            return;
        }

        const identityAcct = await program.account.identity.fetch(idKey);
        console.log(`identityAcct: ${JSON.stringify(identityAcct)}`);

        const orderId = (identityAcct.publishNum).toString();
        const roleKey = PublicKey.findProgramAddressSync(
            [Buffer.from(ROLE_SEED), Buffer.from(orderId), publicKey.toBuffer()],
            program.programId
        )[0];
        console.log(`roleKey: ${roleKey.toBase58()}`);


        const xcityAcct = await program.account.xcity.fetch(xcityKey);
  
        const verifierIdKey = PublicKey.findProgramAddressSync(
            [Buffer.from(IDENTITY_SEED), publicKey.toBuffer()],
            program.programId
        )[0];
        console.log(`verifierIdKey: ${verifierIdKey.toBase58()}`);
        const verifierIdentityAcct = await program.account.identity.fetch(verifierIdKey);
        console.log(`verifierIdentityAcct: ${JSON.stringify(verifierIdentityAcct)}`);


        await program.methods.verifyRole(id)
            .accounts({
                payer: payer.publicKey,
                identity: idKey,
                xcity: xcityKey,
                role: roleKey,
                talent: talentPubKey,
                resumeMintToken: identityAcct.resumeMintToken,
                resumeMintAuthority: xcityAcct.resumeMintAuthority,
                rewardMintToken: xcityAcct.rewardMintToken,
                rewardTokenAccount: identityAcct.rewardTokenAccount,
                verifierRewardTokenAccount: verifierIdentityAcct.rewardTokenAccount,
                rewardMintAuthority: xcityAcct.rewardMintAuthority,
                tokenProgram: TOKEN_PROGRAM_ID,
                token2022Program: TOKEN_2022_PROGRAM_ID,
                associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
                systemProgram: SystemProgram.programId,
            })
            .rpc();

  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-3xl mx-auto">
        {candidates.map((candidate) => (
          <div
            key={candidate.id}
            className="bg-white rounded-lg shadow-sm p-6 mb-4"
          >
            <div className="flex justify-between items-start mb-3">
              <h2 className="text-xl font-bold text-gray-900">
                {candidate.title}
              </h2>
              <div className="flex items-center text-[#5e43d8]">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 mr-1"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z"
                    clipRule="evenodd"
                  />
                </svg>
                <span className="font-medium">{candidate.tokens} Tokens</span>
              </div>
            </div>

            <div className="flex items-center text-sm text-gray-600 mb-3">
              <div className="flex items-center mr-4">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4 mr-1"
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
                <span>{candidate.company}</span>
              </div>
              <div className="flex items-center mr-4">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4 mr-1"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
                <span>{candidate.location}</span>
              </div>
              <div className="flex items-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4 mr-1"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <span>{candidate.salary}</span>
              </div>
            </div>

            <p className="text-gray-700 mb-4">{candidate.description}</p>

            <div className="flex justify-end items-center gap-2">
              <button
                className="bg-[#5e43d8] text-white px-4 py-2 rounded-md hover:bg-[#4a3b8b] transition hover:cursor-pointer"
                onClick={() => handleConfirm(id)}
              >
                Confirm
              </button>
              <button
                className="border border-[#5e43d8] text-[#5e43d8] px-4 py-2 rounded-md hover:bg-gray-100 transition hover:cursor-pointer"
                onClick={() => handleRefuse(id)}
              >
                Refuse
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default page;
