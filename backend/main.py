import os
import json
from typing import List, Dict, Any

import pandas as pd
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
    description="An API that uses Groq to filter CSV data based on natural language queries.",
    version="1.0.0",
)

# Configure CORS
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

# --- Helper Functions ---
def apply_filters(df: pd.DataFrame, filters: List[Dict[str, Any]]) -> pd.DataFrame:
    if not filters:
        return df
    filtered_df = df.copy()
    for condition in filters:
        header, operator, value = condition.get("header"), condition.get("operator"), condition.get("value")
        if not all([header, operator, value is not None]):
            continue
        try:
            if header not in filtered_df.columns:
                print(f"Warning: Header '{header}' from filter not in DataFrame. Skipping.")
                continue

            if operator == '===':
                condition_series = filtered_df[header] == value
            elif operator == '!==':
                condition_series = filtered_df[header] != value
            elif operator == '>':
                condition_series = pd.to_numeric(filtered_df[header], errors='coerce') > float(value)
            elif operator == '<':
                condition_series = pd.to_numeric(filtered_df[header], errors='coerce') < float(value)
            elif operator == '>=':
                condition_series = pd.to_numeric(filtered_df[header], errors='coerce') >= float(value)
            elif operator == '<=':
                condition_series = pd.to_numeric(filtered_df[header], errors='coerce') <= float(value)
            elif operator == 'contains':
                condition_series = filtered_df[header].astype(str).str.contains(str(value), case=False, na=False)
            elif operator == '!contains':
                condition_series = ~filtered_df[header].astype(str).str.contains(str(value), case=False, na=False)
            else:
                continue
            filtered_df = filtered_df[condition_series]
        except (KeyError, TypeError, ValueError) as e:
            print(f"Could not apply filter {condition}: {e}")
            continue
    return filtered_df

async def generate_filter_from_ai(query: str, headers: List[str]) -> List[Dict[str, Any]]:
    """
    Calls the Groq API to convert a natural language query into a structured JSON filter.
    Includes a retry mechanism to handle non-JSON responses.
    """
    system_prompt = f"""
    You are an AI data analysis assistant. Your task is to convert a user's natural language query into a structured JSON filter based on the provided CSV headers.
    The JSON should be an array of filter objects. Each object must have 'header', 'operator', and 'value'.
    - 'header' must be one of the provided CSV Headers: {json.dumps(headers)}
    - 'operator' must be one of: '===', '!==', '>', '<', '>=', '<=', 'contains', '!contains'.
    - 'value' should be a number for numeric comparisons, otherwise a string.
    If the query is ambiguous or cannot be converted, return an empty array [].
    You MUST only return a JSON object with a single key "filters" that contains the array of filter objects. Do not include any extra text, explanations, or markdown formatting like ```json.
    """
    
    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": query},
    ]

    # --- NEW: Retry loop to ensure valid JSON output ---
    for attempt in range(3): # Try up to 3 times
        try:
            chat_completion = await groq_client.chat.completions.create(
                messages=messages,
                model="openai/gpt-oss-20b",
                temperature=0,
                response_format={"type": "json_object"},
            )
            response_text = chat_completion.choices[0].message.content
            if not response_text:
                print(f"Attempt {attempt + 1}: AI returned an empty response.")
                continue

            # Attempt to parse the JSON. If it fails, the except block will catch it.
            response_data = json.loads(response_text)
            filters = response_data.get("filters", [])

            if not isinstance(filters, list):
                raise ValueError("The 'filters' key does not contain a list.")

            # Success! Process and return the filters.
            processed_filters = []
            for f in filters:
                if f.get("operator") in ['>', '<', '>=', '<=']:
                    try:
                        f["value"] = float(f.get("value", ""))
                    except (ValueError, TypeError):
                        continue
                processed_filters.append(f)
            return processed_filters

        except (json.JSONDecodeError, ValueError) as e:
            print(f"Attempt {attempt + 1}: Failed to parse AI response. Error: {e}")
            # Add a correction message to the conversation for the next attempt
            correction_message = {
                "role": "assistant",
                "content": response_text # Show the AI its own bad response
            }
            error_feedback_message = {
                "role": "user",
                "content": "Your previous response was not valid JSON. Please correct it. You must only return a JSON object with a 'filters' key containing an array, with no extra text or formatting."
            }
            messages.extend([correction_message, error_feedback_message])
            
            if attempt == 2: # Last attempt failed
                raise HTTPException(status_code=500, detail="AI failed to generate a valid JSON filter after multiple attempts.")

    return [] # Should not be reached, but here as a fallback

# --- API Endpoint ---
@app.post("/query", response_model=List[Dict[str, Any]])
async def handle_query(request: QueryRequest):
    if not request.data:
        return []
    try:
        df = pd.DataFrame(request.data)
        headers = df.columns.tolist()
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid data format.")
    
    filters = await generate_filter_from_ai(request.query, headers)
    
    if not filters:
        return df.to_dict(orient='records')
    try:
        filtered_df = apply_filters(df, filters)
        filtered_df = filtered_df.where(pd.notna(filtered_df), None)
        return filtered_df.to_dict(orient='records')
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to apply filters: {str(e)}")

@app.get("/", include_in_schema=False)
async def root():
    return {"message": "CSV Query Genie API (Groq Edition) is running!"}