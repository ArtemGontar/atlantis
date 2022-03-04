import { describe } from "mocha"
import { setupMocks } from "./helpers/setupMocks"
import { ethers } from 'hardhat'

const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const ethereumWaffle = require('ethereum-waffle');
chai.use(chaiAsPromised);
chai.use(ethereumWaffle.solidity);
const { expect } = chai;

describe("LendingPool", function(){
  before(async function() {
    this.LendingPool = await ethers.getContractFactory('LendingPool');
    this.wethMock = await setupMocks("WethMock");
  })

  beforeEach(async function () {
    this.lendingPool = await this.LendingPool.deploy();
    await this.lendingPool.deployed();
  });

  it('deposit should be successful', async function () {
    // Arrange
    const amount = 1000
    let token = this.wethMock.address
    this.wethMock.approve(this.lendingPool.address, amount)

    //Act
    await this.lendingPool.deposit(token, amount);
  });

  it('deposit insufficient allowance should be failed', async function () {
    // Arrange
    const amount = 1000
    let token = this.wethMock.address
    const lp = this.lendingPool
    this.wethMock.approve(lp.address, amount - 1)

    //Act
    //Assert
    await expect(lp.deposit(token, amount)).to.be.revertedWith("ERC20: insufficient allowance")
  });

  it('deposit should be reverted with "amount must be more than 0"', async function () {
    // Arrange
    const amount = 0
    let token = this.wethMock.address
    const lp = this.lendingPool
    this.wethMock.approve(lp.address, amount)

    //Act
    //Assert
    await expect(lp.deposit(token, amount)).to.be.revertedWith("Amount must be more than 0")
  });

  it('withdraw should be successful', async function () {
    // Arrange
    const amount = 1000
    let token = this.wethMock.address
    this.wethMock.approve(this.lendingPool.address, amount)
    await this.lendingPool.deposit(token, amount);

    //Act
    await this.lendingPool.withdraw(token, amount)
    
  });

  it('withdraw should be reverted "not enough money"', async function () {
    // Arrange
    const amount = 1000
    let token = this.wethMock.address
    this.wethMock.approve(this.lendingPool.address, amount)
    await this.lendingPool.deposit(token, amount);

    //Act
    //Assert
    await expect(this.lendingPool.withdraw(token, amount + 1)).to.be.revertedWith("Not enough tokens")
  });

  it('withdraw should be reverted "staking balance is now 0"', async function () {
    // Arrange
    const amount = 1000
    let token = this.wethMock.address

    //Act
    //Assert
    await expect(this.lendingPool.withdraw(token, amount)).to.be.revertedWith("Staking balance is now 0")
  });
})