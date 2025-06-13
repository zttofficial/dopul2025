import React, { useState, useEffect, useCallback } from 'react';
import './output.css';
// --- Contract ABI and Address ---
// IMPORTANT: The ABI is now imported from a separate JSON file.
// Ensure 'DopulNFT.json' is located at 'src/contracts/DopulNFT.json' in your frontend project.
// After deploying the new DopulNFT contract, regenerate its ABI and update that JSON file.
import NFT_CONTRACT_ABI_ARRAY from './contracts/DopulNFT.json'; // Import the direct ABI array

const NFT_CONTRACT_ABI = NFT_CONTRACT_ABI_ARRAY; // Use the imported array directly

const NFT_CONTRACT_ADDRESS = '0x67ee3cd9d703917cbc1e11e4e2182eda5e9df022'; // !!! REPLACE WITH YOUR ACTUAL CONTRACT ADDRESS !!!
const SEPOLIA_CHAIN_ID_HEX = '0xaa36a7'; // Sepolia Testnet Chain ID in hexadecimal
const SEPOLIA_CHAIN_ID_DECIMAL = 11155111; // Sepolia Testnet Chain ID in decimal, for direct comparison

function NFTMetadataForm() {
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

    // States for wallet connection and minting status
    const [connectedAccount, setConnectedAccount] = useState('');
    const [walletStatus, setWalletStatus] = useState(''); // Initial state is empty, only set after interaction or specific events
    const [connectedNetwork, setConnectedNetwork] = useState('N/A'); 
    const [isCorrectNetwork, setIsCorrectNetwork] = useState(false); 
    const [mintingStatus, setMintingStatus] = useState('');
    const [mintingFee, setMintingFee] = useState('0'); 

    // New state for purity input warning
    const [purityWarning, setPurityWarning] = useState('');

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
        // Ensure ethers is loaded globally before attempting to use it
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

    // Function to get network name from chain ID
    const getNetworkName = (chainId) => {
        if (!chainId) return 'N/A';
        const decimalChainId = parseInt(chainId, 16); 
        switch (decimalChainId) {
            case 1: return 'Ethereum Mainnet';
            case SEPOLIA_CHAIN_ID_DECIMAL: return 'Sepolia Testnet'; 
            case 5: return 'Goerli Testnet'; 
            default: return `Unknown Network (ID: ${chainId})`;
        }
    };

    // Effect to setup listeners and check network on component mount (no initial walletStatus message)
    useEffect(() => {
        const handleAccountsChanged = (accounts) => {
            if (accounts.length > 0) {
                setConnectedAccount(accounts[0]);
                window.ethereum.request({ method: 'eth_chainId' }).then(chain => handleChainChanged(chain));
            } else {
                setConnectedAccount('');
                setWalletStatus('Wallet disconnected. Please click "Connect Wallet".'); 
                setIsCorrectNetwork(false); 
            }
        };

        const handleChainChanged = (chainId) => {
            console.log(`Chain changed to: ${chainId}`);
            setConnectedNetwork(getNetworkName(chainId));
            const correct = chainId === SEPOLIA_CHAIN_ID_HEX;
            setIsCorrectNetwork(correct);

            if (connectedAccount) { 
                if (correct) {
                    setWalletStatus(`Connected: ${connectedAccount.substring(0, 6)}...${connectedAccount.substring(connectedAccount.length - 4)} (Sepolia Testnet)`); 
                } else {
                    setWalletStatus(`Connected to ${getNetworkName(chainId)}. Please switch to Sepolia Testnet.`); 
                }
            }
            fetchMintingFee(); 
        };

        // Only attach listeners if MetaMask is detected, but do not set initial walletStatus here for missing MetaMask
        if (typeof window.ethereum !== 'undefined' && window.ethereum.isMetaMask && typeof window.ethers !== 'undefined') {
            window.ethereum.on('accountsChanged', handleAccountsChanged);
            window.ethereum.on('chainChanged', handleChainChanged);

            // Initial check for already connected accounts
            window.ethereum.request({ method: 'eth_accounts' })
                .then(accounts => {
                    if (accounts.length > 0) {
                        setConnectedAccount(accounts[0]);
                        window.ethereum.request({ method: 'eth_chainId' }).then(handleChainChanged);
                        setWalletStatus(`Wallet connected: ${accounts[0].substring(0, 6)}...${accounts[0].substring(accounts[0].length - 4)}`); 
                    }
                })
                .catch(error => {
                    console.error("Error checking initial accounts:", error); 
                    // No initial walletStatus for this error, it will be displayed only on connectWallet attempt
                });
        }
        
        // Cleanup event listeners on component unmount
        return () => {
            if (window.ethereum) {
                window.ethereum.removeListener('accountsChanged', handleAccountsChanged); 
                window.ethereum.removeListener('chainChanged', handleChainChanged);
            }
        };

    }, [fetchMintingFee, connectedAccount]); 

    // Function to handle wallet connection - now responsible for initial MetaMask detection messages
    const connectWallet = async () => {
        // Clear previous status messages before attempting connection
        setMintingStatus(''); 
        setWalletStatus(''); // Clear previous wallet status

        if (typeof window.ethereum === 'undefined' || !window.ethereum.isMetaMask) {
            setWalletStatus('MetaMask is not installed. Please install MetaMask: <a href="https://metamask.io/download/" target="_blank" rel="noopener noreferrer">Install MetaMask</a>'); 
            return; 
        }
        if (typeof window.ethers === 'undefined') {
            setWalletStatus('Ethers.js library not loaded. Please ensure the ethers.js CDN is correctly added to your public/index.html file.'); 
            return; 
        }

        setWalletStatus('Requesting wallet connection. Please check your MetaMask popup...'); 

        try {
            const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
            if (accounts.length > 0) {
                setConnectedAccount(accounts[0]);
                setWalletStatus(`Wallet connected successfully: ${accounts[0].substring(0, 6)}...${accounts[0].substring(accounts[0].length - 4)}.`); 
                await switchToSepolia();
            } else {
                setConnectedAccount('');
                setWalletStatus('Wallet connection cancelled or no accounts selected.'); 
            }
        } catch (error) {
            console.error('Wallet connection error:', error); 
            if (error.code === 4001) { 
                setWalletStatus('Wallet connection rejected by user.'); 
            } else {
                setWalletStatus(`Wallet connection failed: ${error.message}. Please check MetaMask and ensure it is unlocked and active.`); 
            }
        }
    };

    // Function to switch network to Sepolia
    const switchToSepolia = async () => {
        if (typeof window.ethereum !== 'undefined' && window.ethereum.isMetaMask) {
            try {
                await window.ethereum.request({
                    method: 'wallet_switchEthereumChain',
                    params: [{ chainId: SEPOLIA_CHAIN_ID_HEX }],
                });
            } catch (switchError) {
                console.error("Failed to switch network:", switchError); 
                if (switchError.code === 4902) {
                    setWalletStatus('Sepolia Testnet not added to MetaMask.'); 
                } else if (switchError.code === 4001) {
                    setWalletStatus('Network switch rejected by user.'); 
                } else {
                    setWalletStatus(`Failed to switch to Sepolia: ${switchError.message}`); 
                }
            }
        } else {
            setWalletStatus('MetaMask is not detected. Cannot switch network directly. Please switch manually in MetaMask.'); 
        }
    };

    // Handler for purity input change with warning logic
    const handlePurityChange = (e) => {
        const value = e.target.value;
        setPurityPercentageInput(value);

        if (value === '9999') {
            setPurityWarning('Warning: 9999 in purity usually means 99.99%. Please enter as 99.99.');
        } else if (value === '999') {
            setPurityWarning('Warning: 999 in purity usually means 99.9%. Please enter as 99.9.');
        }
        else {
            setPurityWarning(''); // Clear warning if input is not 9999
        }
    };


    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!connectedAccount) {
            setMintingStatus('Error: Please connect your wallet first.'); 
            return;
        }
        if (!isCorrectNetwork) {
            setMintingStatus('Error: Please switch to Sepolia Testnet before minting.'); 
            return;
        }

        setMintingStatus('Initiating minting process...'); 

        // Convert decimal inputs to contract-compatible integers for backend to use
        const weightGramsContract = parseFloat(weightGramsInput) * 10000;
        const purityPercentageContract = parseFloat(purityPercentageInput) * 1000;

        // Basic validation for numbers
        if (isNaN(weightGramsContract) || isNaN(purityPercentageContract)) {
            setMintingStatus('Error: Please enter valid numbers for Weight and Purity.'); 
            return;
        }

        // Validate image files
        if (!imageFile1 || !imageFile2) {
            setMintingStatus('Error: Please select two image files to upload.'); 
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
                throw new Error("Backend did not return expected IPFS URIs or contract parameters."); 
            }

            setMintingStatus('IPFS uploads complete. Initiating blockchain transaction...'); 

            // --- Step 2: Call Smart Contract Mint Function from Frontend ---
            // Use window.ethers directly from CDN
            const provider = new window.ethers.BrowserProvider(window.ethereum);
            const signer = await provider.getSigner(); 

            // Use the extracted ABI array
            const nftContract = new window.ethers.Contract(NFT_CONTRACT_ADDRESS, NFT_CONTRACT_ABI, signer);

            // Fetch current minting fee from the contract right before transacting
            const currentMintingFeeWei = await nftContract.mintingFees(assetType);

            // The 'value' field in the transaction object is for sending ETH
            const transactionOverrides = {
                value: currentMintingFeeWei 
            };

            // Call mintNFT with all parameters, including metadataURI from backend
            // Ensure parameters match contract's mintNFT signature exactly based on DopulNFT.json ABI
            console.log("Contract Parameters for mintNFT:", contractParameters); // Log parameters
            console.log("Metadata URI for mintNFT:", metadataURI); // Log metadata URI

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
            const receipt = await tx.wait(); // Wait for transaction to be mined

            console.log("Transaction Receipt:", receipt); // Log the full receipt
            console.log("Receipt Logs (Raw):", receipt.logs); // Log the raw logs
            
            // --- Improved Token ID Extraction ---
            let extractedTokenId = 'N/A';
            try {
                // Get the interface to decode logs
                const contractInterface = new window.ethers.Interface(NFT_CONTRACT_ABI);
                
                // Find the NFTMinted event directly from the receipt logs
                // Iterate through logs and attempt to parse
                for (const log of receipt.logs) {
                    try {
                        const parsedLog = contractInterface.parseLog(log);
                        if (parsedLog && parsedLog.name === 'NFTMinted') {
                            // Check if tokenId exists in args and is a BigInt
                            if (parsedLog.args && parsedLog.args.tokenId !== undefined) {
                                extractedTokenId = parsedLog.args.tokenId.toString(); // Convert BigInt to string
                                console.log("Parsed NFTMinted Event Args:", parsedLog.args);
                                break; // Found the event, no need to continue
                            }
                        }
                    } catch (parseError) {
                        // This log might not be from our contract or not a recognized event
                        // console.warn("Could not parse log:", log, parseError);
                    }
                }
            } catch (error) {
                console.error("Error during token ID extraction:", error);
            }

            console.log("Extracted Token ID:", extractedTokenId); // Log the extracted Token ID

            setMintingStatus(`Minting successful! Transaction Hash: ${receipt.hash}. NFT ID: ${extractedTokenId}`); 
            // Optional: Reset form fields after successful mint
            // setName(''); setIssuer(''); setAssetType('Silver'); setImageFile1(null); setImageFile2(null); etc.

        } catch (error) {
            setMintingStatus(`Minting failed: ${error.message || 'An unknown error occurred.'}`); 
            console.error('Minting process error:', error); 
            // Check if error is from user rejecting transaction
            if (error.code === 4001) {
                setMintingStatus('Minting cancelled by user.'); 
            }
        }
    };

    // Helper to render HTML in wallet status message (for the MetaMask download link)
    function createMarkup(htmlString) {
        return { __html: htmlString };
    }

    return (
        // Added font-inter for global font, min-h-screen, gradient background, flexbox for centering
        <div className="relative min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4 sm:p-6 lg:p-8 font-inter">
            {/* Tailwind CSS CDN - for Canvas preview only. In a real project, Tailwind should be set up via npm. */}
            <script src="https://cdn.tailwindcss.com"></script>
            {/* Google Fonts - Inter */}
            <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap" rel="stylesheet" />

            {/* Custom CSS to remove number input spin buttons */}
            <style>{`
                input[type='number']::-webkit-inner-spin-button,
                input[type='number']::-webkit-outer-spin-button {
                    -webkit-appearance: none;
                    margin: 0;
                }
                input[type='number'] {
                    -moz-appearance: textfield; /* Firefox */
                }
            `}</style>

            {/* Top-right wallet connect/disconnect button and status */}
            <div className="absolute top-4 right-4 sm:top-6 sm:right-6 lg:top-8 lg:right-8 z-10 flex flex-col items-end space-y-2">
                {/* Wallet Status Section (only visible if status has content) */}
                {walletStatus && (
                    <div className="bg-blue-50 border border-blue-200 text-blue-800 p-2 text-xs sm:text-sm rounded-lg text-center font-medium shadow-md max-w-xs transition-all duration-300 ease-in-out">
                        <p dangerouslySetInnerHTML={createMarkup(walletStatus)}></p>
                    </div>
                )}
                
                {/* Connect/Disconnect Button */}
                {!connectedAccount ? (
                    <button 
                        type="button" 
                        className="px-4 py-2 text-sm rounded-full text-white font-semibold 
                                   bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 
                                   transition-all duration-300 ease-in-out shadow-lg hover:shadow-xl" 
                        onClick={connectWallet}>
                        Connect Wallet
                    </button>
                ) : (
                    <button 
                        type="button" 
                        className="px-4 py-2 text-sm rounded-full text-white font-semibold 
                                   bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 
                                   transition-all duration-300 ease-in-out shadow-lg hover:shadow-xl" 
                        onClick={() => { setConnectedAccount(''); setWalletStatus('Wallet disconnected. Please click "Connect Wallet".'); setIsCorrectNetwork(false); setConnectedNetwork('N/A'); }}>
                        Disconnect Wallet
                    </button>
                )}
            </div>

            {/* Main content card */}
            <div className="bg-white p-6 sm:p-8 rounded-xl shadow-2xl w-full max-w-lg lg:max-w-2xl transform hover:scale-105 transition-transform duration-300 ease-in-out">
                <h1 className="text-4xl font-extrabold text-blue-700 mb-6 text-center tracking-tight">
                    Dopul NFT Minting
                </h1>
                
                {/* Network Status and Switch Button */}
                {connectedAccount && ( // Only show network status if an account is connected
                    <div className={`network-status p-3 rounded-lg mb-6 text-center font-medium ${isCorrectNetwork ? 'bg-green-100 border-green-300 text-green-700' : 'bg-orange-100 border-orange-300 text-orange-700'}`}>
                        <p>Connected Network: <strong className="font-bold">{connectedNetwork}</strong></p>
                        {!isCorrectNetwork && (
                            <button 
                                type="button" 
                                onClick={switchToSepolia} 
                                className="mt-3 px-5 py-2 rounded-full text-white font-semibold text-sm
                                           bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 
                                           transition-all duration-300 ease-in-out shadow-md hover:shadow-lg">
                                Switch to Sepolia Testnet
                            </button>
                        )}
                    </div>
                )}

                {/* Minting Fee Display */}
                <div className="text-center mb-6 text-lg font-bold text-blue-600">
                    Minting Fee for {assetType}: {typeof window.ethers !== 'undefined' ? window.ethers.formatEther(mintingFee || '0') : 'Loading...'} ETH
                </div>

                {/* NFT Minting Form */}
                <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                    <div className="form-group col-span-full">
                        <label className="block text-gray-700 text-sm font-semibold mb-2">Name:</label>
                        <input type="text" value={name} onChange={(e) => setName(e.target.value)} required 
                               className="w-full px-4 py-2 bg-gray-50 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 transition duration-150 ease-in-out" />
                    </div>

                    <div className="form-group col-span-full">
                        <label className="block text-gray-700 text-sm font-semibold mb-2">Issuer:</label>
                        <input type="text" value={issuer} onChange={(e) => setIssuer(e.target.value)} required 
                               className="w-full px-4 py-2 bg-gray-50 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 transition duration-150 ease-in-out" />
                    </div>

                    <div className="form-group">
                        <label className="block text-gray-700 text-sm font-semibold mb-2">Asset Type:</label>
                        <select value={assetType} onChange={(e) => setAssetType(e.target.value)}
                                className="w-full px-4 py-2 bg-gray-50 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 transition duration-150 ease-in-out">
                            <option value="Silver">Silver</option>
                            <option value="Gold">Gold</option>
                            {/* Add other asset types as needed */}
                        </select>
                    </div>

                    <div className="form-group">
                        <label className="block text-gray-700 text-sm font-semibold mb-2">Asset Year:</label>
                        <input type="number" value={assetYear} onChange={(e) => setAssetYear(e.target.value)} required 
                               className="w-full px-4 py-2 bg-gray-50 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 transition duration-150 ease-in-out" />
                    </div>

                    <div className="form-group">
                        <label className="block text-gray-700 text-sm font-semibold mb-2">Asset Country:</label>
                        <input type="text" value={assetCountry} onChange={(e) => setAssetCountry(e.target.value)} required 
                               className="w-full px-4 py-2 bg-gray-50 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 transition duration-150 ease-in-out" />
                    </div>

                    <div className="form-group">
                        <label className="block text-gray-700 text-sm font-semibold mb-2">Creator Country:</label>
                        <input type="text" value={creatorCountry} onChange={(e) => setCreatorCountry(e.target.value)} required 
                               className="w-full px-4 py-2 bg-gray-50 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 transition duration-150 ease-in-out" />
                    </div>

                    <div className="form-group">
                        <label className="block text-gray-700 text-sm font-semibold mb-2">Weight (grams):</label>
                        <input type="number" step="any" value={weightGramsInput} onChange={(e) => setWeightGramsInput(e.target.value)} required 
                               className="w-full px-4 py-2 bg-gray-50 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 transition duration-150 ease-in-out" />
                        <small className="text-xs text-gray-500 mt-1 block">Enter the actual weight in grams (e.g., 2.7, 100.05).</small>
                    </div>

                    <div className="form-group">
                        <label className="block text-gray-700 text-sm font-semibold mb-2">Asset Name:</label>
                        <input type="text" value={assetName} onChange={(e) => setAssetName(e.target.value)} required 
                               className="w-full px-4 py-2 bg-gray-50 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 transition duration-150 ease-in-out" />
                    </div>

                    {/* Purity Percentage Input with Warning */}
                    <div className="form-group">
                        <label className="block text-gray-700 text-sm font-semibold mb-2">Purity Percentage (%):</label>
                        <input 
                            type="number" 
                            step="any" 
                            value={purityPercentageInput} 
                            onChange={handlePurityChange} // Use the new handler
                            required 
                            className="w-full px-4 py-2 bg-gray-50 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 transition duration-150 ease-in-out" 
                        />
                        <small className="text-xs text-gray-500 mt-1 block">Enter the actual purity percentage (e.g., 99.9, 99.999).</small>
                        {purityWarning && (
                            <p className="text-orange-600 text-xs mt-1 font-medium">{purityWarning}</p>
                        )}

                        {/* Purity Conversion Table */}
                        <div className="mt-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
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
                               className="w-full px-4 py-2 bg-gray-50 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 transition duration-150 ease-in-out" />
                    </div>

                    <div className="form-group col-span-full flex items-center">
                        <input type="checkbox" checked={isFungible} onChange={(e) => setIsFungible(e.target.checked)} 
                               className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mr-2" />
                        <label className="text-gray-700 text-sm font-semibold">Is Fungible</label>
                    </div>

                    <div className="form-group">
                        <label className="block text-gray-700 text-sm font-semibold mb-2">Image File 1:</label>
                        <input type="file" accept="image/*" onChange={(e) => setImageFile1(e.target.files[0])} required 
                               className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 
                                          file:rounded-full file:border-0 file:text-sm file:font-semibold
                                          file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer" />
                    </div>

                    <div className="form-group">
                        <label className="block text-gray-700 text-sm font-semibold mb-2">Image File 2:</label>
                        <input type="file" accept="image/*" onChange={(e) => setImageFile2(e.target.files[0])} required 
                               className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 
                                          file:rounded-full file:border-0 file:text-sm file:font-semibold
                                          file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer" />
                    </div>

                    <button 
                        type="submit" 
                        disabled={!connectedAccount || !isCorrectNetwork}
                        className="col-span-full mt-6 px-8 py-3 rounded-full text-white font-extrabold text-lg
                                   bg-gradient-to-r from-indigo-600 to-purple-700 hover:from-indigo-700 hover:to-purple-800 
                                   transition-all duration-300 ease-in-out shadow-xl hover:shadow-2xl 
                                   disabled:opacity-50 disabled:cursor-not-allowed">
                        Mint NFT
                    </button>
                </form>

                {/* Minting Status Message */}
                {mintingStatus && (
                    <div className={`mt-6 p-4 rounded-lg text-center font-medium 
                                      ${mintingStatus.includes('Error') || mintingStatus.includes('failed') ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`}>
                        <p>{mintingStatus}</p>
                    </div>
                )}
            </div>
        </div>
    );
}

export default NFTMetadataForm;
