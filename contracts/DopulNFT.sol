// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";

contract DopulNFT is ERC721, Ownable {
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIdCounter;
    using Strings for uint256;
    using SafeMath for uint256;

    // NFT 結構體，存儲 NFT 的詳細信息 (移除 validatorVotes)
    struct NFTMetadata {
        string name;
        string assetType;
        uint256 assetYear;
        string assetCountry;
        string creatorCountry;
        uint256 weightGrams;      // 重量 (克) * 100，例如 100.05 克存儲為 10005
        string assetName;
        uint256 purityPercentage; // 純度 * 1000，例如 99.999% 存儲為 99999
        uint256 quantity;
        bool isFungible;
        string[] imageURIs;
        address creatorId;
        uint8 trueVotes;
        uint8 falseVotes;
        NFTStatus status;
    }

    // NFT 狀態枚舉
    enum NFTStatus {
        Pending,
        True,
        False
    }

    address[] public validators;
    uint8 public constant NUM_VALIDATORS = 5;
    uint8 public requiredApprovals = 3;

    // 將 validatorVotes 移到頂層
    mapping(uint256 => mapping(address => bool)) public validatorVotes;
    mapping(address => uint256) public dpmsBalances;
    uint256 public silverDpmsRewardPerOz = 69;
    uint256 public goldDpmsRewardPerGram = 180;
    uint256 public validatorDpmsReward = 50;
    mapping(string => mapping(uint256 => uint256)) public mintingFees;
    mapping(uint256 => NFTMetadata) public nftMetadata;

    event NFTMinted(uint256 tokenId, address creator, string name);
    event NFTValidated(uint256 tokenId, address validator, bool vote);
    event NFTStatusUpdated(uint256 tokenId, NFTStatus newStatus);
    event DpmsRewarded(address user, uint256 amount);
    event ValidatorAdded(address validator);
    event ValidatorRemoved(address validator);
    event RequiredApprovalsUpdated(uint8 newRequiredApprovals);

    constructor() ERC721("DopulNFT", "DOP") Ownable(msg.sender) {
        mintingFees["Silver"][1] = 2;
        mintingFees["Gold"][1] = 6;
    }

    function tokenURI(uint256 tokenId) public view virtual override returns (string memory) {
        require(_exists(tokenId), "Token does not exist");
        return string(abi.encodePacked("ipfs://your_ipfs_cid/", tokenId.toString()));
    }

    function addValidator(address _validator) public onlyOwner {
        require(validators.length < NUM_VALIDATORS, "Validator list is full");
        for (uint i = 0; i < validators.length; i++) {
            require(validators[i] != _validator, "Validator already exists");
        }
        validators.push(_validator);
        emit ValidatorAdded(_validator);
    }

    function removeValidator(address _validator) public onlyOwner {
        for (uint i = 0; i < validators.length; i++) {
            if (validators[i] == _validator) {
                validators[i] = validators[validators.length - 1];
                validators.pop();
                emit ValidatorRemoved(_validator);
                return;
            }
        }
        revert("Validator not found");
    }

    function mintNFT(
        string memory _name,
        string memory _assetType,
        uint256 _assetYear,
        string memory _assetCountry,
        string memory _creatorCountry,
        uint256 _weightGrams,      // 重量 (克) * 100
        string memory _assetName,
        uint256 _purityPercentage, // 純度 * 1000
        uint256 _quantity,
        bool _isFungible,
        string[] memory _imageURIs
    ) public payable {
        require(_imageURIs.length >= 2, "Must provide at least 2 images");

        // 添加對純度和重量的最大值限制
        require(_purityPercentage <= 100000, "Purity percentage cannot exceed 100%");
        require(_weightGrams <= 10000000, "Weight cannot exceed 100,000 grams");

        uint256 tokenId = _tokenIdCounter.current();
        _tokenIdCounter.increment();
        _safeMint(msg.sender, tokenId);

        uint256 mintingFeeUSD;
        if (keccak256(bytes(_assetType)) == keccak256(bytes("Silver"))) {
            uint256 troyOunces = _weightGrams.mul(10000).div(311034 * 100);
            mintingFeeUSD = mintingFees[_assetType][troyOunces.div(10000)];
        } else if (keccak256(bytes(_assetType)) == keccak256(bytes("Gold"))) {
            mintingFeeUSD = mintingFees[_assetType][_weightGrams / 100];
        } else {
            revert("Unsupported asset type for fee calculation");
        }

        nftMetadata[tokenId] = NFTMetadata({
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
            imageURIs: _imageURIs,
            creatorId: msg.sender,
            trueVotes: 0,
            falseVotes: 0,
            status: NFTStatus.Pending
        });

        emit NFTMinted(tokenId, msg.sender, _name);

        if (keccak256(bytes(_assetType)) == keccak256(bytes("Silver"))) {
            dpmsBalances[msg.sender] += (_weightGrams * silverDpmsRewardPerOz) / (311034 * 100);
            emit DpmsRewarded(msg.sender, (_weightGrams * silverDpmsRewardPerOz) / (311034 * 100));
        } else if (keccak256(bytes(_assetType)) == keccak256(bytes("Gold"))) {
            dpmsBalances[msg.sender] += (_weightGrams * goldDpmsRewardPerGram) / 100;
            emit DpmsRewarded(msg.sender, (_weightGrams * goldDpmsRewardPerGram) / 100);
        }
    }

    function validateNFT(uint256 _tokenId, bool _vote) public {
        bool isValidator = false;
        for (uint i = 0; i < validators.length; i++) {
            if (validators[i] == msg.sender) {
                isValidator = true;
                break;
            }
        }
        require(isValidator, "Only validators can call this function");

        NFTMetadata storage nft = nftMetadata[_tokenId];
        require(nft.status == NFTStatus.Pending, "NFT is not in Pending status");
        require(!validatorVotes[_tokenId][msg.sender], "Validator has already voted on this NFT");

        // 直接使用頂層的 validatorVotes 映射
        validatorVotes[_tokenId][msg.sender] = _vote;
        if (_vote) {
            nft.trueVotes++;
        } else {
            nft.falseVotes++;
        }

        emit NFTValidated(_tokenId, msg.sender, _vote);

        if (nft.trueVotes >= requiredApprovals && nft.status == NFTStatus.Pending) {
            nft.status = NFTStatus.True;
            emit NFTStatusUpdated(_tokenId, NFTStatus.True);
            dpmsBalances[msg.sender] += validatorDpmsReward;
            emit DpmsRewarded(msg.sender, validatorDpmsReward);
        } else if (nft.trueVotes < requiredApprovals && nft.trueVotes + nft.falseVotes == NUM_VALIDATORS && nft.status == NFTStatus.Pending) {
            nft.status = NFTStatus.False;
            emit NFTStatusUpdated(_tokenId, NFTStatus.False);
            dpmsBalances[msg.sender] += validatorDpmsReward;
            emit DpmsRewarded(msg.sender, validatorDpmsReward);
        }
    }

    function getNFTDetails(uint256 _tokenId) public view returns (NFTMetadata memory) {
        require(_exists(_tokenId), "Token does not exist");
        return nftMetadata[_tokenId];
    }

    function getNFTStatus(uint256 _tokenId) public view returns (NFTStatus) {
        require(_exists(_tokenId), "Token does not exist");
        return nftMetadata[_tokenId].status;
    }

    function getValidatorVotes(uint256 _tokenId) public view returns (address[] memory, bool[] memory) {
        require(_exists(_tokenId), "Token does not exist");
        address[] memory _validators = new address[](validators.length);
        bool[] memory _votes = new bool[](validators.length);
        for (uint i = 0; i < validators.length; i++) {
            _validators[i] = validators[i];
            _votes[i] = validatorVotes[_tokenId][validators[i]];
        }
        return (_validators, _votes);
    }

    function getDpmsBalance(address _user) public view returns (uint256) {
        return dpmsBalances[_user];
    }

    function setSilverDpmsRewardPerOz(uint256 _reward) public onlyOwner {
        silverDpmsRewardPerOz = _reward;
    }

    function setGoldDpmsRewardPerGram(uint256 _reward) public onlyOwner {
        goldDpmsRewardPerGram = _reward;
    }

    function setValidatorDpmsReward(uint256 _reward) public onlyOwner {
        validatorDpmsReward = _reward;
    }

    function setMintingFee(string memory _assetType, uint256 _quantity, uint256 _feeInUSD) public onlyOwner {
        mintingFees[_assetType][_quantity] = _feeInUSD;
    }

    function setRequiredApprovals(uint8 _requiredApprovals) public onlyOwner {
        require(_requiredApprovals > 0 && _requiredApprovals <= NUM_VALIDATORS, "Required approvals must be between 1 and number of validators");
        requiredApprovals = _requiredApprovals;
        emit RequiredApprovalsUpdated(_requiredApprovals);
    }

    function getValidators() public view returns (address[] memory) {
        return validators;
    }

    function _exists(uint256 tokenId) internal view returns (bool) {
        return _ownerOf(tokenId) != address(0);
    }
}