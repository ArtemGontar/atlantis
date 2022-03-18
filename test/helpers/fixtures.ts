import { Fixture } from "ethereum-waffle";
import { BigNumber } from "ethers";
import { ethers } from "hardhat";
import { AtlantisV1Factory } from "../../typechain-types/AtlantisV1Factory";
import { TestERC20 } from "../../typechain-types/TestERC20";
import { TestAtlantisV1Callee } from "../../typechain-types/TestAtlantisV1Callee";
import { TestAtlantisV1Router } from "../../typechain-types/TestAtlantisV1Router";
import { MockTimeAtlantisV1Pool } from "../../typechain-types/MockTimeAtlantisV1Pool";
import { MockTimeAtlantisV1PoolDeployer } from "../../typechain-types/MockTimeAtlantisV1PoolDeployer";


interface FactoryFixture {
  factory: AtlantisV1Factory
}

async function factoryFixture(): Promise<FactoryFixture> {
  const factoryFactory = await ethers.getContractFactory('AtlantisV1Factory')
  const factory = (await factoryFactory.deploy()) as AtlantisV1Factory
  return { factory }
}

interface TokensFixture {
  token0: TestERC20
  token1: TestERC20
  token2: TestERC20
}

async function tokensFixture(): Promise<TokensFixture> {
  const tokenFactory = await ethers.getContractFactory('TestERC20')
  const tokenA = (await tokenFactory.deploy(BigNumber.from(2).pow(255))) as TestERC20
  const tokenB = (await tokenFactory.deploy(BigNumber.from(2).pow(255))) as TestERC20
  const tokenC = (await tokenFactory.deploy(BigNumber.from(2).pow(255))) as TestERC20

  const [token0, token1, token2] = [tokenA, tokenB, tokenC].sort((tokenA, tokenB) =>
    tokenA.address.toLowerCase() < tokenB.address.toLowerCase() ? -1 : 1
  )

  return { token0, token1, token2 }
}

type TokensAndFactoryFixture = FactoryFixture & TokensFixture

interface PoolFixture extends TokensAndFactoryFixture {
  swapTargetCallee: TestAtlantisV1Callee
  swapTargetRouter: TestAtlantisV1Router
  createPool(
    fee: number,
    tickSpacing: number,
    firstToken?: TestERC20,
    secondToken?: TestERC20
  ): Promise<MockTimeAtlantisV1Pool>
}

// Monday, October 5, 2020 9:00:00 AM GMT-05:00
export const TEST_POOL_START_TIME = 1601906400

export const poolFixture: Fixture<PoolFixture> = async function (): Promise<PoolFixture> {
  const { factory } = await factoryFixture();
  const { token0, token1, token2 } = await tokensFixture();

  const MockTimeAtlantisV1PoolDeployerFactory = await ethers.getContractFactory("MockTimeAtlantisV1PoolDeployer");
  const MockTimeAtlantisV1PoolFactory = await ethers.getContractFactory("MockTimeAtlantisV1Pool");

  const calleeContractFactory = await ethers.getContractFactory("TestAtlantisV1Callee");
  const routerContractFactory = await ethers.getContractFactory("TestAtlantisV1Router");

  const swapTargetCallee = (await calleeContractFactory.deploy()) as TestAtlantisV1Callee
  const swapTargetRouter = (await routerContractFactory.deploy()) as TestAtlantisV1Router

  return { 
    token0, token1, token2,
    factory, swapTargetCallee, swapTargetRouter,
    createPool: async (fee, tickSpacing, firstToken = token0, secondToken = token1) => {
      const mockTimePoolDeployer = (await MockTimeAtlantisV1PoolDeployerFactory.deploy() as MockTimeAtlantisV1PoolDeployer)
      const tx = await mockTimePoolDeployer.deploy(
        factory.address,
        firstToken.address,
        secondToken.address,
        fee,
        tickSpacing)

      const receipt = await tx.wait()
      const poolAddress = receipt.events?.[0].args?.pool as string
      return MockTimeAtlantisV1PoolFactory.attach(poolAddress) as MockTimeAtlantisV1Pool
    }
  }
}