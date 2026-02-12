// Biometric authentication utilities using Web Authentication API
export interface BiometricCredential {
    id: string;
    publicKey: string;
}

// Check if biometric authentication is available
export function isBiometricAvailable(): boolean {
    return (
        window.PublicKeyCredential !== undefined &&
        navigator.credentials !== undefined
    );
}

// Check if device supports platform authenticator (Face ID, Touch ID, etc.)
export async function isPlatformAuthenticatorAvailable(): Promise<boolean> {
    if (!isBiometricAvailable()) return false;

    try {
        const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
        return available;
    } catch (error) {
        console.error('Error checking platform authenticator:', error);
        return false;
    }
}

// Register biometric credential
export async function registerBiometric(userId: string = 'budget-app-user'): Promise<BiometricCredential | null> {
    if (!isBiometricAvailable()) {
        throw new Error('Biometric authentication not available');
    }

    try {
        // Generate random challenge
        const challenge = new Uint8Array(32);
        crypto.getRandomValues(challenge);

        const publicKeyCredentialCreationOptions: PublicKeyCredentialCreationOptions = {
            challenge,
            rp: {
                name: 'Budget App',
                id: window.location.hostname,
            },
            user: {
                id: new TextEncoder().encode(userId),
                name: userId,
                displayName: 'Budget App User',
            },
            pubKeyCredParams: [
                { alg: -7, type: 'public-key' }, // ES256
                { alg: -257, type: 'public-key' }, // RS256
            ],
            authenticatorSelection: {
                authenticatorAttachment: 'platform',
                userVerification: 'required',
            },
            timeout: 60000,
            attestation: 'none',
        };

        const credential = await navigator.credentials.create({
            publicKey: publicKeyCredentialCreationOptions,
        }) as PublicKeyCredential;

        if (!credential) {
            throw new Error('Failed to create credential');
        }

        // Store credential ID for future authentication
        const credentialData: BiometricCredential = {
            id: credential.id,
            publicKey: arrayBufferToBase64(credential.rawId),
        };

        localStorage.setItem('biometricCredential', JSON.stringify(credentialData));

        return credentialData;
    } catch (error) {
        console.error('Error registering biometric:', error);
        return null;
    }
}

// Authenticate using biometric
export async function authenticateWithBiometric(): Promise<boolean> {
    if (!isBiometricAvailable()) {
        throw new Error('Biometric authentication not available');
    }

    try {
        const storedCredential = localStorage.getItem('biometricCredential');
        if (!storedCredential) {
            throw new Error('No biometric credential registered');
        }

        const credentialData: BiometricCredential = JSON.parse(storedCredential);

        // Generate random challenge
        const challenge = new Uint8Array(32);
        crypto.getRandomValues(challenge);

        const publicKeyCredentialRequestOptions: PublicKeyCredentialRequestOptions = {
            challenge,
            allowCredentials: [{
                id: base64ToArrayBuffer(credentialData.publicKey),
                type: 'public-key',
                transports: ['internal'],
            }],
            timeout: 60000,
            userVerification: 'required',
        };

        const assertion = await navigator.credentials.get({
            publicKey: publicKeyCredentialRequestOptions,
        });

        return assertion !== null;
    } catch (error) {
        console.error('Error authenticating with biometric:', error);
        return false;
    }
}

// Remove biometric credential
export function removeBiometricCredential(): void {
    localStorage.removeItem('biometricCredential');
}

// Check if biometric is registered
export function isBiometricRegistered(): boolean {
    return localStorage.getItem('biometricCredential') !== null;
}

// Helper functions for encoding/decoding
function arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
}

function base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
}

// Settings management
export function isBiometricEnabled(): boolean {
    const setting = localStorage.getItem('biometricEnabled');
    return setting === 'true';
}

export function setBiometricEnabled(enabled: boolean): void {
    localStorage.setItem('biometricEnabled', enabled.toString());
}
