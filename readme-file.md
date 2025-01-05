# Project Name

## Description
A Flask-based web application for managing project details and calculating FSI (Floor Space Index).

## Project Structure
```
project_root/
├── frontend/
│   ├── templates/
│   │   └── index.html
│   ├── static/
│   │   ├── scripts.js
│   │   ├── styles.css
│   │   └── data/
│   │       └── zone.json
│   ├── uploads/
├── backend/
│   ├── app.py
│   ├── calculators/
│   │   ├── fsi_calculator.py
│   │   ├── area_statement_calculator.py
│   │   └── setback_calculator.py
│   ├── utils/
│   │   └── required_id.py
├── run.py
├── .env
└── README.md
```

## Setup Instructions
1. Create a virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # Linux/Mac
   venv\Scripts\activate     # Windows
   ```

2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

3. Set up environment variables:
   - Copy `.env.example` to `.env`
   - Update the values in `.env` with your configuration

4. Initialize the database:
   - Ensure MySQL is running
   - Create the database and tables using the provided SQL scripts

5. Run the application:
   ```bash
   python run.py
   ```

## Features
- Project details management
- FSI calculation
- Area statement calculation
- File upload handling
- Database integration

## Dependencies
- Flask
- MySQL Connector
- Python-dotenv
- Additional requirements listed in requirements.txt

## Contributing
[Your contribution guidelines here]

## License
[Your license information here]
