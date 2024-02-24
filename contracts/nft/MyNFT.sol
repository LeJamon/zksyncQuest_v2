// SPDX-License-Identifier: MIT
// Compatible with OpenZeppelin Contracts ^5.0.0
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

contract ZKPASS is ERC721 {
    constructor() ERC721("ZK Passport NFT", "ZKP") {
        _mint(address(0xc8efafb5F8cbB385b3A3fA20aC7e480F0638Aa87), 1);
    }
    string URI = "https://ipfs.io/ipfs/QmPYKeyoe4cTSbdP4J7XkV7XuM96YkgNsCaMzBLHGrpNdW"; 
    function tokenURI(uint256 tokenId) public view virtual override returns (string memory) {
         return URI; 
    }
       
}