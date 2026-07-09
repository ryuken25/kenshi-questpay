// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title KenshiServicePass
/// @notice Minimal ERC1155-style testnet receipt contract for Kenshi QuestPay.
/// @dev Purpose-built for Base Sepolia demo receipts; avoids storing full briefs on-chain.
contract KenshiServicePass {
    struct Package {
        uint256 priceWei;
        bool active;
    }

    string public name = "Kenshi QuestPay Service Pass";
    string public symbol = "KQSP";
    address public owner;
    address payable public treasury;

    mapping(uint256 => Package) public packages;
    mapping(uint256 => mapping(address => uint256)) private _balances;

    event TransferSingle(address indexed operator, address indexed from, address indexed to, uint256 id, uint256 value);
    event ServicePassPurchased(
        address indexed buyer,
        uint256 indexed packageId,
        uint256 indexed tokenId,
        uint256 pricePaid,
        string briefHashOrCid
    );
    event PackageUpdated(uint256 indexed packageId, uint256 priceWei, bool active);
    event TreasuryUpdated(address indexed treasury);
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    constructor(address payable _treasury) {
        require(_treasury != address(0), "Zero treasury");
        owner = msg.sender;
        treasury = _treasury;

        packages[1] = Package(0.0001 ether, true);
        packages[2] = Package(0.0002 ether, true);
        packages[3] = Package(0.0003 ether, true);
        packages[4] = Package(0.0004 ether, true);
        packages[5] = Package(0.0005 ether, true);

        emit OwnershipTransferred(address(0), msg.sender);
    }

    function buyPass(uint256 packageId, string calldata briefHashOrCid) external payable {
        Package memory pkg = packages[packageId];
        require(pkg.active, "Package not active");
        require(msg.value >= pkg.priceWei, "Insufficient payment");

        _balances[packageId][msg.sender] += 1;
        emit TransferSingle(msg.sender, address(0), msg.sender, packageId, 1);
        emit ServicePassPurchased(msg.sender, packageId, packageId, msg.value, briefHashOrCid);
    }

    function setPackage(uint256 packageId, uint256 priceWei, bool active) external onlyOwner {
        packages[packageId] = Package(priceWei, active);
        emit PackageUpdated(packageId, priceWei, active);
    }

    function setTreasury(address payable newTreasury) external onlyOwner {
        require(newTreasury != address(0), "Zero treasury");
        treasury = newTreasury;
        emit TreasuryUpdated(newTreasury);
    }

    function withdraw() external onlyOwner {
        (bool success, ) = treasury.call{value: address(this).balance}("");
        require(success, "Withdraw failed");
    }

    function balanceOf(address account, uint256 id) external view returns (uint256) {
        require(account != address(0), "Zero address");
        return _balances[id][account];
    }

    function uri(uint256 tokenId) public pure returns (string memory) {
        return string(abi.encodePacked("https://kenshi-questpay.vercel.app/metadata/", _toString(tokenId), ".json"));
    }

    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "Zero owner");
        emit OwnershipTransferred(owner, newOwner);
        owner = newOwner;
    }

    function _toString(uint256 value) internal pure returns (string memory) {
        if (value == 0) return "0";
        uint256 temp = value;
        uint256 digits;
        while (temp != 0) {
            digits++;
            temp /= 10;
        }
        bytes memory buffer = new bytes(digits);
        while (value != 0) {
            digits -= 1;
            buffer[digits] = bytes1(uint8(48 + uint256(value % 10)));
            value /= 10;
        }
        return string(buffer);
    }
}
