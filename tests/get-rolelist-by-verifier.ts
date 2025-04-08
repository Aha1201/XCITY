
import { Program } from "@coral-xyz/anchor";
import { Xcity } from '../target/types/xcity';
import bs58 from 'bs58';
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
// const endpoint = "https://intensive-ancient-glitter.solana-devnet.quiknode.pro/e580d6297f1a631ca33167112bbfc0c9eb1cc2d2/";
// const wsEndpoint = "wss://intensive-ancient-glitter.solana-devnet.quiknode.pro/e580d6297f1a631ca33167112bbfc0c9eb1cc2d2/";

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
        console.log(`keypair=====: ${keypair.publicKey.toBase58()}\n`);
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

    it("get-rolelist-by-verifier!", async () => {   

        const accounts = await connection.getProgramAccounts(
            program.programId,
            {
              dataSlice: { offset: 0, length: 0 },
              filters: [
                {
                  memcmp:
                    {
                      offset: 8,
                      bytes: payer.publicKey.toBase58()
                    },
                    
                },
                {
                    memcmp:
                      {
                        offset: 77,
                        bytes: bs58.encode([0])
                      },
                      
                  },
              ]
            }
          )
          const accountKeys = accounts.map(account => account.pubkey)
          console.log(`accountKeys: ${JSON.stringify(accountKeys)}`);
        const accountInfos = await connection.getMultipleAccountsInfo(accountKeys)
        const deserializedObjects = accountInfos.map((accountInfo) => {
            const accountData = accountInfo.data;
            try {
                const decodedRole = program.coder.accounts.decode("role", accountData);
                console.log(`decodedRole: ${JSON.stringify(decodedRole)}`);
              } catch (err) {
                console.error(`Failed to decode account :`, err);
                return null;
              }
        })
    });
});