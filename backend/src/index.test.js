const request = require('supertest');
const express = require('express');
const app = require('./index');

describe('Data Ingestion API', () => {
    test('POST /ingest - valid request', async () => {
        const response = await request(app)
            .post('/ingest')
            .send({
                ids: [1, 2, 3, 4, 5],
                priority: 'HIGH'
            });
        
        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('ingestion_id');
    });

    test('POST /ingest - invalid ID range', async () => {
        const response = await request(app)
            .post('/ingest')
            .send({
                ids: [0, 1, 2],
                priority: 'HIGH'
            });
        
        expect(response.status).toBe(400);
    });

    test('POST /ingest - invalid priority', async () => {
        const response = await request(app)
            .post('/ingest')
            .send({
                ids: [1, 2, 3],
                priority: 'INVALID'
            });
        
        expect(response.status).toBe(400);
    });

    test('GET /status/:ingestionId - valid request', async () => {
        // First create an ingestion request
        const createResponse = await request(app)
            .post('/ingest')
            .send({
                ids: [1, 2, 3],
                priority: 'HIGH'
            });
        
        const ingestionId = createResponse.body.ingestion_id;

        // Then check its status
        const statusResponse = await request(app)
            .get(`/status/${ingestionId}`);
        
        expect(statusResponse.status).toBe(200);
        expect(statusResponse.body).toHaveProperty('ingestion_id', ingestionId);
        expect(statusResponse.body).toHaveProperty('status');
        expect(statusResponse.body).toHaveProperty('batches');
    });

    test('GET /status/:ingestionId - non-existent ID', async () => {
        const response = await request(app)
            .get('/status/non-existent-id');
        
        expect(response.status).toBe(404);
    });

    test('Priority ordering', async () => {
        // Create a low priority request
        const lowPriorityResponse = await request(app)
            .post('/ingest')
            .send({
                ids: [1, 2, 3],
                priority: 'LOW'
            });
        
        // Wait a bit
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Create a high priority request
        const highPriorityResponse = await request(app)
            .post('/ingest')
            .send({
                ids: [4, 5, 6],
                priority: 'HIGH'
            });

        // Check status of both requests
        const lowPriorityStatus = await request(app)
            .get(`/status/${lowPriorityResponse.body.ingestion_id}`);
        
        const highPriorityStatus = await request(app)
            .get(`/status/${highPriorityResponse.body.ingestion_id}`);

        // High priority request should be processed before low priority
        expect(highPriorityStatus.body.status).not.toBe('yet_to_start');
        expect(lowPriorityStatus.body.status).toBe('yet_to_start');
    });

    test('Batch size', async () => {
        const response = await request(app)
            .post('/ingest')
            .send({
                ids: [1, 2, 3, 4, 5, 6, 7],
                priority: 'MEDIUM'
            });
        
        const statusResponse = await request(app)
            .get(`/status/${response.body.ingestion_id}`);

        // Verify that IDs are split into batches of 3
        expect(statusResponse.body.batches.length).toBe(3);
        expect(statusResponse.body.batches[0].ids.length).toBe(3);
        expect(statusResponse.body.batches[1].ids.length).toBe(3);
        expect(statusResponse.body.batches[2].ids.length).toBe(1);
    });
}); 