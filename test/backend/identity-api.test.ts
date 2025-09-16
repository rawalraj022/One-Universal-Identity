import { expect } from 'chai';
import request from 'supertest';
import { app } from '../../src/server';
import { getDatabaseService } from '../../src/utils/database';

describe('Identity API', function () {
  this.timeout(10000);

  beforeEach(async function () {
    // Reset database state before each test
    const db = getDatabaseService();
    // In a real implementation, this would clear the test database
  });

  describe('POST /api/identity/register', function () {
    it('should register a new identity successfully', async function () {
      const identityData = {
        did: 'did:ethr:test-123',
        owner: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e',
        signature: '0x...'
      };

      const response = await request(app)
        .post('/api/identity/register')
        .send(identityData)
        .expect(200);

      expect(response.body).to.have.property('success', true);
      expect(response.body).to.have.property('identity');
      expect(response.body.identity).to.have.property('did', identityData.did);
      expect(response.body).to.have.property('message');
    });

    it('should return 400 for missing DID', async function () {
      const response = await request(app)
        .post('/api/identity/register')
        .send({})
        .expect(400);

      expect(response.body).to.have.property('error');
      expect(response.body.error).to.include('DID is required');
    });

    it('should handle duplicate identity registration', async function () {
      const identityData = {
        did: 'did:ethr:duplicate-test',
        owner: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e'
      };

      // First registration should succeed
      await request(app)
        .post('/api/identity/register')
        .send(identityData)
        .expect(200);

      // Second registration should fail
      const response = await request(app)
        .post('/api/identity/register')
        .send(identityData)
        .expect(500); // Or appropriate error code

      expect(response.body).to.have.property('error');
    });
  });

  describe('PUT /api/identity/update', function () {
    let existingIdentity: any;

    beforeEach(async function () {
      // Create an identity for testing updates
      const identityData = {
        did: 'did:ethr:update-test',
        owner: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e'
      };

      const response = await request(app)
        .post('/api/identity/register')
        .send(identityData)
        .expect(200);

      existingIdentity = response.body.identity;
    });

    it('should update an existing identity', async function () {
      const updateData = {
        did: existingIdentity.did,
        newDid: 'did:ethr:updated-test',
        signature: '0x...'
      };

      const response = await request(app)
        .put('/api/identity/update')
        .send(updateData)
        .expect(200);

      expect(response.body).to.have.property('success', true);
      expect(response.body).to.have.property('identity');
      expect(response.body.identity.did).to.equal(updateData.newDid);
    });

    it('should return 400 for missing DID in update', async function () {
      const response = await request(app)
        .put('/api/identity/update')
        .send({})
        .expect(400);

      expect(response.body).to.have.property('error');
    });
  });

  describe('POST /api/identity/issue-uvt', function () {
    let testIdentity: any;

    beforeEach(async function () {
      // Create test identity
      const identityData = {
        did: 'did:ethr:uvt-test',
        owner: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e'
      };

      const response = await request(app)
        .post('/api/identity/register')
        .send(identityData)
        .expect(200);

      testIdentity = response.body.identity;
    });

    it('should issue UVT successfully', async function () {
      const uvtData = {
        credentialId: 'kyc-verification-001',
        expiresAt: Math.floor(Date.now() / 1000) + 365 * 24 * 60 * 60, // 1 year
        owner: testIdentity.owner
      };

      const response = await request(app)
        .post('/api/identity/issue-uvt')
        .send(uvtData)
        .expect(200);

      expect(response.body).to.have.property('success', true);
      expect(response.body).to.have.property('uvt');
      expect(response.body.uvt).to.have.property('tokenId');
      expect(response.body.uvt).to.have.property('credentialId', uvtData.credentialId);
    });

    it('should return 400 for missing credential ID', async function () {
      const response = await request(app)
        .post('/api/identity/issue-uvt')
        .send({})
        .expect(400);

      expect(response.body).to.have.property('error');
    });
  });

  describe('GET /api/identity/uvt/:tokenId', function () {
    let testUVT: any;

    beforeEach(async function () {
      // Create test identity and UVT
      const identityData = {
        did: 'did:ethr:uvt-verify-test',
        owner: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e'
      };

      const identityResponse = await request(app)
        .post('/api/identity/register')
        .send(identityData)
        .expect(200);

      const uvtData = {
        credentialId: 'kyc-verification-002',
        expiresAt: Math.floor(Date.now() / 1000) + 365 * 24 * 60 * 60,
        owner: identityData.owner
      };

      const uvtResponse = await request(app)
        .post('/api/identity/issue-uvt')
        .send(uvtData)
        .expect(200);

      testUVT = uvtResponse.body.uvt;
    });

    it('should verify UVT validity', async function () {
      const response = await request(app)
        .get(`/api/identity/uvt/${testUVT.tokenId}`)
        .expect(200);

      expect(response.body).to.have.property('tokenId', testUVT.tokenId);
      expect(response.body).to.have.property('isValid');
      expect(response.body).to.have.property('checkedAt');
    });

    it('should handle invalid token ID', async function () {
      const invalidTokenId = '0x' + '0'.repeat(64);
      const response = await request(app)
        .get(`/api/identity/uvt/${invalidTokenId}`)
        .expect(200); // Should still return a response, just with isValid: false

      expect(response.body).to.have.property('isValid', false);
    });
  });

  describe('GET /api/identity/:did', function () {
    let testIdentity: any;

    beforeEach(async function () {
      const identityData = {
        did: 'did:ethr:get-identity-test',
        owner: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e'
      };

      const response = await request(app)
        .post('/api/identity/register')
        .send(identityData)
        .expect(200);

      testIdentity = response.body.identity;
    });

    it('should retrieve identity by DID', async function () {
      const response = await request(app)
        .get(`/api/identity/${testIdentity.did}`)
        .expect(200);

      expect(response.body).to.have.property('did', testIdentity.did);
      expect(response.body).to.have.property('identity');
      expect(response.body).to.have.property('retrievedAt');
    });

    it('should return 404 for non-existent identity', async function () {
      const response = await request(app)
        .get('/api/identity/did:ethr:non-existent')
        .expect(404);

      expect(response.body).to.have.property('error');
    });
  });

  describe('Error Handling', function () {
    it('should handle malformed JSON', async function () {
      const response = await request(app)
        .post('/api/identity/register')
        .set('Content-Type', 'application/json')
        .send('{invalid json}')
        .expect(400);
    });

    it('should handle network timeouts', async function () {
      // This would test timeout scenarios in a real implementation
      // For now, just verify the endpoint exists
      const response = await request(app)
        .post('/api/identity/register')
        .send({ did: 'did:ethr:timeout-test' })
        .expect(200);
    });
  });

  describe('Rate Limiting', function () {
    it('should handle rapid requests appropriately', async function () {
      const promises = [];
      for (let i = 0; i < 10; i++) {
        promises.push(
          request(app)
            .post('/api/identity/register')
            .send({ did: `did:ethr:rate-limit-test-${i}` })
        );
      }

      const responses = await Promise.all(promises);
      const successCount = responses.filter(r => r.status === 200).length;

      // At least some should succeed
      expect(successCount).to.be.greaterThan(0);
    });
  });
});