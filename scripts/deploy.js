// scripts/deploy.js
async function main () {
  // We get the contract to deploy
  const AtlantisToken = await ethers.getContractFactory('AtlantisToken');
  console.log('Deploying AtlantisToken...');
  const atlantisToken = await AtlantisToken.deploy(100000000);
  await atlantisToken.deployed();
  console.log('Atlantis token deployed to:', atlantisToken.address);
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });