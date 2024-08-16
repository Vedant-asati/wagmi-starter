export interface Listing {
    tokenId: number;
    price: string;
    seller: string;
    buyer: string;
    arbiter: string;
    listingTime: number;
    auctionWindow: number; // Auction Expiry time in sec
    sold: boolean;
    uri: string;
}