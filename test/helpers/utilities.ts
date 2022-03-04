import { ethers } from "hardhat"

export enum FeeAmount {
  LOW = 500,
  MEDIUM = 3000,
  HIGH = 10000,
}

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