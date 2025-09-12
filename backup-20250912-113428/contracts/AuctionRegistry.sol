// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title AuctionRegistry
 * @dev Registry contract to track all sealed auctions
 */
contract AuctionRegistry {
    struct AuctionInfo {
        address contractAddress;
        address creator;
        string name;
        string description;
        uint256 createdAt;
        uint256 endTime;
        bool isActive;
        uint256 bidCount;
    }
    
    // Array to store all auctions
    AuctionInfo[] public auctions;
    
    // Mapping from contract address to auction index
    mapping(address => uint256) public auctionIndex;
    
    // Mapping to check if contract is registered
    mapping(address => bool) public isRegistered;
    
    // Events
    event AuctionRegistered(
        address indexed contractAddress,
        address indexed creator,
        string name,
        uint256 createdAt
    );
    
    event AuctionUpdated(
        address indexed contractAddress,
        uint256 bidCount,
        bool isActive
    );
    
    /**
     * @dev Register a new auction
     * @param contractAddress The address of the SealedAuction contract
     * @param name The name of the auction
     * @param description The description of the auction
     * @param endTime The end time of the auction
     */
    function registerAuction(
        address contractAddress,
        string memory name,
        string memory description,
        uint256 endTime
    ) external {
        require(contractAddress != address(0), "Invalid contract address");
        require(!isRegistered[contractAddress], "Auction already registered");
        require(endTime > block.timestamp, "Invalid end time");
        
        AuctionInfo memory newAuction = AuctionInfo({
            contractAddress: contractAddress,
            creator: msg.sender,
            name: name,
            description: description,
            createdAt: block.timestamp,
            endTime: endTime,
            isActive: true,
            bidCount: 0
        });
        
        auctions.push(newAuction);
        auctionIndex[contractAddress] = auctions.length - 1;
        isRegistered[contractAddress] = true;
        
        emit AuctionRegistered(contractAddress, msg.sender, name, block.timestamp);
    }
    
    /**
     * @dev Register a new auction with specific creator (for Factory)
     * @param contractAddress The address of the SealedAuction contract
     * @param creator The actual creator of the auction
     * @param name The name of the auction
     * @param description The description of the auction
     * @param endTime The end time of the auction
     */
    function registerAuctionWithCreator(
        address contractAddress,
        address creator,
        string memory name,
        string memory description,
        uint256 endTime
    ) external {
        require(contractAddress != address(0), "Invalid contract address");
        require(creator != address(0), "Invalid creator address");
        require(!isRegistered[contractAddress], "Auction already registered");
        require(endTime > block.timestamp, "Invalid end time");
        
        AuctionInfo memory newAuction = AuctionInfo({
            contractAddress: contractAddress,
            creator: creator, // Use the provided creator address
            name: name,
            description: description,
            createdAt: block.timestamp,
            endTime: endTime,
            isActive: true,
            bidCount: 0
        });
        
        auctions.push(newAuction);
        auctionIndex[contractAddress] = auctions.length - 1;
        isRegistered[contractAddress] = true;
        
        emit AuctionRegistered(contractAddress, creator, name, block.timestamp);
    }
    
    
    /**
     * @dev Update auction information (bid count, active status)
     * @param contractAddress The address of the SealedAuction contract
     * @param bidCount The current bid count
     * @param isActive Whether the auction is still active
     */
    function updateAuction(
        address contractAddress,
        uint256 bidCount,
        bool isActive
    ) external {
        require(isRegistered[contractAddress], "Auction not registered");
        
        uint256 index = auctionIndex[contractAddress];
        auctions[index].bidCount = bidCount;
        auctions[index].isActive = isActive;
        
        emit AuctionUpdated(contractAddress, bidCount, isActive);
    }
    
    /**
     * @dev Get all auctions
     * @return Array of all auction information
     */
    function getAllAuctions() external view returns (AuctionInfo[] memory) {
        return auctions;
    }
    
    /**
     * @dev Get active auctions only
     * @return Array of active auction information
     */
    function getActiveAuctions() external view returns (AuctionInfo[] memory) {
        uint256 activeCount = 0;
        
        // Count active auctions
        for (uint256 i = 0; i < auctions.length; i++) {
            if (auctions[i].isActive && auctions[i].endTime > block.timestamp) {
                activeCount++;
            }
        }
        
        // Create array for active auctions
        AuctionInfo[] memory activeAuctions = new AuctionInfo[](activeCount);
        uint256 currentIndex = 0;
        
        // Fill active auctions array
        for (uint256 i = 0; i < auctions.length; i++) {
            if (auctions[i].isActive && auctions[i].endTime > block.timestamp) {
                activeAuctions[currentIndex] = auctions[i];
                currentIndex++;
            }
        }
        
        return activeAuctions;
    }
    
    /**
     * @dev Get auctions by creator
     * @param creator The address of the creator
     * @return Array of auction information created by the creator
     */
    function getAuctionsByCreator(address creator) external view returns (AuctionInfo[] memory) {
        uint256 creatorCount = 0;
        
        // Count auctions by creator
        for (uint256 i = 0; i < auctions.length; i++) {
            if (auctions[i].creator == creator) {
                creatorCount++;
            }
        }
        
        // Create array for creator's auctions
        AuctionInfo[] memory creatorAuctions = new AuctionInfo[](creatorCount);
        uint256 currentIndex = 0;
        
        // Fill creator's auctions array
        for (uint256 i = 0; i < auctions.length; i++) {
            if (auctions[i].creator == creator) {
                creatorAuctions[currentIndex] = auctions[i];
                currentIndex++;
            }
        }
        
        return creatorAuctions;
    }
    
    /**
     * @dev Get total number of auctions
     * @return Total count of registered auctions
     */
    function getTotalAuctions() external view returns (uint256) {
        return auctions.length;
    }
    
    /**
     * @dev Get auction by contract address
     * @param contractAddress The address of the SealedAuction contract
     * @return Auction information
     */
    function getAuctionByAddress(address contractAddress) external view returns (AuctionInfo memory) {
        require(isRegistered[contractAddress], "Auction not registered");
        return auctions[auctionIndex[contractAddress]];
    }
}
