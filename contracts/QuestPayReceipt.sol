// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
import {Strings} from "@openzeppelin/contracts/utils/Strings.sol";

/// @title QuestPayReceipt
/// @notice Soulbound (non-transferable) ERC-721 "proof of purchase receipt" for Kenshi QuestPay.
/// @dev One receipt token is minted per completed order. Tokens can never be transferred,
///      approved, or re-assigned after mint — they are bound to the buyer wallet forever.
///      Minting is gated behind MINTER_ROLE so the QuestPay backend signer can issue receipts
///      while the deployer/admin retains role management.
contract QuestPayReceipt is ERC721, AccessControl {
    using Strings for uint256;

    /// @notice Role allowed to mint receipts (granted to the QuestPay backend minter).
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");

    /// @dev Incrementing token id counter. First minted token id is 1, so id 0 is reserved
    ///      as the "no receipt" sentinel returned by {receiptForOrder}.
    uint256 private _nextTokenId;

    /// @notice orderId => tokenId (0 when no receipt exists for the order).
    mapping(uint256 => uint256) public orderToToken;

    /// @notice tokenId => orderId of the order the receipt was minted for.
    mapping(uint256 => uint256) public tokenToOrder;

    /// @notice Emitted once when a receipt is minted for an order.
    event ReceiptMinted(uint256 indexed orderId, uint256 indexed tokenId, address indexed to);

    /// @notice Thrown on any attempt to transfer, approve, or set approval for a soulbound token.
    error SoulboundNonTransferable();

    /// @notice Thrown when a receipt has already been minted for the given order.
    error ReceiptAlreadyMinted(uint256 orderId);

    /// @dev Grants DEFAULT_ADMIN_ROLE and MINTER_ROLE to the deployer. The admin may later
    ///      grant MINTER_ROLE to a dedicated backend minter address and/or revoke its own.
    constructor() ERC721("QuestPay Receipt", "QPR") {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(MINTER_ROLE, msg.sender);
    }

    /// @notice Mint the receipt for `orderId` to `to`. Reverts if a receipt already exists
    ///         for that order (each order can be minted at most once).
    /// @param to The buyer wallet the soulbound receipt is bound to.
    /// @param orderId The off-chain QuestPay order identifier.
    /// @return tokenId The freshly minted, incrementing token id.
    function mintReceipt(address to, uint256 orderId)
        external
        onlyRole(MINTER_ROLE)
        returns (uint256 tokenId)
    {
        if (orderToToken[orderId] != 0) {
            revert ReceiptAlreadyMinted(orderId);
        }

        tokenId = ++_nextTokenId; // first id is 1; 0 stays reserved as the sentinel
        orderToToken[orderId] = tokenId;
        tokenToOrder[tokenId] = orderId;

        _safeMint(to, tokenId);
        emit ReceiptMinted(orderId, tokenId, to);
    }

    /// @notice Returns the receipt token id for `orderId`, or 0 if none has been minted.
    function receiptForOrder(uint256 orderId) external view returns (uint256 tokenId) {
        return orderToToken[orderId];
    }

    /// @notice Off-chain metadata endpoint for a receipt token. Reverts if the token does not exist.
    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        _requireOwned(tokenId);
        return string.concat(
            "https://kenshi-questpay.vercel.app/api/receipts/",
            tokenId.toString(),
            "/metadata"
        );
    }

    // ---------------------------------------------------------------------
    // Soulbound enforcement
    // ---------------------------------------------------------------------

    /// @dev Allow mints (from == 0) and burns (to == 0) but block every wallet-to-wallet
    ///      transfer, making the token soulbound.
    function _update(address to, uint256 tokenId, address auth)
        internal
        override
        returns (address)
    {
        address from = _ownerOf(tokenId);
        if (from != address(0) && to != address(0)) {
            revert SoulboundNonTransferable();
        }
        return super._update(to, tokenId, auth);
    }

    /// @dev Approvals are meaningless for a non-transferable token — always revert.
    function approve(address, uint256) public pure override {
        revert SoulboundNonTransferable();
    }

    /// @dev Operator approvals are meaningless for a non-transferable token — always revert.
    function setApprovalForAll(address, bool) public pure override {
        revert SoulboundNonTransferable();
    }

    // ---------------------------------------------------------------------
    // ERC165
    // ---------------------------------------------------------------------

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, AccessControl)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
