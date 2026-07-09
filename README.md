# PlotVision: AI Real Estate Map Digitizer & Management Hub

PlotVision is a web-based interactive map digitizer and management platform tailored for real estate agents and administrators. It automates the digitization of flat layout plans and maps, turns static blueprint images into interactive SVG overlays, and supports real-time plot reservation, sales management, and metadata import/export.

---

## 🚀 Key Features

### 1. **Interactive Vector Editor & Map Viewer**
- **Seamless Navigation:** Pan and zoom across high-resolution layout maps using standard controls.
- **Custom Vector Tooling:** Interactive SVG overlay tools to **draw**, **edit**, and **delete** plot polygons directly on the map.
- **Plot Filtering & Searching:** Instantly filter plots by status (Available, Reserved, Sold) or search by plot number.

### 2. **AI & Computer Vision Digitization Engines**
- **OpenCV Contour & Digit Detection:** 
  - Filters shapes using Solidity & Aspect Ratio constraints.
  - Employs Hierarchical Containment filters to avoid duplicates.
  - Crops bounding contours using precise polygon-based binary masks and processes text/digits via template matching.
- **Gemini 2.5 Flash Integration:**
  - Automates structural identification of maps.
  - Extracts normalized bounding coordinates, dimensions (size), and calculated areas directly from layout drawings using Google's generative AI models.

### 3. **PlotEdit Layout Optimizer & Preprocessor**
- **Interactive Cropper.js Interface:** Precision cropping and rotation tool embedded directly in the admin dashboard for alignment.
- **OpenCV Auto-Crop Scanning:** Analyzes the uploaded layout using computer vision to suggest layout crop boundary boundaries.
- **Image Filters & Color Correction:** Live adjustment sliders for brightness, contrast, sharpening, and keying/background color removal.
- **Non-Destructive Backups:** Keeps original, high-resolution un-cropped uploads under `uploads/raw_layout_<id>.<ext>` so admins can re-crop or alter filter properties anytime.

### 4. **Role-Based Access Control (RBAC)**
- **Admins:** Full control over creating/renaming projects, setting system configurations (e.g., Gemini API keys), running AI/CV analysis, modifying plot shapes, and managing user approval workflows.
- **Agents:** View live project catalogs, request access accounts, and book/reserve plots with customer token amounts and contract details.
- **Audit Logging & SSE Sync:** Uses Server-Sent Events (SSE) to sync map status changes to all active users in real-time.

### 5. **Utility & Export Subsystems**
- **CSV Data Import:** Import plot metadata tables (Plot No., Dimensions, Area) to quickly bind structured details to map coordinates.
- **Interactive HTML Exporter:** Export the digitized maps as standalone interactive HTML pages (with inline SVGs, style sheets, and search controls) ready for public property portals.
- **Booking Receipts:** Generate clean, printable PDF/print booking receipts for customers.

---

## 🛠️ Tech Stack

### Backend
- **Flask (Python):** Lightweight REST API and blueprint architecture.
- **SQLite:** Serverless database for managing projects, users, plot states, and logs.
- **OpenCV & NumPy:** Advanced image preprocessing, contour extraction, and custom OCR template matching.
- **Google Generative AI SDK:** Integrates Gemini models for visual mapping analysis.

### Frontend
- **HTML5 & CSS3:** Semantic structure styled with a premium dark-mode dashboard (custom "Slate" UI theme, Outfit typography, FontAwesome vector iconography).
- **Cropper.js:** For responsive, client-side map alignment and cropping interfaces.
- **Vanilla JavaScript:** High-performance viewport rendering, viewport drag/zoom controls, SVG point manipulation, and SSE communication.

---

## 📁 Repository Structure

```
PlotVision/
├── backend/
│   ├── app.py                  # Flask Application Entry point
│   ├── detector.py             # OpenCV Layout Auto-Crop/Optimizer helper
│   ├── controllers/            # Blueprints (Auth, User, Request, Project)
│   └── models/                 # Database schema and SQLite access functions
├── frontend/
│   ├── css/                    # Custom CSS frameworks and workspace styling
│   ├── js/                     # Application state management & SVG editors
│   └── index.html              # Main client-side single-page dashboard
├── uploads/                    # Stores uploaded layout plans (ignored by git)
├── static/                     # Hosts default static assets and mock layouts
├── requirements.txt            # Python environment dependencies
├── sample_setup.py             # Script to initialize static sample assets
├── test_app.py                 # Comprehensive backend Flask unit tests
└── build_clean_layout.py       # Layout generation script mapping plot details
```

---

## ⚙️ Installation & Setup

### Prerequisites
- Python 3.9+
- A modern web browser
- (Optional) A Gemini API Key for dynamic AI digitizer functionality.

### 1. Clone & Set Up Directory
Ensure you are inside the project root:
```bash
cd PlotVision
```

### 2. Create Virtual Environment & Install Dependencies
```bash
# Create a virtual environment
python -m venv venv

# Activate the virtual environment
# On macOS/Linux:
source venv/bin/activate
# On Windows:
venv\Scripts\activate

# Install requirements
pip install -r requirements.txt
```

### 3. Initialize Assets & Run Setup Scripts
Copy default sample maps and layout configurations:
```bash
python sample_setup.py
python build_clean_layout.py
```

### 4. Start the Application
Run the Flask server:
```bash
python -m backend.app
```
By default, the server will launch at **`http://localhost:5001`**.

---

## 🧪 Running Tests

A suite of unit tests is included to verify the application's configuration, auth flows, CSV parsers, and project endpoints:

```bash
python -m unittest test_app.py
```

---

## 🔑 Default Credentials

When the database is initialized, it seeds the following credentials:

| Role  | Username | Password |
| :--- | :--- | :--- |
| **Admin** | `admin` | `admin123` |
| **Agent** | `agent` | `agent123` |
