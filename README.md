# CSV Query Genie

An AI-powered data analysis tool that allows users to upload any CSV file and ask natural language questions to filter and query the data. The AI translates questions into structured filters to display the results in a clean, interactive table.

## Architecture

This project uses a modern client-server architecture:

-   **Frontend:** A responsive web interface built with **React** and styled with **Tailwind CSS**. It handles file uploads and displays the filtered data.
-   **Backend:** A secure and efficient API built with **Python** and **FastAPI**. It handles the core logic:
    -   Receiving data and queries from the frontend.
    -   Calling the **Large Language Model** to parse natural language.
    -   Using the **Pandas** library to perform powerful and fast data filtering.

## Features

-   **Upload Any CSV:** Drag and drop or select any CSV file from your device.
-   **Natural Language Queries:** Ask questions like "show me sales over 500" or "list all products in the electronics category".
-   **Instant Filtering:** The backend processes the data and returns the filtered results immediately.
-   **Secure API Key:** Your AI API key is stored securely on the backend and never exposed to the browser.
-   **Responsive Design:** The interface works seamlessly on both desktop and mobile devices.

## How to Run the Application

You need to run two separate services: the backend server and the frontend application.

### 1. Backend Setup (FastAPI)

First, set up and run the Python server.

1.  **Navigate to the backend directory:**
    ```bash
    cd backend
    ```

2.  **Create a virtual environment (recommended):**
    ```bash
    python -m venv venv
    source venv/bin/activate  # On Windows, use `venv\Scripts\activate`
    ```

3.  **Install dependencies:**
    ```bash
    pip install -r requirements.txt
    ```

4.  **Set up your API Key:**
    -   Rename the `.env.example` file to `.env`.
    -   Open the `.env` file and replace your groq api key.
    ```
    API_KEY="your_google_api_key_here"
    ```

5.  **Run the server:**
    ```bash
    uvicorn main:app --reload
    ```
    The backend will now be running at `http://127.0.0.1:8000`. Keep this terminal window open.

### 2. Frontend Setup (React)

There is no build step required for the frontend. You can run it by opening the `index.html` file in your web browser.

1.  **Open `index.html`:** In the root directory of the project, find the `index.html` file.
2.  **Open in Browser:** Right-click the file and choose "Open with" your favorite web browser (e.g., Chrome, Firefox).

You can now use the application! Upload a CSV file and start asking questions.

## How It Works

1.  The user uploads a CSV file in the **React frontend**.
2.  The frontend parses the CSV and displays the full dataset.
3.  The user types a natural language query (e.g., "show me users from Canada").
4.  The frontend sends the query and the *entire original dataset* to the **FastAPI backend**.
5.  The backend receives the request. It extracts the column headers from the data.
6.  It sends the headers and the user's query to the **Large Language Model**, asking it to generate a structured JSON filter.
7.  The AI responds with a filter, e.g., `[{"header": "Country", "operator": "===", "value": "Canada"}]`.
8.  The backend uses **Pandas** to apply this filter to the dataset, which is extremely fast.
9.  The backend returns the final, **filtered data** as a JSON response to the frontend.
10. The frontend receives the filtered data and updates the table, showing the user the result of their query.
