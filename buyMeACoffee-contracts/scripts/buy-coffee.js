// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// You can also run a script with `npx hardhat run <script>`. If you do that, Hardhat
// will compile your contracts, add the Hardhat Runtime Environment's members to the
// global scope, and execute the script.
const hre = require("hardhat");

async function getBalance(address) {
  const balanceBigInt = await hre.waffle.provider.getBalance(address);
  return hre.ethers.utils.formatEther(balanceBigInt);
}

async function printBalances(addresses){
  let idx = 0;
  for (const address of addresses) {
    console.log(`Address ${idx} balance: `, await getBalance(address));
    idx++;
  }
}

async function printMemos (memos) {
  for (const memo of memos) {
  const timestamp = memo.timestamp;
  const tipper = memo.name;
  const tipperAddress = memo.from;
  const message = memo.message;
  console.log(`At ${timestamp}, ${tipper} (${tipperAddress}) said: "${message}"`);
  }
}



async function main() {
  // Get example accounts.
  const [owner, tipper, tipper2, tipper3] = await hre.ethers.getSigners();

  // Get the contract to deploy & deploy.
  const BuyMeACoffee = await hre.ethers.getContractFactory("BuyMeACoffee");
  const buyMeACoffee = await BuyMeACoffee.deploy();
  await buyMeACoffee.deployed();
  console.log("BuyMeACoffee deployed to ", buyMeACoffee.address);

  // Check balances before the coffee purchase.
  const addresses = [owner.address, tipper.address, buyMeACoffee.address];
  console.log(" == start == ");
  await printBalances(addresses);
  
  // Buy the owner a few coffees.
  const tip = {value: hre.ethers.utils.parseEther("1")};
  await buyMeACoffee.connect(tipper).buyCoffee("Carolina", "You're the best!", tip);
  await buyMeACoffee.connect(tipper2).buyCoffee("Vitto", "Amazing teacher :)", tip);
  await buyMeACoffee.connect(tipper3) .buyCoffee("Kay", "I love my Proof of Knowledge NFT", tip);

  // Check balances after coffee purchase.
  console. log(" == bought coffee == ");
  await printBalances(addresses);

  // Withdraw funds.
  await buyMeACoffee.connect(owner).withdrawTips();
  
  console.log(" == withrawTips == ");
  await printBalances(addresses);
  
  
  console.log(" == memos == ");
  const memos = await buyMeACoffee.getMemos();
  printMemos(memos);
}


// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
.then(()=>process.exit(0))
.catch((error) => {
  console.error(error);
  process.exit(1)
});
