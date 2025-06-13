// Load environment variables from .env file
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const multer = require('multer');
const axios = require('axios');
const { ethers } = require('ethers'); // Import ethers.js for backend interaction
const FormData = require('form-data'); // Explicitly import Node.js's FormData
const fs = require('fs'); // For reading files

const app = express();
const port = process.env.PORT || 3001; // Defaults to 3001 if PORT is not set in .env

// --- Environment Variables Configuration ---
const PINATA_API_KEY = process.env.PINATA_API_KEY;
const PINATA_SECRET_API_KEY = process.env.PINATA_SECRET_API_KEY;
const ETHEREUM_NODE_URL = process.env.ETHEREUM_NODE_URL;
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS;
const IPFS_GATEWAY_URL = process.env.IPFS_GATEWAY_URL || 'https://ipfs.io/ipfs/'; // Get IPFS Gateway URL

// --- Smart Contract ABI ---
let NFT_CONTRACT_ABI;
try {
    const abiPath = './contracts/DopulNFT.json';
    console.log('Attempting to load ABI from:', abiPath);
    const rawData = fs.readFileSync(abiPath, 'utf8');
    const parsedAbi = JSON.parse(rawData);
    
    if (Array.isArray(parsedAbi)) {
        NFT_CONTRACT_ABI = parsedAbi; // Use the parsed array directly
        console.log('Contract ABI loaded successfully from:', abiPath);
        console.log('Type of loaded ABI:', typeof NFT_CONTRACT_ABI); // Debugging ABI type
        console.log('Is loaded ABI an Array:', Array.isArray(NFT_CONTRACT_ABI)); // Debugging ABI Array check
        console.log('Loaded ABI length:', NFT_CONTRACT_ABI.length); // Debugging ABI length
        if (NFT_CONTRACT_ABI.length > 0) {
            console.log('First element of ABI:', JSON.stringify(NFT_CONTRACT_ABI[0], null, 2)); // Debugging first element
        }
    } else {
        throw new Error('DopulNFT.json is not a direct ABI array. It should be a JSON array of ABI fragments.');
    }
} catch (error) {
    console.error('Failed to load contract ABI. Please ensure DopulNFT.json is in ./contracts/ and is correctly formatted as a JSON array.');
    console.error('ABI Loading Error Details:', error.message);
    process.exit(1); // Terminate application if ABI cannot be loaded
}

// --- Middleware Setup ---
app.use(cors()); // Enable CORS for cross-origin requests from your frontend
app.use(express.json()); // For parsing application/json
app.use(express.urlencoded({ extended: true })); // For parsing application/x-www-form-urlencoded

// Multer storage configuration for file uploads
const storage = multer.memoryStorage(); // Store files in memory as buffers
const upload = multer({ storage: storage });

// --- IPFS Helper Function ---
/**
 * @dev Uploads data (image or JSON) to Pinata IPFS.
 * @param data The data to upload (Buffer for image, JSON object for metadata).
 * @param fileName Name of the file on IPFS.
 * @param isJson Boolean indicating if the data is JSON (for Pinata's metadata).
 * @returns IPFS CID (Content Identifier) or null on error.
 */
async function uploadToPinata(data, fileName, isJson = false) {
    if (!PINATA_API_KEY || !PINATA_SECRET_API_KEY) {
        console.error('Pinata API keys are not set in .env');
        return null;
    }

    const pinataUrl = 'https://api.pinata.cloud/pinning/pinFileToIPFS';
    const jsonPinataUrl = 'https://api.pinata.cloud/pinning/pinJSONToIPFS';

    console.log('Attempting to upload to Pinata...');
    console.log('Is JSON upload:', isJson);
    console.log('File Name:', fileName);

    try {
        let response;
        let headers = {
            'pinata_api_key': PINATA_API_KEY,
            'pinata_secret_api_key': PINATA_SECRET_API_KEY,
        };

        if (isJson) {
            // For JSON, create a payload with pinataMetadata for naming
            const jsonPayload = {
                pinataContent: data,
                pinataMetadata: {
                    name: fileName // Use the provided fileName for the JSON
                }
            };
            headers['Content-Type'] = 'application/json'; // Axios will stringify jsonPayload
            response = await axios.post(jsonPinataUrl, jsonPayload, { headers });
            console.log('Pinata JSON upload successful. IPFS Hash:', response.data.IpfsHash);
            return `ipfs://${response.data.IpfsHash}`; 
        } else {
            const formData = new FormData();
            formData.append('file', data, { filename: fileName });
            // Axios will automatically set Content-Type for FormData.
            response = await axios.post(pinataUrl, formData, { headers });
            console.log('Pinata file upload successful. IPFS Hash:', response.data.IpfsHash);
            return `ipfs://${response.data.IpfsHash}`; 
        }
    } catch (error) {
        console.error('Error uploading to Pinata:', error.response ? error.response.data : error.message);
        if (error.response && error.response.data) {
            console.error('Pinata API Error Details:', error.response.data);
        }
        return null;
    }
}

// Helper function: Converts an ipfs://CID to an HTTP Gateway URL
function convertIpfsUriToHttpUrl(ipfsUri) {
    if (!ipfsUri || !ipfsUri.startsWith('ipfs://')) {
        return ipfsUri; // Return as is if not an ipfs:// URI
    }
    const cid = ipfsUri.replace('ipfs://', '');
    return `${IPFS_GATEWAY_URL}${cid}`;
}


// --- API Endpoint to Process NFT Data ---
app.post('/api/process-nft-data', upload.fields([{ name: 'imageFile1', maxCount: 1 }, { name: 'imageFile2', maxCount: 1 }]), async (req, res) => {
    try {
        // 1. Validate inputs
        const { 
            name, issuer, assetType, assetYear, assetCountry, creatorCountry, 
            weightGramsInput, purityPercentageInput, assetName, quantity, isFungible,
            connectedAccount, // Get connected account from frontend
            weightGramsContract, purityPercentageContract // Scaled values from frontend for contract
        } = req.body;

        const imageFile1 = req.files['imageFile1'] ? req.files['imageFile1'][0] : null;
        const imageFile2 = req.files['imageFile2'] ? req.files['imageFile2'][0] : null;

        if (!imageFile1 || !imageFile2) {
            return res.status(400).json({ message: 'Two image files are required.' });
        }

        // Basic validation (more robust validation should be added)
        if (!name || !issuer || !assetType || !assetYear || !assetCountry || !creatorCountry || 
            !weightGramsInput || !purityPercentageInput || !assetName || !quantity || !connectedAccount) {
            return res.status(400).json({ message: 'Missing required NFT metadata fields.' });
        }

        // Convert boolean string back to boolean
        const isFungibleBoolean = isFungible === 'true';

        // 2. Upload image files to IPFS (these will be ipfs://CIDs)
        const image1IpfsUri = await uploadToPinata(imageFile1.buffer, imageFile1.originalname);
        const image2IpfsUri = await uploadToPinata(imageFile2.buffer, imageFile2.originalname);

        if (!image1IpfsUri || !image2IpfsUri) {
            return res.status(500).json({ message: 'Failed to upload images to IPFS.' });
        }

        // Convert IPFS URIs to HTTP Gateway URLs for metadata display
        const image1HttpUrl = convertIpfsUriToHttpUrl(image1IpfsUri);
        const image2HttpUrl = convertIpfsUriToHttpUrl(image2IpfsUri);


        // 3. Prepare NFT metadata JSON (following ERC721 Metadata JSON Schema)
        const nftMetadata = {
            name: name,
            description: `This is a digital representation of ${assetName} (${assetType}) issued by ${issuer} for the Dopul project.`,
            image: image1HttpUrl, // Primary image should be an HTTP Gateway URL for display
            // external_url has been removed as it's not currently needed
            attributes: [
                { trait_type: "Issuer", value: issuer },
                { trait_type: "Asset Type", value: assetType },
                { trait_type: "Asset Year", value: parseInt(assetYear) }, // Ensure number type for attributes
                { trait_type: "Asset Country", value: assetCountry },
                { trait_type: "Creator Country", value: creatorCountry },
                { trait_type: "Weight (grams)", value: parseFloat(weightGramsInput) }, 
                { trait_type: "Asset Name", value: assetName },
                { trait_type: "Purity (%)", value: parseFloat(purityPercentageInput) }, 
                { trait_type: "Quantity", value: parseInt(quantity) },
                { trait_type: "Is Fungible", value: isFungibleBoolean },
                // Add any other relevant attributes
                { trait_type: "Image 2 (Secondary)", value: image2HttpUrl } // Secondary image as HTTP Gateway URL
            ]
        };

        // 4. Upload metadata JSON to IPFS (this will be an ipfs://CID)
        // Use a descriptive file name for the metadata JSON
        const metadataFileName = `${name.replace(/\s/g, '_')}_metadata.json`; // Example: "For_Sale!_metadata.json"
        const metadataUri = await uploadToPinata(nftMetadata, metadataFileName, true); // true indicates JSON upload

        if (!metadataUri) {
            return res.status(500).json({ message: 'Failed to upload metadata to IPFS.' });
        }

        // 5. Prepare contract parameters for frontend (already scaled)
        const contractParameters = {
            to: connectedAccount,
            name: name,
            assetType: assetType,
            assetYear: parseInt(assetYear),
            assetCountry: assetCountry,
            creatorCountry: creatorCountry,
            weightGrams: parseInt(weightGramsContract),
            assetName: assetName,
            purityPercentage: parseInt(purityPercentageContract),
            quantity: parseInt(quantity),
            isFungible: isFungibleBoolean,
            issuer: issuer,
            metadataURI: metadataUri // This is the ipfs:// URI for the metadata JSON
        };

        // 6. Optional: Interact with the smart contract (e.g., read view functions)
        if (ETHEREUM_NODE_URL && CONTRACT_ADDRESS) {
            try {
                const provider = new ethers.JsonRpcProvider(ETHEREUM_NODE_URL);
                const contract = new ethers.Contract(CONTRACT_ADDRESS, NFT_CONTRACT_ABI, provider);

                const currentProjectWallet = await contract.projectWalletAddress();
                console.log('Current Project Wallet Address (from backend):', currentProjectWallet);
                
                const minterDPMSSupply = await contract.getDPMSTokenBalance(connectedAccount);
                console.log(`DPMS Balance for ${connectedAccount}: ${minterDPMSSupply.toString()}`);

            } catch (contractError) {
                console.error('Backend contract interaction error:', contractError);
            }
        } else {
            console.warn('ETHEREUM_NODE_URL or CONTRACT_ADDRESS is not set in .env. Skipping backend contract interaction.');
        }

        // 7. Send back IPFS URI and contract parameters to frontend
        res.status(200).json({
            message: 'NFT data processed and uploaded to IPFS successfully.',
            metadataURI: metadataUri, // The ipfs:// URI for the metadata JSON
            contractParameters: contractParameters
        });

    } catch (error) {
        console.error('API /api/process-nft-data error:', error);
        res.status(500).json({ message: 'Internal server error during NFT data processing.', error: error.message });
    }
});

// --- Start Server ---
app.listen(port, () => {
    console.log(`Dopul backend server running on http://localhost:${port}`);
    console.log('Remember to start your frontend on a different port (e.g., 3000).');
});
