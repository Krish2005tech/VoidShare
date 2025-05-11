import { AES256 } from "./aes";

let aesInstance;
let aesKey;

aesKey = crypto.getRandomValues(new Uint8Array(32)); // 256-bit key
aesInstance = new AES256(aesKey); 



function base64ToUint8Array(base64) {
    const binaryString = atob(base64);
    return Uint8Array.from(binaryString, char => char.charCodeAt(0));
}

function uint8ArrayToBase64(uint8Array) {
    const binaryString = String.fromCharCode(...uint8Array);
    return btoa(binaryString);}

function copyKey(id) {
        const field = document.getElementById(id);
        field.select();
        field.setSelectionRange(0, 99999); // For mobile
        navigator.clipboard.writeText(field.value);
        alert("Key copied!");
    }

async function initializeAES() {
    aesKey = crypto.getRandomValues(new Uint8Array(32)); // 256-bit key
    const aesInstance2 = new AES256(aesKey);
    return aesInstance2;
}

function getAESkey() {
    // const AESkey = aesInstance.key;
    const AESkeyBase64 = btoa(String.fromCharCode(...aesInstance.key));
    localStorage.setItem("aesKey", AESkeyBase64);
    return AESkeyBase64;
}

//function to generate ECC keys - returns public and private keys in base64 format and also stores them in localStorage
async function generateECCKeys() {
    const keyPair = await window.crypto.subtle.generateKey(
        {
            name: "ECDH",
            namedCurve: "P-256",
        },
        true,
        ["deriveKey"]
    );

    const publicKey = await window.crypto.subtle.exportKey("spki", keyPair.publicKey);
    const privateKey = await window.crypto.subtle.exportKey("pkcs8", keyPair.privateKey);

    console.log("Public Key (Base64):", btoa(String.fromCharCode(...new Uint8Array(publicKey))));
    console.log("Private Key (Base64):", btoa(String.fromCharCode(...new Uint8Array(privateKey))));

    localStorage.setItem("publicKey", btoa(String.fromCharCode(...new Uint8Array(publicKey))));
    localStorage.setItem("privateKey", btoa(String.fromCharCode(...new Uint8Array(privateKey))));

    return {publicKey: btoa(String.fromCharCode(...new Uint8Array(publicKey))), privateKey: btoa(String.fromCharCode(...new Uint8Array(privateKey)))};
}

async function deriveSharedSecret(privateKeyBase64, publicKeyBase64) {
    const privateKeyBuffer = new Uint8Array(atob(privateKeyBase64).split("").map(c => c.charCodeAt(0)));
    const publicKeyBuffer = new Uint8Array(atob(publicKeyBase64).split("").map(c => c.charCodeAt(0)));

    const privateKey = await window.crypto.subtle.importKey(
        "pkcs8",
        privateKeyBuffer,
        { name: "ECDH", namedCurve: "P-256" },
        true,
        ["deriveKey"]
    );

    const publicKey = await window.crypto.subtle.importKey(
        "spki",
        publicKeyBuffer,
        { name: "ECDH", namedCurve: "P-256" },
        true,
        []
    );

    return await window.crypto.subtle.deriveKey(
        { name: "ECDH", public: publicKey },
        privateKey,
        { name: "AES-GCM", length: 256 },
        true,
        ["encrypt", "decrypt"]
    );
}


async function encryptFile(file) {
    const encryptedData = await aesInstance.encryptFile(file);

    const blob = new Blob([encryptedData]);
    const url = URL.createObjectURL(blob);

    const downloadLink = document.getElementById('downloadLink_Encrypt');
    downloadLink.href = url;
    downloadLink.download = 'encrypted_' + file.name;
    downloadLink.style.display = 'block';
    downloadLink.innerText = 'Download Encrypted File';
}

async function decryptFile(fileInput,userKeyBase64) {
    if (!fileInput.files.length) return alert("Select an encrypted file first");

    if (!userKeyBase64) return alert("Please paste the AES key!");

    const aesKeyBytes = new Uint8Array(atob(userKeyBase64).split('').map(c => c.charCodeAt(0)));
    const aes = new AES256(aesKeyBytes); // Use provided key

    const file = fileInput.files[0];
    const reader = new FileReader();

    reader.onload = async function (event) {
        const encryptedData = new Uint8Array(event.target.result);
        const encryptedBlob = new Blob([encryptedData]);
        const decryptedBlob = await aes.decryptFile(encryptedBlob);

        if (decryptedBlob) {
            const url = URL.createObjectURL(decryptedBlob);

            const downloadLink = document.getElementById('downloadLink_Decrypt');
            downloadLink.href = url;
            downloadLink.download = 'decrypted_' + file.name.replace('encrypted_', '');
            downloadLink.innerText = 'Download Decrypted File';
            downloadLink.style.display = 'block';
        }
    };
    reader.readAsArrayBuffer(file);
}


async function encryptAESKey(aesKey) {
    try {
        const publicKeyBase64 = localStorage.getItem("externalPublicKey");
        const privateKeyBase64 = localStorage.getItem("privateKey");

        if (!publicKeyBase64 || !privateKeyBase64) {
            throw new Error("Missing keys in localStorage.");
        }

        const sharedSecret = await deriveSharedSecret(privateKeyBase64, publicKeyBase64);

        const iv = crypto.getRandomValues(new Uint8Array(12));
        const encryptedData = await crypto.subtle.encrypt(
            { name: "AES-GCM", iv: iv },
            sharedSecret,
            aesKey
        );

        const ivBase64 = uint8ArrayToBase64(iv);
        const encryptedBase64 = uint8ArrayToBase64(new Uint8Array(encryptedData));

        return `${ivBase64}:${encryptedBase64}`;
    } catch (error) {
        console.error("Encryption failed:", error.message);
        return null;
    }
}

// function uint8ArrayToBase64(uint8Array) {
//     return btoa(String.fromCharCode(...uint8Array));
// }


async function decryptAESKey(encryptedAESInput) {

    const privateKeyBase64 = localStorage.getItem("privateKey");
    const publicKeyBase64 = localStorage.getItem("externalPublicKey");

    const [ivBase64, encryptedBase64] = encryptedAESInput.split(":");
    const iv = new Uint8Array(atob(ivBase64).split("").map(c => c.charCodeAt(0)));
    const encryptedData = new Uint8Array(atob(encryptedBase64).split("").map(c => c.charCodeAt(0)));

    const sharedSecret = await deriveSharedSecret(privateKeyBase64, publicKeyBase64);

    try {
        const decryptedData = await crypto.subtle.decrypt(
            { name: "AES-GCM", iv: iv },
            sharedSecret,
            encryptedData
        );

        // document.getElementById("decryptedAES").value = btoa(String.fromCharCode(...new Uint8Array(decryptedData)));

        return btoa(String.fromCharCode(...new Uint8Array(decryptedData)));
    } catch (error) {
        alert("Decryption failed! Invalid key.");
    }
}



export {initializeAES, generateECCKeys, deriveSharedSecret, encryptFile, decryptFile, encryptAESKey, decryptAESKey, getAESkey, copyKey };