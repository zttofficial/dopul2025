import React, { useState, useCallback } from 'react';
import NFT_CONTRACT_ABI_ARRAY from './contracts/DopulNFT.json'; // Moved to top for import/first rule

// --- Contract ABI and Address ---
// This file should contain the full JSON array of your contract's ABI.
const NFT_CONTRACT_ABI = NFT_CONTRACT_ABI_ARRAY;
const NFT_CONTRACT_ADDRESS = '0x67ee3cd9d703917cbc1e11e4e2182eda5e9df022'; // Replace with your actual contract address

// Import Lucide icons dynamically (same as in the main app)
const icons = {
    CheckCircle: (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>,
    XCircle: (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>,
    Loader2: (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>,
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
            <div className="p-6 bg-red-50 border border-red-200 rounded-xl shadow-lg">
                <h2 className="text-2xl font-bold text-red-700 mb-4 text-center flex items-center justify-center gap-2">
                    <icons.Settings className="w-7 h-7" /> Admin Dashboard
                </h2>
                <p className="text-lg text-red-800 font-medium mb-4 text-center">
                    Welcome, Contract Owner! Manage contract settings here.
                </p>
                <p className="text-sm text-gray-600 mb-4 text-center">
                    Contract Owner: <span className="font-mono text-blue-700">{ownerAddress}</span>
                </p>

                <div className="space-y-6">
                    {/* Set Minting Fee */}
                    <div className="bg-white p-4 rounded-lg shadow-md border border-gray-200">
                        <h3 className="text-xl font-bold text-gray-800 mb-3">Set Minting Fee</h3>
                        <div className="flex flex-col sm:flex-row gap-4 mb-3">
                            <select 
                                value={newMintingFeeAssetType} 
                                onChange={(e) => setNewMintingFeeAssetType(e.target.value)}
                                className="flex-1 px-4 py-2 bg-gray-100 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
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
                                className="flex-1 px-4 py-2 bg-gray-100 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>
                        <button 
                            onClick={handleSetMintingFee} 
                            disabled={adminIsLoading || !newMintingFeeValue || isNaN(parseFloat(newMintingFeeValue))}
                            className="w-full px-4 py-2 rounded-md text-white font-semibold bg-blue-500 hover:bg-blue-600 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {adminIsLoading && adminActionStatus.includes('fee') ? <div className="spinner !border-l-white !w-4 !h-4"></div> : null}
                            Set Fee
                        </button>
                    </div>

                    {/* Add Validator */}
                    <div className="bg-white p-4 rounded-lg shadow-md border border-gray-200">
                        <h3 className="text-xl font-bold text-gray-800 mb-3">Add Validator</h3>
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
                            className="w-full px-4 py-2 rounded-md text-white font-semibold bg-green-500 hover:bg-green-600 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {adminIsLoading && adminActionStatus.includes('Adding validator') ? <div className="spinner !border-l-white !w-4 !h-4"></div> : null}
                            Add Validator
                        </button>
                    </div>

                    {/* Remove Validator */}
                    <div className="bg-white p-4 rounded-lg shadow-md border border-gray-200">
                        <h3 className="text-xl font-bold text-gray-800 mb-3">Remove Validator</h3>
                        <input 
                            type="text" 
                            placeholder="Validator Address to Remove" 
                            value={removeValidatorAddress} 
                            onChange={(e) => setRemoveValidatorAddress(e.target.value)}
                            className="w-full px-4 py-2 bg-gray-100 border border-gray-300 rounded-md mb-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        />
                        <button 
                            onClick={handleRemoveValidator} 
                            disabled={adminIsLoading || !window.ethers.isAddress(removeValidatorAddress)}
                            className="w-full px-4 py-2 rounded-md text-white font-semibold bg-red-500 hover:bg-red-600 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {adminIsLoading && adminActionStatus.includes('Removing validator') ? <div className="spinner !border-l-white !w-4 !h-4"></div> : null}
                            Remove Validator
                        </button>
                    </div>

                    {/* Update Project Wallet Address */}
                    <div className="bg-white p-4 rounded-lg shadow-md border border-gray-200">
                        <h3 className="text-xl font-bold text-gray-800 mb-3">Update Project Wallet</h3>
                        <input 
                            type="text" 
                            placeholder="New Project Wallet Address" 
                            value={newProjectWalletAddress} 
                            onChange={(e) => setNewProjectWalletAddress(e.target.value)}
                            className="w-full px-4 py-2 bg-gray-100 border border-gray-300 rounded-md mb-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        />
                        <button 
                            onClick={handleUpdateProjectWalletAddress} 
                            disabled={adminIsLoading || !window.ethers.isAddress(newProjectWalletAddress)}
                            className="w-full px-4 py-2 rounded-md text-white font-semibold bg-yellow-500 hover:bg-yellow-600 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {adminIsLoading && adminActionStatus.includes('Updating project wallet') ? <div className="spinner !border-l-white !w-4 !h-4"></div> : null}
                            Update Project Wallet
                        </button>
                    </div>
                </div>

                {/* Admin Action Status Message */}
                {adminActionStatus && (
                    <div className={`mt-6 p-4 rounded-lg text-center font-medium flex items-center gap-2 justify-center
                                      ${adminActionStatus.includes('Error') || adminActionStatus.includes('Failed') ? 'bg-red-100 text-red-700 border border-red-300' : 'bg-blue-100 text-blue-700 border border-blue-300'}`}>
                        {adminActionStatus.includes('Error') || adminActionStatus.includes('Failed') ? <icons.XCircle className="w-5 h-5"/> : <icons.CheckCircle className="w-5 h-5"/>}
                        <p>{adminActionStatus}</p>
                    </div>
                )}
            </div>
        </section>
    );
}

export default AdminDashboard;
