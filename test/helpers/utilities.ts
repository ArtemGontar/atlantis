import { BigNumber, BigNumberish, constants, Contract, ContractTransaction, Wallet } from "ethers";
import { ethers } from "hardhat"
import { MockTimeAtlantisV1Pool } from "../../typechain-types/MockTimeAtlantisV1Pool";
import { TestAtlantisV1Callee } from "../../typechain-types/TestAtlantisV1Callee";
import { TestERC20 } from "../../typechain-types/TestERC20";

export enum FeeAmount {
  LOW = 500,
  MEDIUM = 3000,
  HIGH = 10000,
}

export const getMinTick = (tickSpacing: number) => Math.ceil(-887272 / tickSpacing) * tickSpacing
export const getMaxTick = (tickSpacing: number) => Math.floor(887272 / tickSpacing) * tickSpacing
export const getMaxLiquidityPerTick = (tickSpacing: number) =>
  BigNumber.from(2)
    .pow(128)
    .sub(1)
    .div((getMaxTick(tickSpacing) - getMinTick(tickSpacing)) / tickSpacing + 1)
    
export const MaxUint128 = BigNumber.from(2).pow(128).sub(1)
export const MIN_SQRT_RATIO = BigNumber.from('4295128739')
export const MAX_SQRT_RATIO = BigNumber.from('1461446703485210103287273052203988822378723970342')

export const TICK_SPACINGS: { [amount in FeeAmount]: number } = {
  [FeeAmount.LOW]: 10,
  [FeeAmount.MEDIUM]: 60,
  [FeeAmount.HIGH]: 200,
}

export function getCreate2Address(factoryAddress: string, tokens: [string, string], feeAmount: FeeAmount, bytecode: string) {
  const constructorArgumentsEncoded = ethers.utils.defaultAbiCoder.encode(
    ['address', 'address', 'uint24'],
    [tokens[0], tokens[1], feeAmount]
  )
  const encodedConstructorArgumentsEncoded = ethers.utils.keccak256(constructorArgumentsEncoded);
  const encodedByteCode = ethers.utils.keccak256(bytecode);
  const create2Address = ethers.utils.getCreate2Address(factoryAddress, encodedConstructorArgumentsEncoded, encodedByteCode);
  return create2Address;
}

export type SwapFunction = (
  amount: BigNumberish,
  to: Wallet | string,
  sqrtPriceLimitX96?: BigNumberish
) => Promise<ContractTransaction>
export type SwapToPriceFunction = (sqrtPriceX96: BigNumberish, to: Wallet | string) => Promise<ContractTransaction>
export type FlashFunction = (
  amount0: BigNumberish,
  amount1: BigNumberish,
  to: Wallet | string,
  pay0?: BigNumberish,
  pay1?: BigNumberish
) => Promise<ContractTransaction>
export type MintFunction = (
  recipient: string,
  tickLower: BigNumberish,
  tickUpper: BigNumberish,
  liquidity: BigNumberish
) => Promise<ContractTransaction>
export interface PoolFunctions {
  swapToLowerPrice: SwapToPriceFunction
  swapToHigherPrice: SwapToPriceFunction
  swapExact0For1: SwapFunction
  swap0ForExact1: SwapFunction
  swapExact1For0: SwapFunction
  swap1ForExact0: SwapFunction
  flash: FlashFunction
  mint: MintFunction
}
export function createPoolFunctions({
  swapTarget,
  token0,
  token1,
  pool,
}: {
  swapTarget: TestAtlantisV1Callee
  token0: TestERC20
  token1: TestERC20
  pool: MockTimeAtlantisV1Pool
}): PoolFunctions {
  async function swapToSqrtPrice(
    inputToken: Contract,
    targetPrice: BigNumberish,
    to: Wallet | string
  ): Promise<ContractTransaction> {
    const method = inputToken === token0 ? swapTarget.swapToLowerSqrtPrice : swapTarget.swapToHigherSqrtPrice

    await inputToken.approve(swapTarget.address, constants.MaxUint256)

    const toAddress = typeof to === 'string' ? to : to.address

    return method(pool.address, targetPrice, toAddress)
  }

  async function swap(
    inputToken: Contract,
    [amountIn, amountOut]: [BigNumberish, BigNumberish],
    to: Wallet | string,
    sqrtPriceLimitX96?: BigNumberish
  ): Promise<ContractTransaction> {
    const exactInput = amountOut === 0

    const method =
      inputToken === token0
        ? exactInput
          ? swapTarget.swapExact0For1
          : swapTarget.swap0ForExact1
        : exactInput
        ? swapTarget.swapExact1For0
        : swapTarget.swap1ForExact0

    if (typeof sqrtPriceLimitX96 === 'undefined') {
      if (inputToken === token0) {
        sqrtPriceLimitX96 = MIN_SQRT_RATIO.add(1)
      } else {
        sqrtPriceLimitX96 = MAX_SQRT_RATIO.sub(1)
      }
    }
    await inputToken.approve(swapTarget.address, constants.MaxUint256)

    const toAddress = typeof to === 'string' ? to : to.address

    return method(pool.address, exactInput ? amountIn : amountOut, toAddress, sqrtPriceLimitX96)
  }

  const swapToLowerPrice: SwapToPriceFunction = (sqrtPriceX96, to) => {
    return swapToSqrtPrice(token0, sqrtPriceX96, to)
  }

  const swapToHigherPrice: SwapToPriceFunction = (sqrtPriceX96, to) => {
    return swapToSqrtPrice(token1, sqrtPriceX96, to)
  }

  const swapExact0For1: SwapFunction = (amount, to, sqrtPriceLimitX96) => {
    return swap(token0, [amount, 0], to, sqrtPriceLimitX96)
  }

  const swap0ForExact1: SwapFunction = (amount, to, sqrtPriceLimitX96) => {
    return swap(token0, [0, amount], to, sqrtPriceLimitX96)
  }

  const swapExact1For0: SwapFunction = (amount, to, sqrtPriceLimitX96) => {
    return swap(token1, [amount, 0], to, sqrtPriceLimitX96)
  }

  const swap1ForExact0: SwapFunction = (amount, to, sqrtPriceLimitX96) => {
    return swap(token1, [0, amount], to, sqrtPriceLimitX96)
  }

  const mint: MintFunction = async (recipient, tickLower, tickUpper, liquidity) => {
    await token0.approve(swapTarget.address, constants.MaxUint256)
    await token1.approve(swapTarget.address, constants.MaxUint256)
    return swapTarget.mint(pool.address, recipient, tickLower, tickUpper, liquidity)
  }

  const flash: FlashFunction = async (amount0, amount1, to, pay0?: BigNumberish, pay1?: BigNumberish) => {
    const fee = await pool.fee()
    if (typeof pay0 === 'undefined') {
      pay0 = BigNumber.from(amount0)
        .mul(fee)
        .add(1e6 - 1)
        .div(1e6)
        .add(amount0)
    }
    if (typeof pay1 === 'undefined') {
      pay1 = BigNumber.from(amount1)
        .mul(fee)
        .add(1e6 - 1)
        .div(1e6)
        .add(amount1)
    }
    return swapTarget.flash(pool.address, typeof to === 'string' ? to : to.address, amount0, amount1, pay0, pay1)
  }

  return {
    swapToLowerPrice,
    swapToHigherPrice,
    swapExact0For1,
    swap0ForExact1,
    swapExact1For0,
    swap1ForExact0,
    mint,
    flash,
  }
}