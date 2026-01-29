const { addonBuilder, serveHTTP } = require("stremio-addon-sdk");
const axios = require("axios");
const crypto = require("crypto");

const CINEMA_OS_API = "https://cinemaos.tech";

// Manifest for the addon
const manifest = {
    id: "com.cinemaos.stremio",
    version: "1.0.0",
    name: "CinemaOS",
    description: "Stream movies and TV shows from CinemaOS sources",
    logo: "https://cinemaos.tech/logo.png",
    background: "https://cinemaos.tech/background.jpg",
    resources: ["stream"],
    types: ["movie", "series"],
    idPrefixes: ["tt", "tmdb:"],
    catalogs: [],
    behaviorHints: {
        configurable: false,
        configurationRequired: false
    }
};

const builder = new addonBuilder(manifest);

// Source headers for CinemaOS API requests
const sourceHeaders = {
    "Accept": "*/*",
    "Accept-Language": "en-US,en;q=0.9",
    "Connection": "keep-alive",
    "Referer": CINEMA_OS_API,
    "Host": "cinemaos.tech",
    "Sec-Fetch-Dest": "empty",
    "Sec-Fetch-Mode": "cors",
    "Sec-Fetch-Site": "same-origin",
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36",
    "sec-ch-ua": "\"Not;A=Brand\";v=\"99\", \"Google Chrome\";v=\"139\", \"Chromium\";v=\"139\"",
    "sec-ch-ua-mobile": "?0",
    "sec-ch-ua-platform": "\"Windows\"",
    "Content-Type": "application/json"
};

// Convert hex string to byte array
function hexStringToByteArray(hexString) {
    const bytes = [];
    for (let i = 0; i < hexString.length; i += 2) {
        bytes.push(parseInt(hexString.substr(i, 2), 16));
    }
    return Buffer.from(bytes);
}

// Calculate HMAC-SHA256
function calculateHmacSha256(data, key) {
    const hmac = crypto.createHmac("sha256", key);
    hmac.update(data);
    return hmac.digest("hex");
}

// Create content string for hash generation
function createContentString(tmdbId, imdbId, seasonId, episodeId) {
    const parts = [];
    if (tmdbId) parts.push(`tmdbId:${tmdbId}`);
    if (imdbId) parts.push(`imdbId:${imdbId}`);
    if (seasonId && seasonId !== "") parts.push(`seasonId:${seasonId}`);
    if (episodeId && episodeId !== "") parts.push(`episodeId:${episodeId}`);
    return parts.join("|");
}

// Generate hash for CinemaOS authentication
function cinemaOSGenerateHash(tmdbId, imdbId, seasonId, episodeId, isSeries) {
    const primary = "a7f3b9c2e8d4f1a6b5c9e2d7f4a8b3c6e1d9f7a4b2c8e5d3f9a6b4c1e7d2f8a5";
    const secondary = "d3f8a5b2c9e6d1f7a4b8c5e2d9f3a6b1c7e4d8f2a9b5c3e7d4f1a8b6c2e9d5f3";

    const contentString = createContentString(tmdbId, imdbId, seasonId, episodeId);
    const firstHash = calculateHmacSha256(contentString, primary);
    return calculateHmacSha256(firstHash, secondary);
}

// Decrypt AES-256-GCM response
function cinemaOSDecryptResponse(encrypted, cin, mao, salt) {
    const keyBytes = Buffer.from("a1b2c3d4e4f6477658455678901477567890abcdef1234567890abcdef123456");
    const ivBytes = hexStringToByteArray(cin);
    const authTagBytes = hexStringToByteArray(mao);
    const encryptedBytes = hexStringToByteArray(encrypted);
    const saltBytes = hexStringToByteArray(salt);

    // Derive key with PBKDF2-HMAC-SHA256
    const key = crypto.pbkdf2Sync(
        keyBytes.toString(),
        saltBytes,
        100000,
        32,
        "sha256"
    );

    // AES-256-GCM decrypt using createDecipheriv
    // In Node.js, GCM mode is specified in the algorithm string
    const decipher = crypto.createDecipheriv("aes-256-gcm", key, ivBytes);
    decipher.setAuthTag(authTagBytes);

    let decrypted = decipher.update(encryptedBytes);
    decrypted = Buffer.concat([decrypted, decipher.final()]);

    return decrypted.toString("utf8");
}

// Parse CinemaOS sources from decrypted JSON
function parseCinemaOSSources(jsonString) {
    try {
        const json = JSON.parse(jsonString);
        const sourcesObject = json.sources;
        const sourcesList = [];

        for (const key in sourcesObject) {
            if (sourcesObject.hasOwnProperty(key)) {
                const source = sourcesObject[key];

                // Check if source has "qualities" object
                if (source.qualities) {
                    const qualities = source.qualities;
                    for (const qualityKey in qualities) {
                        if (qualities.hasOwnProperty(qualityKey)) {
                            const qualityObj = qualities[qualityKey];
                            sourcesList.push({
                                server: source.server || key,
                                url: qualityObj.url || "",
                                type: qualityObj.type || "",
                                speed: source.speed || "",
                                bitrate: source.bitrate || "",
                                quality: qualityKey
                            });
                        }
                    }
                } else {
                    // Regular source with direct URL
                    sourcesList.push({
                        server: source.server || key,
                        url: source.url || "",
                        type: source.type || "",
                        speed: source.speed || "",
                        bitrate: source.bitrate || "",
                        quality: source.quality || ""
                    });
                }
            }
        }

        return sourcesList;
    } catch (error) {
        console.error("Error parsing CinemaOS sources:", error);
        return [];
    }
}

// Get quality value from name
function getQualityFromName(qualityName) {
    if (!qualityName) return 1080;
    const quality = qualityName.toString().toLowerCase();
    if (quality.includes("4k") || quality.includes("2160")) return 2160;
    if (quality.includes("fhd") || quality.includes("1080")) return 1080;
    if (quality.includes("hd") || quality.includes("720")) return 720;
    if (quality.includes("480") || quality.includes("sd")) return 480;
    if (quality.includes("360")) return 360;
    return 1080;
}

// Main function to invoke CinemaOS
async function invokeCinemaOS(imdbId, tmdbId, title, season, episode, year) {
    const streams = [];

    try {
        const fixTitle = title ? title.replace(/\s/g, "+") : "";
        const secretHash = cinemaOSGenerateHash(
            tmdbId ? tmdbId.toString() : null,
            imdbId,
            season ? season.toString() : "",
            episode ? episode.toString() : "",
            season !== null && season !== undefined
        );

        const type = season === null || season === undefined ? "movie" : "tv";
        let sourceUrl;

        if (season === null || season === undefined) {
            sourceUrl = `${CINEMA_OS_API}/api/provider?type=${type}&tmdbId=${tmdbId}&imdbId=${imdbId}&t=${fixTitle}&ry=${year}&secret=${secretHash}`;
        } else {
            sourceUrl = `${CINEMA_OS_API}/api/provider?type=${type}&tmdbId=${tmdbId}&imdbId=${imdbId}&seasonId=${season}&episodeId=${episode}&t=${fixTitle}&ry=${year}&secret=${secretHash}`;
        }

        console.log("Fetching from CinemaOS:", sourceUrl);

        const response = await axios.get(sourceUrl, {
            headers: sourceHeaders,
            timeout: 60000
        });

        const sourceResponse = response.data;

        if (!sourceResponse || !sourceResponse.data) {
            console.log("No data received from CinemaOS");
            return streams;
        }

        const decryptedJson = cinemaOSDecryptResponse(
            sourceResponse.data.encrypted,
            sourceResponse.data.cin,
            sourceResponse.data.mao,
            sourceResponse.data.salt
        );

        const sources = parseCinemaOSSources(decryptedJson);

        for (const source of sources) {
            let streamType = "video";
            if (source.type && source.type.toLowerCase().includes("hls")) {
                streamType = "hls";
            } else if (source.type && source.type.toLowerCase().includes("dash")) {
                streamType = "dash";
            }

            let quality = 1080;
            if (source.bitrate) {
                if (source.bitrate.toLowerCase().includes("fhd")) quality = 1080;
                else if (source.bitrate.toLowerCase().includes("hd")) quality = 720;
            }
            if (source.quality) {
                const parsedQuality = parseInt(source.quality);
                if (!isNaN(parsedQuality)) {
                    quality = parsedQuality;
                } else {
                    quality = getQualityFromName(source.quality);
                }
            }

            const titleStr = `CinemaOS [${source.server}] ${source.bitrate || ""} ${source.speed || ""}`.replace(/\s{2,}/g, " ").trim();

            const streamObj = {
                name: titleStr,
                url: source.url,
                quality: quality
            };

            if (streamType === "hls") {
                streamObj.type = "hls";
            } else if (streamType === "dash") {
                streamObj.type = "dash";
            }

            // Add headers for the stream
            streamObj.headers = {
                "Referer": CINEMA_OS_API,
                "User-Agent": sourceHeaders["User-Agent"]
            };

            streams.push(streamObj);
        }

    } catch (error) {
        console.error("Error invoking CinemaOS:", error.message);
    }

    return streams;
}

// Extract ID from Stremio ID format
function extractIds(id) {
    let imdbId = null;
    let tmdbId = null;

    if (id.startsWith("tt")) {
        imdbId = id;
    } else if (id.startsWith("tmdb:")) {
        tmdbId = id.replace("tmdb:", "");
    }

    return { imdbId, tmdbId };
}

// Stream handler
builder.defineStreamHandler(async (args) => {
    console.log("Stream request:", args);

    const { type, id } = args;
    let imdbId = null;
    let tmdbId = null;
    let season = null;
    let episode = null;

    // Parse ID based on type
    if (type === "movie") {
        const ids = extractIds(id);
        imdbId = ids.imdbId;
        tmdbId = ids.tmdbId;
    } else if (type === "series") {
        // Series ID format: tt1234567:1:2 (imdb:season:episode) or tmdb:12345:1:2
        const parts = id.split(":");
        if (parts[0].startsWith("tt")) {
            imdbId = parts[0];
            season = parseInt(parts[1]) || null;
            episode = parseInt(parts[2]) || null;
        } else if (parts[0] === "tmdb") {
            tmdbId = parts[1];
            season = parseInt(parts[2]) || null;
            episode = parseInt(parts[3]) || null;
        }
    }

    if (!imdbId && !tmdbId) {
        console.log("No valid ID found");
        return { streams: [] };
    }

    // We need to fetch metadata to get the title and year
    // For now, we'll try to get streams without title/year as they're optional in the API
    const streams = await invokeCinemaOS(imdbId, tmdbId, null, season, episode, null);

    return { streams };
});

// Serve the addon
const addonInterface = builder.getInterface();
const port = process.env.PORT || 7000;

// Create Express app for both HTTP server and Stremio addon
const express = require("express");
const app = express();

// Health check endpoint
app.get("/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Manifest endpoint for direct access
app.get("/manifest.json", (req, res) => {
    res.json(manifest);
});

// Serve the addon
serveHTTP(addonInterface, { server: app, port });

console.log(`CinemaOS Stremio addon running on port ${port}`);
console.log(`Manifest URL: http://localhost:${port}/manifest.json`);
