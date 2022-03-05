import { expect } from "chai";
import { Wallet } from "ethers";
import { ethers, waffle } from "hardhat";
import { describe } from "mocha";
import { AtlantisV1Factory } from "../typechain-types/AtlantisV1Factory";
import { AtlantisV1Pool } from '../typechain-types/AtlantisV1Pool'
import { MockTimeAtlantisV1Pool } from "../typechain-types/MockTimeAtlantisV1Pool";
import { TestAtlantisV1Callee } from "../typechain-types/TestAtlantisV1Callee";
import { TestERC20 } from "../typechain-types/TestERC20";
import { poolFixture } from './helpers/fixtures'
import { createPoolFunctions, FeeAmount, FlashFunction, getMaxLiquidityPerTick, getMaxTick, getMinTick, MintFunction, SwapFunction, SwapToPriceFunction, TICK_SPACINGS } from "./helpers/utilities";

const createFixtureLoader = waffle.createFixtureLoader
type ThenArg<T> = T extends PromiseLike<infer U> ? U : T
describe('AtlantisV1Pool', async () => {
  let wallet: Wallet, other: Wallet

  let token0: TestERC20
  let token1: TestERC20
  let token2: TestERC20

  let factory: AtlantisV1Factory
  let pool: MockTimeAtlantisV1Pool

  let swapTarget: TestAtlantisV1Callee

  let swapToLowerPrice: SwapToPriceFunction
  let swapToHigherPrice: SwapToPriceFunction
  let swapExact0For1: SwapFunction
  let swap0ForExact1: SwapFunction
  let swapExact1For0: SwapFunction
  let swap1ForExact0: SwapFunction

  let feeAmount: number
  let tickSpacing: number

  let minTick: number
  let maxTick: number

  let mint: MintFunction
  let flash: FlashFunction

  let loadFixture: ReturnType<typeof createFixtureLoader>
  let createPool: ThenArg<ReturnType<typeof poolFixture>>['createPool']

  before('create fixture loader', async () => {
    ;[wallet, other] = await (ethers as any).getSigners();
    loadFixture = createFixtureLoader([wallet, other])
  })

  beforeEach('deploy fixture',async () => {
    ;({ token0, token1, token2, factory, createPool, swapTargetCallee: swapTarget } = await loadFixture(poolFixture))
    const oldCreatePool = createPool
    createPool = async (_feeAmount, _tickSpacing) => {
      const pool = await oldCreatePool(_feeAmount, _tickSpacing)
      ;({
        swapToLowerPrice,
        swapToHigherPrice,
        swapExact0For1,
        swap0ForExact1,
        swapExact1For0,
        swap1ForExact0,
        mint,
        flash,
      } = createPoolFunctions({
        token0,
        token1,
        swapTarget,
        pool,
      }))
      minTick = getMinTick(_tickSpacing)
      maxTick = getMaxTick(_tickSpacing)
      feeAmount = _feeAmount
      tickSpacing = _tickSpacing
      return pool
    }

    // default to the 30 bips pool
    pool = await createPool(FeeAmount.MEDIUM, TICK_SPACINGS[FeeAmount.MEDIUM])
  })

  it('constructor initializes immutables', async () => {
    expect(await pool.factory()).to.eq(factory.address)
    expect(await pool.token0()).to.eq(token0.address)
    expect(await pool.token1()).to.eq(token1.address)
    expect(await pool.maxLiquidityPerTick()).to.eq(getMaxLiquidityPerTick(tickSpacing))
  })
})