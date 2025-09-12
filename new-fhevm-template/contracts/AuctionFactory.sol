// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "./SealedAuction.sol";
import "./AuctionRegistry.sol";

/// @title AuctionFactory
/// @notice Factory contract to create and register auctions in one transaction
contract AuctionFactory {
    AuctionRegistry public immutable registry;
    
    event AuctionCreated(
        address indexed auctionAddress,
        address indexed creator,
        string name,
        uint256 endTime
    );
    
    constructor(address _registry) {
        registry = AuctionRegistry(_registry);
    }
    
    /// @notice Create a new auction and register it in one transaction
    /// @param biddingSeconds Duration of the auction in seconds
    /// @param name Name of the auction
    /// @param description Description of the auction
    /// @param imageHash IPFS hash of the auction image (optional)
    /// @return auctionAddress Address of the created auction
    function createAuction(
        uint256 biddingSeconds,
        string memory name,
        string memory description,
        string memory imageHash
    ) external returns (address auctionAddress) {
        // Deploy new SealedAuction with the actual seller (msg.sender) and image hash
        SealedAuction auction = new SealedAuction(biddingSeconds, msg.sender, imageHash);
        auctionAddress = address(auction);
        
        // Calculate end time
        uint256 endTime = block.timestamp + biddingSeconds;
        
        // Register in Registry
        registry.registerAuction(
            auctionAddress,
            name,
            description,
            endTime
        );
        
        emit AuctionCreated(auctionAddress, msg.sender, name, endTime);
        
        return auctionAddress;
    }
}
