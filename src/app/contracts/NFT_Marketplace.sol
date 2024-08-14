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
        string uri;
        uint256 tokenId;
    }

    Listing[] public listings;

    // Mappings
    mapping(address => mapping(uint256 => Listing))
        public address_TokenId_ListingMap;

    mapping(address => mapping(uint256 => string)) public address_TokenId_URI;

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
        uint256 price,
        string uri
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

    modifier IsForSale(address NFTContract, uint256 tokenId) {
        require(
            !address_TokenId_ListingMap[NFTContract][tokenId].sold,
            "Item is already sold"
        );
        _;
    }

    /// @notice Constructor to set the owner of the contract
    constructor() Ownable(msg.sender) {}

    /// @notice Lists an NFT for sale
    /// @param NFTContract The address of the NFT contract
    /// @param _tokenId The ID of the token to be listed
    /// @param price The listing price of the NFT
    /// @param _arbiter The address of the arbiter
    /// @param _auctionWindow The time window for the auction
    function listNFT(
        address NFTContract,
        uint256 _tokenId,
        uint256 price,
        address _arbiter,
        uint256 _auctionWindow,
        string calldata _uri
    )
        external
        OnlyItemOwner(NFTContract, _tokenId)
    {
        require(price > 0, "Price must be greater than zero");
        require(
            (CryptoCanvasToken(NFTContract).getApproved(_tokenId) ==
                address(this)) ||
                (CryptoCanvasToken(NFTContract).isApprovedForAll(
                    msg.sender,
                    address(this)
                ) == true),
            "MarketPlace is not approved"
        );
        address_TokenId_ListingMap[NFTContract][_tokenId].seller == address(0);

        Listing memory newListing = Listing({
            seller: msg.sender,
            buyer: address(0),
            arbiter: _arbiter,
            price: price,
            listingTime: block.timestamp,
            auctionWindow: _auctionWindow,
            sold: false,
            uri: _uri,
            tokenId:_tokenId
        });

        CryptoCanvasToken(NFTContract).safeTransferFrom(
            msg.sender,
            address(this),
            _tokenId
        );

        address_TokenId_ListingMap[NFTContract][_tokenId] = newListing;
        address_TokenId_URI[NFTContract][_tokenId] = _uri;
        // Update to array
        listings.push(newListing);

        emit NFTListed(NFTContract, _tokenId, msg.sender, price, _uri);
    }

    /// @notice Allows a user to make an offer to buy an NFT
    /// @param NFTContract The address of the NFT contract
    /// @param tokenId The ID of the token to be bought
    function offerToBuy(address NFTContract, uint256 tokenId)
        external
        payable
        IsForSale(NFTContract, tokenId)
    {
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

        payable(listing.seller).transfer((listing.price * 9) / 10);
        payable(this.owner()).transfer((listing.price) / 10);

        address_TokenId_ListingMap[NFTContract][tokenId].sold = true;
        address_TokenId_ListingMap[NFTContract][tokenId].buyer = msg.sender; // no NFT transfer here

        uint256 index = findListingIndex(NFTContract, tokenId);
        listings[index].sold = true;
        listings[index].buyer = msg.sender;

        emit NFTBuyRequest(NFTContract, tokenId, msg.sender, listing.price);
    }

    /// @notice Allows the buyer to claim the NFT after the auction window ends
    /// @param NFTContract The address of the NFT contract
    /// @param tokenId The ID of the token to be claimed
    function claimNFT(address NFTContract, uint256 tokenId) external payable {
        Listing memory listing = address_TokenId_ListingMap[NFTContract][
            tokenId
        ];
        require(listing.seller != address(0), "NFT is not listed for sale");
        require(
            listing.buyer == msg.sender,
            "You are not to eligible to claim..."
        );
        require(
            listing.sold == true,
            "Buy request not made yet..."
        );

        // Can be claimed only after the auction window ends
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
    function cancelListing(address NFTContract, uint256 tokenId)
        external
        payable
        onlyAdmin(NFTContract, tokenId)
    {
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

        uint256 index = findListingIndex(NFTContract, tokenId);
        listings[index] = listings[listings.length - 1];
        delete listings[listings.length - 1];

        delete address_TokenId_ListingMap[NFTContract][tokenId];

        payable(listing.buyer).transfer(listing.price);

        CryptoCanvasToken(NFTContract).safeTransferFrom(
            address(this),
            listing.seller,
            tokenId
        );

        emit ListingCancelled(NFTContract, tokenId);
    }

    function findListingIndex(address NFTContract, uint256 tokenId)
        public
        view
        returns (uint256)
    {
        Listing memory foundListing = address_TokenId_ListingMap[NFTContract][
            tokenId
        ];
        for (uint256 i = 0; i < listings.length; i++) {
            if (
                listings[i].listingTime == foundListing.listingTime &&
                listings[i].seller == foundListing.seller
            ) return i;
        }
        return 1e9;
    }

    function getListingsLength()
        public
        view
        returns (uint256)
    {
        return listings.length;
    }

    /// @notice Allows the owner to withdraw funds
    function withdrawFunds() external onlyOwner {
        payable(owner()).transfer(address(this).balance);
    }

    receive() external payable {}

    fallback() external payable {}
}
