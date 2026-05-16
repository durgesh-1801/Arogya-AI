# 🩺 Arogya-AI

AI-powered healthcare literacy platform that simplifies medical lab reports into patient-friendly explanations in English and Hindi.

Built for healthcare AI hackathons with a focus on accessibility, explainability, and rural health literacy.

---

# 🚀 Features

## 📄 Upload Medical Reports

* Upload PDF lab reports or scanned images
* Supports pathology reports like:

  * CBC
  * Diabetes Profile
  * Lipid Profile
  * Kidney Function Tests

---

## 🔍 OCR + Structured Parsing

* PDF extraction using **PyMuPDF**
* Image OCR using **Tesseract OCR**
* Regex-based structured medical parameter extraction

Example:

```json
{
  "parameter": "Hemoglobin",
  "value": 10.2,
  "unit": "g/dL",
  "status": "abnormal"
}
```

---

## 🤖 AI-Powered Explanations

Uses **Google Gemini API** to generate:

* Plain-language explanations
* Patient-friendly summaries
* Suggested next steps
* Hindi + English output

---

## 🛡️ Safety-Focused Architecture

* AI does NOT diagnose diseases
* Backend computes medical thresholds locally
* Gemini is only used for explanation generation
* Includes fallback responses if AI fails
* Every response includes:

  > "Please consult your doctor before making any health decisions."

---

## 📈 Trend Tracking (WIP)

Planned support for:

* Multi-report history
* Rising/falling health trends
* AI-generated trend narratives
* Recharts visualizations

---

# 🏗️ Tech Stack

## Backend

* FastAPI
* Python
* SQLAlchemy
* SQLite
* Pydantic

## AI

* Google Gemini 1.5 Flash

## OCR & Parsing

* PyMuPDF
* pytesseract
* Pillow
* Regex-based parsing

## Frontend (Planned)

* React
* Tailwind CSS
* Recharts

---

# 📂 Project Structure

```bash
backend/
├── main.py
├── routes/
├── services/
├── schemas/
├── prompts/
├── constants/
├── database/
└── utils/
```

---

# ⚙️ Backend Setup

## 1. Clone Repository

```bash
git clone https://github.com/YOUR_USERNAME/Arogya-AI.git
cd Arogya-AI/backend
```

---

## 2. Create Virtual Environment

### Windows

```bash
python -m venv .venv
.venv\Scripts\activate
```

### Linux / Mac

```bash
python3 -m venv .venv
source .venv/bin/activate
```

---

## 3. Install Dependencies

```bash
pip install -r requirements.txt
```

---

## 4. Configure Environment Variables

Create a `.env` file inside `backend/`

Example:

```env
HOST=0.0.0.0
PORT=8000

GEMINI_API_KEY=your_api_key_here
GEMINI_MODEL=gemini-1.5-flash
GEMINI_TIMEOUT_SECONDS=30
```

---

# ▶️ Run Backend

```bash
uvicorn main:app --reload
```

Server runs on:

```text
http://127.0.0.1:8000
```

Swagger API Docs:

```text
http://127.0.0.1:8000/docs
```

---

# 📡 API Endpoints

| Method | Endpoint       | Description                           |
| ------ | -------------- | ------------------------------------- |
| POST   | `/api/upload`  | Upload and parse report               |
| POST   | `/api/explain` | Generate AI explanations              |
| POST   | `/api/trend`   | Trend analysis (planned)              |
| POST   | `/api/chat`    | Ask questions about reports (planned) |

---

# 🧠 Current Backend Flow

```text
Upload Report
    ↓
OCR / PDF Extraction
    ↓
Regex Medical Parsing
    ↓
Local Threshold Evaluation
    ↓
Structured Medical JSON
    ↓
Gemini AI Explanation
    ↓
Hindi / English Output
```

---

# 🌍 Why Arogya-AI?

Millions of patients struggle to understand medical reports due to:

* medical jargon
* English-only reports
* lack of follow-up explanation

Arogya-AI aims to improve healthcare literacy by making reports:

* understandable
* multilingual
* conversational
* actionable

---

# 🔒 Privacy & Ethics

* Minimal patient data storage
* Environment variables protected using `.env`
* No clinical diagnosis generation
* Built as a health literacy tool, not a replacement for doctors

---

# 👨‍💻 Contributors

* Durgesh Sharma
* Backend & AI Team

---

# 📌 Status

✅ OCR Pipeline
✅ Structured Medical Parsing
✅ Gemini AI Integration
✅ Hindi Support
🚧 Trend Tracking
🚧 Frontend Integration
🚧 Chat Assistant

---

# 📜 License

MIT License
