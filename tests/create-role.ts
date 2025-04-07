
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

const KEYPAIR_FILE_PATH = '~/my-keypair.json';
const endpoint = "http://127.0.0.1:8899";
const wsEndpoint = "ws://127.0.0.1:8900";
const connection = new Connection(endpoint, {wsEndpoint: wsEndpoint, commitment: 'finalized'});

describe("xcity", () => {

    let wallet: anchor.Wallet;
    let payer: Keypair;
    let provider: anchor.AnchorProvider;
    let program: Program<Xcity>;
    before( () => {
         wallet = anchor.Wallet.local();
         payer = wallet.payer;
         provider = new anchor.AnchorProvider(connection, wallet, {
            commitment: 'finalized'
        });
        anchor.setProvider(provider);
    program = anchor.workspace.Xcity as Program<Xcity>;
      });

    // before(async () => {
    //     const keypair = await initializeKeypair(connection, {keypairPath: KEYPAIR_FILE_PATH, airdropAmount: 1});
    //     console.log(`keypair**=====: ${keypair.publicKey.toBase58()}\n`);
    //     wallet = new anchor.Wallet(keypair);
    //     payer = wallet.payer;
    //     provider = new anchor.AnchorProvider(connection, wallet, {
    //         commitment: 'finalized'
    //     });
    //     anchor.setProvider(provider);
    //     program = anchor.workspace.Xcity as Program<Xcity>;
    //   });


    const XCITY_SEED = "xcity";
    const REWARD_MINT_AUTHORITY_SEED = "reward_mint_authority";
    const KYC_MINT_AUTHORITY_SEED = "kyc_mint_authority";
    const RESUME_MINT_AUTHORITY_SEED = "resume_mint_authority";
    const REWARD_VAULT_AUTHORITY_SEED = "reward_vault_authority";
    const IDENTITY_SEED = "identity";
    const ROLE_SEED = "role";
  

  
    it("create_role!", async () => {   
        const verifier = await initializeKeypair(connection, {keypairPath: KEYPAIR_FILE_PATH, airdropAmount: 1});
        console.log(`verifier: ${verifier.publicKey.toBase58()}`);


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

        const identityAcct = await program.account.identity.fetch(idKey);
        console.log(`identityAcct: ${JSON.stringify(identityAcct)}`);

        const old_encryptionId = identityAcct.encryptionId;
        console.log(`old_encryptionId: ${old_encryptionId}`);

        const decryptedMessage = decryptMessage(Buffer.from(old_encryptionId, "base64"), 
        payer.publicKey.toBytes(), 
        payer.secretKey.slice(0, 32));
        console.log("Decrypted:", decryptedMessage);

        const encryptedMessage = encryptMessage(decryptedMessage, 
            payer.secretKey.slice(0, 32),
            verifier.publicKey.toBytes());
        const encryptionId = Buffer.from(encryptedMessage).toString("base64");
        console.log("Encrypted:", encryptionId);


        const orderId = (identityAcct.publishNum + 1).toString();
        const roleKey = PublicKey.findProgramAddressSync(
            [Buffer.from(ROLE_SEED), Buffer.from(orderId), payer.publicKey.toBuffer()],
            program.programId
        )[0];
        console.log(`roleKey: ${roleKey.toBase58()}`);

        const info = "2020.02-2024.03 aliyun cloud security engineer";
        // const signMessage = info + roleKey.toBase58() + payer.publicKey.toBase58();
        // const signature = signCustomMessage(signMessage, wallet.payer.secretKey);
        // console.log("Signature:", signature);


        await program.methods.createRole(encryptionId, info)
            .accounts({
                payer: payer.publicKey,
                verifier: verifier.publicKey,
                identity: idKey,
                role: roleKey,
                systemProgram: SystemProgram.programId,
            })
            .rpc();

        const newIdentityAcct = await program.account.identity.fetch(idKey);
        const newOderId = newIdentityAcct.publishNum.toString();
        console.log(`newOderId: ${newOderId}`);

        const roleInfo = await program.account.role.fetch(roleKey);
        console.log(`roleInfo: ${JSON.stringify(roleInfo)}`);
    });
});