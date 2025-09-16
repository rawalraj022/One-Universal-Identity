// scripts/deploy.ts
// Smart contract deployment script for OUI

import { ethers } from "hardhat";

async function main() {
  console.log("🚀 Starting OUI Smart Contract Deployment...");

  const [deployer] = await ethers.getSigners();
  console.log("📋 Deploying contracts with account:", deployer.address);
  console.log("💰 Account balance:", (await ethers.provider.getBalance(deployer.address)).toString());

  // Deploy OUI Identity (implementation)
  console.log("\n🔨 Deploying OUIIdentity...");
  const OUIIdentity = await ethers.getContractFactory("OUIIdentity");
  const ouiIdentity = await OUIIdentity.deploy();
  await ouiIdentity.waitForDeployment();
  console.log("✅ OUIIdentity deployed to:", await ouiIdentity.getAddress());

  // Deploy OUI Identity Upgradeable (implementation)
  console.log("\n🔨 Deploying OUIIdentityUpgradeable...");
  const OUIIdentityUpgradeable = await ethers.getContractFactory("OUIIdentityUpgradeable");
  const ouiIdentityUpgradeable = await OUIIdentityUpgradeable.deploy();
  await ouiIdentityUpgradeable.waitForDeployment();
  console.log("✅ OUIIdentityUpgradeable deployed to:", await ouiIdentityUpgradeable.getAddress());

  // Deploy Proxy for upgradeable identity
  console.log("\n🔨 Deploying OUIIdentityProxy...");
  const OUIIdentityProxy = await ethers.getContractFactory("OUIIdentityProxy");
  const proxy = await OUIIdentityProxy.deploy(
    await ouiIdentityUpgradeable.getAddress(),
    deployer.address,
    "0x" // Initialization data
  );
  await proxy.waitForDeployment();
  console.log("✅ OUIIdentityProxy deployed to:", await proxy.getAddress());

  // Get proxy contract instance
  const proxyAddress = await proxy.getAddress();
  const upgradeableIdentity = OUIIdentityUpgradeable.attach(proxyAddress);

  // Initialize upgradeable contract
  console.log("\n⚙️ Initializing upgradeable identity contract...");
  const minReputation = 0;
  const maxUVTs = 10;
  await upgradeableIdentity.initialize(minReputation, maxUVTs);
  console.log("✅ Upgradeable identity initialized");

  // Deploy UVT Token
  console.log("\n🔨 Deploying UVTToken...");
  const UVTToken = await ethers.getContractFactory("UVTToken");
  const uvtToken = await UVTToken.deploy();
  await uvtToken.waitForDeployment();
  console.log("✅ UVTToken deployed to:", await uvtToken.getAddress());

  // Initialize UVT Token
  const tokenAddress = await uvtToken.getAddress();
  const uvtTokenInstance = UVTToken.attach(tokenAddress);
  const mintingFee = ethers.parseEther("0.001"); // 0.001 ETH
  const verificationReward = ethers.parseEther("0.0005"); // 0.0005 ETH
  const stakingRewardRate = 500; // 5%

  await uvtTokenInstance.initialize(
    deployer.address, // defaultAdmin
    deployer.address, // minter
    deployer.address, // pauser
    deployer.address, // upgrader
    mintingFee,
    verificationReward,
    stakingRewardRate
  );
  console.log("✅ UVT Token initialized");

  // Deploy DAO
  console.log("\n🔨 Deploying OUIDAO...");
  const OUIDAO = await ethers.getContractFactory("OUIDAO");
  const dao = await OUIDAO.deploy();
  await dao.waitForDeployment();
  console.log("✅ OUIDAO deployed to:", await dao.getAddress());

  // Deploy Advanced ZKP Verifier
  console.log("\n🔨 Deploying AdvancedZKPVerifier...");
  const AdvancedZKPVerifier = await ethers.getContractFactory("AdvancedZKPVerifier");
  const zkpVerifier = await AdvancedZKPVerifier.deploy();
  await zkpVerifier.waitForDeployment();
  console.log("✅ AdvancedZKPVerifier deployed to:", await zkpVerifier.getAddress());

  // Initialize ZKP Verifier
  const zkpAddress = await zkpVerifier.getAddress();
  const zkpInstance = AdvancedZKPVerifier.attach(zkpAddress);
  await zkpInstance.initialize();
  console.log("✅ ZKP Verifier initialized");

  // Deploy Compliance Module
  console.log("\n🔨 Deploying ComplianceModule...");
  const ComplianceModule = await ethers.getContractFactory("ComplianceModule");
  const compliance = await ComplianceModule.deploy();
  await compliance.waitForDeployment();
  console.log("✅ ComplianceModule deployed to:", await compliance.getAddress());

  // Initialize Compliance Module
  const complianceAddress = await compliance.getAddress();
  const complianceInstance = ComplianceModule.attach(complianceAddress);
  await complianceInstance.initialize(deployer.address);
  console.log("✅ Compliance Module initialized");

  // Deploy Advanced Watermark
  console.log("\n🔨 Deploying AdvancedWatermark...");
  const AdvancedWatermark = await ethers.getContractFactory("AdvancedWatermark");
  const watermark = await AdvancedWatermark.deploy();
  await watermark.waitForDeployment();
  console.log("✅ AdvancedWatermark deployed to:", await watermark.getAddress());

  // Initialize Watermark
  const watermarkAddress = await watermark.getAddress();
  const watermarkInstance = AdvancedWatermark.attach(watermarkAddress);
  await watermarkInstance.initialize(deployer.address);
  console.log("✅ Watermark contract initialized");

  // Deploy Cross-Chain Bridge
  console.log("\n🔨 Deploying CrossChainIdentityBridge...");
  const CrossChainIdentityBridge = await ethers.getContractFactory("CrossChainIdentityBridge");
  // LayerZero endpoint for the network (this would be different for each network)
  const lzEndpoint = "0x66A71Dcef29A0fFBDBE3c6a460a3B5BC225Cd675"; // Example for Ethereum
  const bridgeFee = ethers.parseEther("0.01"); // 0.01 ETH bridge fee
  const maxBridgeAmount = ethers.parseEther("100"); // Max 100 ETH
  const minBridgeAmount = ethers.parseEther("0.001"); // Min 0.001 ETH

  const bridge = await CrossChainIdentityBridge.deploy(
    lzEndpoint,
    bridgeFee,
    maxBridgeAmount,
    minBridgeAmount
  );
  await bridge.waitForDeployment();
  console.log("✅ CrossChainIdentityBridge deployed to:", await bridge.getAddress());

  // Initialize Bridge
  const bridgeAddress = await bridge.getAddress();
  const bridgeInstance = CrossChainIdentityBridge.attach(bridgeAddress);
  await bridgeInstance.initialize(deployer.address);
  console.log("✅ Cross-Chain Bridge initialized");

  // Save deployment addresses
  const deploymentInfo = {
    network: await ethers.provider.getNetwork(),
    deployer: deployer.address,
    contracts: {
      OUIIdentity: await ouiIdentity.getAddress(),
      OUIIdentityUpgradeable: await ouiIdentityUpgradeable.getAddress(),
      OUIIdentityProxy: proxyAddress,
      UVTToken: tokenAddress,
      OUIDAO: await dao.getAddress(),
      AdvancedZKPVerifier: zkpAddress,
      ComplianceModule: complianceAddress,
      AdvancedWatermark: watermarkAddress,
      CrossChainIdentityBridge: bridgeAddress
    },
    timestamp: new Date().toISOString(),
    gasUsed: {
      total: 0, // Would need to track this
      breakdown: {}
    }
  };

  // Write deployment info to file
  const fs = require('fs');
  const path = require('path');

  if (!fs.existsSync('deployments')) {
    fs.mkdirSync('deployments');
  }

  const networkName = (await ethers.provider.getNetwork()).name;
  const deploymentPath = path.join('deployments', `${networkName}.json`);

  fs.writeFileSync(
    deploymentPath,
    JSON.stringify(deploymentInfo, null, 2)
  );

  console.log("\n📄 Deployment info saved to:", deploymentPath);

  // Print summary
  console.log("\n🎉 DEPLOYMENT SUMMARY");
  console.log("======================");
  console.log(`Network: ${(await ethers.provider.getNetwork()).name}`);
  console.log(`Deployer: ${deployer.address}`);
  console.log("\n📋 Contract Addresses:");
  Object.entries(deploymentInfo.contracts).forEach(([name, address]) => {
    console.log(`  ${name}: ${address}`);
  });

  console.log("\n✅ All contracts deployed successfully!");
  console.log("🚀 Ready for frontend integration and testing!");
}

// Error handling
main().catch((error) => {
  console.error("❌ Deployment failed:", error);
  process.exitCode = 1;
});