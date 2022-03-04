import { ethers } from 'hardhat'

const INITIAL_SUPPLY = 100000000;
export async function setupMocks(contractName: string): Promise<any>
{
  let activeNetwork = await ethers.providers.getDefaultProvider().getNetwork();
  if(activeNetwork.name === "homestead") {
    let mock = await ethers.getContractFactory(contractName);
    let mockContract = await mock.deploy(INITIAL_SUPPLY);
    await mockContract.deployed();
    console.log(contractName + " deployed: " + mockContract.address);
    return mockContract;
  }
  return null;
}