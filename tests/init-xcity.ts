import { clusterApiUrl, Connection, PublicKey, sendAndConfirmTransaction, SystemProgram, Transaction, TransactionInstruction, TransactionInstructionCtorFields } from '@solana/web3.js';
import { initializeKeypair, makeKeypairs } from '@solana-developers/helpers';
import dotenv from 'dotenv';
import * as anchor from "@coral-xyz/anchor";
import { Xcity } from '../target/types/xcity';
import { Program } from '@coral-xyz/anchor';
import { 
    MINT_SIZE, 
    TOKEN_2022_PROGRAM_ID, 
    createInitializeMintInstruction, 
    ASSOCIATED_TOKEN_PROGRAM_ID 
} from '@solana/spl-token';
import { assert } from 'chai';
dotenv.config();


const endpoint = "http://127.0.0.1:8899";
const wsEndpoint = "ws://127.0.0.1:8900";
const connection = new Connection(endpoint, {wsEndpoint: wsEndpoint, commitment: 'finalized'});


describe("xcity", () => {

    const wallet = anchor.Wallet.local();
    const payer = wallet.payer;
    const provider = new anchor.AnchorProvider(connection, wallet, {
        commitment: 'finalized'
    });
    anchor.setProvider(provider);

    const XCITY_SEED = "xcity";
    const REWARD_MINT_AUTHORITY_SEED = "reward_mint_authority";
    const KYC_MINT_AUTHORITY_SEED = "kyc_mint_authority";
    const RESUME_MINT_AUTHORITY_SEED = "resume_mint_authority";
    const REWARD_VAULT_AUTHORITY_SEED = "reward_vault_authority";
  
    const program = anchor.workspace.Xcity as Program<Xcity>;
  
    it("init xcity!", async () => {

        const xcityKey = PublicKey.findProgramAddressSync(
            [Buffer.from(XCITY_SEED)],
            program.programId
        )[0];
        const xcityInfo = await connection.getAccountInfo(xcityKey);
        // console.log(xcityInfo);

        if (xcityInfo) {
            console.log("xcity already initialized");
            const xcityAcct = await program.account.xcity.fetch(xcityKey);
            console.log(`xcityAcct: ${JSON.stringify(xcityAcct)}`);
            return;
        }
        
        // let instructions: Array<Transaction | TransactionInstruction | TransactionInstructionCtorFields> = [];
        const decimals = 0;
        const rewardDecimals = 6;
        const maxMembers = 1000;

        const [groupYkcMintKeypair, groupResumeMintKeypair, rewardMintKeypair] = makeKeypairs(3);


        //CREATE REWARD MINT
        const createMintAccountInstruction = SystemProgram.createAccount({
            fromPubkey: payer.publicKey,
            newAccountPubkey: rewardMintKeypair.publicKey,
            space: MINT_SIZE,
            lamports: await connection.getMinimumBalanceForRentExemption(MINT_SIZE),
            programId: TOKEN_2022_PROGRAM_ID,
        });

        const rewardMintAuthority = PublicKey.findProgramAddressSync(
            [Buffer.from(REWARD_MINT_AUTHORITY_SEED)],
            program.programId
        )[0];
        const createMintInstruction = createInitializeMintInstruction(
            rewardMintKeypair.publicKey,
            rewardDecimals,
            rewardMintAuthority,
            rewardMintAuthority,
            TOKEN_2022_PROGRAM_ID
        );

        

        const tx = new Transaction().add(createMintAccountInstruction, createMintInstruction);
        const signature = await sendAndConfirmTransaction(
            connection,
            tx,
            [payer,rewardMintKeypair]
            );

        console.log(`reward mint txHash: ${signature}`);
        
        // // CREATE GROUP METADATA
        // const groupMetadata: XcityNFTMetadata[] = [
        // {
        //     mint: groupYkcMintKeypair,
        //     imagePath: "image/XCITY_logo.png",
        //     tokenName: "XCITY_YKC",
        //     tokenDescription: "Collection of XCITY's YKC",
        //     tokenSymbol: "XCITY_YKC",
        //     tokenExternalUrl: "https://solana.com/",
        //     tokenAdditionalMetadata: {},
        //     tokenUri: "",
        // },
        // {
        //     mint: groupResumeMintKeypair,
        //     imagePath: "image/XCITY_logo.png",
        //     tokenName: "XCITY_RESUME",
        //     tokenDescription: "Collection of Resume",
        //     tokenSymbol: "XCITY_RESUME",
        //     tokenExternalUrl: "https://solana.com/",
        //     tokenAdditionalMetadata: {},
        //     tokenUri: "",
        // }];
        
        // // UPLOAD OFF-CHAIN METADATA
        // for (const grpup of groupMetadata) {
        //     grpup.tokenUri = await uploadOffChainMetadata(payer, grpup);
        //     console.log(
        //         `groupMetadata url :${grpup.tokenUri}\n`
        //     );
        // }


        
        // // CREATE GROUP INSTRUCTIONS
        // for (const grpup of groupMetadata) {
        //     const collectionTokenMetadata: TokenMetadata = {
        //         name: grpup.tokenName,
        //         mint: grpup.mint.publicKey,
        //         symbol: grpup.tokenSymbol,
        //         uri: grpup.tokenUri,
        //         updateAuthority: payer.publicKey,
        //         additionalMetadata: Object.entries(
        //             grpup.tokenAdditionalMetadata || []
        //         ).map(([trait_type, value]) => [trait_type, value]),
        //     };

        //     const group_signature = await createTokenGroup(
        //         connection,
        //         payer,
        //         grpup.mint,
        //         decimals,
        //         maxMembers,
        //         collectionTokenMetadata
        //     );

        //     console.log(`group_signature: ${group_signature}`);
        // }



        const kycMintAuthority = PublicKey.findProgramAddressSync(
            [Buffer.from(KYC_MINT_AUTHORITY_SEED)],
            program.programId
        )[0];
        const resumeMintAuthority = PublicKey.findProgramAddressSync(
            [Buffer.from(RESUME_MINT_AUTHORITY_SEED)],
            program.programId
        )[0];
        const rewardVaultAuthority = PublicKey.findProgramAddressSync(
            [Buffer.from(REWARD_VAULT_AUTHORITY_SEED)],
            program.programId
        )[0];

        await program.methods.initXcity(
            true
        ).accounts({
            payer: payer.publicKey,
            kycMintAuthority: kycMintAuthority,
            rewardMintToken: rewardMintKeypair.publicKey,
            rewardMintAuthority: rewardMintAuthority,
            resumeMintAuthority: resumeMintAuthority,
            rewardVaultAuthority: rewardVaultAuthority,
            kycValidator: payer.publicKey,
            tokenProgram: TOKEN_2022_PROGRAM_ID,
            associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
            systemProgram: SystemProgram.programId,
        }).rpc();


        const xcityAcct = await program.account.xcity.fetch(xcityKey);
        console.log(`xcityAcct: ${JSON.stringify(xcityAcct)}`);
        
        assert.equal(xcityAcct.kycSkip, true);
        assert.equal(xcityAcct.kycMintAuthority.equals(kycMintAuthority), true);
        assert.equal(xcityAcct.rewardMintToken.equals(rewardMintKeypair.publicKey), true);
        assert.equal(xcityAcct.rewardMintAuthority.equals(rewardMintAuthority), true);
        assert.equal(xcityAcct.resumeMintAuthority.equals(resumeMintAuthority), true);
        // assert.equal(xcityAcct.rewardVault.equals(rewardMintKeypair.publicKey), true);
        
    });
  });
  