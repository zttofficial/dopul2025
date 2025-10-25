import React, { useState, useCallback } from 'react';
import NFT_CONTRACT_ABI_ARRAY from './contracts/DopulNFT.json'; // Moved to top for import/first rule

// --- Contract ABI and Address ---
// This file should contain the full JSON array of your contract's ABI.
const NFT_CONTRACT_ABI = NFT_CONTRACT_ABI_ARRAY;
const NFT_CONTRACT_ADDRESS = '0x67ee3cd9d703917cbc1e11e4e2182eda5e9df022'; // Replace with your actual contract address

// Import Lucide icons dynamically (same as in the main app)
const icons = {
    Wallet: (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"/><path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"/><path d="M3 5v14a2 2 0 0 0 2 2h16v-5"/><path d="M18 12h.01"/><path d="M7 12h10"/></svg>,
    DollarSign: (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>,
    CheckCircle: (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>,
    XCircle: (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>,
    Loader2: (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>,
    UserCheck: (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><polyline points="22 7 18 11 16 9"/></svg>,
    Settings: (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.04.02a2 2 0 0 1 .97 1.91v.44a2 2 0 0 1-.97 1.91l-.04.02a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l-.22-.38a2 2 0 0 0-.73-2.73l-.04-.02a2 2 0 0 1-.97-1.91v-.44a2 2 0 0 1 .97-1.91l.04-.02a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>
};

/**
 * AdminDashboard component for contract owner to manage settings.
 * @param {object} props - Component props.
 * @param {string} props.connectedAccount - The currently connected wallet address.
 * @param {boolean} props.isCorrectNetwork - True if connected to the correct network.
 * @param {boolean} props.isContractOwner - True if the connected account is the contract owner.
 * @param {string} props.ownerAddress - The contract owner's address.
 * @param {function} props.showToast - Function to display toast notifications.
 * @param {function} props.fetchMintingFee - Function to refresh the displayed minting fee.
 * @param {function} props.checkValidatorStatus - Function to refresh validator status.
 */
function AdminDashboard({ 
    connectedAccount, 
    isCorrectNetwork, 
    isContractOwner, 
    ownerAddress, 
    showToast, 
    fetchMintingFee,
    checkValidatorStatus
}) {
    const [newMintingFeeAssetType, setNewMintingFeeAssetType] = useState('Silver');
    const [newMintingFeeValue, setNewMintingFeeValue] = useState('');
    const [newValidatorAddress, setNewValidatorAddress] = useState('');
    const [removeValidatorAddress, setRemoveValidatorAddress] = useState('');
    const [newProjectWalletAddress, setNewProjectWalletAddress] = useState('');
    const [adminActionStatus, setAdminActionStatus] = useState('');
    const [adminIsLoading, setAdminIsLoading] = useState(false); // Local loading state for admin actions

    // Admin Functions
    const handleSetMintingFee = useCallback(async () => {
        if (!connectedAccount || !isCorrectNetwork || !isContractOwner) {
            showToast('Error: Not authorized or wallet not connected to Sepolia.', 'error');
            return;
        }
        if (isNaN(parseFloat(newMintingFeeValue)) || parseFloat(newMintingFeeValue) < 0) {
            showToast('Error: Please enter a valid positive number for the new minting fee.', 'error');
            return;
        }

        setAdminActionStatus('Setting new minting fee...');
        setAdminIsLoading(true);
        try {
            const provider = new window.ethers.BrowserProvider(window.ethereum);
            const signer = await provider.getSigner(); 
            const contract = new window.ethers.Contract(NFT_CONTRACT_ADDRESS, NFT_CONTRACT_ABI, signer);
            const feeInWei = window.ethers.parseEther(newMintingFeeValue); // Convert ETH to Wei

            const tx = await contract.setMintingFee(newMintingFeeAssetType, feeInWei);
            setAdminActionStatus('Transaction sent. Waiting for confirmation...');
            await tx.wait();
            setAdminActionStatus('Minting fee updated successfully!');
            showToast('Minting fee updated successfully!', 'success');
            fetchMintingFee(); // Refresh displayed fee in MintingPage
        } catch (error) {
            console.error("Error setting minting fee:", error);
            setAdminActionStatus(`Failed to set minting fee: ${error.message}`);
            showToast(`Failed to set minting fee: ${error.message}`, 'error');
        } finally {
            setAdminIsLoading(false);
        }
    }, [connectedAccount, isCorrectNetwork, isContractOwner, newMintingFeeValue, newMintingFeeAssetType, showToast, fetchMintingFee]);

    const handleAddValidator = useCallback(async () => {
        if (!connectedAccount || !isCorrectNetwork || !isContractOwner) {
            showToast('Error: Not authorized or wallet not connected to Sepolia.', 'error');
            return;
        }
        if (!window.ethers.isAddress(newValidatorAddress)) {
            showToast('Error: Invalid Ethereum address for validator.', 'error');
            return;
        }

        setAdminActionStatus('Adding validator...');
        setAdminIsLoading(true);
        try {
            const provider = new window.ethers.BrowserProvider(window.ethereum);
            const signer = await provider.getSigner(); 
            const contract = new window.ethers.Contract(NFT_CONTRACT_ADDRESS, NFT_CONTRACT_ABI, signer);

            const tx = await contract.addValidator(newValidatorAddress);
            setAdminActionStatus('Transaction sent. Waiting for confirmation...');
            await tx.wait();
            setAdminActionStatus('Validator added successfully!');
            showToast('Validator added successfully!', 'success');
            setNewValidatorAddress('');
            checkValidatorStatus(connectedAccount); // Re-check current user's validator status
        } catch (error) {
            console.error("Error adding validator:", error);
            setAdminActionStatus(`Failed to add validator: ${error.message}`);
            showToast(`Failed to add validator: ${error.message}`, 'error');
        } finally {
            setAdminIsLoading(false);
        }
    }, [connectedAccount, isCorrectNetwork, isContractOwner, newValidatorAddress, showToast, checkValidatorStatus]);

    const handleRemoveValidator = useCallback(async () => {
        if (!connectedAccount || !isCorrectNetwork || !isContractOwner) {
            showToast('Error: Not authorized or wallet not connected to Sepolia.', 'error');
            return;
        }
        if (!window.ethers.isAddress(removeValidatorAddress)) {
            showToast('Error: Invalid Ethereum address for validator.', 'error');
            return;
        }

        setAdminActionStatus('Removing validator...');
        setAdminIsLoading(true);
        try {
            const provider = new window.ethers.BrowserProvider(window.ethereum);
            const signer = await provider.getSigner(); 
            const contract = new window.ethers.Contract(NFT_CONTRACT_ADDRESS, NFT_CONTRACT_ABI, signer);

            const tx = await contract.removeValidator(removeValidatorAddress);
            setAdminActionStatus('Transaction sent. Waiting for confirmation...');
            await tx.wait();
            setAdminActionStatus('Validator removed successfully!');
            showToast('Validator removed successfully!', 'success');
            setRemoveValidatorAddress('');
            checkValidatorStatus(connectedAccount); // Re-check current user's validator status
        } catch (error) {
            console.error("Error removing validator:", error);
            setAdminActionStatus(`Failed to remove validator: ${error.message}`);
            showToast(`Failed to remove validator: ${error.message}`, 'error');
        } finally {
            setAdminIsLoading(false);
        }
    }, [connectedAccount, isCorrectNetwork, isContractOwner, removeValidatorAddress, showToast, checkValidatorStatus]);

    const handleUpdateProjectWalletAddress = useCallback(async () => {
        if (!connectedAccount || !isCorrectNetwork || !isContractOwner) {
            showToast('Error: Not authorized or wallet not connected to Sepolia.', 'error');
            return;
        }
        if (!window.ethers.isAddress(newProjectWalletAddress)) {
            showToast('Error: Invalid Ethereum address for project wallet.', 'error');
            return;
        }

        setAdminActionStatus('Updating project wallet address...');
        setAdminIsLoading(true);
        try {
            const provider = new window.ethers.BrowserProvider(window.ethereum);
            const signer = await provider.getSigner(); 
            const contract = new window.ethers.Contract(NFT_CONTRACT_ADDRESS, NFT_CONTRACT_ABI, signer);

            const tx = await contract.updateProjectWalletAddress(newProjectWalletAddress);
            setAdminActionStatus('Transaction sent. Waiting for confirmation...');
            await tx.wait();
            setAdminActionStatus('Project wallet address updated successfully!');
            showToast('Project wallet address updated successfully!', 'success');
            setNewProjectWalletAddress('');
        } catch (error) {
            console.error("Error updating project wallet address:", error);
            setAdminActionStatus(`Failed to update project wallet address: ${error.message}`);
            showToast(`Failed to update project wallet address: ${error.message}`, 'error');
        } finally {
            setAdminIsLoading(false);
        }
    }, [connectedAccount, isCorrectNetwork, isContractOwner, newProjectWalletAddress, showToast]);

    if (!isContractOwner) {
        return (
            <div className="p-6 bg-red-50 border border-red-200 rounded-xl shadow-lg text-center">
                <h2 className="text-2xl font-bold text-red-700 mb-4">Access Denied</h2>
                <p className="text-lg text-red-600">
                    You are not the contract owner.
                </p>
                <p className="text-sm text-gray-500 mt-2">
                    This dashboard is restricted to the wallet address that deployed the contract.
                </p>
            </div>
        );
    }

    return (
        <section className="col-span-full">
            <div className="p-8 bg-gradient-to-br from-red-500/20 to-orange-500/20 border-2 border-red-400/50 rounded-2xl shadow-2xl backdrop-blur-sm">
                <div className="flex items-center justify-center gap-3 mb-4">
                    <div className="p-3 rounded-xl bg-gradient-to-br from-red-500 to-orange-600 shadow-lg shimmer">
                        <icons.Settings className="w-8 h-8 text-white" />
                    </div>
                    <h2 className="text-4xl font-extrabold bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-transparent">
                        Admin Dashboard
                    </h2>
                </div>
                <p className="text-xl text-red-800 font-bold mb-3 text-center">
                    Welcome, Contract Owner!
                </p>
                <p className="text-sm font-medium text-gray-700 mb-6 text-center bg-white/60 py-2 px-4 rounded-lg inline-block">
                    Contract Owner: <span className="font-mono text-blue-700">{ownerAddress}</span>
                </p>

                <div className="space-y-6">
                    {/* Set Minting Fee */}
                    <div className="bg-white/95 p-6 rounded-2xl shadow-xl border-2 border-blue-300/50 backdrop-blur-sm hover:shadow-2xl hover:scale-[1.02] transition-all duration-300">
                        <h3 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent mb-4 flex items-center gap-2">
                            <icons.DollarSign className="w-6 h-6 text-blue-600" /> Set Minting Fee
                        </h3>
                        <div className="flex flex-col sm:flex-row gap-4 mb-3">
                            <select 
                                value={newMintingFeeAssetType} 
                                onChange={(e) => setNewMintingFeeAssetType(e.target.value)}
                                className="flex-1 px-4 py-3 bg-white border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 hover:border-blue-400"
                            >
                                <option value="Silver">Silver</option>
                                <option value="Gold">Gold</option>
                            </select>
                            <input 
                                type="number" 
                                step="any" 
                                placeholder="New Fee (ETH)" 
                                value={newMintingFeeValue} 
                                onChange={(e) => setNewMintingFeeValue(e.target.value)}
                                className="flex-1 px-4 py-3 bg-white border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 hover:border-blue-400"
                            />
                        </div>
                        <button 
                            onClick={handleSetMintingFee} 
                            disabled={adminIsLoading || !newMintingFeeValue || isNaN(parseFloat(newMintingFeeValue))}
                            className="w-full px-6 py-3 rounded-xl text-white font-bold bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 hover:shadow-[0_0_25px_rgba(59,130,246,0.5)] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {adminIsLoading && adminActionStatus.includes('fee') ? <div className="spinner !border-l-white !w-4 !h-4"></div> : null}
                            Set Fee
                        </button>
                    </div>

                    {/* Add Validator */}
                    <div className="bg-white/95 p-6 rounded-2xl shadow-xl border-2 border-green-300/50 backdrop-blur-sm hover:shadow-2xl hover:scale-[1.02] transition-all duration-300">
                        <h3 className="text-2xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent mb-4 flex items-center gap-2">
                            <icons.UserCheck className="w-6 h-6 text-green-600" /> Add Validator
                        </h3>
                        <input 
                            type="text" 
                            placeholder="Validator Address (e.g., 0x...)" 
                            value={newValidatorAddress} 
                            onChange={(e) => setNewValidatorAddress(e.target.value)}
                            className="w-full px-4 py-2 bg-gray-100 border border-gray-300 rounded-md mb-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        />
                        <button 
                            onClick={handleAddValidator} 
                            disabled={adminIsLoading || !window.ethers.isAddress(newValidatorAddress)}
                            className="w-full px-6 py-3 rounded-xl text-white font-bold bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 hover:shadow-[0_0_25px_rgba(16,185,129,0.5)] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {adminIsLoading && adminActionStatus.includes('Adding validator') ? <div className="spinner !border-l-white !w-4 !h-4"></div> : null}
                            Add Validator
                        </button>
                    </div>

                    {/* Remove Validator */}
                    <div className="bg-white/95 p-6 rounded-2xl shadow-xl border-2 border-red-300/50 backdrop-blur-sm hover:shadow-2xl hover:scale-[1.02] transition-all duration-300">
                        <h3 className="text-2xl font-bold bg-gradient-to-r from-red-600 to-pink-600 bg-clip-text text-transparent mb-4 flex items-center gap-2">
                            <icons.XCircle className="w-6 h-6 text-red-600" /> Remove Validator
                        </h3>
                        <input 
                            type="text" 
                            placeholder="Validator Address to Remove" 
                            value={removeValidatorAddress} 
                            onChange={(e) => setRemoveValidatorAddress(e.target.value)}
                            className="w-full px-4 py-3 bg-white border-2 border-gray-300 rounded-xl mb-4 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all duration-200 hover:border-red-400"
                        />
                        <button 
                            onClick={handleRemoveValidator} 
                            disabled={adminIsLoading || !window.ethers.isAddress(removeValidatorAddress)}
                            className="w-full px-6 py-3 rounded-xl text-white font-bold bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 hover:shadow-[0_0_25px_rgba(239,68,68,0.5)] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {adminIsLoading && adminActionStatus.includes('Removing validator') ? <div className="spinner !border-l-white !w-4 !h-4"></div> : null}
                            Remove Validator
                        </button>
                    </div>

                    {/* Update Project Wallet Address */}
                    <div className="bg-white/95 p-6 rounded-2xl shadow-xl border-2 border-yellow-300/50 backdrop-blur-sm hover:shadow-2xl hover:scale-[1.02] transition-all duration-300">
                        <h3 className="text-2xl font-bold bg-gradient-to-r from-yellow-600 to-orange-600 bg-clip-text text-transparent mb-4 flex items-center gap-2">
                            <icons.Wallet className="w-6 h-6 text-yellow-600" /> Update Project Wallet
                        </h3>
                        <input 
                            type="text" 
                            placeholder="New Project Wallet Address" 
                            value={newProjectWalletAddress} 
                            onChange={(e) => setNewProjectWalletAddress(e.target.value)}
                            className="w-full px-4 py-3 bg-white border-2 border-gray-300 rounded-xl mb-4 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-all duration-200 hover:border-yellow-400"
                        />
                        <button 
                            onClick={handleUpdateProjectWalletAddress} 
                            disabled={adminIsLoading || !window.ethers.isAddress(newProjectWalletAddress)}
                            className="w-full px-6 py-3 rounded-xl text-white font-bold bg-gradient-to-r from-yellow-500 to-orange-600 hover:from-yellow-600 hover:to-orange-700 hover:shadow-[0_0_25px_rgba(245,158,11,0.5)] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {adminIsLoading && adminActionStatus.includes('Updating project wallet') ? <div className="spinner !border-l-white !w-4 !h-4"></div> : null}
                            Update Project Wallet
                        </button>
                    </div>
                </div>

                {/* Admin Action Status Message */}
                {adminActionStatus && (
                    <div className={`mt-6 p-5 rounded-2xl text-center font-semibold flex items-center gap-3 justify-center shadow-xl backdrop-blur-sm border-2
                                      ${adminActionStatus.includes('Error') || adminActionStatus.includes('Failed') 
                                        ? 'bg-gradient-to-r from-red-500/20 to-pink-500/20 text-red-700 border-red-400/50' 
                                        : 'bg-gradient-to-r from-blue-500/20 to-cyan-500/20 text-blue-700 border-blue-400/50'}`}>
                        <div className={`p-2 rounded-lg ${adminActionStatus.includes('Error') || adminActionStatus.includes('Failed') ? 'bg-red-500' : 'bg-blue-500'}`}>
                            {adminActionStatus.includes('Error') || adminActionStatus.includes('Failed') ? <icons.XCircle className="w-5 h-5 text-white"/> : <icons.CheckCircle className="w-5 h-5 text-white"/>}
                        </div>
                        <p className="text-base">{adminActionStatus}</p>
                    </div>
                )}
            </div>
        </section>
    );
}

export default AdminDashboard;
