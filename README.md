# Data Ingestion API System

A full-stack application for handling data ingestion requests with priority-based processing and rate limiting.

## Features

- RESTful API endpoints for data ingestion and status checking
- Priority-based processing (HIGH, MEDIUM, LOW)
- Rate limiting (1 batch per 5 seconds)
- Batch processing (3 IDs per batch)
- Real-time status updates
- Modern React frontend with Material-UI
- Comprehensive test suite

## Project Structure

```
.
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py          # FastAPI application
│   │   ├── models.py        # Data models
│   │   ├── processing.py    # Batch processing logic
│   │   └── storage.py       # In-memory storage
│   ├── requirements.txt
│   └── test_api.py         # Backend tests
└── frontend/
    ├── src/
    │   ├── components/
    │   ├── services/
    │   │   └── api.js      # API service
    │   └── App.js          # Main React component
    └── package.json
```

## Setup

### Backend

1. Create a virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

2. Install dependencies:
   ```bash
   cd backend
   pip install -r requirements.txt
   ```

3. Run the server:
   ```bash
   uvicorn app.main:app --reload
   ```

### Frontend

1. Install dependencies:
   ```bash
   cd frontend
   npm install
   ```

2. Start the development server:
   ```bash
   npm start
   ```

## API Endpoints

### POST /ingest
Submit a data ingestion request.

Request body:
```json
{
    "ids": [1, 2, 3, 4, 5],
    "priority": "HIGH"
}
```

Response:
```json
{
    "ingestion_id": "uuid"
}
```

### GET /status/{ingestion_id}
Get the status of an ingestion request.

Response:
```json
{
    "ingestion_id": "uuid",
    "status": "triggered",
    "batches": [
        {
            "batch_id": "uuid",
            "ids": [1, 2, 3],
            "status": "completed"
        },
        {
            "batch_id": "uuid",
            "ids": [4, 5],
            "status": "triggered"
        }
    ]
}
```

## Running Tests

```bash
cd backend
pytest test_api.py -v
```

## Design Choices

1. **FastAPI Backend**
   - Modern, fast web framework with built-in async support
   - Automatic API documentation
   - Type hints and validation with Pydantic

2. **React Frontend**
   - Material-UI for modern, responsive design
   - Real-time status updates with polling
   - Error handling and loading states

3. **In-memory Storage**
   - Simple implementation for demonstration
   - Can be replaced with a database in production

4. **Priority Queue**
   - Ensures high-priority requests are processed first
   - Maintains order based on creation time for same priority

5. **Rate Limiting**
   - Enforces 1 batch per 5 seconds
   - Prevents system overload

## Future Improvements

1. Add database persistence
2. Implement authentication
3. Add retry logic for failed batches
4. Add more comprehensive error handling
5. Implement WebSocket for real-time updates
6. Add monitoring and logging
7. Containerize the application
