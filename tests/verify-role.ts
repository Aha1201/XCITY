
import { Program } from "@coral-xyz/anchor";
import { Xcity } from '../target/types/xcity';
import { 
    Connection, 
    PublicKey, 
    Keypair,
    SystemProgram
    } 
    from '@solana/web3.js';
import * as anchor from "@coral-xyz/anchor";
import { makeKeypairs } from "@solana-developers/helpers";
import { 
    ASSOCIATED_TOKEN_PROGRAM_ID, 
    TOKEN_2022_PROGRAM_ID, 
    TOKEN_PROGRAM_ID, 
    TYPE_SIZE } 
    from "@solana/spl-token";
import { pack, TokenMetadata } from "@solana/spl-token-metadata";
import fs from 'fs/promises';
import { initializeKeypair } from "@solana-developers/helpers";
import { encryptMessage, decryptMessage, signCustomMessage } from "./utils/crypt";
import { delay } from "./utils/tools";
import { readFileSync } from "fs";
import path from "path";
import os from "os";
const KEYPAIR_FILE_FILE = 'my-keypair.json';
const endpoint = "http://127.0.0.1:8899";
const wsEndpoint = "ws://127.0.0.1:8900";

const connection = new Connection(endpoint, {wsEndpoint: wsEndpoint, commitment: 'finalized'});

describe("xcity", () => {

    let wallet: anchor.Wallet;
    let payer: Keypair;
    let provider: anchor.AnchorProvider;
    let program: Program<Xcity>;
    // before( () => {
    //      wallet = anchor.Wallet.local();
    //      payer = wallet.payer;
    //      provider = new anchor.AnchorProvider(connection, wallet, {
    //         commitment: 'finalized'
    //     });
    //     anchor.setProvider(provider);
    // program = anchor.workspace.Xcity as Program<Xcity>;
    //   });

    before(async () => {
        const keypairData = JSON.parse(readFileSync(path.join(os.homedir(), KEYPAIR_FILE_FILE), "utf8"));
        const keypair = Keypair.fromSecretKey(Uint8Array.from(keypairData));
        console.log(`keypair**=====: ${keypair.publicKey.toBase58()}\n`);
        wallet = new anchor.Wallet(keypair);
        payer = wallet.payer;
        provider = new anchor.AnchorProvider(connection, wallet, {
            commitment: 'finalized'
        });
        anchor.setProvider(provider);
        program = anchor.workspace.Xcity as Program<Xcity>;
      });


    const XCITY_SEED = "xcity";
    const REWARD_MINT_AUTHORITY_SEED = "reward_mint_authority";
    const KYC_MINT_AUTHORITY_SEED = "kyc_mint_authority";
    const RESUME_MINT_AUTHORITY_SEED = "resume_mint_authority";
    const REWARD_VAULT_AUTHORITY_SEED = "reward_vault_authority";
    const IDENTITY_SEED = "identity";
    const ROLE_SEED = "role";
    const talentPubKey = new PublicKey("4JQHcHj7FSmyQ8NzNzVt2RqPDnaQxNLu6tSNb3Bormeh");

    it("verify_role!", async () => {   

        const xcityKey = PublicKey.findProgramAddressSync(
            [Buffer.from(XCITY_SEED)],
            program.programId
        )[0];

        const idKey = PublicKey.findProgramAddressSync(
            [Buffer.from(IDENTITY_SEED), talentPubKey.toBuffer()],
            program.programId
        )[0];
        console.log(`idKey: ${idKey.toBase58()}`);

        const idInfo = await connection.getAccountInfo(idKey);

        if (!idInfo) {
            console.log(`idInfo not found`);
            return;
        }
        await delay(1000);
        const identityAcct = await program.account.identity.fetch(idKey);
        console.log(`identityAcct: ${JSON.stringify(identityAcct)}`);
        await delay(1000);
        const orderId = (identityAcct.publishNum).toString();
        const roleKey = PublicKey.findProgramAddressSync(
            [Buffer.from(ROLE_SEED), Buffer.from(orderId), talentPubKey.toBuffer()],
            program.programId
        )[0];
        console.log(`roleKey: ${roleKey.toBase58()}`);


        const xcityAcct = await program.account.xcity.fetch(xcityKey);
        await delay(1000);
        const verifierIdKey = PublicKey.findProgramAddressSync(
            [Buffer.from(IDENTITY_SEED), payer.publicKey.toBuffer()],
            program.programId
        )[0];
        console.log(`verifierIdKey: ${verifierIdKey.toBase58()}`);
        const verifierIdentityAcct = await program.account.identity.fetch(verifierIdKey);
        console.log(`verifierIdentityAcct: ${JSON.stringify(verifierIdentityAcct)}`);

        // const oldRoleInfo = await program.account.role.fetch(roleKey);
        // console.log(`oldRoleInfo: ${JSON.stringify(oldRoleInfo)}`);
        // const signMessage = oldRoleInfo.info + roleKey.toBase58() + talentPubKey.toBase58();
        // const signature = signCustomMessage(signMessage, wallet.payer.secretKey);
        // console.log("Signature:", signature);
        // console.log("Signature  length:", signature.length);

        await program.methods.verifyRole(1)
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
            await delay(1000);
        const roleInfo = await program.account.role.fetch(roleKey);
        console.log(`roleInfo: ${JSON.stringify(roleInfo)}`);
    });
});