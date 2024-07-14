// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

// this has been deployed to sepolia at 0xb7024ba115aa7e107877b5c397a417dd931e6e68


// Uncomment this line to use console.log
// import "hardhat/console.sol";


contract BuyMeACoffee {
    //event to emit when a Memo is created
    event NewMemo(
        address indexed from,
        uint256 timestamp,
        string name,
        string message
    );

    //Memo struct.
    struct Memo {
        address from;
        uint256 timestamp;
        string name;
        string message;
    }

    //list of all memos recieved from friends
    Memo[] memos;

    //Address of the owner of the contract
    address payable owner;

    //Constructor
    constructor() {
        owner = payable(msg.sender);
    }

    /**
     * @dev buy a coffee for the owner of the contract
     * @param _name the name of the coffee
     * @param _message a nice message from coffee buyer
     */
    function buyCoffee(
        string memory _name,
        string memory _message
    ) public payable {
        require(msg.value > 0, "Not enough ether to buy a coffee");

        memos.push(
            Memo({
                from: msg.sender,
                timestamp: block.timestamp,
                name: _name,
                message: _message
            })
        );

        emit NewMemo(msg.sender, block.timestamp, _name, _message);
    }
    
    /**
     * @dev send the entire balance stored in this contract to the owner
     */
    function withdrawTips() public {
        require(owner.send(address(this).balance));
    }

    /**
     * @dev retrieve all the memos recieved and stored in the blockchain
     */
    function getMemos() public view returns(Memo[] memory) {
        return memos;
    }
}
