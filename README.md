# Smart Issue Reporting

A full-stack civic issue reporting web app built with React, FastAPI, PostgreSQL, and Leaflet maps.

## Features

- User login and logout
- Create new civic issues
- Pick issue location from the map
- Use current location automatically
- View personal reported issues
- Filter issues by status
- Mark issues as resolved
- Interactive map with colored markers
- Selected issue sync between list and map

## Tech Stack

### Frontend
- React
- Vite
- Axios
- Leaflet / React Leaflet
- CSS

### Backend
- FastAPI
- Python
- SQLAlchemy
- PostgreSQL
- JWT authentication
- Passlib / bcrypt

## Project Structure

- `src/` - React frontend files
- `public/` - static frontend assets
- `app/` - FastAPI backend files
- `requirements.txt` - Python dependencies
- `package.json` - frontend dependencies

## How to Run

### Frontend

```bash
npm install
npm run dev
```

### Backend

```bash
pip install -r requirements.txt
uvicorn app.main:app --reload
```
