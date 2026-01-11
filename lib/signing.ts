// Ed25519 response signing for license server
import * as ed from '@noble/ed25519';

// The private key should be set in environment variables (base64 encoded)
// Generate with: node -e "const ed = require('@noble/ed25519'); const key = ed.utils.randomPrivateKey(); console.log(Buffer.from(key).toString('base64'));"
function getPrivateKey(): Uint8Array {
  const keyBase64 = process.env.ED25519_PRIVATE_KEY;
  if (!keyBase64) {
    throw new Error('ED25519_PRIVATE_KEY environment variable is not set');
  }
  return Buffer.from(keyBase64, 'base64');
}

/**
 * Signs response data using Ed25519.
 * The signature can be verified by the app using the embedded public key.
 */
export async function signResponse(data: object): Promise<string> {
  const privateKey = getPrivateKey();
  const message = JSON.stringify(data);
  const messageBytes = new TextEncoder().encode(message);
  const signature = await ed.signAsync(messageBytes, privateKey);
  return Buffer.from(signature).toString('base64');
}

/**
 * Gets the public key in base64 format.
 * This should be embedded in the app for verification.
 */
export async function getPublicKeyBase64(): Promise<string> {
  const privateKey = getPrivateKey();
  const publicKey = await ed.getPublicKeyAsync(privateKey);
  return Buffer.from(publicKey).toString('base64');
}

/**
 * Signs response data and returns both the data and signature.
 * Convenience function for API endpoints.
 */
export async function signedResponse<T extends object>(
  data: T
): Promise<{ data: T; signature: string }> {
  const signature = await signResponse(data);
  return { data, signature };
}
