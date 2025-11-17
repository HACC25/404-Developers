# System Status & Important Notes

## ⚠️ IMPORTANT: Backend Startup Time

**The backend takes approximately 60-90 seconds to fully load on first startup.**

This is because:
1. The SentenceTransformer ML model needs to load (~400MB+)
2. FAISS index needs to be built
3. All JSON files need to be loaded and processed
4. All embeddings need to be calculated

**Solution:** Just wait! The server will be ready after the initial load.

## Current Setup

### Backend (Main.py)
- **Port:** 8000
- **Start Command:** 
  ```powershell
  cd "c:\Users\18084\Documents\404-Developers\Back End"
  python -m uvicorn main:app --host localhost --port 8000
  ```
- **Status:** ✅ Running (may show errors on startup while loading)
- **Endpoints:**
  - `GET /jobs` - Returns all available SOC job titles
  - `GET /pathway/{job1}/{job2}` - Returns skill pathway data

### Frontend (React + Vite)
- **Port:** 5173
- **Start Command:**
  ```powershell
  cd "c:\Users\18084\Documents\404-Developers\Frontend"
  npx vite
  ```
- **Status:** ✅ Running

## Recent Fixes

### Fixed Issues:
1. ✅ Fixed CORS errors - Backend now accepts frontend requests
2. ✅ Fixed backend logic - Job indices now properly resolved
3. ✅ Fixed frontend null reference errors - Added proper data validation
4. ✅ Updated frontend to use real SOC job titles from backend
5. ✅ Single "Get Pathway" button for cleaner UX

## How to Use

### First Time Setup:
1. **Start Backend** (will take ~60-90 seconds):
   ```powershell
   cd "c:\Users\18084\Documents\404-Developers\Back End"
   python -m uvicorn main:app --host localhost --port 8000
   ```
   Wait for: `INFO:     Uvicorn running on http://localhost:8000`

2. **Start Frontend** (in new terminal):
   ```powershell
   cd "c:\Users\18084\Documents\404-Developers\Frontend"
   npx vite
   ```
   Wait for: `Local:   http://localhost:5173/`

3. **Open Browser:**
   - Go to http://localhost:5173
   - Navigate to "Complex Map" tab
   - Enter Job 1 and Job 2
   - Click "Get Pathway"
   - Wait for graph to load

### Troubleshooting:

**Port 8000 already in use:**
```powershell
taskkill /F /IM python.exe
```

**Backend taking too long:**
- Don't panic! Wait 60-90 seconds on first startup
- Subsequent requests will be much faster

**CORS errors in frontend:**
- Make sure backend is running first
- Check that both servers are on localhost

**Frontend not loading:**
- Check that npm install was run: `npm install`
- Try: `npm run dev` or `npx vite`

## Files Modified

- ✅ `Back End/main.py` - Added `/jobs` endpoint, fixed job indexing
- ✅ `Frontend/src/services/api.js` - Added `getAvailableJobs()`
- ✅ `Frontend/src/App.jsx` - Updated to use real API data, fixed null checks

## Performance Notes

- **First pathway request:** 30-60 seconds (model inference)
- **Subsequent requests:** 2-5 seconds
- **Graph rendering:** 1-3 seconds depending on size
- **Node click interactions:** Instant

The slow initial request is due to:
1. Encoding job descriptions with SentenceTransformer
2. FAISS similarity search
3. Loading embeddings and calculating distances
4. Building the skill network

This is expected and normal!
