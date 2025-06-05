const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { v4: uuidv4 } = require('uuid');

console.log('Starting server initialization...');

const app = express();
const port = process.env.PORT || 8000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

console.log('Middleware configured');

// In-memory storage
const requests = new Map();
const processingQueue = [];
let lastProcessedTime = null;

// Priority levels
const PRIORITY_LEVELS = {
    HIGH: 0,
    MEDIUM: 1,
    LOW: 2
};

// Batch status
const BatchStatus = {
    YET_TO_START: 'yet_to_start',
    TRIGGERED: 'triggered',
    COMPLETED: 'completed'
};

// Overall status
const OverallStatus = {
    YET_TO_START: 'yet_to_start',
    TRIGGERED: 'triggered',
    COMPLETED: 'completed'
};

// Process queue function
async function processQueue() {
    console.log('Queue processor started');
    while (true) {
        if (processingQueue.length > 0) {
            const now = Date.now();
            if (lastProcessedTime && now - lastProcessedTime < 5000) {
                await new Promise(resolve => setTimeout(resolve, 5000 - (now - lastProcessedTime)));
            }

            const batch = processingQueue.shift();
            const request = requests.get(batch.ingestionId);

            if (request) {
                console.log(`Processing batch ${batch.batchId} for ingestion ${batch.ingestionId}`);
                // Update batch status to triggered
                batch.status = BatchStatus.TRIGGERED;
                
                // Simulate processing each ID
                for (const id of batch.ids) {
                    await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
                }

                // Update batch status to completed
                batch.status = BatchStatus.COMPLETED;
                lastProcessedTime = Date.now();
                console.log(`Completed batch ${batch.batchId}`);
            }
        } else {
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
    }
}

// Start queue processing
processQueue().catch(err => console.error('Queue processor error:', err));

// Routes
app.post('/ingest', (req, res) => {
    console.log('Received ingest request:', req.body);
    const { ids, priority } = req.body;

    // Validate input
    if (!Array.isArray(ids) || !priority || !PRIORITY_LEVELS.hasOwnProperty(priority)) {
        console.log('Invalid input:', { ids, priority });
        return res.status(400).json({ error: 'Invalid input' });
    }

    // Validate IDs
    for (const id of ids) {
        if (!Number.isInteger(id) || id < 1 || id > 1e9 + 7) {
            console.log('Invalid ID:', id);
            return res.status(400).json({ error: 'IDs must be integers between 1 and 10^9 + 7' });
        }
    }

    const ingestionId = uuidv4();
    const batches = [];

    // Split IDs into batches of 3
    for (let i = 0; i < ids.length; i += 3) {
        const batchIds = ids.slice(i, i + 3);
        const batch = {
            batchId: uuidv4(),
            ids: batchIds,
            status: BatchStatus.YET_TO_START,
            createdAt: Date.now()
        };
        batches.push(batch);

        // Add to processing queue with priority
        processingQueue.push({
            ...batch,
            ingestionId,
            priority,
            priorityValue: PRIORITY_LEVELS[priority]
        });
    }

    // Sort queue by priority and creation time
    processingQueue.sort((a, b) => {
        if (a.priorityValue !== b.priorityValue) {
            return a.priorityValue - b.priorityValue;
        }
        return a.createdAt - b.createdAt;
    });

    // Store request
    requests.set(ingestionId, {
        ingestionId,
        ids,
        priority,
        batches,
        createdAt: Date.now()
    });

    console.log('Created ingestion request:', ingestionId);
    res.json({ ingestion_id: ingestionId });
});

app.get('/status/:ingestionId', (req, res) => {
    const { ingestionId } = req.params;
    console.log('Status request for:', ingestionId);
    
    const request = requests.get(ingestionId);

    if (!request) {
        console.log('Request not found:', ingestionId);
        return res.status(404).json({ error: 'Ingestion request not found' });
    }

    // Calculate overall status
    let status = OverallStatus.YET_TO_START;
    if (request.batches.some(batch => batch.status === BatchStatus.TRIGGERED)) {
        status = OverallStatus.TRIGGERED;
    } else if (request.batches.every(batch => batch.status === BatchStatus.COMPLETED)) {
        status = OverallStatus.COMPLETED;
    }

    console.log('Status response:', { ingestionId, status });
    res.json({
        ingestion_id: ingestionId,
        status,
        batches: request.batches
    });
});

// Welcome route for root
app.get('/', (req, res) => {
    res.send('<h2>Welcome to the Data Ingestion API!<br>Use <code>POST /ingest</code> and <code>GET /status/:ingestionId</code>.</h2>');
});

// Start server
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
    console.log('Server is ready to accept requests');
    console.log(`Click to open: http://localhost:${port}`);
}); 