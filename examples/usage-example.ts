// examples/usage-example.ts
// Usage example for One Universal Identity (OUI) system

import { ethers } from 'ethers';
// Note: Import ABIs and contract addresses as needed

async function exampleIdentityRegistration() {
  // Connect to Ethereum provider
  const provider = new ethers.JsonRpcProvider('https://mainnet.infura.io/v3/YOUR_INFURA_KEY');
  const signer = new ethers.Wallet('YOUR_PRIVATE_KEY', provider);

  // OUI Identity contract address and ABI (placeholder)
  const ouiAddress = '0x...';
  const ouiABI = []; // ABI array

  const ouiContract = new ethers.Contract(ouiAddress, ouiABI, signer);

  // Generate DID hash
  const didString = 'did:ethr:0x1234...';
  const didHash = ethers.keccak256(ethers.toUtf8Bytes(didString));

  // Register identity
  const tx = await ouiContract.createIdentity(didHash);
  await tx.wait();

  console.log('Identity registered successfully');
}

async function exampleUVTIssuance() {
  const ouiContract = new ethers.Contract(ouiAddress, ouiABI, signer);

  // Issue UVT for KYC credential
  const credentialId = ethers.keccak256(ethers.toUtf8Bytes("kyc-verified"));
  const expiresAt = Math.floor(Date.now() / 1000) + 365 * 24 * 60 * 60; // 1 year

  const tokenId = await ouiContract.issueUVT(credentialId, expiresAt);
  console.log(`UVT issued: ${tokenId}`);
}

async function exampleAssetWatermarking() {
  // Asset Watermark contract
  const watermarkAddress = '0x...';
  const watermarkABI = [];

  const watermarkContract = new ethers.Contract(watermarkAddress, watermarkABI, signer);

  // Watermark an image
  const assetId = ethers.keccak256(ethers.toUtf8Bytes("image.jpg"));
  const metadataHash = ethers.keccak256(ethers.toUtf8Bytes("EXIF metadata"));
  const ouiDid = ethers.keccak256(ethers.toUtf8Bytes("user-did"));

  await watermarkContract.watermarkAsset(assetId, ouiDid, "image", metadataHash);
  console.log('Asset watermarked successfully');
}

async function exampleDAOProposal() {
  // DAO contract
  const daoAddress = '0x...';
  const daoABI = [];

  const daoContract = new ethers.Contract(daoAddress, daoABI, signer);

  // Create proposal for system upgrade
  const duration = 7 * 24 * 60 * 60; // 7 days
  const proposalId = await daoContract.createProposal("Upgrade to AI v2", duration);
  console.log(`Proposal created: ${proposalId}`);

  // Vote on proposal
  await daoContract.vote(proposalId);
  console.log('Voted on proposal');
}

// Run examples
async function main() {
  try {
    await exampleIdentityRegistration();
    await exampleUVTIssuance();
    await exampleAssetWatermarking();
    await exampleDAOProposal();
  } catch (error) {
    console.error('Error in example:', error);
  }
}

main();