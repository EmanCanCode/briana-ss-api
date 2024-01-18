import 'dotenv/config';
import { ethers, Wallet } from 'ethers';
import { encrypt, decrypt } from 'eciesjs';
import { TxForm } from '../types/interfaces';

export class Chain {
    provider = new ethers.JsonRpcProvider(process.env.WS_PROVIDER!);

    async sendTx(
        _id: any, // user id, who is sending the tx,
        address: string, // user addr, stored in db
        txEncrypted: Buffer, // encrypted tx (ECIES, Elliptic Curve Integrated Encryption Scheme)
    ) {
        try {
            // Decrypt the tx
            const decryptedTxBuffer = decrypt(process.env.SERVER_SECRET!.slice(2), txEncrypted);
            // Convert Buffer to base64 string
            const txBase64 = decryptedTxBuffer.toString('base64');
            // Decode base64 to get the JSON string
            const jsonString = Buffer.from(txBase64, 'base64').toString('utf-8');
            // Parse JSON to get the object
            const { signedTx, signature } = JSON.parse(jsonString) as TxForm; // Destructure to get signedTx and signature
            // Verify the signature
            const signatureDigest = ethers.solidityPackedKeccak256(['bytes'], [signedTx]);
            const recoveredAddress = ethers.recoverAddress(signatureDigest, signature);
            // sanity check to make sure the recovered address is the same as the user's address stored in db
            if (recoveredAddress !== address) {
                throw new Error('Invalid signature');
            }
            // Send tx to blockchain
            const txResponse = await this.provider.send('eth_sendRawTransaction', [signedTx]);
            // Get tx hash
            const txHash = txResponse.result;
            // Wait for tx to be mined
            const txReceipt = await this.provider.waitForTransaction(txHash);
            // Return true and tx hash if tx was successful
            if (!txReceipt || txReceipt.status === 0) {
                throw new Error('Transaction failed');
            }
            return { txHash };
        } catch (err) {
            console.log("Error: ", err);
            throw err;
        }
    }
}