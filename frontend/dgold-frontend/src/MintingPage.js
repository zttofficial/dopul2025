import React, { useState, useEffect, useCallback } from 'react'; 
import './output.css'; // As per user's instruction, not auto-importing this line.

// --- Contract ABI and Address ---
// IMPORTANT: Ensure 'DopulNFT.json' is located at 'src/contracts/DopulNFT.json' in your frontend project.
// This file should contain the full JSON array of your contract's ABI.
import NFT_CONTRACT_ABI_ARRAY from './contracts/DopulNFT.json'; 

const NFT_CONTRACT_ABI = NFT_CONTRACT_ABI_ARRAY; // Use the imported array directly

const NFT_CONTRACT_ADDRESS = '0x67ee3cd9d703917cbc1e11e4e2182eda5e9df022'; // !!! REPLACE WITH YOUR ACTUAL CONTRACT ADDRESS !!!
// Removed SEPOLIA_CHAIN_ID_HEX and SEPOLIA_CHAIN_ID_DECIMAL as they are only used in App.js

// Import Lucide icons dynamically (same as in the main app)
const icons = {
    Wallet: (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"/><path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"/><path d="M3 5v14a2 2 0 0 0 2 2h16v-5"/><path d="M18 12h.01"/><path d="M7 12h10"/></svg>,
    Network: (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="16" y="2" width="6" height="6" rx="1"/><rect x="2" y="16" width="6" height="6" rx="1"/><path d="M6 16V6a2 2 0 0 1 2-2h8"/><path d="M17 22v-8a2 2 0 0 0-2-2H8"/><path d="M12 7h.01"/><path d="M12 17h.01"/></svg>,
    DollarSign: (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>,
    CheckCircle: (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>,
    XCircle: (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>,
    Loader2: (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>,
    UserCheck: (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><polyline points="22 7 18 11 16 9"/></svg>,
    ClipboardList: (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="3" width="6" height="4" rx="1"/><path d="M10 7H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3"/><path d="M8 12h8"/><path d="M8 16h8"/></svg>,
    Image: (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>,
    Coins: (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="8" cy="8" r="6"/><path d="M18.09 10.37A6 6 0 1 1 10.34 18"/><path d="M7 17H4a2 2 0 0 0-2 2v2a2 2 0 0 0 2 2h2"/><path d="M22 17h-3a2 2 0 0 0-2 2v2a2 2 0 0 0 2 2h3"/><path d="M6 17v-2a2 2 0 0 1 2-2h4"/></svg>,
    Calendar: (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
    Globe: (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>,
    Percent: (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="5" x2="5" y2="19"/><circle cx="6.5" cy="6.5" r="2.5"/><circle cx="17.5" cy="17.5" r="2.5"/></svg>,
    Hash: (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="4" y1="9" x2="20" y2="9"/><line x1="4" y1="15" x2="20" y2="15"/><line x1="10" y1="3" x2="8" y2="21"/><line x1="16" y1="3" x2="14" y2="21"/></svg>,
    AlertTriangle: (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
    Info: (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
};


/**
 * MintingPage component for minting new NFTs.
 * @param {object} props - Component props.
 * @param {string} props.connectedAccount - The currently connected wallet address.
 * @param {string} props.connectedNetwork - The name of the connected network.
 * @param {boolean} props.isCorrectNetwork - True if connected to the correct network.
 * @param {string} props.walletStatus - Status message for the wallet connection.
 * @param {string} props.dpmsBalance - The user's DPMS token balance.
 * @param {boolean} props.isValidator - True if the connected account is a validator.
 * @param {boolean} props.isLoading - Global loading state (e.g., for wallet connection).
 * @param {function} props.connectWallet - Function to connect the wallet.
 * @param {function} props.disconnectWallet - Function to disconnect the wallet.
 * @param {function} props.switchToSepolia - Function to switch network to Sepolia.
 * @param {function} props.fetchDPMSBalance - Function to refresh DPMS balance.
 * @param {function} props.checkValidatorStatus - Function to refresh validator status.
 * @param {function} props.showToast - Function to display toast notifications.
 */
function MintingPage({ 
    connectedAccount, 
    connectedNetwork, 
    isCorrectNetwork, 
    walletStatus, 
    dpmsBalance, 
    isValidator, 
    isLoading, 
    connectWallet, 
    disconnectWallet, 
    switchToSepolia, 
    fetchDPMSBalance,
    checkValidatorStatus,
    showToast // Passed from App.js
}) {
    // States for all form fields
    const [name, setName] = useState('');
    const [issuer, setIssuer] = useState('');
    const [assetType, setAssetType] = useState('Silver');
    const [assetYear, setAssetYear] = useState('');
    const [assetCountry, setAssetCountry] = useState('');
    const [creatorCountry, setCreatorCountry] = useState('');
    const [weightGramsInput, setWeightGramsInput] = useState('');
    const [assetName, setAssetName] = useState('');
    const [purityPercentageInput, setPurityPercentageInput] = useState('');
    const [quantity, setQuantity] = useState('');
    const [isFungible, setIsFungible] = useState(false);
    const [imageFile1, setImageFile1] = useState(null);
    const [imageFile2, setImageFile2] = useState(null);

    // States for minting status
    const [mintingStatus, setMintingStatus] = useState('');
    const [mintingFee, setMintingFee] = useState('0'); 
    const [mintingIsLoading, setMintingIsLoading] = useState(false); // Local loading state for minting

    // New state for purity input warning
    const [purityWarning, setPurityWarning] = useState('');

    // Validator specific states
    const [unverifiedNfts, setUnverifiedNfts] = useState([]);


    // Purity conversion data for display
    const purityConversions = [
        { label: '24K Gold', percentage: '99.99%', note: '(9999 fine)' },
        { label: '22K Gold', percentage: '91.67%', note: '(916 fine)' },
        { label: '18K Gold', percentage: '75.00%', note: '(750 fine)' },
        { label: '14K Gold', percentage: '58.33%', note: '(583 fine)' },
        { label: '999 Silver', percentage: '99.90%', note: '' },
        { label: '925 Silver', percentage: '92.50%', note: '' },
    ];

    // Function to fetch minting fee, using useCallback for memoization
    const fetchMintingFee = useCallback(async () => {
        if (typeof window.ethers !== 'undefined' && typeof window.ethereum !== 'undefined' && window.ethereum.isMetaMask && isCorrectNetwork) {
            try {
                const provider = new window.ethers.BrowserProvider(window.ethereum);
                const contract = new window.ethers.Contract(NFT_CONTRACT_ADDRESS, NFT_CONTRACT_ABI, provider);
                const fee = await contract.mintingFees(assetType);
                setMintingFee(fee.toString());
            } catch (error) {
                console.error("Error fetching minting fee:", error); 
                setMintingStatus("Error fetching minting fee. Please check contract address or network."); 
                setMintingFee('0'); 
            }
        } else if (!connectedAccount) { 
            setMintingFee('0');
        }
    }, [assetType, isCorrectNetwork, connectedAccount]); 

    // New: Function to fetch unverified NFTs (for validators)
    const fetchUnverifiedNfts = useCallback(async () => {
        if (!isValidator || typeof window.ethers === 'undefined' || !isCorrectNetwork) {
            setUnverifiedNfts([]);
            return;
        }
        setMintingIsLoading(true); // Use local loading for this section
        try {
            const provider = new window.ethers.BrowserProvider(window.ethereum);
            const contract = new window.ethers.Contract(NFT_CONTRACT_ADDRESS, NFT_CONTRACT_ABI, provider);
            const totalSupply = await contract.totalSupply();
            const pendingNfts = [];

            // Loop through all token IDs to check their status
            // NOTE: For very large total supplies, this loop can be inefficient.
            // In a production dApp, you'd typically use a subgraph or a backend indexer.
            for (let i = 1; i <= totalSupply; i++) {
                const nftDetails = await contract.getNFTDetails(i);
                // NFTStatus.Pending is 0 in Solidity enum (check your contract for exact enum values)
                if (nftDetails.status === 0) { 
                    pendingNfts.push({
                        id: i,
                        name: nftDetails.name,
                        creator: nftDetails.creator,
                        assetType: nftDetails.assetType,
                        metadataURI: nftDetails.metadataURI,
                        status: 'Pending'
                    });
                }
            }
            setUnverifiedNfts(pendingNfts);
        } catch (error) {
            console.error("Error fetching unverified NFTs:", error);
            setUnverifiedNfts([]);
        } finally {
            setMintingIsLoading(false); // End loading
        }
    }, [isValidator, isCorrectNetwork]);

    // Effects to fetch data when dependencies change
    useEffect(() => {
        fetchMintingFee(); 
    }, [fetchMintingFee]);

    useEffect(() => {
        if (isValidator && isCorrectNetwork) {
            fetchUnverifiedNfts();
        } else {
            setUnverifiedNfts([]); 
        }
    }, [isValidator, isCorrectNetwork, fetchUnverifiedNfts]);


    const handlePurityChange = (e) => {
        const value = e.target.value;
        setPurityPercentageInput(value);

        if (value === '9999') {
            setPurityWarning('Warning: 9999 in purity usually means 99.99%. Please enter 99.99.');
        } else if (value === '999') {
            setPurityWarning('Warning: 999 in purity usually means 99.9%. Please enter 99.9.');
        }
        else {
            setPurityWarning(''); 
        }
    };


    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!connectedAccount) {
            setMintingStatus('Error: Please connect your wallet first.'); 
            showToast('Please connect your wallet first.', 'error');
            return;
        }
        if (!isCorrectNetwork) {
            setMintingStatus('Error: Please switch to Sepolia Testnet.'); 
            showToast('Please switch to Sepolia Testnet.', 'error');
            return;
        }

        setMintingStatus('Initiating minting process...'); 
        setMintingIsLoading(true); // Start local loading for minting

        // Convert decimal inputs to contract-compatible integers for backend to use
        const weightGramsContract = parseFloat(weightGramsInput) * 10000;
        const purityPercentageContract = parseFloat(purityPercentageInput) * 1000;

        // Basic validation for numbers
        if (isNaN(weightGramsContract) || isNaN(purityPercentageContract)) {
            setMintingStatus('Error: Please enter valid numbers for weight and purity.'); 
            showToast('Please enter valid numbers for weight and purity.', 'error');
            setMintingIsLoading(false);
            return;
        }

        // Validate image files
        if (!imageFile1 || !imageFile2) {
            setMintingStatus('Error: Please select two image files to upload.'); 
            showToast('Please select two image files to upload.', 'error');
            setMintingIsLoading(false);
            return;
        }

        // Prepare raw data for backend submission
        const formData = new FormData();
        formData.append('name', name);
        formData.append('issuer', issuer);
        formData.append('assetType', assetType);
        formData.append('assetYear', assetYear);
        formData.append('assetCountry', assetCountry);
        formData.append('creatorCountry', creatorCountry);
        formData.append('weightGramsInput', weightGramsInput); 
        formData.append('purityPercentageInput', purityPercentageInput); 
        formData.append('assetName', assetName);
        formData.append('quantity', quantity);
        formData.append('isFungible', isFungible.toString());
        formData.append('imageFile1', imageFile1);
        formData.append('imageFile2', imageFile2);

        // Send the connected account so backend knows who the NFT is for
        formData.append('connectedAccount', connectedAccount); 

        // Backend will use these contract-specific raw integer values
        formData.append('weightGramsContract', weightGramsContract.toString());
        formData.append('purityPercentageContract', purityPercentageContract.toString());

        // --- Step 1: Send data to backend for IPFS uploads ---
        try {
            const backendEndpoint = '/api/process-nft-data'; 
            setMintingStatus('Uploading files to IPFS via backend...'); 
            showToast('Uploading files to IPFS...', 'info');

            const response = await fetch(backendEndpoint, {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Backend processing failed.'); 
            }

            const backendResult = await response.json();
            const { metadataURI, contractParameters } = backendResult; 

            if (!metadataURI || !contractParameters) {
                throw new Error("Backend did not return expected IPFS URI or contract parameters."); 
            }

            setMintingStatus('IPFS upload complete. Initiating blockchain transaction...'); 
            showToast('IPFS upload complete. Initiating transaction...', 'info');

            // --- Step 2: Call Smart Contract Mint Function from Frontend ---
            const provider = new window.ethers.BrowserProvider(window.ethereum);
            const signer = await provider.getSigner(); 

            const nftContract = new window.ethers.Contract(NFT_CONTRACT_ADDRESS, NFT_CONTRACT_ABI, signer);

            const currentMintingFeeWei = await nftContract.mintingFees(assetType);

            const transactionOverrides = {
                value: currentMintingFeeWei 
            };

            console.log("Contract Parameters for mintNFT:", contractParameters); 
            console.log("Metadata URI for mintNFT:", metadataURI); 

            const tx = await nftContract.mintNFT(
                contractParameters.to, 
                contractParameters.name,
                contractParameters.assetType,
                contractParameters.assetYear,
                contractParameters.assetCountry,
                contractParameters.creatorCountry,
                contractParameters.weightGrams, 
                contractParameters.assetName,
                contractParameters.purityPercentage, 
                contractParameters.quantity,          
                contractParameters.isFungible,        
                contractParameters.issuer,            
                metadataURI,                          
                transactionOverrides 
            );

            setMintingStatus('Transaction sent. Waiting for confirmation...'); 
            showToast('Transaction sent. Waiting for confirmation...', 'info');
            const receipt = await tx.wait(); 

            console.log("Transaction Receipt:", receipt); 
            console.log("Receipt Logs (Raw):", receipt.logs); 
            
            let extractedTokenId = 'N/A';
            try {
                const contractInterface = new window.ethers.Interface(NFT_CONTRACT_ABI);
                for (const log of receipt.logs) {
                    try {
                        const parsedLog = contractInterface.parseLog(log);
                        if (parsedLog && parsedLog.name === 'NFTMinted') {
                            if (parsedLog.args && parsedLog.args.tokenId !== undefined) {
                                extractedTokenId = parsedLog.args.tokenId.toString(); 
                                console.log("Parsed NFTMinted Event Args:", parsedLog.args);
                                break; 
                            }
                        }
                    } catch (parseError) {
                        // console.warn("Could not parse log:", log, parseError);
                    }
                }
            } catch (error) {
                console.error("Error during token ID extraction (ABI might be empty/invalid):", error);
                setMintingStatus("Error: Failed to extract NFT ID. Ensure ABI is correctly copied into the code.");
                showToast("Failed to extract NFT ID. Ensure ABI is correct.", 'error');
            }

            console.log("Extracted Token ID:", extractedTokenId); 

            setMintingStatus(`Minting successful! Transaction Hash: ${receipt.hash}. NFT ID: ${extractedTokenId}`); 
            showToast(`Minting successful! NFT ID: ${extractedTokenId}`, 'success');
            fetchDPMSBalance(connectedAccount);
            checkValidatorStatus(connectedAccount); 

        } catch (error) {
            setMintingStatus(`Minting failed: ${error.message || 'An unknown error occurred.'}`); 
            showToast(`Minting failed: ${error.message || 'An unknown error occurred.'}`, 'error');
            console.error('Minting process error:', error); 
            if (error.code === 4001) {
                setMintingStatus('Minting was cancelled by the user.'); 
                showToast('Minting was cancelled by the user.', 'info');
            }
        } finally {
            setMintingIsLoading(false); // End local loading
        }
    };

    return (
        <section className="col-span-full">
            <h2 className="sr-only">Mint New NFT Form</h2> {/* Hidden heading for accessibility */}
            {/* Network Status */}
            {connectedAccount && !isCorrectNetwork && (
                <div className="mb-6 p-4 rounded-xl bg-gradient-to-r from-orange-500/20 to-yellow-500/20 border-2 border-orange-400/50 shadow-lg backdrop-blur-sm">
                    <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-orange-500">
                                <icons.AlertTriangle className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <p className="text-sm font-bold text-orange-800">Wrong Network</p>
                                <p className="text-xs text-orange-700">Connected to: {connectedNetwork}</p>
                            </div>
                        </div>
                        <button 
                            type="button" 
                            onClick={switchToSepolia} 
                            className="px-5 py-2 rounded-xl text-white font-bold text-sm bg-gradient-to-r from-yellow-500 to-orange-600 hover:from-yellow-600 hover:to-orange-700 transition-all shadow-md hover:shadow-lg"
                        >
                            Switch to Sepolia
                        </button>
                    </div>
                </div>
            )}

            {/* Minting Fee Display */}
            <div className="mb-6 p-5 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 rounded-2xl border-2 border-blue-400/50 backdrop-blur-sm shadow-xl">
                <div className="flex items-center gap-3">
                    <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-600 shadow-lg">
                        <icons.Info className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <p className="text-sm text-blue-600 font-medium">Current Minting Fee</p>
                        <p className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                            {typeof window.ethers !== 'undefined' ? window.ethers.formatEther(mintingFee || '0') : 'Loading...'} ETH
                        </p>
                        <p className="text-xs text-gray-600">for {assetType} NFT</p>
                    </div>
                </div>
            </div>

            {/* NFT Minting Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
                {/* NFT Details Section */}
                <div className="bg-gradient-to-br from-slate-50 to-blue-50/50 p-6 rounded-2xl border-2 border-blue-200/50 shadow-xl backdrop-blur-sm hover:shadow-2xl transition-shadow duration-300">
                    <div className="flex items-center gap-3 mb-5">
                        <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 shadow-md">
                            <icons.Info className="w-5 h-5 text-white"/>
                        </div>
                        <h3 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">NFT Details</h3>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="form-group">
                            <label className="block text-gray-700 text-sm font-semibold mb-2">Name:</label>
                            <input type="text" value={name} onChange={(e) => setName(e.target.value)} required 
                                   className="w-full px-4 py-3 bg-white border-2 border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 hover:border-blue-400" />
                        </div>
                        <div className="form-group">
                            <label className="block text-gray-700 text-sm font-semibold mb-2">Issuer:</label>
                            <input type="text" value={issuer} onChange={(e) => setIssuer(e.target.value)} required 
                                   className="w-full px-4 py-3 bg-white border-2 border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 hover:border-blue-400" />
                        </div>
                        <div className="form-group">
                            <label className="block text-gray-700 text-sm font-semibold mb-2">Asset Type:</label>
                            <select value={assetType} onChange={(e) => setAssetType(e.target.value)}
                                    className="w-full px-4 py-3 bg-white border-2 border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 hover:border-blue-400 cursor-pointer">
                                <option value="Silver">Silver</option>
                                <option value="Gold">Gold</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label className="block text-gray-700 text-sm font-semibold mb-2 flex items-center gap-1"><icons.Calendar className="w-4 h-4"/> Asset Year:</label>
                            <input type="number" value={assetYear} onChange={(e) => setAssetYear(e.target.value)} required 
                                   className="w-full px-4 py-3 bg-white border-2 border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 hover:border-blue-400" />
                        </div>
                        <div className="form-group">
                            <label className="block text-gray-700 text-sm font-semibold mb-2 flex items-center gap-1"><icons.Globe className="w-4 h-4"/> Asset Country:</label>
                            <input type="text" value={assetCountry} onChange={(e) => setAssetCountry(e.target.value)} required 
                                   className="w-full px-4 py-3 bg-white border-2 border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 hover:border-blue-400" />
                        </div>
                        <div className="form-group">
                            <label className="block text-gray-700 text-sm font-semibold mb-2 flex items-center gap-1"><icons.Globe className="w-4 h-4"/> Creator Country:</label>
                            <input type="text" value={creatorCountry} onChange={(e) => setCreatorCountry(e.target.value)} required 
                                   className="w-full px-4 py-3 bg-white border-2 border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 hover:border-blue-400" />
                        </div>
                    </div>
                </div>

                {/* Asset Specifications Section */}
                <div className="bg-gradient-to-br from-slate-50 to-purple-50/50 p-6 rounded-2xl border-2 border-purple-200/50 shadow-xl backdrop-blur-sm hover:shadow-2xl transition-shadow duration-300">
                    <div className="flex items-center gap-3 mb-5">
                        <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500 to-pink-600 shadow-md">
                            <icons.Hash className="w-5 h-5 text-white"/>
                        </div>
                        <h3 className="text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">Asset Specifications</h3>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="form-group">
                            <label className="block text-gray-700 text-sm font-semibold mb-2">Weight (grams):</label>
                            <input type="number" step="any" value={weightGramsInput} onChange={(e) => setWeightGramsInput(e.target.value)} required 
                                   className="w-full px-4 py-3 bg-white border-2 border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 hover:border-blue-400" />
                            <small className="text-xs text-gray-500 mt-1 block">Enter actual weight (e.g., 2.7, 100.05).</small>
                        </div>
                        <div className="form-group">
                            <label className="block text-gray-700 text-sm font-semibold mb-2">Asset Name:</label>
                            <input type="text" value={assetName} onChange={(e) => setAssetName(e.target.value)} required 
                                   className="w-full px-4 py-3 bg-white border-2 border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 hover:border-blue-400" />
                        </div>
                        <div className="form-group col-span-full">
                            <label className="block text-gray-700 text-sm font-semibold mb-2 flex items-center gap-1"><icons.Percent className="w-4 h-4"/> Purity Percentage (%):</label>
                            <input 
                                type="number" 
                                step="any" 
                                value={purityPercentageInput} 
                                onChange={handlePurityChange} 
                                required 
                                className="w-full px-4 py-3 bg-white border-2 border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 hover:border-blue-400" 
                            />
                            <small className="text-xs text-gray-500 mt-1 block">Enter actual purity percentage (e.g., 99.9, 99.999).</small>
                            {purityWarning && (
                                <p className="text-orange-600 text-xs mt-1 font-medium flex items-center gap-1"><icons.AlertTriangle className="w-4 h-4"/>{purityWarning}</p>
                            )}
                            <div className="mt-4 p-3 bg-gray-100 rounded-lg border border-gray-200">
                                <h4 className="text-sm font-semibold text-gray-700 mb-2">Purity Conversion Reference:</h4>
                                <ul className="list-disc list-inside text-xs text-gray-600 space-y-1">
                                    {purityConversions.map((conversion, index) => (
                                        <li key={index}>
                                            <span className="font-bold">{conversion.label}:</span> {conversion.percentage} {conversion.note && <span className="text-gray-500">{conversion.note}</span>}
                                        </li>
                                    ))}
                                    <li><span className="font-bold">1 Troy OZ:</span> 31.1034 grams</li>
                                </ul>
                            </div>
                        </div>
                        <div className="form-group">
                            <label className="block text-gray-700 text-sm font-semibold mb-2">Quantity:</label>
                            <input type="number" value={quantity} onChange={(e) => setQuantity(e.target.value)} required 
                                   className="w-full px-4 py-3 bg-white border-2 border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 hover:border-blue-400" />
                        </div>
                        <div className="form-group col-span-full flex items-center">
                            <input type="checkbox" checked={isFungible} onChange={(e) => setIsFungible(e.target.checked)} 
                                   className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mr-2" />
                            <label className="text-gray-700 text-sm font-semibold">Is Fungible</label>
                        </div>
                    </div>
                </div>

                {/* Image Upload Section */}
                <div className="bg-gradient-to-br from-slate-50 to-cyan-50/50 p-6 rounded-2xl border-2 border-cyan-200/50 shadow-xl backdrop-blur-sm hover:shadow-2xl transition-shadow duration-300">
                    <div className="flex items-center gap-3 mb-5">
                        <div className="p-2 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 shadow-md">
                            <icons.Image className="w-5 h-5 text-white"/>
                        </div>
                        <h3 className="text-xl font-bold bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent">Image Uploads</h3>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="form-group">
                            <label className="block text-gray-700 text-sm font-semibold mb-2">Image File 1:</label>
                            <input type="file" accept="image/*" onChange={(e) => setImageFile1(e.target.files[0])} required 
                                   className="block w-full text-sm text-gray-600 file:mr-4 file:py-3 file:px-6 
                                              file:rounded-xl file:border-0 file:text-sm file:font-bold
                                              file:bg-gradient-to-r file:from-blue-500 file:to-cyan-600 file:text-white 
                                              hover:file:from-blue-600 hover:file:to-cyan-700 file:shadow-lg 
                                              hover:file:shadow-xl file:transition-all file:duration-300 cursor-pointer" />
                        </div>
                        <div className="form-group">
                            <label className="block text-gray-700 text-sm font-semibold mb-2">Image File 2:</label>
                            <input type="file" accept="image/*" onChange={(e) => setImageFile2(e.target.files[0])} required 
                                   className="block w-full text-sm text-gray-600 file:mr-4 file:py-3 file:px-6 
                                              file:rounded-xl file:border-0 file:text-sm file:font-bold
                                              file:bg-gradient-to-r file:from-blue-500 file:to-cyan-600 file:text-white 
                                              hover:file:from-blue-600 hover:file:to-cyan-700 file:shadow-lg 
                                              hover:file:shadow-xl file:transition-all file:duration-300 cursor-pointer" />
                        </div>
                    </div>
                </div>

                <button 
                    type="submit" 
                    disabled={!connectedAccount || !isCorrectNetwork || mintingIsLoading}
                    className="relative w-full mt-8 px-8 py-4 rounded-2xl text-white font-extrabold text-xl overflow-hidden group
                               bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 
                               hover:shadow-[0_0_40px_rgba(139,92,246,0.6)] 
                               transition-all duration-300 ease-in-out shadow-2xl hover:scale-105 
                               disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 
                               flex items-center justify-center gap-3">
                    <span className="relative z-10 flex items-center gap-3">
                        {mintingIsLoading ? <div className="spinner !border-l-white"></div> : <icons.Coins className="w-6 h-6" />}
                        {mintingIsLoading ? 'Minting in progress...' : 'Mint NFT'}
                    </span>
                    {!mintingIsLoading && (
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent shimmer"></div>
                    )}
                </button>
            </form>

            {/* Minting Status Message */}
            {mintingStatus && (
                <div className={`mt-6 p-5 rounded-2xl text-center font-semibold flex items-center gap-3 justify-center shadow-xl backdrop-blur-sm border-2
                                  ${mintingStatus.includes('Error') || mintingStatus.includes('failed') || mintingStatus.includes('cancelled') 
                                    ? 'bg-gradient-to-r from-red-500/20 to-pink-500/20 text-red-700 border-red-400/50' 
                                    : 'bg-gradient-to-r from-blue-500/20 to-cyan-500/20 text-blue-700 border-blue-400/50'}`}>
                    <div className={`p-2 rounded-lg ${mintingStatus.includes('Error') || mintingStatus.includes('failed') || mintingStatus.includes('cancelled') ? 'bg-red-500' : 'bg-blue-500'}`}>
                        {mintingStatus.includes('Error') || mintingStatus.includes('failed') || mintingStatus.includes('cancelled') ? <icons.XCircle className="w-5 h-5 text-white"/> : <icons.CheckCircle className="w-5 h-5 text-white"/>}
                    </div>
                    <p className="text-base">{mintingStatus}</p>
                </div>
            )}

            {/* Validator Dashboard Section (moved from App.js, now within MintingPage) */}
            {isValidator && (
                <div className="mt-8 p-6 bg-gradient-to-br from-purple-500/20 to-pink-500/20 border-2 border-purple-400/50 rounded-2xl shadow-2xl backdrop-blur-sm">
                    <div className="flex items-center justify-center gap-3 mb-4">
                        <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 shadow-lg">
                            <icons.UserCheck className="w-7 h-7 text-white" />
                        </div>
                        <h3 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                            Validator Dashboard
                        </h3>
                    </div>
                    <p className="text-lg text-purple-800 font-semibold mb-6 text-center">
                        As a validator, you can view and verify pending NFTs.
                    </p>

                    {mintingIsLoading ? (
                        <div className="flex justify-center items-center gap-2 text-purple-600">
                            <div className="spinner !border-l-purple-600"></div>
                            <span>Loading unverified NFTs...</span>
                        </div>
                    ) : unverifiedNfts.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            {unverifiedNfts.map((nft) => (
                                <div key={nft.id} className="bg-white/90 p-5 rounded-xl shadow-lg border-2 border-purple-300/50 backdrop-blur-sm hover:shadow-2xl hover:scale-105 transition-all duration-300">
                                    <h4 className="text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-3">
                                        NFT ID: {nft.id} - {nft.name}
                                    </h4>
                                    <div className="space-y-2 mb-4">
                                        <p className="text-sm text-gray-700"><span className="font-semibold">Issuer:</span> {nft.creator.substring(0, 6)}...{nft.creator.substring(nft.creator.length - 4)}</p>
                                        <p className="text-sm text-gray-700"><span className="font-semibold">Asset Type:</span> {nft.assetType}</p>
                                        <p className="text-sm text-gray-700">
                                            <span className="font-semibold">Status:</span> 
                                            <span className="ml-2 px-3 py-1 rounded-full text-xs font-bold bg-gradient-to-r from-orange-500 to-yellow-500 text-white shadow-md">
                                                {nft.status}
                                            </span>
                                        </p>
                                    </div>
                                    <button 
                                        className="w-full px-4 py-3 rounded-xl text-white font-bold bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 hover:shadow-[0_0_20px_rgba(59,130,246,0.5)] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                                        onClick={() => showToast(`Verification logic for NFT ID ${nft.id} not implemented yet.`, 'info')}
                                    >
                                        Verify NFT
                                    </button>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-center text-gray-600">No unverified NFTs found.</p>
                    )}
                </div>
            )}
        </section>
    );
}

export default MintingPage;
