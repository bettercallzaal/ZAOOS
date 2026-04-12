// contracts/ZabalConviction.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

contract ZabalConviction {
    using SafeERC20 for IERC20;

    IERC20 public zabal;

    struct Stake {
        uint256 amount;
        uint256 stakedAt;
    }

    mapping(address => Stake[]) public stakes;
    mapping(address => uint256) public totalStaked;
    mapping(address => uint256) public weightedStakeSum;
    mapping(address => uint256) public convictionAccrued;
    uint256 public totalSupplyStaked;

    event Staked(address indexed user, uint256 amount, uint256 stakeIndex, uint256 stakedAt);
    event Unstaked(address indexed user, uint256 amount, uint256 stakeIndex, uint256 stakedAt, uint256 unstakedAt);

    constructor(address _zabal) {
        zabal = IERC20(_zabal);
    }

    function stake(uint256 amount) external {
        require(amount >= 100_000_000 * 1e18, "Minimum 100M ZABAL");
        zabal.safeTransferFrom(msg.sender, address(this), amount);

        uint256 index = stakes[msg.sender].length;
        stakes[msg.sender].push(Stake(amount, block.timestamp));
        totalStaked[msg.sender] += amount;
        totalSupplyStaked += amount;
        weightedStakeSum[msg.sender] += amount * block.timestamp;

        emit Staked(msg.sender, amount, index, block.timestamp);
    }

    function unstake(uint256 stakeIndex) external {
        Stake storage s = stakes[msg.sender][stakeIndex];
        require(s.amount > 0, "No stake at index");

        uint256 conviction = s.amount * (block.timestamp - s.stakedAt);
        convictionAccrued[msg.sender] += conviction;

        uint256 amount = s.amount;
        totalStaked[msg.sender] -= amount;
        totalSupplyStaked -= amount;
        weightedStakeSum[msg.sender] -= amount * s.stakedAt;

        s.amount = 0;
        s.stakedAt = 0;

        zabal.safeTransfer(msg.sender, amount);

        emit Unstaked(msg.sender, amount, stakeIndex, s.stakedAt, block.timestamp);
    }

    function getConviction(address user) external view returns (uint256) {
        return convictionAccrued[user] + totalStaked[user] * block.timestamp - weightedStakeSum[user];
    }

    function getActiveStakes(address user) external view returns (uint256[] memory amounts, uint256[] memory timestamps) {
        Stake[] storage userStakes = stakes[user];
        uint256 count = 0;
        for (uint256 i = 0; i < userStakes.length; i++) {
            if (userStakes[i].amount > 0) count++;
        }
        amounts = new uint256[](count);
        timestamps = new uint256[](count);
        uint256 j = 0;
        for (uint256 i = 0; i < userStakes.length; i++) {
            if (userStakes[i].amount > 0) {
                amounts[j] = userStakes[i].amount;
                timestamps[j] = userStakes[i].stakedAt;
                j++;
            }
        }
    }
}
