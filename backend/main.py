import os
import json
from typing import List, Dict, Any

import polars as pl
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from groq import AsyncGroq

# Load environment variables from .env file
load_dotenv()

# --- Initialize Groq Client ---
try:
    groq_client = AsyncGroq(api_key=os.environ["GROQ_API_KEY"])
except KeyError:
    raise RuntimeError("GROQ_API_KEY not found in .env file. Please add your Groq API key.")

# Initialize FastAPI app
app = FastAPI(
    title="CSV Query Genie API (Groq Edition)",
    description="An API that uses Groq and Polars to filter CSV data based on natural language queries.",
    version="1.2.0",
)

# CORS Middleware is still needed
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Pydantic Models ---
class QueryRequest(BaseModel):
    query: str
    data: List[Dict[str, Any]]

# --- Helper Functions (No changes needed here) ---
def apply_filters(df: pl.DataFrame, filters: List[Dict[str, Any]]) -> pl.DataFrame:
    if not filters:
        return df
    expressions = []
    for condition in filters:
        header, operator, value = condition.get("header"), condition.get("operator"), condition.get("value")
        if not all([header, operator, value is not None]): continue
        try:
            col = pl.col(header)
            if operator == '===': expressions.append(col == value)
            elif operator == '!==': expressions.append(col != value)
            elif operator == '>': expressions.append(col > value)
            elif operator == '<': expressions.append(col < value)
            elif operator == '>=': expressions.append(col >= value)
            elif operator == '<=': expressions.append(col <= value)
            elif operator == 'contains': expressions.append(col.cast(pl.Utf8).str.contains(str(value), literal=False))
            elif operator == '!contains': expressions.append(~col.cast(pl.Utf8).str.contains(str(value), literal=False))
        except Exception as e:
            print(f"Could not create filter expression for {condition}: {e}")
            continue
    if not expressions: return df
    return df.filter(pl.all_horizontal(expressions))

async def generate_filter_from_ai(query: str, headers: List[str]) -> List[Dict[str, Any]]:
    system_prompt = f"""
    You are an AI data analysis assistant. Your task is to convert a user's natural language query into a structured JSON filter based on the provided CSV headers.
    The JSON should be an array of filter objects. Each object must have 'header', 'operator', and 'value'.
    - 'header' must be one of the provided CSV Headers: {json.dumps(headers)}
    - 'operator' must be one of: '===', '!==', '>', '<', '>=', '<=', 'contains', '!contains'.
    - 'value' should be a number for numeric comparisons, otherwise a string.
    You MUST only return a JSON object with a single key "filters" that contains the array of filter objects. Do not include any extra text.
    """
    messages = [{"role": "system", "content": system_prompt}, {"role": "user", "content": query}]
    for attempt in range(3):
        try:
            chat_completion = await groq_client.chat.completions.create(
                messages=messages, model="llama3-70b-8192", temperature=0, response_format={"type": "json_object"},
            )
            response_text = chat_completion.choices[0].message.content
            if not response_text: continue
            response_data = json.loads(response_text)
            filters = response_data.get("filters", [])
            if not isinstance(filters, list): raise ValueError("The 'filters' key does not contain a list.")
            return filters
        except (json.JSONDecodeError, ValueError) as e:
            print(f"Attempt {attempt + 1}: Failed to parse AI response. Error: {e}")
            messages.extend([
                {"role": "assistant", "content": response_text},
                {"role": "user", "content": "Your previous response was not valid JSON. Please correct it."}
            ])
            if attempt == 2:
                raise HTTPException(status_code=500, detail="AI failed to generate a valid JSON filter.")
    return []

# --- API Endpoints ---

# THE FIX: The path is now just "/query". Vercel's routing handles the "/api" part.
@app.post("/query")
async def handle_query(request: QueryRequest) -> List[Dict[str, Any]]:
    if not request.data: return []
    try:
        df = pl.DataFrame(request.data)
        headers = df.columns
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid data format.")
    filters = await generate_filter_from_ai(request.query, headers)
    if not filters: return df.to_dicts()
    try:
        filtered_df = apply_filters(df, filters)
        return filtered_df.to_dicts()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to apply filters: {str(e)}")

# THE FIX: The root path is now just "/".
@app.get("/")
async def root():
    return {"message": "CSV Query Genie API is running!"}