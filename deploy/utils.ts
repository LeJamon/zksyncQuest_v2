import { Provider, Wallet } from "zksync-ethers";
import * as hre from "hardhat";
import { Deployer } from "@matterlabs/hardhat-zksync-deploy";
import dotenv from "dotenv";
import { ethers } from "ethers";
import * as zk from "zksync-ethers";

import "@matterlabs/hardhat-zksync-node/dist/type-extensions";
import "@matterlabs/hardhat-zksync-verify/dist/src/type-extensions";

// Load env file
dotenv.config();

export const getProvider = () => {
  const rpcUrl = hre.network.config.url;
  if (!rpcUrl) throw `⛔️ RPC URL wasn't found in "${hre.network.name}"! Please add a "url" field to the network config in hardhat.config.ts`;
  
  // Initialize zkSync Provider
  const provider = new Provider(rpcUrl);

  return provider;
}

export const getWallet = (privateKey?: string) => {
  if (!privateKey) {
    // Get wallet private key from .env file
    if (!process.env.WALLET_PRIVATE_KEY) throw "⛔️ Wallet private key wasn't found in .env file!";
  }

  const provider = getProvider();
  
  // Initialize zkSync Wallet
  const wallet = new Wallet(privateKey ?? process.env.WALLET_PRIVATE_KEY!, provider);

  return wallet;
}

export const verifyEnoughBalance = async (wallet: Wallet, amount: bigint) => {
  // Check if the wallet has enough balance
  const balance = await wallet.getBalance();
  if (balance < amount) throw `⛔️ Wallet balance is too low! Required ${ethers.formatEther(amount)} ETH, but current ${wallet.address} balance is ${ethers.formatEther(balance)} ETH`;
}

/**
 * @param {string} data.contract The contract's path and name. E.g., "contracts/Greeter.sol:Greeter"
 */
export const verifyContract = async (data: {
  address: string,
  contract: string,
  constructorArguments: string,
  bytecode: string
}) => {
  const verificationRequestId: number = await hre.run("verify:verify", {
    ...data,
    noCompile: true,
  });
  return verificationRequestId;
}

type DeployContractOptions = {
  /**
   * If true, the deployment process will not print any logs
   */
  silent?: boolean
  /**
   * If true, the contract will not be verified on Block Explorer
   */
  noVerify?: boolean
  /**
   * If specified, the contract will be deployed using this wallet
   */ 
  wallet?: Wallet
}
export const deployContract = async (contractArtifactName: string, constructorArguments?: any[], options?: DeployContractOptions) => {
  const log = (message: string) => {
    if (!options?.silent) console.log(message);
  }

  log(`\nStarting deployment process of "${contractArtifactName}"...`);
  
  const wallet = options?.wallet ?? getWallet();
  const deployer = new Deployer(hre, wallet);
  const artifact = await deployer.loadArtifact(contractArtifactName).catch((error) => {
    if (error?.message?.includes(`Artifact for contract "${contractArtifactName}" not found.`)) {
      console.error(error.message);
      throw `⛔️ Please make sure you have compiled your contracts or specified the correct contract name!`;
    } else {
      throw error;
    }
  });

  // Estimate contract deployment fee
  const deploymentFee = await deployer.estimateDeployFee(artifact, constructorArguments || []);
  log(`Estimated deployment cost: ${ethers.formatEther(deploymentFee)} ETH`);

  // Check if the wallet has enough balance
  await verifyEnoughBalance(wallet, deploymentFee);

  // Deploy the contract to zkSync
  const contract = await deployer.deploy(artifact, constructorArguments);
  const address = await contract.getAddress();
  const constructorArgs = contract.interface.encodeDeploy(constructorArguments);
  const fullContractSource = `${artifact.sourceName}:${artifact.contractName}`;

  // Display contract deployment info
  log(`\n"${artifact.contractName}" was successfully deployed:`);
  log(` - Contract address: ${address}`);
  log(` - Contract source: ${fullContractSource}`);
  log(` - Encoded constructor arguments: ${constructorArgs}\n`);

  if (!options?.noVerify && hre.network.config.verifyURL) {
    log(`Requesting contract verification...`);
    await verifyContract({
      address,
      contract: fullContractSource,
      constructorArguments: constructorArgs,
      bytecode: artifact.bytecode,
    });
  }

  return contract;
}

/*export const deployBeaconProxy = async (contract_name : string) => {
const zkWallet = getWallet();
const deployer = new Deployer(hre, zkWallet);
const boxContract = await deployer.loadArtifact(contract_name);
await hre.zkUpgrades.deployBeacon(deployer.zkWallet, boxContract);
const beacon = await hre.zkUpgrades.deployBeacon(deployer.zkWallet, boxContract);
await beacon.waitForDeployment();
const box = await hre.zkUpgrades.deployBeaconProxy(deployer.zkWallet, await beacon.getAddress(), boxContract);
await box.waitForDeployment();
const fullContractSource = `${boxContract.sourceName}:${boxContract.contractName}`;
const constructorArgs = box.interface.encodeDeploy([]);
    await verifyContract({
      address : await box.getAddress(),
      contract: fullContractSource,
      constructorArguments: constructorArgs,
      bytecode: boxContract.bytecode,
    });
  }

export const upgradeContract = async (address : string,contract_name:string) => {
  const wallet =  getWallet();
  const deployer = new Deployer(hre, wallet);
  const artifact = await deployer.loadArtifact(contract_name).catch((error) => {
    if (error?.message?.includes(`Artifact for contract "${contract_name}" not found.`)) {
      console.error(error.message);
      throw `⛔️ Please make sure you have compiled your contracts or specified the correct contract name!`;
    } else {
      throw error;
    }
  });
  const boxV2Implementation = await deployer.loadArtifact(contract_name);
  await hre.zkUpgrades.upgradeBeacon(deployer.zkWallet, address, boxV2Implementation);
  console.info("Successfully upgraded beacon Box to BoxV2 on address: ", address);
}*/
/**
 * Rich wallets can be used for testing purposes.
 * Available on zkSync In-memory node and Dockerized node.
 */
export const LOCAL_RICH_WALLETS = [
  {
    address: "0x36615Cf349d7F6344891B1e7CA7C72883F5dc049",
    privateKey: "0x7726827caac94a7f9e1b160f7ea819f172f7b6f9d2a97f992c38edeab82d4110"
  },
  {
    address: "0xa61464658AfeAf65CccaaFD3a512b69A83B77618",
    privateKey: "0xac1e735be8536c6534bb4f17f06f6afc73b2b5ba84ac2cfb12f7461b20c0bbe3"
  },
  {
    address: "0x0D43eB5B8a47bA8900d84AA36656c92024e9772e",
    privateKey: "0xd293c684d884d56f8d6abd64fc76757d3664904e309a0645baf8522ab6366d9e"
  },
  {
    address: "0xA13c10C0D5bd6f79041B9835c63f91de35A15883",
    privateKey: "0x850683b40d4a740aa6e745f889a6fdc8327be76e122f5aba645a5b02d0248db8"
  },
  {
    address: "0x8002cD98Cfb563492A6fB3E7C8243b7B9Ad4cc92",
    privateKey: "0xf12e28c0eb1ef4ff90478f6805b68d63737b7f33abfa091601140805da450d93"
  },
  {
    address: "0x4F9133D1d3F50011A6859807C837bdCB31Aaab13",
    privateKey: "0xe667e57a9b8aaa6709e51ff7d093f1c5b73b63f9987e4ab4aa9a5c699e024ee8"
  },
  {
    address: "0xbd29A1B981925B94eEc5c4F1125AF02a2Ec4d1cA",
    privateKey: "0x28a574ab2de8a00364d5dd4b07c4f2f574ef7fcc2a86a197f65abaec836d1959"
  },
  {
    address: "0xedB6F5B4aab3dD95C7806Af42881FF12BE7e9daa",
    privateKey: "0x74d8b3a188f7260f67698eb44da07397a298df5427df681ef68c45b34b61f998"
  },
  {
    address: "0xe706e60ab5Dc512C36A4646D719b889F398cbBcB",
    privateKey: "0xbe79721778b48bcc679b78edac0ce48306a8578186ffcb9f2ee455ae6efeace1"
  },
  {
    address: "0xE90E12261CCb0F3F7976Ae611A29e84a6A85f424",
    privateKey: "0x3eb15da85647edd9a1159a4a13b9e7c56877c4eb33f614546d4db06a51868b1c"
  }
]


export const deployBeacon = async(contractName:string)=>{

  console.log("Deploying " + contractName + "...");
  const zkWallet = getWallet(); 
  const deployer = new Deployer(hre, zkWallet);

  const boxContract = await deployer.loadArtifact(contractName);
  const beacon = await hre.zkUpgrades.deployBeacon(deployer.zkWallet, boxContract);
  await beacon.waitForDeployment();
  console.log("Beacon deployed to:", await beacon.getAddress());

  const box = await hre.zkUpgrades.deployBeaconProxy(deployer.zkWallet, await beacon.getAddress(), boxContract, []);
  await box.waitForDeployment();
  console.log(contractName + " beacon proxy deployed to: ", await beacon.getAddress());
  box.connect(zkWallet);
  const value = await box.decimals();
  console.log("Box value is: ", value);
}

export const upgradeBeacon = async()=>{
  const zkWallet = await getWallet(); 
  const deployer = new Deployer(hre, zkWallet);

  // deploy beacon proxy
  const contractName = "Box";
  const contract = await deployer.loadArtifact(contractName);
  const beacon = await hre.zkUpgrades.deployBeacon(deployer.zkWallet, contract);
  await beacon.waitForDeployment();

  const beaconAddress = await beacon.getAddress();

  const boxBeaconProxy = await hre.zkUpgrades.deployBeaconProxy(deployer.zkWallet, beaconAddress, contract, []);
  await boxBeaconProxy.waitForDeployment();
  boxBeaconProxy.connect(zkWallet);
  const name = await boxBeaconProxy.name(); 
  const symbol = await boxBeaconProxy.symbol(); 
  const value = await boxBeaconProxy.decimals();
  console.log("name : ",name);
  console.log("symbol : ", symbol); 
  console.log("Box value is: ", value);

  //upgrade
  const boxV2Implementation = await deployer.loadArtifact("Box2");
  await hre.zkUpgrades.upgradeBeacon(deployer.zkWallet, beaconAddress, boxV2Implementation);
  console.info("Successfully upgraded beacon Box to BoxV2 on address: ", beaconAddress);

  const attachTo = new zk.ContractFactory(boxV2Implementation.abi, boxV2Implementation.bytecode, deployer.zkWallet, deployer.deploymentType);
  const upgradedBox = attachTo.attach(await boxBeaconProxy.getAddress());
  console.log("done")

  await new Promise((resolve) => setTimeout(resolve, 2000));
  const name1 = await boxBeaconProxy.name(); 
  const symbol1 = await boxBeaconProxy.symbol(); 
  const value1 = await boxBeaconProxy.decimals();
  console.log("name : ",name1);
  console.log("symbol : ", symbol1); 
  console.log("Box value is: ", value1);

}

