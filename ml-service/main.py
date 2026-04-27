from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Optional
import uvicorn
from nlp_engine import extract_keywords, detect_intent

app = FastAPI(title="RetroFits AI ML Service")

class QueryRequest(BaseModel):
    query: str

class SearchResponse(BaseModel):
    keywords: List[str]
    category: Optional[str] = None
    original_query: str

class ChatResponse(BaseModel):
    intent: str
    response: str
    suggestion: Optional[str] = None
    keywords: Optional[List[str]] = None
    order_id: Optional[str] = None
    height: Optional[str] = None
    weight: Optional[str] = None

@app.get("/")
async def root():
    return {"status": "ok", "message": "ML Service is running"}

@app.post("/search", response_model=SearchResponse)
async def search_endpoint(request: QueryRequest):
    try:
        result = extract_keywords(request.query)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/chat", response_model=ChatResponse)
async def chat_endpoint(request: QueryRequest):
    try:
        result = detect_intent(request.query)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
