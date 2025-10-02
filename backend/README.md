# CSV Query Genie - Backend

This directory contains the Python backend for the CSV Query Genie application, built with **FastAPI**.

## Functionality

-   Provides a single API endpoint `/query` that accepts a user's natural language query and their raw CSV data.
-   Securely stores and uses the Google AI (Gemini) API key.
-   Communicates with the Gemini API to translate the query into a structured JSON filter.
-   Uses the **Pandas** library to apply the generated filter to the data.
-   Returns the filtered data to the frontend.

## Setup and Running

1.  **Navigate to this directory:**
    From the project root, run `cd backend`.

2.  **Create a virtual environment (recommended):**
    ```bash
    # For macOS/Linux
    python3 -m venv venv
    source venv/bin/activate

    # For Windows
    py -m venv venv
    venv\Scripts\activate
    ```

3.  **Install all required packages:**
    ```bash
    pip install -r requirements.txt
    ```

4.  **Configure your Environment Variables:**
    -   Create a new file named `.env` in this directory (`backend/`).
    -   Copy the contents of `.env.example` into it.
    -   Open the `.env` file and replace the placeholder with your actual Google AI API key.

    **File: `.env`**
    ```
    API_KEY="your_google_api_key_here"
    ```

5.  **Start the local server:**
    ```bash
    uvicorn main:app --reload
    ```
    -   The `--reload` flag enables hot-reloading, so the server will restart automatically when you make code changes.
    -   The server will be live and listening for requests at `http://127.0.0.1:8000`.
