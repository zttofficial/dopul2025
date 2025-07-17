import React, { useState, useEffect, useCallback, useRef } from 'react';
import MintingPage from './MintingPage'; // Renamed from NFTMetadataForm
import AdminDashboard from './AdminDashboard'; // New Admin Dashboard component

// --- Contract ABI and Address ---
// IMPORTANT: Ensure 'DopulNFT.json' is located at 'src/contracts/DopulNFT.json' in your frontend project.
// This file should contain the full JSON array of your contract's ABI.
import NFT_CONTRACT_ABI_ARRAY from './contracts/DopulNFT.json'; 

const NFT_CONTRACT_ABI = NFT_CONTRACT_ABI_ARRAY; // Use the imported array directly

const NFT_CONTRACT_ADDRESS = '0x67ee3cd9d703917cbc1e11e4e2182eda5e9df022'; // !!! REPLACE WITH YOUR ACTUAL CONTRACT ADDRESS !!!
const SEPOLIA_CHAIN_ID_HEX = '0xaa36a7'; // Sepolia Testnet Chain ID in hexadecimal
const SEPOLIA_CHAIN_ID_DECIMAL = 11155111; // Sepolia Testnet Chain ID in decimal, for direct comparison

// Import Lucide icons dynamically (same as in other components)
const icons = {
    Wallet: (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"/><path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"/><path d="M3 5v14a2 2 0 0 0 2 2h16v-5"/><path d="M18 12h.01"/><path d="M7 12h10"/></svg>,
    Network: (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="16" y="2" width="6" height="6" rx="1"/><rect x="2" y="16" width="6" height="6" rx="1"/><path d="M6 16V6a2 2 0 0 1 2-2h8"/><path d="M17 22v-8a2 2 0 0 0-2-2H8"/><path d="M12 7h.01"/><path d="M12 17h.01"/></svg>,
    DollarSign: (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>,
    CheckCircle: (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>,
    XCircle: (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>,
    Loader2: (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>,
    UserCheck: (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><polyline points="22 7 18 11 16 9"/></svg>,
    Settings: (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.04.02a2 2 0 0 1 .97 1.91v.44a2 2 0 0 1-.97 1.91l-.04.02a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l-.22-.38a2 2 0 0 0-.73-2.73l-.04-.02a2 2 0 0 1-.97-1.91v-.44a2 2 0 0 1 .97-1.91l.04-.02a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>,
    Info: (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>,
    Coins: (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="8" cy="8" r="6"/><path d="M18.09 10.37A6 6 0 1 1 10.34 18"/><path d="M7 17H4a2 2 0 0 0-2 2v2a2 2 0 0 0 2 2h2"/><path d="M22 17h-3a2 2 0 0 0-2 2v2a2 2 0 0 0 2 2h3"/><path d="M6 17v-2a2 2 0 0 1 2-2h4"/></svg>
};


function App() { // Renamed from NFTMetadataForm to App
    // Global states for wallet connection and user roles
    const [connectedAccount, setConnectedAccount] = useState('');
    const [walletStatus, setWalletStatus] = useState(''); 
    const [connectedNetwork, setConnectedNetwork] = useState('N/A'); 
    const [isCorrectNetwork, setIsCorrectNetwork] = useState(false); 
    const [isLoading, setIsLoading] = useState(false); // Global loading for wallet connection

    // User role states
    const [dpmsBalance, setDpmsBalance] = useState('0');
    const [isValidator, setIsValidator] = useState(false);
    const [isContractOwner, setIsContractOwner] = useState(false);
    const [ownerAddress, setOwnerAddress] = useState('');

    // State for toast notification
    const [toast, setToast] = useState({ show: false, message: '', type: '' }); // type: 'success', 'error', 'info'

    // State for current page/tab, now derived from URL
    const [currentPage, setCurrentPage] = useState('mint'); // Default to 'mint'

    // Ref to track manual disconnect
    const isManuallyDisconnected = useRef(false); 

    // Function to show toast notification
    const showToast = useCallback((message, type) => {
        setToast({ show: true, message, type });
        const timer = setTimeout(() => {
            setToast({ show: false, message: '', type: '' });
        }, 5000); // Toast disappears after 5 seconds
        return () => clearTimeout(timer);
    }, []);

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

    // Function to fetch DPMS balance
    const fetchDPMSBalance = useCallback(async (account) => {
        if (!account || typeof window.ethers === 'undefined' || !isCorrectNetwork) {
            setDpmsBalance('0');
            return;
        }
        try {
            const provider = new window.ethers.BrowserProvider(window.ethereum);
            const contract = new window.ethers.Contract(NFT_CONTRACT_ADDRESS, NFT_CONTRACT_ABI, provider);
            const balance = await contract.getDPMSTokenBalance(account);
            // Assuming DPMS is a whole number or has 0 decimals based on user feedback (204, not 0.00...204)
            setDpmsBalance(balance.toString()); 
        } catch (error) {
            console.error("Error fetching DPMS balance:", error);
            setDpmsBalance('Error');
        }
    }, [isCorrectNetwork]);

    // Function to check if current account is a validator
    const checkValidatorStatus = useCallback(async (account) => {
        if (!account || typeof window.ethers === 'undefined' || !isCorrectNetwork) {
            setIsValidator(false);
            return;
        }
        try {
            const provider = new window.ethers.BrowserProvider(window.ethereum);
            const contract = new window.ethers.Contract(NFT_CONTRACT_ADDRESS, NFT_CONTRACT_ABI, provider);
            const validatorStatus = await contract.isValidator(account);
            setIsValidator(validatorStatus);
        } catch (error) {
            console.error("Error checking validator status:", error);
            setIsValidator(false);
        }
    }, [isCorrectNetwork]);

    // Function to fetch contract owner
    const fetchContractOwner = useCallback(async () => {
        if (typeof window.ethers === 'undefined' || !isCorrectNetwork) {
            setOwnerAddress('');
            setIsContractOwner(false);
            return;
        }
        try {
            const provider = new window.ethers.BrowserProvider(window.ethereum);
            const contract = new window.ethers.Contract(NFT_CONTRACT_ADDRESS, NFT_CONTRACT_ABI, provider);
            const owner = await contract.owner();
            setOwnerAddress(owner);
            if (connectedAccount && owner.toLowerCase() === connectedAccount.toLowerCase()) {
                setIsContractOwner(true);
            } else {
                setIsContractOwner(false);
            }
        } catch (error) {
            console.error("Error fetching contract owner:", error);
            setOwnerAddress('');
            setIsContractOwner(false);
        }
    }, [isCorrectNetwork, connectedAccount]);

    // Wallet Connection Logic
    const connectWallet = async () => {
        setWalletStatus(''); 
        isManuallyDisconnected.current = false; // Reset on new connection attempt

        if (typeof window.ethereum === 'undefined' || !window.ethereum.isMetaMask) {
            setWalletStatus('MetaMask is not installed. Please install MetaMask: <a href="https://metamask.io/download/" target="_blank" rel="noopener noreferrer">Install MetaMask</a>'); 
            showToast('MetaMask is not installed. Please install MetaMask.', 'error');
            return; 
        }
        if (typeof window.ethers === 'undefined') {
            setWalletStatus('Ethers.js library not loaded. Please ensure the ethers.js CDN is correctly added to your public/index.html file.'); 
            showToast('Ethers.js library not loaded.', 'error');
            return; 
        }

        setWalletStatus('Requesting wallet connection. Please check your MetaMask popup...'); 
        setIsLoading(true); // Start global loading for wallet connection

        try {
            const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
            if (accounts.length > 0) {
                setConnectedAccount(accounts[0]);
                setWalletStatus(`Wallet connected successfully: ${accounts[0].substring(0, 6)}...${accounts[0].substring(accounts[0].length - 4)}.`); 
                await switchToSepolia(); // Attempt to switch to Sepolia after connection
                fetchDPMSBalance(accounts[0]); 
                checkValidatorStatus(accounts[0]); 
                fetchContractOwner(); 
                showToast('Wallet connected successfully!', 'success');
            } else {
                setConnectedAccount('');
                setWalletStatus('Wallet connection cancelled or no accounts selected.'); 
                showToast('Wallet connection cancelled.', 'info');
            }
        } catch (error) {
            console.error('Wallet connection error:', error); 
            if (error.code === 4001) { 
                setWalletStatus('Wallet connection rejected by user.'); 
                showToast('Wallet connection rejected by user.', 'error');
            } else {
                setWalletStatus(`Wallet connection failed: ${error.message}. Please check MetaMask and ensure it is unlocked and active.`); 
                showToast(`Wallet connection failed: ${error.message}`, 'error');
            }
        } finally {
            setIsLoading(false); // End global loading
        }
    };

    const disconnectWallet = () => {
        setConnectedAccount(''); 
        setWalletStatus('Wallet disconnected. Please click "Connect Wallet".'); 
        setIsCorrectNetwork(false); 
        setConnectedNetwork('N/A'); 
        setDpmsBalance('0'); 
        setIsValidator(false); 
        setIsContractOwner(false); 
        isManuallyDisconnected.current = true; // Set ref to true on explicit disconnect
        showToast('Wallet disconnected.', 'info');
        // No need to call window.ethereum.request({ method: 'wallet_revokePermissions' }) here
        // as MetaMask handles disconnections via accountsChanged event when user disconnects.
    };

    const switchToSepolia = async () => {
        if (typeof window.ethereum !== 'undefined' && window.ethereum.isMetaMask) {
            try {
                await window.ethereum.request({
                    method: 'wallet_switchEthereumChain',
                    params: [{ chainId: SEPOLIA_CHAIN_ID_HEX }],
                });
                showToast('Switched to Sepolia Testnet.', 'success');
            } catch (switchError) {
                console.error("Failed to switch network:", switchError); 
                if (switchError.code === 4902) {
                    setWalletStatus('Sepolia Testnet not added to MetaMask. Please add it manually or through a dApp that supports adding networks.'); 
                    showToast('Sepolia Testnet not added to MetaMask.', 'error');
                } else if (switchError.code === 4001) {
                    setWalletStatus('Network switch rejected by user.'); 
                    showToast('Network switch rejected by user.', 'info');
                } else {
                    setWalletStatus(`Failed to switch to Sepolia: ${switchError.message}`); 
                    showToast(`Failed to switch to Sepolia: ${switchError.message}`, 'error');
                }
            }
        } else {
            setWalletStatus('MetaMask is not detected. Cannot switch network directly. Please switch manually in MetaMask.'); 
            showToast('MetaMask is not detected. Please switch manually.', 'error');
        }
    };

    // Effect to setup listeners and check network on component mount
    useEffect(() => {
        // Determine initial page based on URL path
        if (window.location.pathname === '/admin') {
            setCurrentPage('admin');
        } else {
            setCurrentPage('mint'); // Default to mint page
        }

        const handleAccountsChanged = (accounts) => {
            if (isManuallyDisconnected.current) {
                isManuallyDisconnected.current = false; // Reset after handling manual disconnect
                return;
            }
            if (accounts.length > 0) {
                setConnectedAccount(accounts[0]);
                window.ethereum.request({ method: 'eth_chainId' }).then(chain => handleChainChanged(chain));
            } else {
                // If accounts become empty, it means wallet is disconnected
                setConnectedAccount('');
                setWalletStatus('Wallet disconnected. Please click "Connect Wallet".'); 
                setIsCorrectNetwork(false); 
                setDpmsBalance('0'); 
                setIsValidator(false); 
                setIsContractOwner(false); 
                showToast('Wallet disconnected.', 'info');
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
                    showToast(`Connected to ${getNetworkName(chainId)}. Please switch to Sepolia Testnet.`, 'error');
                }
            }
            fetchDPMSBalance(connectedAccount); 
            checkValidatorStatus(connectedAccount); 
            fetchContractOwner(); 
        };

        if (typeof window.ethereum !== 'undefined' && window.ethereum.isMetaMask && typeof window.ethers !== 'undefined') {
            window.ethereum.on('accountsChanged', handleAccountsChanged);
            window.ethereum.on('chainChanged', handleChainChanged);

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
                });
        }
        
        return () => {
            if (window.ethereum) {
                window.ethereum.removeListener('accountsChanged', handleAccountsChanged); 
                window.ethereum.removeListener('chainChanged', handleChainChanged);
            }
        };

    }, [connectedAccount, fetchDPMSBalance, checkValidatorStatus, fetchContractOwner, showToast]); 

    // Effects to fetch data when dependencies change
    useEffect(() => {
        if (connectedAccount && isCorrectNetwork) {
            fetchDPMSBalance(connectedAccount);
            checkValidatorStatus(connectedAccount);
            fetchContractOwner(); 
        }
    }, [connectedAccount, isCorrectNetwork, fetchDPMSBalance, checkValidatorStatus, fetchContractOwner]);


    // Helper to render HTML in wallet status message (for the MetaMask download link)
    function createMarkup(htmlString) {
        return { __html: htmlString };
    }

    return (
        <div className="relative min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8 font-inter text-gray-800">
            {/* Tailwind CSS CDN and Google Fonts for Inter */}
            <script src="https://cdn.tailwindcss.com"></script>
            <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />

            {/* Custom CSS for spinner and toast */}
            <style>{`
                input[type='number']::-webkit-inner-spin-button,
                input[type='number']::-webkit-outer-spin-button {
                    -webkit-appearance: none;
                    margin: 0;
                }
                input[type='number'] {
                    -moz-appearance: textfield; /* Firefox */
                }
                .spinner {
                    border: 4px solid rgba(0, 0, 0, 0.1);
                    border-left-color: #ffffff;
                    border-radius: 50%;
                    width: 24px;
                    height: 24px;
                    animation: spin 1s linear infinite;
                }
                @keyframes spin {
                    to { transform: rotate(360deg); }
                }
                .toast-container {
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    z-index: 1000;
                    display: flex;
                    flex-direction: column;
                    gap: 10px;
                }
                .toast {
                    padding: 12px 20px;
                    border-radius: 8px;
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    min-width: 250px;
                    max-width: 350px;
                    animation: slideInRight 0.5s forwards, fadeOut 0.5s 4.5s forwards;
                }
                .toast.success {
                    background-color: #d4edda;
                    color: #155724;
                    border: 1px solid #c3e6cb;
                }
                .toast.error {
                    background-color: #f8d7da;
                    color: #721c24;
                    border: 1px solid #f5c6cb;
                }
                .toast.info {
                    background-color: #d1ecf1;
                    color: #0c5460;
                    border: 1px solid #bee5eb;
                }
                @keyframes slideInRight {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
                @keyframes fadeOut {
                    from { opacity: 1; }
                    to { opacity: 0; }
                }
            `}</style>

            {/* Toast Notification Container */}
            {toast.show && (
                <div className="toast-container">
                    <div className={`toast ${toast.type}`}>
                        {toast.type === 'success' && <icons.CheckCircle className="w-5 h-5" />}
                        {toast.type === 'error' && <icons.XCircle className="w-5 h-5" />}
                        {toast.type === 'info' && <icons.Info className="w-5 h-5" />}
                        <p className="flex-1">{toast.message}</p>
                        <button onClick={() => setToast({ show: false, message: '', type: '' })} className="text-current opacity-70 hover:opacity-100">
                            &times;
                        </button>
                    </div>
                </div>
            )}

            {/* Header and Wallet Connection */}
            <header className="w-full max-w-4xl flex justify-between items-center mb-8 p-4 bg-white rounded-xl shadow-lg">
                <h1 className="text-3xl sm:text-4xl font-extrabold text-blue-700 tracking-tight">
                    Dopul NFT Platform
                </h1>
                <div className="flex flex-col items-end space-y-2">
                    {walletStatus && (
                        <div className="bg-blue-50 border border-blue-200 text-blue-800 p-2 text-xs sm:text-sm rounded-lg text-center font-medium shadow-md max-w-xs transition-all duration-300 ease-in-out">
                            <p dangerouslySetInnerHTML={createMarkup(walletStatus)}></p>
                        </div>
                    )}
                    {!connectedAccount ? (
                        <button 
                            type="button" 
                            className="flex items-center gap-2 px-5 py-2 text-sm rounded-full text-white font-semibold 
                                       bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 
                                       transition-all duration-300 ease-in-out shadow-lg hover:shadow-xl" 
                            onClick={connectWallet}
                            disabled={isLoading}
                        >
                            {isLoading ? <div className="spinner"></div> : <icons.Wallet className="w-5 h-5" />}
                            {isLoading ? 'Connecting...' : 'Connect Wallet'}
                        </button>
                    ) : (
                        <button 
                            type="button" 
                            className="flex items-center gap-2 px-5 py-2 text-sm rounded-full text-white font-semibold 
                                       bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 
                                       transition-all duration-300 ease-in-out shadow-lg hover:shadow-xl" 
                            onClick={disconnectWallet} // Use the new disconnectWallet function
                            disabled={isLoading}
                        >
                            <icons.XCircle className="w-5 h-5" />
                            Disconnect Wallet
                        </button>
                    )}
                </div>
            </header>

            {/* Main Content Area */}
            <main className="w-full max-w-4xl bg-white p-6 sm:p-8 rounded-xl shadow-2xl transform hover:scale-[1.005] transition-transform duration-300 ease-in-out">
                {/* Tab Navigation (only for Mint and Validator) */}
                {currentPage !== 'admin' && ( // Hide tabs if on admin page
                    <div className="flex justify-center mb-6">
                        <button
                            className={`px-6 py-3 rounded-l-lg text-lg font-semibold transition-all duration-200
                                        ${currentPage === 'mint' ? 'bg-blue-600 text-white shadow-md' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                            onClick={() => setCurrentPage('mint')}
                        >
                            <span className="flex items-center gap-2"><icons.Coins className="w-5 h-5" /> Mint NFT</span>
                        </button>
                        <button
                            className={`px-6 py-3 rounded-r-lg text-lg font-semibold transition-all duration-200
                                        ${currentPage === 'validator' && isValidator ? 'bg-purple-600 text-white shadow-md' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}
                                        ${!isValidator ? 'opacity-50 cursor-not-allowed' : ''}`}
                            onClick={() => {
                                if (isValidator) {
                                    setCurrentPage('validator');
                                } else {
                                    showToast('You are not registered as a validator. Only designated addresses can access this dashboard.', 'info');
                                }
                            }}
                            disabled={!connectedAccount || !isCorrectNetwork} // Disable if not connected or wrong network
                        >
                            <span className="flex items-center gap-2"><icons.UserCheck className="w-5 h-5" /> Validator Dashboard</span>
                        </button>
                    </div>
                )}

                {/* Conditional Page Rendering */}
                {currentPage === 'mint' && (
                    <MintingPage 
                        connectedAccount={connectedAccount}
                        connectedNetwork={connectedNetwork}
                        isCorrectNetwork={isCorrectNetwork}
                        walletStatus={walletStatus}
                        dpmsBalance={dpmsBalance}
                        isValidator={isValidator}
                        isLoading={isLoading}
                        connectWallet={connectWallet}
                        disconnectWallet={disconnectWallet}
                        switchToSepolia={switchToSepolia}
                        fetchDPMSBalance={fetchDPMSBalance}
                        checkValidatorStatus={checkValidatorStatus}
                        showToast={showToast}
                    />
                )}
                {currentPage === 'validator' && (
                    <MintingPage // Reusing MintingPage for validator view, as it contains the unverified NFTs logic
                        connectedAccount={connectedAccount}
                        connectedNetwork={connectedNetwork}
                        isCorrectNetwork={isCorrectNetwork}
                        walletStatus={walletStatus}
                        dpmsBalance={dpmsBalance}
                        isValidator={isValidator}
                        isLoading={isLoading}
                        connectWallet={connectWallet}
                        disconnectWallet={disconnectWallet}
                        switchToSepolia={switchToSepolia}
                        fetchDPMSBalance={fetchDPMSBalance}
                        checkValidatorStatus={checkValidatorStatus}
                        showToast={showToast}
                    />
                )}
                {/* Admin Dashboard is now rendered only if currentPage is 'admin' */}
                {currentPage === 'admin' && (
                    <AdminDashboard 
                        connectedAccount={connectedAccount}
                        isCorrectNetwork={isCorrectNetwork}
                        isContractOwner={isContractOwner}
                        ownerAddress={ownerAddress}
                        showToast={showToast}
                        fetchMintingFee={() => { /* Placeholder, MintingPage handles this */ }}
                        checkValidatorStatus={checkValidatorStatus}
                    />
                )}
            </main>
        </div>
    );
}

export default App;
