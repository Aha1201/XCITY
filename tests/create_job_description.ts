
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
import { initializeKeypair } from "@solana-developers/helpers";
import { encryptMessage, decryptMessage, signCustomMessage } from "./utils/crypt";
import { ASSOCIATED_TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { TOKEN_2022_PROGRAM_ID } from "@solana/spl-token";

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
    // program = anchor.workspace.Xcity as Program<Xcity>;
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
    const JOB_DESCRIPTION_SEED = "job_description";
  

  
    it("create_job_description!", async () => {   
        const verifier = await initializeKeypair(connection, {keypairPath: KEYPAIR_FILE_PATH, airdropAmount: 1});
        console.log(`verifier: ${verifier.publicKey.toBase58()}`);

        const xcityKey = PublicKey.findProgramAddressSync(
            [Buffer.from(XCITY_SEED)],
            program.programId
        )[0];

        const idKey = PublicKey.findProgramAddressSync(
            [Buffer.from(IDENTITY_SEED), payer.publicKey.toBuffer()],
            program.programId
        )[0];
        console.log(`idKey: ${idKey.toBase58()}`);


        const idInfo = await connection.getAccountInfo(idKey);

        if (!idInfo) {
            console.log(`idInfo not found`);
            return;
        }

        const xcityAcct = await program.account.xcity.fetch(xcityKey);

        const identityAcct = await program.account.identity.fetch(idKey);
        console.log(`identityAcct: ${JSON.stringify(identityAcct)}`);

        const jdHash = "jdHash";
        const jdUrl = "jdUrl";
        const orderId = (identityAcct.publishNum + 1).toString();

        const jdKey = PublicKey.findProgramAddressSync(
            [Buffer.from(JOB_DESCRIPTION_SEED), Buffer.from(orderId), payer.publicKey.toBuffer()],
            program.programId
        )[0];
        console.log(`jdKey: ${jdKey.toBase58()}`);
        await program.methods.createJobDescription(jdHash, jdUrl)
            .accounts({
                payer: payer.publicKey,
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

        const newIdentityAcct = await program.account.identity.fetch(idKey);
        const newOderId = newIdentityAcct.publishNum.toString();
        console.log(`newOderId: ${newOderId}`);

        const jdInfo = await program.account.jobDescription.fetch(jdKey);
        console.log(`jdInfo: ${JSON.stringify(jdInfo)}`);
    });
});