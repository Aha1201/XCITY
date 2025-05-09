"use client";

import { useState } from "react";
import { addDays, format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
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
    idNumber: "",
    date: "",
    companyAddress: "",
  });

  const [date, setDate] = useState({
    from: new Date(2022, 0, 20),
    to: addDays(new Date(2022, 0, 20), 20),
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
      date:
        date.from.getFullYear().toString() +
        (date.from.getMonth() + 1) +
        date.to.getFullYear().toString() +
        (date.to.getMonth() + 1),
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("提交的表单数据:", formData);
    // 和合约函数交互，将候选人的数据上传
    // 上传成功后跳转首页
    handleCreateRole(formData.date, formData.companyAddress);

  };

  const handleCreateRole = async (dateStr, companyAddress) => {
    const IDENTITY_SEED = "identity";
    const ROLE_SEED = "role";
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

    const idInfo = await connection.getAccountInfo(idKey);
    
    if (!idInfo) {
        console.log(`idInfo not found`);
        return;
    }

    const identityAcct = await program.account.identity.fetch(idKey);

    const old_encryptionId = identityAcct.encryptionId;

    const decryptedMessage = decryptMessage(Buffer.from(old_encryptionId, "base64"), 
    keypair.publicKey.toBytes(), 
    keypair.secretKey.slice(0, 32));

    const encryptedMessage = encryptMessage(decryptedMessage, 
      keypair.secretKey.slice(0, 32),
        verifier.publicKey.toBytes());
    const encryptionId = Buffer.from(encryptedMessage).toString("base64");


    const orderId = (identityAcct.publishNum + 1).toString();
    const roleKey = PublicKey.findProgramAddressSync(
        [Buffer.from(ROLE_SEED), Buffer.from(orderId), keypair.publicKey.toBuffer()],
        program.programId
    )[0];

    const info = dateStr + " " + companyAddress;

    await program.methods.createRole(encryptionId, info)
        .accounts({
            payer: publicKey,
            verifier: verifier.publicKey,
            identity: idKey,
            role: roleKey,
            systemProgram: SystemProgram.programId,
        })
        .rpc();
    const newIdentityAcct = await program.account.identity.fetch(idKey);
    const newOderId = newIdentityAcct.publishNum.toString();

    const roleInfo = await program.account.role.fetch(roleKey);
  };

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-sm p-8">
        <h1 className="text-2xl font-bold mb-6">Candidate Profile</h1>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label
              htmlFor="Your Id Number"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Your Id Number
            </label>
            <input
              type="text"
              id="idNumber"
              name="idNumber"
              value={formData.idNumber}
              onChange={handleChange}
              className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-[#5e43d8]"
            />
          </div>

          <div className="flex flex-col items-start">
            <label
              htmlFor="Date Range"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Date Range
            </label>
            <div className={cn("grid gap-2")}>
              <Popover>
                <PopoverTrigger>
                  <Button
                    id="date"
                    variant={"outline"}
                    className={cn(
                      "w-[300px] justify-start text-left font-normal",
                      !date && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon />
                    {date?.from ? (
                      date.to ? (
                        <>
                          {format(date.from, "LLL dd, y")} -{" "}
                          {format(date.to, "LLL dd, y")}
                        </>
                      ) : (
                        format(date.from, "LLL dd, y")
                      )
                    ) : (
                      <span>Pick a date</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    initialFocus
                    mode="range"
                    defaultMonth={date?.from}
                    selected={date}
                    onSelect={setDate}
                    numberOfMonths={2}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className="mt-3">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Company Address
            </label>
            <input
              type="text"
              id="companyAddress"
              name="companyAddress"
              value={formData.companyAddress}
              onChange={handleChange}
              className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-[#5e43d8]"
            />
          </div>
          <div className="flex flex-row-reverse mt-3">
            <button
              type="submit"
              className="bg-[#5e43d8] text-white px-6 py-2 rounded flex items-center hover:bg-[#4a3b8b] transition hover:cursor-pointer"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 mr-2"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"
                />
              </svg>
              Save Profile
            </button>
          </div>
        </form>
      </div>
    </main>
  );
};

export default page;
