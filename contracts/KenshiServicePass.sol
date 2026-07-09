// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract KenshiServicePass is ERC1155, Ownable {
    struct Package {
        uint256 priceWei;
        bool active;
    }

    mapping(uint256 => Package) public packages;

    address payable public treasury;

    event ServicePassPurchased(
        address indexed buyer,
        uint256 indexed packageId,
        string briefHashOrCid,
        uint256 priceWei,
        uint256 timestamp
    );
    event PackageUpdated(uint256 indexed packageId, uint256 priceWei, bool active);
    event TreasuryUpdated(address indexed newTreasury);

    constructor(address payable _treasury) ERC1155("") Ownable(msg.sender) {
        treasury = _treasury;

        // Initialize 5 packages with prices
        packages[1] = Package(0.0001 ether, true);
        packages[2] = Package(0.0002 ether, true);
        packages[3] = Package(0.0003 ether, true);
        packages[4] = Package(0.0004 ether, true);
        packages[5] = Package(0.0005 ether, true);
    }

    function buyPass(uint256 packageId, string calldata briefHashOrCid) external payable {
        require(packageId >= 1 && packageId <= 5, "Invalid package");
        Package memory pkg = packages[packageId];
        require(pkg.active, "Package not active");
        require(msg.value >= pkg.priceWei, "Insufficient payment");

        _mint(msg.sender, packageId, 1, "");

        emit ServicePassPurchased(msg.sender, packageId, briefHashOrCid, msg.value, block.timestamp);
    }

    function setPackage(uint256 packageId, uint256 priceWei, bool active) external onlyOwner {
        require(packageId >= 1 && packageId <= 5, "Invalid package");
        packages[packageId] = Package(priceWei, active);
        emit PackageUpdated(packageId, priceWei, active);
    }

    function setTreasury(address payable newTreasury) external onlyOwner {
        require(newTreasury != address(0), "Zero address");
        treasury = newTreasury;
        emit TreasuryUpdated(newTreasury);
    }

    function withdraw() external onlyOwner {
        (bool success, ) = treasury.call{value: address(this).balance}("");
        require(success, "Withdraw failed");
    }

    function uri(uint256 tokenId) public view override returns (string memory) {
        return string(abi.encodePacked("https://questpay.kenshi.dev/metadata/", tokenId.toString(), ".json"));
    }
}
