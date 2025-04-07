import { Program } from "@coral-xyz/anchor";
import { Xcity } from '../target/types/xcity';
import { 
    Connection, 
    Keypair, 
    PublicKey, 
    sendAndConfirmTransaction, 
    SystemProgram, 
    Transaction, 
} from '@solana/web3.js';
import * as anchor from "@coral-xyz/anchor";
import { initializeKeypair, makeKeypairs } from "@solana-developers/helpers";
import { ASSOCIATED_TOKEN_PROGRAM_ID, ExtensionType, getAssociatedTokenAddress, getMintLen, LENGTH_SIZE, TOKEN_2022_PROGRAM_ID, TYPE_SIZE } from "@solana/spl-token";
import { pack, TokenMetadata } from "@solana/spl-token-metadata";

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
  

  
    it("register!", async () => {   
        const [kycMintKeypair, ResumeMintKeypair] = makeKeypairs(2);

        const xcityKey = PublicKey.findProgramAddressSync(
            [Buffer.from(XCITY_SEED)],
            program.programId
        )[0];
        
        const idKey = PublicKey.findProgramAddressSync(
            [Buffer.from(IDENTITY_SEED), payer.publicKey.toBuffer()],
            program.programId
        )[0];



        const idInfo = await connection.getAccountInfo(idKey);
        // console.log(xcityInfo);

        if (idInfo) {
            console.log(`idKey=====: ${idKey.toBase58()}\n`);
            const identityAcct = await program.account.identity.fetch(idKey);
            console.log(`identityAcct: ${JSON.stringify(identityAcct)}`);
            return;
        }

        const kycMetadata: TokenMetadata = {
            mint: kycMintKeypair.publicKey,
            name: "XCITY_KYC",
            symbol: "XCITY_KYC",
            uri: "XCITY_KYC",
            additionalMetadata: [],
          };

        const resumeMetadata: TokenMetadata = {
            mint: ResumeMintKeypair.publicKey,
            name: "XCITY_RESUME",
            symbol: "XCITY_RESUME",
            uri: "XCITY_RESUME",
            additionalMetadata: [],
        };
          
        const kycMintLen = getMintLen([ExtensionType.MetadataPointer,ExtensionType.NonTransferable]);
        const kycMintSpace = kycMintLen + TYPE_SIZE + LENGTH_SIZE + pack(kycMetadata).length+100;
        const resumeMintLen = getMintLen([ExtensionType.MetadataPointer]);
        const resumeMintSpace = resumeMintLen + TYPE_SIZE + LENGTH_SIZE + pack(resumeMetadata).length+100;
        console.log(`kycMintSpace: ${kycMintSpace}`);   

        console.log(`resumeMintSpace: ${resumeMintSpace}`);   

        console.log(`kycMintLen: ${kycMintLen}`);   

        console.log(`resumeMintLen: ${resumeMintLen}`); 

        const xcityAcct = await program.account.xcity.fetch(xcityKey);

        const kycAta = await getAssociatedTokenAddress(
            kycMintKeypair.publicKey,
            payer.publicKey,
            false,
            TOKEN_2022_PROGRAM_ID,
          );
        console.log(`kycAta: ${kycAta}`);
        const resumeAta = await getAssociatedTokenAddress(
            ResumeMintKeypair.publicKey,
            payer.publicKey,
            false,
            TOKEN_2022_PROGRAM_ID,
          );
        console.log(`resumeAta: ${resumeAta}`);   
        const rewardAta = await getAssociatedTokenAddress(
            xcityAcct.rewardMintToken,
            payer.publicKey,
            false,
            TOKEN_2022_PROGRAM_ID,
          );
        console.log(`rewardAta: ${rewardAta}`);   
        
        let registerInstruction = await program.methods.register({enterprise: {}}, kycMintSpace, resumeMintSpace)
            .accounts({
                payer: payer.publicKey,
                kycMintToken: kycMintKeypair.publicKey,
                resumeMintToken: ResumeMintKeypair.publicKey,
                xcity: xcityKey,
                kycMintAuthority: xcityAcct.kycMintAuthority,
                resumeMintAuthority: xcityAcct.resumeMintAuthority,
                tokenProgram: TOKEN_2022_PROGRAM_ID,
                associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
                systemProgram: SystemProgram.programId,

        }).instruction();

        let initAtaInstruction = await program.methods.initAta()
            .accounts({
                payer: payer.publicKey,
                identity: idKey,
                xcity: xcityKey,
                rewardTokenAccount: rewardAta,
                kycTokenAccount: kycAta,
                resumeTokenAccount: resumeAta,
                rewardMintToken: xcityAcct.rewardMintToken,
                rewardMintAuthority: xcityAcct.rewardMintAuthority,
                kycMintToken: kycMintKeypair.publicKey,
                resumeMintToken: ResumeMintKeypair.publicKey,
                kycMintAuthority: xcityAcct.kycMintAuthority,
                resumeMintAuthority: xcityAcct.resumeMintAuthority,
                tokenProgram: TOKEN_2022_PROGRAM_ID,
                associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
                systemProgram: SystemProgram.programId,
            }).instruction();

        const registerTransaction = new Transaction().add(registerInstruction, initAtaInstruction);

        const signature = await sendAndConfirmTransaction(
            connection,
            registerTransaction,
            [payer, kycMintKeypair, ResumeMintKeypair]
            );
        const identityAcct = await program.account.identity.fetch(idKey);
        console.log(`identityAcct: ${JSON.stringify(identityAcct)}`);
    });
});