// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20; // Specifies the Solidity compiler version

import "@openzeppelin/contracts/token/ERC721/ERC721.sol"; // Imports the ERC721 standard
import "@openzeppelin/contracts/access/Ownable.sol";    // Corrected import: .jsol changed to .sol
import "@openzeppelin/contracts/utils/Counters.sol";   // Imports the Counters library for safe ID management
import "@openzeppelin/contracts/utils/Strings.sol";    // Imports the Strings library for uint256 to string conversion

/**
 * @title DopulNFT
 * @dev Deploys an ERC721 NFT contract for the Dopul project, representing real-world assets like gold and silver.
 * This contract adds NFT status management, validator voting functionality,
 * transfers minting fees to a project wallet address, and provides DPMS rewards to minters with risk control.
 */
contract DopulNFT is ERC721, Ownable { // Contract name changed to DopulNFT
    // Uses OpenZeppelin's Counters library for safe management of Token IDs
    using Counters for Counters.Counter;
    // Uses OpenZeppelin's Strings library for uint256 to string conversion (if needed)
    using Strings for uint256;

    // Counter for tracking ERC721 Token IDs
    Counters.Counter private _tokenIds; 

    // NFT statuses, initially Pending
    enum NFTStatus { Pending, Approved, Rejected }
    // Validator votes: None (not voted), Yes (approve), No (reject)
    enum Vote { None, Yes, No } 

    // Struct: Defines all data contained within an NFT
    struct NFTData {
        address creator;         // Address of the NFT creator
        string name;             // Name of the NFT (e.g., "24K Gold Bar")
        string assetType;        // Type of asset (e.g., "Gold", "Silver", "Ruby")
        uint256 assetYear;       // Year of the asset (e.g., 2023)
        string assetCountry;     // Country of origin for the asset
        string creatorCountry;   // Country of the creator
        uint256 weightGrams;     // Weight in grams, scaled by 10000 for fixed-point representation (original_weight * 10000)
        string assetName;        // Specific name of the asset (e.g., "Canada Maple Leaf")
        uint256 purityPercentage; // Purity percentage, scaled by 1000 for fixed-point representation (original_purity * 1000)
        uint256 quantity;        // Quantity (default is 1)
        bool isFungible;         // Whether the asset is fungible (True/False)
        string issuer;           // Issuer of the asset (e.g., "Royal Mint")
        string metadataURI;      // URI pointing to the metadata JSON on IPFS
        NFTStatus status;        // New NFT status field
    }

    // Maps Token ID to its corresponding NFTData struct
    mapping(uint256 => NFTData) public nfts;

    // Validator management
    mapping(address => bool) public isValidator; // Maps address to boolean indicating if it's a validator
    address[] public validators;                 // List of validator addresses (for iteration)
    uint256 public constant MAX_VALIDATORS = 5;  // Maximum number of validators allowed (fixed at 5)

    // Validator voting details for each NFT
    mapping(uint256 => mapping(address => Vote)) public nftValidatorVotes;      // Token ID => Validator address => Vote (Yes/No)
    mapping(uint256 => mapping(address => string)) public nftValidatorComments; // Token ID => Validator address => Comment for 'No' votes
    mapping(uint256 => uint256) public yesVotesCount;                             // Token ID => Count of 'Yes' votes
    mapping(uint256 => uint256) public noVotesCount;                              // Token ID => Count of 'No' votes

    // Minting fee configuration (per asset type)
    mapping(string => uint256) public mintingFees; // Asset type => Fee (in Wei)

    // Project wallet address, now a mutable state variable
    address public projectWalletAddress; 

    // Minter DPMS reward constants
    // DPMS rewards are per unit of asset, assuming DPMS is a token without decimals for simplicity in calculation
    uint256 public constant DPMS_GOLD_PER_GRAM = 180;        // 180 DPMS for 1 gram of Gold
    uint256 public constant DPMS_SILVER_PER_TROY_OZ = 69;    // 69 DPMS for 1 Troy Oz of Silver

    // Conversion constant: 1 Troy Oz is 31.1034 grams. Scaled by 10000 to match _weightGrams unit.
    // So, 1 Troy Oz in the `_weightGrams` unit (grams * 10000) is 311034.
    uint256 public constant TROY_OZ_TO_GRAMS_SCALED = 311034; 

    // Maximum DPMS reward limit per single minting operation (risk control)
    // This is an example value; adjust as per project requirements
    uint256 public constant MAX_DPMS_REWARD_PER_MINT = 10000; // Example: Max 10,000 DPMS per mint

    // Tracks cumulative DPMS balance for each address (for future airdrops)
    mapping(address => uint256) public dpmsBalances; 

    // DPMS bonus amounts for Validators (for reference only, contract doesn't directly handle distribution, frontend will display these)
    uint256 public constant DPMS_BONUS_V1 = 30; 
    uint256 public constant DPMS_BONUS_V2 = 20;
    uint256 public constant DPMS_BONUS_V3 = 15;
    uint256 public constant DPMS_BONUS_V4 = 10;
    uint256 public constant DPMS_BONUS_V5 = 10;

    // Event definitions for off-chain monitoring of contract activities
    event NFTMinted(uint256 indexed tokenId, address indexed creator, string name, string assetType, NFTStatus status);
    event ValidatorAdded(address indexed validatorAddress);
    event ValidatorRemoved(address indexed validatorAddress);
    event NFTStatusUpdated(uint256 indexed tokenId, NFTStatus newStatus);
    event VoteSubmitted(uint256 indexed tokenId, address indexed validator, Vote vote, string comment);
    event MintingFeeUpdated(string indexed assetType, uint256 newFee);
    event ProjectWalletAddressUpdated(address indexed oldAddress, address indexed newAddress); // New event
    event DPMSRewardIssued(address indexed recipient, uint256 amount, string assetType, uint256 weight); // New DPMS reward event

    /**
     * @dev Contract constructor. Initializes the ERC721 contract, sets the owner, and default project wallet address.
     * @param initialOwner Address of the initial owner of the contract.
     */
    constructor(address initialOwner) 
        ERC721("DopulNFT", "DOPUL") // Contract name and symbol changed to DopulNFT and DOPUL
        Ownable(initialOwner) 
    {
        // Sets the default project wallet address
        projectWalletAddress = 0xE9c1521D469e669F69a99d4cA825D6b123bAc2a8;

        // Sets some default minting fees (can be updated later by the owner)
        mintingFees["Gold"] = 0.01 ether;   // Example: Gold minting fee is 0.01 ETH
        mintingFees["Silver"] = 0.005 ether; // Example: Silver minting fee is 0.005 ETH
        mintingFees["Ruby"] = 0.002 ether;   // Example: Ruby minting fee is 0.002 ETH
        // Add other asset types and their default fees here if needed
    }

    // --- Owner-only functions ---

    /**
     * @dev Adds a validator address.
     * @param _validator Address of the validator to be added.
     */
    function addValidator(address _validator) public onlyOwner {
        require(_validator != address(0), "Validator address cannot be zero."); 
        require(!isValidator[_validator], "Validator is already added.");      
        require(validators.length < MAX_VALIDATORS, "Maximum number of validators reached."); 

        isValidator[_validator] = true;
        validators.push(_validator); // Adds the validator to the list
        emit ValidatorAdded(_validator); // Emits ValidatorAdded event
    }

    /**
     * @dev Removes a validator address.
     * @param _validator Address of the validator to be removed.
     */
    function removeValidator(address _validator) public onlyOwner {
        require(_validator != address(0), "Validator address cannot be zero."); 
        require(isValidator[_validator], "Validator is not found.");          

        isValidator[_validator] = false;
        // Finds and removes the address from the validators list
        // This is an optimized way to remove an array element, avoiding expensive element shifts, but it does disrupt order.
        // For a list of validators, order is usually not critical.
        for (uint i = 0; i < validators.length; i++) {
            if (validators[i] == _validator) {
                // Swaps the last element with the current position, then removes the last element to keep array compact
                validators[i] = validators[validators.length - 1];
                validators.pop();
                break;
            }
        }
        emit ValidatorRemoved(_validator); // Emits ValidatorRemoved event
    }

    /**
     * @dev Updates the minting fee for a specific asset type.
     * @param _assetType Asset type for which to update the fee.
     * @param _newFee New minting fee (in Wei).
     */
    function updateMintingFee(string memory _assetType, uint256 _newFee) public onlyOwner {
        require(bytes(_assetType).length > 0, "Asset type cannot be empty."); 
        mintingFees[_assetType] = _newFee; // Updates the minting fee
        emit MintingFeeUpdated(_assetType, _newFee); // Emits MintingFeeUpdated event
    }

    /**
     * @dev Updates the project wallet address. Only the contract owner can call this function.
     * @param _newAddress The new project wallet address.
     */
    function setProjectWalletAddress(address _newAddress) public onlyOwner {
        require(_newAddress != address(0), "New project wallet address cannot be zero."); 
        require(_newAddress != projectWalletAddress, "New project wallet address cannot be the same as the current one."); 
        
        address oldAddress = projectWalletAddress;
        projectWalletAddress = _newAddress; // Updates the project wallet address
        emit ProjectWalletAddressUpdated(oldAddress, _newAddress); // Emits ProjectWalletAddressUpdated event
    }

    // --- NFT Minting function ---

    /**
     * @dev Mints a new NFT.
     * This function is payable, meaning it can receive ETH.
     * @param _to Receiver address of the NFT.
     * @param _name Name of the NFT.
     * @param _assetType Type of asset.
     * @param _assetYear Year of the asset.
     * @param _assetCountry Country of origin for the asset.
     * @param _creatorCountry Country of the creator.
     * @param _weightGrams Weight in grams, scaled by 10000 (fixed-point).
     * @param _assetName Specific name of the asset.
     * @param _purityPercentage Purity percentage, scaled by 1000 (fixed-point).
     * @param _quantity Quantity.
     * @param _isFungible Whether the asset is fungible (True/False).
     * @param _issuer Issuer of the asset.
     * @param _metadataURI IPFS URI pointing to the NFT metadata.
     */
    function mintNFT(
        address _to,
        string memory _name,
        string memory _assetType,
        uint256 _assetYear,
        string memory _assetCountry,
        string memory _creatorCountry,
        uint256 _weightGrams, // Fixed-point: original_weight * 10000
        string memory _assetName,
        uint256 _purityPercentage, // Fixed-point: original_purity * 1000
        uint256 _quantity,
        bool _isFungible,
        string memory _issuer,
        string memory _metadataURI // IPFS URI
    ) public payable { // Function is marked as payable to receive ETH
        require(_to != address(0), "Mint to the zero address.");        
        require(bytes(_name).length > 0, "Name cannot be empty.");      
        require(bytes(_assetType).length > 0, "Asset type cannot be empty."); 
        require(_assetYear > 0, "Asset year must be valid.");          
        require(_weightGrams > 0, "Weight must be greater than zero."); 
        require(_purityPercentage > 0, "Purity must be greater than zero."); 
        require(_quantity > 0, "Quantity must be greater than zero."); 
        require(bytes(_issuer).length > 0, "Issuer cannot be empty."); 
        require(bytes(_metadataURI).length > 0, "Metadata URI cannot be empty."); 

        uint256 requiredFee = mintingFees[_assetType]; // Gets the required minting fee
        require(msg.value >= requiredFee, "Insufficient minting fee."); // Checks if enough ETH was sent

        // Transfers the minting fee to the project wallet address
        // Using call function for safety, recommended for ETH transfers to external addresses
        (bool success, ) = payable(projectWalletAddress).call{value: requiredFee}("");
        require(success, "Failed to transfer minting fee to project wallet."); 

        // If the user sent more ETH than required, refunds the surplus to the caller
        if (msg.value > requiredFee) {
            (success, ) = payable(msg.sender).call{value: msg.value - requiredFee}("");
            require(success, "Failed to refund surplus ETH."); 
        }

        _tokenIds.increment();
        uint256 newItemId = _tokenIds.current(); // Gets the new Token ID

        // Calculates and issues DPMS rewards to the minter
        uint256 calculatedDPMSReward = 0; 
        if (keccak256(abi.encodePacked(_assetType)) == keccak256(abi.encodePacked("Gold"))) {
            // For Gold: DPMS = (total_weight_in_grams * 180 DPMS/gram)
            // _weightGrams is grams * 10000, so divide by 10000 to get actual grams
            calculatedDPMSReward = (_weightGrams * DPMS_GOLD_PER_GRAM) / 10000;
        } else if (keccak256(abi.encodePacked(_assetType)) == keccak256(abi.encodePacked("Silver"))) {
            // For Silver: DPMS = (total_weight_in_grams / 31.1034 grams/troy_oz) * 69 DPMS/troy_oz
            // Since _weightGrams is scaled by 10000, and TROY_OZ_TO_GRAMS_SCALED is also scaled by 10000,
            // they can be directly used in division.
            calculatedDPMSReward = (_weightGrams * DPMS_SILVER_PER_TROY_OZ) / TROY_OZ_TO_GRAMS_SCALED;
        }
        // Add additional conditions here for other asset types if DPMS rewards are applicable

        // Implements risk control: caps the calculated DPMS reward to a maximum value
        uint256 actualDPMSReward = calculatedDPMSReward > MAX_DPMS_REWARD_PER_MINT ? MAX_DPMS_REWARD_PER_MINT : calculatedDPMSReward;

        if (actualDPMSReward > 0) {
            dpmsBalances[msg.sender] += actualDPMSReward; // Accumulates DPMS in the minter's wallet
            emit DPMSRewardIssued(msg.sender, actualDPMSReward, _assetType, _weightGrams); // Emits DPMS reward event
        }

        // Stores NFT data
        nfts[newItemId] = NFTData({
            creator: msg.sender,
            name: _name,
            assetType: _assetType,
            assetYear: _assetYear,
            assetCountry: _assetCountry,
            creatorCountry: _creatorCountry,
            weightGrams: _weightGrams,
            assetName: _assetName,
            purityPercentage: _purityPercentage,
            quantity: _quantity,
            isFungible: _isFungible,
            issuer: _issuer,
            metadataURI: _metadataURI, // metadataURI is stored here
            status: NFTStatus.Pending // Initial status is set to Pending
        });

        _mint(_to, newItemId); // Mints the ERC721 Token
        emit NFTMinted(newItemId, msg.sender, _name, _assetType, NFTStatus.Pending); // Emits NFTMinted event
    }

    // --- Validator Voting function ---

    /**
     * @dev Allows a validator to submit a vote for an NFT.
     * @param _tokenId Token ID of the NFT to vote on.
     * @param _vote Type of vote (Yes or No).
     * @param _comment Comment if the vote is 'No'; can be empty otherwise.
     */
    function submitVote(uint256 _tokenId, Vote _vote, string memory _comment) public {
        require(isValidator[msg.sender], "Only validators can submit votes."); 
        require(_tokenId > 0 && _tokenId <= _tokenIds.current(), "Invalid tokenId."); 
        require(nfts[_tokenId].status == NFTStatus.Pending, "NFT status is not pending."); 
        require(nftValidatorVotes[_tokenId][msg.sender] == Vote.None, "Validator has already voted for this NFT."); 
        require(_vote != Vote.None, "Vote cannot be None."); 

        nftValidatorVotes[_tokenId][msg.sender] = _vote; // Records the validator's vote

        if (_vote == Vote.Yes) {
            yesVotesCount[_tokenId]++; // Increments Yes vote count
            nftValidatorComments[_tokenId][msg.sender] = ""; // Clears comment if vote is Yes
        } else if (_vote == Vote.No) {
            noVotesCount[_tokenId]++;  // Increments No vote count
            nftValidatorComments[_tokenId][msg.sender] = _comment; // Stores comment for No vote
        }
        emit VoteSubmitted(_tokenId, msg.sender, _vote, _comment); // Emits VoteSubmitted event

        // Checks if enough validators have voted to determine the final status (at least 3 validators)
        // Assumes at least 3 registered validators participate in voting to trigger status update
        // If the total number of registered validators is less than 3, this condition might never be met.
        if (yesVotesCount[_tokenId] + noVotesCount[_tokenId] >= 3) {
            _updateNFTStatus(_tokenId); // Updates NFT status
        }
    }

    /**
     * @dev Internal function: Updates the NFT's status based on voting results.
     * This function is automatically called when sufficient votes are received.
     * @param _tokenId Token ID of the NFT whose status needs to be updated.
     */
    function _updateNFTStatus(uint256 _tokenId) internal {
        // Only proceed if the current status is Pending, to avoid reprocessing
        if (nfts[_tokenId].status != NFTStatus.Pending) return;

        // Calculates the total number of votes cast so far
        uint256 totalVotes = yesVotesCount[_tokenId] + noVotesCount[_tokenId];
        
        // Ensures at least 3 validators have voted before finalizing the status
        if (totalVotes < 3) return; // Not enough votes, status remains Pending

        NFTStatus newStatus;
        // Determines final status based on majority votes
        if (yesVotesCount[_tokenId] > noVotesCount[_tokenId]) {
            newStatus = NFTStatus.Approved; // If Yes votes > No votes, status is Approved
        } else if (noVotesCount[_tokenId] > yesVotesCount[_tokenId]) {
            newStatus = NFTStatus.Rejected; // If No votes > Yes votes, status is Rejected
        } else {
            // If Yes and No votes are equal (e.g., 2 Yes, 2 No), no clear majority, status remains Pending
            return; 
        }
        
        nfts[_tokenId].status = newStatus; // Updates NFT status
        emit NFTStatusUpdated(_tokenId, newStatus); // Emits NFTStatusUpdated event
    }

    // --- View functions (read data) ---

    /**
     * @dev Retrieves all detailed information for a specific NFT.
     * @param _tokenId NFT's Token ID.
     * @return NFTData A struct containing all NFT data.
     */
    function getNFTDetails(uint256 _tokenId) public view returns (NFTData memory) {
        require(_tokenId > 0 && _tokenId <= _tokenIds.current(), "Invalid tokenId."); 
        return nfts[_tokenId];
    }

    /**
     * @dev Retrieves the URI for a token.
     * Overrides ERC721's _baseURI and tokenURI to correctly return the stored metadataURI.
     * @param tokenId The ID of the token.
     * @return The URI for the token.
     */
    function tokenURI(uint256 tokenId) public view virtual override returns (string memory) {
        _requireOwned(tokenId); // Inherited from ERC721, checks if the token exists and is valid.
        return nfts[tokenId].metadataURI; // Directly return the stored metadataURI
    }

    /**
     * @dev Retrieves the vote and comment of a specific validator for a given NFT.
     * @param _tokenId NFT's Token ID.
     * @param _validator Validator's address.
     * @return voteType The vote type (Vote).
     * @return comment The comment string.
     */
    function getValidatorVote(uint256 _tokenId, address _validator) public view returns (Vote voteType, string memory comment) {
        require(_tokenId > 0 && _tokenId <= _tokenIds.current(), "Invalid tokenId."); 
        require(isValidator[_validator], "Address is not a validator."); 
        return (nftValidatorVotes[_tokenId][_validator], nftValidatorComments[_tokenId][_validator]);
    }

    /**
     * @dev Retrieves the total Yes and No vote counts for a specific NFT.
     * @param _tokenId NFT's Token ID.
     * @return yes The count of Yes votes.
     * @return no The count of No votes.
     */
    function getTotalVotes(uint256 _tokenId) public view returns (uint256 yes, uint256 no) {
        require(_tokenId > 0 && _tokenId <= _tokenIds.current(), "Invalid tokenId."); 
        return (yesVotesCount[_tokenId], noVotesCount[_tokenId]);
    }

    /**
     * @dev Retrieves a list of all registered validator addresses.
     * @return An array containing all validator addresses.
     */
    function getAllValidators() public view returns (address[] memory) {
        return validators;
    }

    /**
     * @dev Retrieves the DPMS balance for a specified address.
     * @param _account The address to query.
     * @return The DPMS balance of the specified address.
     */
    function getDPMSTokenBalance(address _account) public view returns (uint256) {
        return dpmsBalances[_account];
    }

    /**
     * @dev Retrieves the total number of NFTs currently minted.
     * @return The current value of the Token ID counter.
     */
    function totalSupply() public view returns (uint256) { // Removed 'override' keyword
        return _tokenIds.current();
    }
}