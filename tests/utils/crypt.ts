
import * as nacl from "tweetnacl";
import bs58 from 'bs58';
// encrypt  message
export function encryptMessage(message: string, senderSecretKey: Uint8Array, recipientPublicKey: Uint8Array): Uint8Array {
    const nonce = nacl.randomBytes(nacl.box.nonceLength); //  nonce
    const messageBytes = Buffer.from(message, "utf8");
  
    const encrypted = nacl.box(messageBytes, nonce, recipientPublicKey, senderSecretKey);
    return Buffer.concat([nonce, encrypted]); //  nonce + encrypted message
  }
  
//  decrypt message
export function decryptMessage(encrypted: Uint8Array, senderPublicKey: Uint8Array, recipientSecretKey: Uint8Array): string {
    const nonce = encrypted.slice(0, nacl.box.nonceLength); //  24 bytes for nonce
    const ciphertext = encrypted.slice(nacl.box.nonceLength);
  
    const decrypted = nacl.box.open(ciphertext, nonce, senderPublicKey, recipientSecretKey);
    if (!decrypted) throw new Error("Decryption failed");
    return Buffer.from(decrypted).toString("utf8");
  }



export function signCustomMessage(message: string | Uint8Array, secretKey: Uint8Array): string {
    const messageBytes = typeof message === 'string' 
        ? new TextEncoder().encode(message) 
        : message;
    
    const signature = nacl.sign.detached(messageBytes, secretKey);
    return bs58.encode(signature);
}