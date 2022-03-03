async function main () {
  console.log('Deploying AtlantisToken...');
  const atlantisToken = await deployContract('AtlantisToken', [100000000000000])
  console.log('Atlantis token deployed to:', atlantisToken.address);

  console.log('Deploying LendingPool...');
  const lendingPool = await deployContract('LendingPool', [])
  console.log('Lending pool deployed to:', lendingPool.address);
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });

async function deployContract(
    contractName: string,
    args: any[]
  ): Promise<any> {
    const contract = (await (await hre.ethers.getContractFactory(contractName))
      .connect((await hre.ethers.getSigners())[0])
      .deploy(...args));
      await contract.deployed();
    return contract;
  };