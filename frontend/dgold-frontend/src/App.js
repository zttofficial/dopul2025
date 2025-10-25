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

    // State for user info modal
    const [showUserInfo, setShowUserInfo] = useState(false);

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
            // If manually disconnected, ignore all account changes
            if (isManuallyDisconnected.current) {
                console.log('Manual disconnect active, ignoring account change');
                return;
            }
            
            if (accounts.length > 0) {
                setConnectedAccount(accounts[0]);
                window.ethereum.request({ method: 'eth_chainId' }).then(chain => handleChainChanged(chain));
            } else {
                // If accounts become empty, it means wallet is disconnected from MetaMask side
                // This is a MetaMask-initiated disconnect, so we should allow future reconnections
                setConnectedAccount('');
                setWalletStatus('Wallet disconnected. Please click "Connect Wallet".'); 
                setIsCorrectNetwork(false); 
                setDpmsBalance('0'); 
                setIsValidator(false); 
                setIsContractOwner(false); 
                showToast('Wallet disconnected.', 'info');
                // Don't reset isManuallyDisconnected here - let user manually reconnect
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

            // Only auto-connect if user hasn't manually disconnected
            if (!isManuallyDisconnected.current) {
                window.ethereum.request({ method: 'eth_accounts' })
                    .then(accounts => {
                        if (accounts.length > 0 && !isManuallyDisconnected.current) {
                            setConnectedAccount(accounts[0]);
                            window.ethereum.request({ method: 'eth_chainId' }).then(handleChainChanged);
                            setWalletStatus(`Wallet connected: ${accounts[0].substring(0, 6)}...${accounts[0].substring(accounts[0].length - 4)}`); 
                        }
                    })
                    .catch(error => {
                        console.error("Error checking initial accounts:", error); 
                    });
            }
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

    // No need for click outside handler - backdrop handles closing


    // Helper to render HTML in wallet status message (for the MetaMask download link)
    function createMarkup(htmlString) {
        return { __html: htmlString };
    }

    return (
        <div className="relative min-h-screen overflow-hidden flex flex-col items-center p-4 sm:p-6 lg:p-8 font-inter text-gray-800">
            {/* Animated Background */}
            <div className="fixed inset-0 z-0 bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
                <div className="absolute inset-0 bg-grid-pattern opacity-10"></div>
                <div className="absolute top-0 left-0 w-full h-full">
                    <div className="floating-orb orb-1"></div>
                    <div className="floating-orb orb-2"></div>
                    <div className="floating-orb orb-3"></div>
                </div>
            </div>
            
            {/* Tailwind CSS CDN and Google Fonts for Inter */}
            <script src="https://cdn.tailwindcss.com"></script>
            <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />

            {/* Custom CSS for animations and effects */}
            <style>{`
                input[type='number']::-webkit-inner-spin-button,
                input[type='number']::-webkit-outer-spin-button {
                    -webkit-appearance: none;
                    margin: 0;
                }
                input[type='number'] {
                    -moz-appearance: textfield;
                }
                
                /* Animated Grid Background */
                .bg-grid-pattern {
                    background-image: 
                        linear-gradient(rgba(255, 255, 255, 0.05) 1px, transparent 1px),
                        linear-gradient(90deg, rgba(255, 255, 255, 0.05) 1px, transparent 1px);
                    background-size: 50px 50px;
                    animation: gridMove 20s linear infinite;
                }
                @keyframes gridMove {
                    0% { transform: translate(0, 0); }
                    100% { transform: translate(50px, 50px); }
                }
                
                /* Floating Orbs */
                .floating-orb {
                    position: absolute;
                    border-radius: 50%;
                    filter: blur(60px);
                    opacity: 0.3;
                    animation: float 20s ease-in-out infinite;
                }
                .orb-1 {
                    width: 400px;
                    height: 400px;
                    background: linear-gradient(45deg, #667eea 0%, #764ba2 100%);
                    top: -200px;
                    left: -200px;
                    animation-delay: 0s;
                }
                .orb-2 {
                    width: 500px;
                    height: 500px;
                    background: linear-gradient(45deg, #f093fb 0%, #f5576c 100%);
                    bottom: -250px;
                    right: -250px;
                    animation-delay: 7s;
                }
                .orb-3 {
                    width: 350px;
                    height: 350px;
                    background: linear-gradient(45deg, #4facfe 0%, #00f2fe 100%);
                    top: 50%;
                    left: 50%;
                    animation-delay: 14s;
                }
                @keyframes float {
                    0%, 100% { transform: translate(0, 0) scale(1); }
                    33% { transform: translate(100px, -100px) scale(1.1); }
                    66% { transform: translate(-100px, 100px) scale(0.9); }
                }
                
                /* Glassmorphism */
                .glass {
                    background: rgba(255, 255, 255, 0.1);
                    backdrop-filter: blur(10px);
                    -webkit-backdrop-filter: blur(10px);
                    border: 1px solid rgba(255, 255, 255, 0.2);
                }
                
                .glass-strong {
                    background: rgba(255, 255, 255, 0.95);
                    backdrop-filter: blur(20px);
                    -webkit-backdrop-filter: blur(20px);
                    border: 1px solid rgba(255, 255, 255, 0.3);
                    box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.15);
                }
                
                /* Spinner */
                .spinner {
                    border: 4px solid rgba(255, 255, 255, 0.3);
                    border-left-color: #667eea;
                    border-radius: 50%;
                    width: 24px;
                    height: 24px;
                    animation: spin 1s linear infinite;
                }
                @keyframes spin {
                    to { transform: rotate(360deg); }
                }
                
                /* Shimmer Effect */
                .shimmer {
                    position: relative;
                    overflow: hidden;
                }
                .shimmer::after {
                    content: '';
                    position: absolute;
                    top: 0;
                    left: -100%;
                    width: 100%;
                    height: 100%;
                    background: linear-gradient(
                        90deg,
                        transparent,
                        rgba(255, 255, 255, 0.3),
                        transparent
                    );
                    animation: shimmer 3s infinite;
                }
                @keyframes shimmer {
                    to { left: 100%; }
                }
                
                /* Toast Notifications */
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
                    padding: 14px 24px;
                    border-radius: 12px;
                    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    min-width: 280px;
                    max-width: 400px;
                    animation: slideInRight 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55) forwards, 
                              fadeOut 0.5s ease-in 4.5s forwards;
                    backdrop-filter: blur(10px);
                }
                .toast.success {
                    background: linear-gradient(135deg, rgba(16, 185, 129, 0.95) 0%, rgba(5, 150, 105, 0.95) 100%);
                    color: #fff;
                    border: 1px solid rgba(255, 255, 255, 0.3);
                }
                .toast.error {
                    background: linear-gradient(135deg, rgba(239, 68, 68, 0.95) 0%, rgba(220, 38, 38, 0.95) 100%);
                    color: #fff;
                    border: 1px solid rgba(255, 255, 255, 0.3);
                }
                .toast.info {
                    background: linear-gradient(135deg, rgba(59, 130, 246, 0.95) 0%, rgba(37, 99, 235, 0.95) 100%);
                    color: #fff;
                    border: 1px solid rgba(255, 255, 255, 0.3);
                }
                @keyframes slideInRight {
                    from { transform: translateX(400px) scale(0.8); opacity: 0; }
                    to { transform: translateX(0) scale(1); opacity: 1; }
                }
                @keyframes fadeOut {
                    from { opacity: 1; transform: scale(1); }
                    to { opacity: 0; transform: scale(0.9); }
                }
                
                /* Pulse Animation */
                @keyframes pulse {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.5; }
                }
                
                /* Slide In from Right Animation */
                @keyframes slideInFromRight {
                    from {
                        opacity: 0;
                        transform: translateX(100%);
                    }
                    to {
                        opacity: 1;
                        transform: translateX(0);
                    }
                }
                .animate-slideInFromRight {
                    animation: slideInFromRight 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
                }
                
                /* Fade In Animation */
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                .animate-fadeIn {
                    animation: fadeIn 0.2s ease-out forwards;
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
            <header className="relative z-10 w-full max-w-4xl mx-auto mb-6">
                <div className="glass-strong p-4 rounded-2xl shadow-2xl flex flex-col sm:flex-row justify-between items-center gap-4">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center shadow-lg shimmer">
                            <icons.Coins className="w-7 h-7 text-white" />
                        </div>
                        <h1 className="text-2xl sm:text-3xl font-extrabold bg-gradient-to-r from-purple-600 via-blue-600 to-cyan-600 bg-clip-text text-transparent tracking-tight">
                            Dopul NFT
                        </h1>
                    </div>
                    
                    {!connectedAccount ? (
                        <button 
                            type="button" 
                            className="flex items-center gap-2 px-6 py-3 text-sm rounded-xl text-white font-bold 
                                       bg-gradient-to-r from-emerald-500 via-green-500 to-teal-600 
                                       hover:shadow-[0_0_30px_rgba(16,185,129,0.6)] 
                                       transition-all duration-300 ease-in-out shadow-lg hover:scale-105 
                                       disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100" 
                            onClick={connectWallet}
                            disabled={isLoading}
                        >
                            {isLoading ? <div className="spinner"></div> : <icons.Wallet className="w-5 h-5" />}
                            {isLoading ? 'Connecting...' : 'Connect Wallet'}
                        </button>
                    ) : (
                        <button 
                            onClick={() => setShowUserInfo(!showUserInfo)}
                            className="flex items-center gap-3 px-5 py-3 rounded-xl bg-white/90 border-2 border-purple-400/60 backdrop-blur-sm hover:border-purple-500 hover:bg-white transition-all duration-300 shadow-lg hover:shadow-xl group"
                        >
                            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center shadow-md">
                                <icons.Wallet className="w-5 h-5 text-white" />
                            </div>
                            <div className="text-left">
                                <p className="text-xs text-purple-600 font-semibold">Connected</p>
                                <p className="text-sm font-bold text-gray-800 font-mono">
                                    {connectedAccount.substring(0, 6)}...{connectedAccount.substring(connectedAccount.length - 4)}
                                </p>
                            </div>
                            <svg className={`w-5 h-5 text-purple-600 transition-transform duration-300 ${showUserInfo ? 'rotate-180' : ''}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                        </button>
                    )}
                </div>
            </header>

            {/* User Info Panel - Collapsible */}
            {showUserInfo && connectedAccount && (
                <div className="relative z-10 w-full max-w-4xl mx-auto mb-6 animate-slideInFromRight">
                    <div className="bg-white/95 backdrop-blur-sm rounded-xl shadow-2xl border-2 border-purple-400/60 p-5">
                        {/* Compact Two-Column Layout */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            {/* Left Column: Info */}
                            <div className="space-y-3.5">
                                {/* Wallet Address */}
                                <div>
                                    <h3 className="text-xs font-bold text-purple-600 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                                        <icons.Wallet className="w-3.5 h-3.5" />
                                        Wallet Address
                                    </h3>
                                    <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-lg p-3 border border-purple-200 mb-2">
                                        <p className="text-xs font-mono text-gray-800 break-all leading-relaxed">{connectedAccount}</p>
                                    </div>
                                    <button 
                                        onClick={() => {
                                            navigator.clipboard.writeText(connectedAccount);
                                            showToast('Address copied!', 'success');
                                        }}
                                        className="w-full px-4 py-2.5 text-sm rounded-lg text-white font-bold bg-gradient-to-r from-purple-500 to-blue-600 hover:from-purple-600 hover:to-blue-700 transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                        </svg>
                                        Copy Address
                                    </button>
                                </div>
                                
                                {/* Network Status */}
                                <div>
                                    <h3 className="text-xs font-bold text-purple-600 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                                        <icons.Network className="w-3.5 h-3.5" />
                                        Network
                                    </h3>
                                    <div className={`rounded-lg p-3 border-2 ${isCorrectNetwork ? 'bg-green-50 border-green-300' : 'bg-orange-50 border-orange-300'}`}>
                                        <p className={`text-sm font-bold ${isCorrectNetwork ? 'text-green-700' : 'text-orange-700'}`}>
                                            {isCorrectNetwork ? '✓ ' : '⚠ '}{connectedNetwork}
                                        </p>
                                    </div>
                                    {!isCorrectNetwork && (
                                        <button 
                                            onClick={switchToSepolia}
                                            className="mt-2 w-full px-4 py-2 text-sm rounded-lg font-bold text-white bg-gradient-to-r from-yellow-500 to-orange-600 hover:from-yellow-600 hover:to-orange-700 transition-all shadow-md flex items-center justify-center gap-2"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                            </svg>
                                            Switch Network
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Right Column: Balance, Role & Action */}
                            <div className="space-y-3.5">
                                {/* DPMS Balance */}
                                <div>
                                    <h3 className="text-xs font-bold text-purple-600 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                                        <icons.DollarSign className="w-3.5 h-3.5" />
                                        DPMS Balance
                                    </h3>
                                    <div className="bg-gradient-to-br from-purple-100 to-pink-100 rounded-lg p-3 border-2 border-purple-300">
                                        <p className="text-2xl font-extrabold text-center bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent leading-tight">
                                            {dpmsBalance}
                                        </p>
                                    </div>
                                </div>

                                {/* User Role */}
                                <div>
                                    <h3 className="text-xs font-bold text-purple-600 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                                        <icons.UserCheck className="w-3.5 h-3.5" />
                                        Role
                                    </h3>
                                    {isContractOwner && (
                                        <div className="px-4 py-2.5 rounded-lg bg-gradient-to-r from-red-100 to-pink-200 border-2 border-red-300 shadow-md">
                                            <p className="text-red-800 text-sm font-bold flex items-center justify-center gap-2">
                                                <icons.Settings className="w-4 h-4" />
                                                Contract Owner
                                            </p>
                                        </div>
                                    )}
                                    {isValidator && !isContractOwner && (
                                        <div className="px-4 py-2.5 rounded-lg bg-gradient-to-r from-purple-100 to-blue-200 border-2 border-purple-300 shadow-md">
                                            <p className="text-purple-800 text-sm font-bold flex items-center justify-center gap-2">
                                                <icons.UserCheck className="w-4 h-4" />
                                                Validator
                                            </p>
                                        </div>
                                    )}
                                    {!isValidator && !isContractOwner && (
                                        <div className="px-4 py-2.5 rounded-lg bg-gradient-to-r from-gray-100 to-gray-300 border-2 border-gray-400 shadow-md">
                                            <p className="text-gray-800 text-sm font-bold flex items-center justify-center gap-2">
                                                <icons.Wallet className="w-4 h-4" />
                                                Standard User
                                            </p>
                                        </div>
                                    )}
                                </div>

                                {/* Disconnect Button */}
                                <button 
                                    onClick={() => {
                                        disconnectWallet();
                                        setShowUserInfo(false);
                                    }}
                                    className="w-full px-4 py-2.5 rounded-lg text-white font-bold text-sm
                                               bg-gradient-to-r from-rose-500 to-red-600 
                                               hover:from-rose-600 hover:to-red-700
                                               transition-all shadow-md hover:shadow-lg
                                               flex items-center justify-center gap-2"
                                >
                                    <icons.XCircle className="w-5 h-5" />
                                    Disconnect Wallet
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Main Content Area */}
            <main className="relative z-10 w-full max-w-4xl mx-auto glass-strong p-6 sm:p-8 rounded-2xl shadow-2xl transform hover:shadow-[0_20px_60px_rgba(0,0,0,0.3)] transition-all duration-500 ease-in-out">
                {/* Tab Navigation (only for Mint and Validator) */}
                {currentPage !== 'admin' && (
                    <div className="flex justify-center mb-8 gap-2">
                        <button
                            className={`relative px-8 py-4 rounded-xl text-lg font-bold transition-all duration-300 overflow-hidden group
                                        ${currentPage === 'mint' 
                                            ? 'bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600 text-white shadow-lg shadow-blue-500/50' 
                                            : 'bg-white/80 text-gray-700 hover:bg-white hover:shadow-lg'}`}
                            onClick={() => setCurrentPage('mint')}
                        >
                            <span className="relative z-10 flex items-center gap-2">
                                <icons.Coins className="w-6 h-6" /> Mint NFT
                            </span>
                            {currentPage === 'mint' && (
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent shimmer"></div>
                            )}
                        </button>
                        <button
                            className={`relative px-8 py-4 rounded-xl text-lg font-bold transition-all duration-300 overflow-hidden group
                                        ${currentPage === 'validator' && isValidator
                                            ? 'bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 text-white shadow-lg shadow-purple-500/50' 
                                            : 'bg-white/80 text-gray-700 hover:bg-white hover:shadow-lg'}
                                        ${!isValidator ? 'opacity-50 cursor-not-allowed' : ''}`}
                            onClick={() => {
                                if (isValidator) {
                                    setCurrentPage('validator');
                                } else {
                                    showToast('You are not registered as a validator. Only designated addresses can access this dashboard.', 'info');
                                }
                            }}
                            disabled={!connectedAccount || !isCorrectNetwork}
                        >
                            <span className="relative z-10 flex items-center gap-2">
                                <icons.UserCheck className="w-6 h-6" /> Validator Dashboard
                            </span>
                            {currentPage === 'validator' && isValidator && (
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent shimmer"></div>
                            )}
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
