import { Program } from "@coral-xyz/anchor";
import { Xcity } from '../target/types/xcity';
import { sha256 } from 'js-sha256';
import { 
    Connection, 
    Keypair, 
    PublicKey, 
    SystemProgram, 
} from '@solana/web3.js';
import * as anchor from "@coral-xyz/anchor";
import { initializeKeypair, makeKeypairs } from "@solana-developers/helpers";
import { ASSOCIATED_TOKEN_PROGRAM_ID, ExtensionType, getAssociatedTokenAddress, getMintLen, LENGTH_SIZE, TOKEN_2022_PROGRAM_ID, TOKEN_PROGRAM_ID, TYPE_SIZE } from "@solana/spl-token";
import { encryptMessage, decryptMessage } from "./utils/crypt";

const KEYPAIR_FILE_PATH = '~/my-keypair.json';
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
    //     program = anchor.workspace.Xcity as Program<Xcity>;
    //   });

    before(async () => {
        const keypair = await initializeKeypair(connection, {keypairPath: KEYPAIR_FILE_PATH, airdropAmount: 1});
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
  

    it("init-kyc!", async () => {   

        const xcityKey = PublicKey.findProgramAddressSync(
            [Buffer.from(XCITY_SEED)],
            program.programId
        )[0];
        
        const idKey = PublicKey.findProgramAddressSync(
            [Buffer.from(IDENTITY_SEED), payer.publicKey.toBuffer()],
            program.programId
        )[0];


        let kycMintToken: PublicKey;
        let resumeMintToken: PublicKey;
        let rewardMintToken: PublicKey;
        let kycTokenAccount: PublicKey;
        let resumeTokenAccount: PublicKey;
        let rewardTokenAccount: PublicKey;
        let kycMintAuthority: PublicKey;
        let resumeMintAuthority: PublicKey;
        let rewardMintAuthority: PublicKey;

        const idInfo = await connection.getAccountInfo(idKey);
        // console.log(xcityInfo);

        if (idInfo) {
            console.log(`idKey=====: ${idKey.toBase58()}\n`);
            const identityAcct = await program.account.identity.fetch(idKey);
            kycMintToken = identityAcct.kycMintToken;
            resumeMintToken = identityAcct.resumeMintToken;
            kycTokenAccount = identityAcct.kycTokenAccount;
            resumeTokenAccount = identityAcct.resumeTokenAccount;
            rewardTokenAccount = identityAcct.rewardTokenAccount;
            console.log(`identityAcct: ${JSON.stringify(identityAcct)}`);
            if (identityAcct.isVerified) {
                console.log("identityAcct is verified");
                return;
            }
        }else{
            console.log(`identity is not exist\n`);
            return;
        }

      
        const xcityAcct = await program.account.xcity.fetch(xcityKey);
        rewardMintToken = xcityAcct.rewardMintToken;
        kycMintAuthority = xcityAcct.kycMintAuthority;
        resumeMintAuthority = xcityAcct.resumeMintAuthority;
        rewardMintAuthority = xcityAcct.rewardMintAuthority;

        const idStr = "MK1234567890";
        const name = "test";
        const url = "https://test.com";

        // encrypt the real idStr
        const encryptedMessage = encryptMessage(idStr, 
        payer.secretKey.slice(0, 32),
        payer.publicKey.toBytes());
        console.log("Encrypted:", Buffer.from(encryptedMessage).toString("base64"));
        const encryptionId = Buffer.from(encryptedMessage).toString("base64");


        // const hashId = "test"; 
        const hashId = sha256(Buffer.from(idStr));
        const dataHash = hashId;
        console.log(`hashId=====: ${hashId}\n`);
        console.log(`dataHash=====: ${dataHash}\n`);


        // decrypt to the real idStr(test)
        const decryptedMessage = decryptMessage(Buffer.from(encryptionId, "base64"), 
            payer.publicKey.toBytes(), 
        payer.secretKey.slice(0, 32));
        console.log("Decrypted:", decryptedMessage);
        
        console.log(`kycMintToken=====: ${kycMintToken.toBase58()}\n`);
        console.log(`resumeMintToken=====: ${resumeMintToken.toBase58()}\n`);
        console.log(`rewardMintToken=====: ${rewardMintToken.toBase58()}\n`);
        console.log(`kycTokenAccount=====: ${kycTokenAccount.toBase58()}\n`);
        console.log(`resumeTokenAccount=====: ${resumeTokenAccount.toBase58()}\n`);
        console.log(`rewardTokenAccount=====: ${rewardTokenAccount.toBase58()}\n`);
        console.log(`kycMintAuthority=====: ${kycMintAuthority.toBase58()}\n`);
        console.log(`resumeMintAuthority=====: ${resumeMintAuthority.toBase58()}\n`);
        console.log(`rewardMintAuthority=====: ${rewardMintAuthority.toBase58()}\n`);


        await program.methods.initKyc(hashId, encryptionId, dataHash, name, url)
            .accounts({
                payer: payer.publicKey,
                identity: idKey,
                xcity: xcityKey,
                kycMintToken: kycMintToken,
                resumeMintToken: resumeMintToken,
                kycMintAuthority: kycMintAuthority,
                resumeMintAuthority: resumeMintAuthority,
                rewardMintToken: rewardMintToken,
                rewardTokenAccount: rewardTokenAccount,
                kycTokenAccount: kycTokenAccount,
                resumeTokenAccount: resumeTokenAccount,
                rewardMintAuthority: rewardMintAuthority,
                tokenProgram: TOKEN_PROGRAM_ID,
                token2022Program: TOKEN_2022_PROGRAM_ID,
                associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
                systemProgram: SystemProgram.programId,
        }).rpc();

        console.log("initKyc success");
    });
});