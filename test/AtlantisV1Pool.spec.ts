import { expect } from "chai";
import { BigNumber, Wallet } from "ethers";
import { ethers, waffle } from "hardhat";
import { describe } from "mocha";
import { AtlantisV1Factory } from "../typechain-types/AtlantisV1Factory";
import { AtlantisV1Pool } from '../typechain-types/AtlantisV1Pool'
import { MockTimeAtlantisV1Pool } from "../typechain-types/MockTimeAtlantisV1Pool";
import { TestAtlantisV1Callee } from "../typechain-types/TestAtlantisV1Callee";
import { TestERC20 } from "../typechain-types/TestERC20";
import checkObservationEquals from "./helpers/checkObservationEquals";
import { poolFixture, TEST_POOL_START_TIME } from './helpers/fixtures'
import { createPoolFunctions, encodePriceSqrt, FeeAmount, FlashFunction, getMaxLiquidityPerTick, getMaxTick, getMinTick, MAX_SQRT_RATIO, MintFunction, MIN_SQRT_RATIO, SwapFunction, SwapToPriceFunction, TICK_SPACINGS } from "./helpers/utilities";

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

  describe('#initialize', () => {
    it('fails if already initialized', async () => {
      await pool.initialize(encodePriceSqrt(1, 1))
      await expect(pool.initialize(encodePriceSqrt(1, 1))).to.be.reverted
    })
    it('fails if starting price is too low', async () => {
      await expect(pool.initialize(1)).to.be.revertedWith('R')
      await expect(pool.initialize(MIN_SQRT_RATIO.sub(1))).to.be.revertedWith('R')
    })
    it('fails if starting price is too high', async () => {
      await expect(pool.initialize(MAX_SQRT_RATIO)).to.be.revertedWith('R')
      await expect(pool.initialize(BigNumber.from(2).pow(160).sub(1))).to.be.revertedWith('R')
    })
    it('can be initialized at MIN_SQRT_RATIO', async () => {
      await pool.initialize(MIN_SQRT_RATIO)
      expect((await pool.slot0()).tick).to.eq(getMinTick(1))
    })
    it('can be initialized at MAX_SQRT_RATIO - 1', async () => {
      await pool.initialize(MAX_SQRT_RATIO.sub(1))
      expect((await pool.slot0()).tick).to.eq(getMaxTick(1) - 1)
    })
    it('sets initial variables', async () => {
      const price = encodePriceSqrt(1, 2)
      await pool.initialize(price)

      const { sqrtPriceX96, observationIndex } = await pool.slot0()
      expect(sqrtPriceX96).to.eq(price)
      expect(observationIndex).to.eq(0)
      expect((await pool.slot0()).tick).to.eq(-6932)
    })
    it('initializes the first observations slot', async () => {
      await pool.initialize(encodePriceSqrt(1, 1))
      checkObservationEquals(await pool.observations(0), {
        secondsPerLiquidityCumulativeX128: 0,
        initialized: true,
        blockTimestamp: TEST_POOL_START_TIME,
        tickCumulative: 0,
      })
    })
    it('emits a Initialized event with the input tick', async () => {
      const sqrtPriceX96 = encodePriceSqrt(1, 2)
      await expect(pool.initialize(sqrtPriceX96)).to.emit(pool, 'Initialize').withArgs(sqrtPriceX96, -6932)
    })
  })

  describe('#increaseObservationCardinalityNext', () => {
    it('can only be called after initialize', async () => {
      await expect(pool.increaseObservationCardinalityNext(2)).to.be.revertedWith('LOK')
    })
    it('emits an event including both old and new', async () => {
      await pool.initialize(encodePriceSqrt(1, 1))
      await expect(pool.increaseObservationCardinalityNext(2))
        .to.emit(pool, 'IncreaseObservationCardinalityNext')
        .withArgs(1, 2)
    })
    it('does not emit an event for no op call', async () => {
      await pool.initialize(encodePriceSqrt(1, 1))
      await pool.increaseObservationCardinalityNext(3)
      await expect(pool.increaseObservationCardinalityNext(2)).to.not.emit(pool, 'IncreaseObservationCardinalityNext')
    })
    it('does not change cardinality next if less than current', async () => {
      await pool.initialize(encodePriceSqrt(1, 1))
      await pool.increaseObservationCardinalityNext(3)
      await pool.increaseObservationCardinalityNext(2)
      expect((await pool.slot0()).observationCardinalityNext).to.eq(3)
    })
    it('increases cardinality and cardinality next first time', async () => {
      await pool.initialize(encodePriceSqrt(1, 1))
      await pool.increaseObservationCardinalityNext(2)
      const { observationCardinality, observationCardinalityNext } = await pool.slot0()
      expect(observationCardinality).to.eq(1)
      expect(observationCardinalityNext).to.eq(2)
    })
  })

  describe('#mint', () => {
    it('fails if not initialized', async () => {
      await expect(mint(wallet.address, -tickSpacing, tickSpacing, 1)).to.be.revertedWith('LOK')
    })

    describe('after initialization', () => {
      // beforeEach('initialize the pool at price of 10:1', async () => {
      //   await pool.initialize(encodePriceSqrt(1, 10))
      //   await mint(wallet.address, minTick, maxTick, 3161)
      // })

      describe('failure cases', () => {
        it('fails if tickLower greater than tickUpper', async () => {
          // should be TLU but...hardhat
          await expect(mint(wallet.address, 1, 0, 1)).to.be.reverted
        })
        it('fails if tickLower less than min tick', async () => {
          // should be TLM but...hardhat
          await expect(mint(wallet.address, -887273, 0, 1)).to.be.reverted
        })
        it('fails if tickUpper greater than max tick', async () => {
          // should be TUM but...hardhat
          await expect(mint(wallet.address, 0, 887273, 1)).to.be.reverted
        })
        it('fails if amount exceeds the max', async () => {
          // these should fail with 'LO' but hardhat is bugged
          const maxLiquidityGross = await pool.maxLiquidityPerTick()
          await expect(mint(wallet.address, minTick + tickSpacing, maxTick - tickSpacing, maxLiquidityGross.add(1))).to
            .be.reverted
          await expect(mint(wallet.address, minTick + tickSpacing, maxTick - tickSpacing, maxLiquidityGross)).to.not.be
            .reverted
        })
        it('fails if total amount at tick exceeds the max', async () => {
          // these should fail with 'LO' but hardhat is bugged
          await mint(wallet.address, minTick + tickSpacing, maxTick - tickSpacing, 1000)

          const maxLiquidityGross = await pool.maxLiquidityPerTick()
          await expect(
            mint(wallet.address, minTick + tickSpacing, maxTick - tickSpacing, maxLiquidityGross.sub(1000).add(1))
          ).to.be.reverted
          await expect(
            mint(wallet.address, minTick + tickSpacing * 2, maxTick - tickSpacing, maxLiquidityGross.sub(1000).add(1))
          ).to.be.reverted
          await expect(
            mint(wallet.address, minTick + tickSpacing, maxTick - tickSpacing * 2, maxLiquidityGross.sub(1000).add(1))
          ).to.be.reverted
          await expect(mint(wallet.address, minTick + tickSpacing, maxTick - tickSpacing, maxLiquidityGross.sub(1000)))
            .to.not.be.reverted
        })
        it('fails if amount is 0', async () => {
          await expect(mint(wallet.address, minTick + tickSpacing, maxTick - tickSpacing, 0)).to.be.reverted
        })
      })

      describe('success cases', () => {
        it('initial balances', async () => {
          expect(await token0.balanceOf(pool.address)).to.eq(9996)
          expect(await token1.balanceOf(pool.address)).to.eq(1000)
        })
      })
    })
  })
})