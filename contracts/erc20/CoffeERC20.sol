pragma solidity ^0.8.17;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract coffe is ERC20 {
    constructor() ERC20("Best coffee in Denver", "COFFEE") {
        _mint(address(0xc8efafb5F8cbB385b3A3fA20aC7e480F0638Aa87), 2275 * 10**16);
    }

    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }

    function burn(address from, uint256 amount) external {
        _burn(from, amount);
    }

    function decimals() public view override returns (uint8) {
        return 18;
    }
}