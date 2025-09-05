// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { FHE, euint64, eaddress, ebool, externalEuint64 } from "@fhevm/solidity/lib/FHE.sol";
import { SepoliaConfig } from "@fhevm/solidity/config/ZamaConfig.sol";

/// @title Sealed Auction (Minimal) — fhEVM
/// @notice Keeps highest bid & winner fully encrypted during the auction.
/// @dev Uses FHE.select for confidential branching. Returns ciphertext in views.
contract SealedAuction is SepoliaConfig {
    address public immutable seller;
    uint256 public immutable endTime;
    bool    public ended;
    uint32  public bids;

    // Encrypted state
    euint64  private highestBidEnc;   // encrypted highest bid
    eaddress private winnerEnc;       // encrypted winner

    // Viewers who can call ciphertext getters after end
    mapping(address => bool) public canViewAfterEnd;

    event BidPlaced(address indexed bidder);
    event Finalized(address seller);

    modifier onlySeller() {
        require(msg.sender == seller, "not seller");
        _;
    }

    constructor(uint256 biddingSeconds) {
        seller = msg.sender;
        endTime = block.timestamp + biddingSeconds;
        canViewAfterEnd[msg.sender] = true; // seller can view by default
    }

    /// @notice Grant a viewer access to encrypted result *after* finalize.
    function grantView(address viewer) external onlySeller {
        require(ended, "not finalized");
        canViewAfterEnd[viewer] = true;
        // Allow this viewer to decrypt the final ciphertexts
        FHE.allow(highestBidEnc, viewer);
        FHE.allow(winnerEnc, viewer);
    }

    /// @notice Place an encrypted bid. Returns encrypted boolean: whether you're now leading.
    function placeBid(externalEuint64 bidCt, bytes calldata inputProof)
        external
        returns (ebool isLeading)
    {
        require(!ended && block.timestamp < endTime, "auction ended");

        // Validate & convert input into euint64
        euint64 bid = FHE.fromExternal(bidCt, inputProof);

        if (FHE.isInitialized(highestBidEnc)) {
            ebool better = FHE.lt(highestBidEnc, bid); // bid > highest?
            // Confidential branching using FHE.select
            highestBidEnc = FHE.select(better, bid, highestBidEnc);
            winnerEnc     = FHE.select(better, FHE.asEaddress(msg.sender), winnerEnc);
        } else {
            // First bid
            highestBidEnc = bid;
            winnerEnc     = FHE.asEaddress(msg.sender);
        }

        // Re-authorize updated ciphertexts for future use
        FHE.allowThis(highestBidEnc);
        FHE.allowThis(winnerEnc);

        unchecked { bids += 1; }
        emit BidPlaced(msg.sender);

        // Let bidder privately learn if they lead
        return FHE.lt(FHE.asEuint64(0), FHE.select(FHE.lt(highestBidEnc, bid), FHE.asEuint64(1), FHE.asEuint64(0)));
        // (We return ebool; in tests/UI, decrypt with fhevm.userDecryptEbool)
    }

    /// @notice End the auction. Grants seller decrypt permissions.
    function finalize() external {
        require(block.timestamp >= endTime, "not yet");
        require(!ended, "already");
        ended = true;

        // Give seller ability to decrypt final values
        FHE.allow(highestBidEnc, seller);
        FHE.allow(winnerEnc, seller);

        emit Finalized(seller);
    }

    // ====== Views (ciphertext handles) ======

    /// @notice Get encrypted highest bid (only after end & if whitelisted)
    function highestBidCipher() external view returns (euint64) {
        require(ended, "not finalized");
        require(canViewAfterEnd[msg.sender], "no view permission");
        return highestBidEnc;
    }

    /// @notice Get encrypted winner address (only after end & if whitelisted)
    function winnerCipher() external view returns (eaddress) {
        require(ended, "not finalized");
        require(canViewAfterEnd[msg.sender], "no view permission");
        return winnerEnc;
    }

    /// @notice Public, plaintext state for UI convenience
    function getState()
        external
        view
        returns (bool isBidding, bool isEnded, uint256 _endTime, uint32 _bids)
    {
        isEnded   = ended;
        isBidding = (!ended && block.timestamp < endTime);
        _endTime  = endTime;
        _bids     = bids;
    }
}
Notes - Uses FHE.fromExternal per current guides. - Confidential branching uses FHE.select (no plaintext if on ebools). - Permissions: FHE.allowThis(...) during bidding; final FHE.allow(..., viewer) after finalize & on grantView.
