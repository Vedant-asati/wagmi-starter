// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC721/utils/ERC721Holder.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

import "./CryptoCanvasToken.sol";

/// @title NFT Marketplace
/// @notice This contract allows users to list and buy NFTs in an auction format.
contract NFTMarketplace is ERC721Holder, Ownable {
    struct Listing {
        address seller;
        address buyer;
        address arbiter;
        uint256 price; // in wei
        uint256 listingTime; // time of listing
        uint256 auctionWindow; // time up to which the trade is open
        bool sold;
    }

    Listing[] public listings;

    // Mappings
    mapping(address => mapping(uint256 => Listing))
        public address_TokenId_ListingMap;

    // Event Logs
    /// @notice Emitted when an NFT is listed for sale
    /// @param NFTContract The address of the NFT contract
    /// @param tokenId The ID of the token listed
    /// @param seller The address of the seller
    /// @param price The listing price of the NFT
    event NFTListed(
        address indexed NFTContract,
        uint256 indexed tokenId,
        address indexed seller,
        uint256 price
    );

    /// @notice Emitted when a new offer is made
    /// @param buyer The address of the buyer
    /// @param price The offered price
    event NewOffer(
        address indexed NFTContract,
        uint256 indexed tokenId,
        address indexed buyer,
        uint256 price
    );

    /// @notice Emitted when an NFT buy request is made
    event NFTBuyRequest(
        address indexed NFTContract,
        uint256 indexed tokenId,
        address indexed buyer,
        uint256 price
    );

    /// @notice Emitted when a listing is cancelled
    event ListingCancelled(
        address indexed NFTContract,
        uint256 indexed tokenId
    );

    // Modifiers
    modifier onlyAdmin(address NFTContract, uint256 tokenId) {
        Listing memory listing = address_TokenId_ListingMap[NFTContract][
            tokenId
        ];
        require(
            msg.sender == listing.seller || msg.sender == listing.arbiter,
            "Access denied"
        );
        _;
    }

    modifier OnlyItemOwner(address NFTContract, uint256 tokenId) {
        require(
            CryptoCanvasToken(NFTContract).ownerOf(tokenId) == msg.sender,
            "Sender does not own the item"
        );
        _;
    }

    modifier HasTransferApproval(address NFTContract, uint256 tokenId) {
        require(
            CryptoCanvasToken(NFTContract).getApproved(tokenId) ==
                address(this),
            "Market is not approved"
        );
        _;
    }

    modifier IsForSale(address NFTContract, uint256 tokenId) {
        require(
            !address_TokenId_ListingMap[NFTContract][tokenId].sold,
            "Item is already sold"
        );
        _;
    }

    modifier IsNew(address NFTContract, uint256 tokenId) {
        require(
            address_TokenId_ListingMap[NFTContract][tokenId].seller ==
                address(0),
            "Item is already listed"
        );
        _;
    }

    /// @notice Constructor to set the owner of the contract
    constructor() Ownable(msg.sender) {}

    /// @notice Lists an NFT for sale
    /// @param NFTContract The address of the NFT contract
    /// @param tokenId The ID of the token to be listed
    /// @param price The listing price of the NFT
    /// @param _arbiter The address of the arbiter
    /// @param _auctionWindow The time window for the auction
    function listNFT(
        address NFTContract,
        uint256 tokenId,
        uint256 price,
        address _arbiter,
        uint256 _auctionWindow
    )
        external
        IsNew(NFTContract, tokenId)
        OnlyItemOwner(NFTContract, tokenId)
        HasTransferApproval(NFTContract, tokenId)
    {
        require(price > 0, "Price must be greater than zero");
        CryptoCanvasToken newToken = CryptoCanvasToken(NFTContract);

        address_TokenId_ListingMap[NFTContract][tokenId] = Listing({
            seller: msg.sender,
            buyer: address(0),
            arbiter: _arbiter,
            price: price,
            listingTime: block.timestamp,
            auctionWindow: _auctionWindow,
            sold: false
        });

        newToken.safeTransferFrom(msg.sender, address(this), tokenId);

        emit NFTListed(NFTContract, tokenId, msg.sender, price);
    }

    /// @notice Allows a user to make an offer to buy an NFT
    /// @param NFTContract The address of the NFT contract
    /// @param tokenId The ID of the token to be bought
    function offerToBuy(
        address NFTContract,
        uint256 tokenId
    ) external payable IsForSale(NFTContract, tokenId) {
        Listing memory listing = address_TokenId_ListingMap[NFTContract][
            tokenId
        ];
        require(listing.price > 0, "NFT is not listed for sale");
        require(msg.value >= listing.price, "Insufficient funds..");
        require(listing.sold == false, "NFT Already sold out...");

        // Can be bought only until the sale is running
        require(
            block.timestamp <= listing.auctionWindow,
            "Ohho! you just got little late..."
        );

        address_TokenId_ListingMap[NFTContract][tokenId].sold = true;
        address_TokenId_ListingMap[NFTContract][tokenId].buyer = msg.sender; // no NFT transfer here

        payable(listing.seller).transfer((listing.price * 9) / 10);
        payable(this.owner()).transfer((listing.price) / 10);

        emit NFTBuyRequest(NFTContract, tokenId, msg.sender, listing.price);
    }

    /// @notice Allows the buyer to claim the NFT after the auction window ends
    /// @param NFTContract The address of the NFT contract
    /// @param tokenId The ID of the token to be claimed
    function claimNFT(address NFTContract, uint256 tokenId) external payable {
        Listing memory listing = address_TokenId_ListingMap[NFTContract][
            tokenId
        ];
        require(listing.price > 0, "NFT is not listed for sale");
        require(
            listing.sold == false || listing.buyer == msg.sender,
            "NFT Already sold out..."
        );

        // Can be claimed only after the auction window
        require(
            block.timestamp > listing.auctionWindow,
            "Come back after sometime to claim your NFT..."
        );

        CryptoCanvasToken(NFTContract).safeTransferFrom(
            address(this),
            msg.sender,
            tokenId
        );
        emit NFTBuyRequest(NFTContract, tokenId, msg.sender, listing.price);
    }

    /// @notice Allows the seller or arbiter to cancel a listing
    /// @param NFTContract The address of the NFT contract
    /// @param tokenId The ID of the token to be cancelled
    function cancelListing(
        address NFTContract,
        uint256 tokenId
    ) external payable onlyAdmin(NFTContract, tokenId) {
        Listing memory listing = address_TokenId_ListingMap[NFTContract][
            tokenId
        ];

        require(msg.value >= listing.price, "Insufficient funds to cancel..");
        require(
            block.timestamp <= listing.auctionWindow,
            "Ohho! you just got little late. NFT trades can't be reverted back now."
        );
        require(
            listing.buyer != address(0),
            "You can't cancel tokens that arent listed."
        );

        payable(listing.buyer).transfer(listing.price);

        CryptoCanvasToken(NFTContract).safeTransferFrom(
            address(this),
            address_TokenId_ListingMap[NFTContract][tokenId].seller,
            tokenId
        );
        delete address_TokenId_ListingMap[NFTContract][tokenId];

        emit ListingCancelled(NFTContract, tokenId);
    }

    /// @notice Allows the owner to withdraw funds
    function withdrawFunds() external onlyOwner {
        payable(owner()).transfer(address(this).balance);
    }

    receive() external payable {}

    fallback() external payable {}
}
