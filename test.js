// Test script for CinemaOS Stremio Addon
const crypto = require("crypto");

// Test hexStringToByteArray
function hexStringToByteArray(hexString) {
    const bytes = [];
    for (let i = 0; i < hexString.length; i += 2) {
        bytes.push(parseInt(hexString.substr(i, 2), 16));
    }
    return Buffer.from(bytes);
}

// Test calculateHmacSha256
function calculateHmacSha256(data, key) {
    const hmac = crypto.createHmac("sha256", key);
    hmac.update(data);
    return hmac.digest("hex");
}

// Test createContentString
function createContentString(tmdbId, imdbId, seasonId, episodeId) {
    const parts = [];
    if (tmdbId) parts.push(`tmdbId:${tmdbId}`);
    if (imdbId) parts.push(`imdbId:${imdbId}`);
    if (seasonId && seasonId !== "") parts.push(`seasonId:${seasonId}`);
    if (episodeId && episodeId !== "") parts.push(`episodeId:${episodeId}`);
    return parts.join("|");
}

// Test cinemaOSGenerateHash
function cinemaOSGenerateHash(tmdbId, imdbId, seasonId, episodeId, isSeries) {
    const primary = "a7f3b9c2e8d4f1a6b5c9e2d7f4a8b3c6e1d9f7a4b2c8e5d3f9a6b4c1e7d2f8a5";
    const secondary = "d3f8a5b2c9e6d1f7a4b8c5e2d9f3a6b1c7e4d8f2a9b5c3e7d4f1a8b6c2e9d5f3";

    const contentString = createContentString(tmdbId, imdbId, seasonId, episodeId);
    const firstHash = calculateHmacSha256(contentString, primary);
    return calculateHmacSha256(firstHash, secondary);
}

// Run tests
console.log("=== CinemaOS Addon Tests ===\n");

// Test 1: hexStringToByteArray
console.log("Test 1: hexStringToByteArray");
const hexStr = "48656c6c6f"; // "Hello" in hex
const byteArray = hexStringToByteArray(hexStr);
console.log(`  Input: ${hexStr}`);
console.log(`  Output bytes: [${Array.from(byteArray).join(",")}]`);
console.log(`  Expected: [72,101,108,108,111]`);
console.log(`  Pass: ${Array.from(byteArray).join(",") === "72,101,108,108,111" ? "✓" : "✗"}\n`);

// Test 2: calculateHmacSha256
console.log("Test 2: calculateHmacSha256");
const testData = "test data";
const testKey = "test key";
const hmacResult = calculateHmacSha256(testData, testKey);
console.log(`  Input: data="${testData}", key="${testKey}"`);
console.log(`  Output: ${hmacResult}`);
console.log(`  Length: ${hmacResult.length} (expected: 64)\n`);

// Test 3: createContentString
console.log("Test 3: createContentString");
const content1 = createContentString("12345", "tt1234567", "", "");
console.log(`  Movie: ${content1}`);
console.log(`  Expected: tmdbId:12345|imdbId:tt1234567`);
console.log(`  Pass: ${content1 === "tmdbId:12345|imdbId:tt1234567" ? "✓" : "✗"}`);

const content2 = createContentString("12345", "tt1234567", "1", "5");
console.log(`  Series: ${content2}`);
console.log(`  Expected: tmdbId:12345|imdbId:tt1234567|seasonId:1|episodeId:5`);
console.log(`  Pass: ${content2 === "tmdbId:12345|imdbId:tt1234567|seasonId:1|episodeId:5" ? "✓" : "✗"}\n`);

// Test 4: cinemaOSGenerateHash
console.log("Test 4: cinemaOSGenerateHash");
const hash1 = cinemaOSGenerateHash("12345", "tt1234567", "", "", false);
console.log(`  Movie Hash: ${hash1}`);
console.log(`  Length: ${hash1.length} (expected: 64)`);

const hash2 = cinemaOSGenerateHash("12345", "tt1234567", "1", "5", true);
console.log(`  Series Hash: ${hash2}`);
console.log(`  Length: ${hash2.length} (expected: 64)\n`);

// Test 5: AES-GCM Decryption (mock test)
console.log("Test 5: AES-GCM Encryption/Decryption");
const key = crypto.pbkdf2Sync("password", "salt", 100000, 32, "sha256");
const iv = crypto.randomBytes(16);
const plaintext = "Test message for CinemaOS";

// Encrypt using createCipheriv with aes-256-gcm
const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
let encrypted = cipher.update(plaintext, "utf8");
encrypted = Buffer.concat([encrypted, cipher.final()]);
const authTag = cipher.getAuthTag();

// Decrypt using createDecipheriv with aes-256-gcm
const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
decipher.setAuthTag(authTag);
let decrypted = decipher.update(encrypted);
decrypted = Buffer.concat([decrypted, decipher.final()]);

console.log(`  Original: ${plaintext}`);
console.log(`  Decrypted: ${decrypted.toString("utf8")}`);
console.log(`  Pass: ${plaintext === decrypted.toString("utf8") ? "✓" : "✗"}\n`);

console.log("=== All Tests Completed ===");
