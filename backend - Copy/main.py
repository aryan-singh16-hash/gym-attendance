import os
import io
import csv
from datetime import datetime, date as date_type
from typing import Optional, List

from fastapi import FastAPI, Depends, HTTPException, status, Query, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from dotenv import load_dotenv
import openpyxl

from database import attendance_collection, owner_collection, ensure_indexes
from models import AttendanceCreate, OwnerLogin, TokenOut
from auth import hash_password, verify_password, create_access_token, get_current_owner
from email_service import send_attendance_notification

load_dotenv()

FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")

app = FastAPI(title="Gym Attendance Tracker")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[FRONTEND_URL, "http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def on_startup():
    await ensure_indexes()


# ---------- Realtime (WebSocket) ----------

class ConnectionManager:
    def __init__(self):
        self.active: List[WebSocket] = []

    async def connect(self, ws: WebSocket):
        await ws.accept()
        self.active.append(ws)

    def disconnect(self, ws: WebSocket):
        if ws in self.active:
            self.active.remove(ws)

    async def broadcast(self, message: dict):
        dead = []
        for ws in self.active:
            try:
                await ws.send_json(message)
            except Exception:
                dead.append(ws)
        for ws in dead:
            self.disconnect(ws)


manager = ConnectionManager()


@app.websocket("/ws/dashboard")
async def dashboard_ws(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            # We don't expect messages from the client; just keep the socket alive.
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)


def serialize(doc) -> dict:
    doc = dict(doc)
    doc["id"] = str(doc.pop("_id"))
    return doc


# ---------- Public: Member Attendance ----------

@app.post("/api/attendance", status_code=status.HTTP_201_CREATED)
async def mark_attendance(payload: AttendanceCreate):
    record = payload.model_dump()
    record["created_at"] = datetime.utcnow().isoformat()
    result = await attendance_collection.insert_one(record)
    record["id"] = str(result.inserted_id)

    # Notify owner by email (best-effort, never blocks the response)
    send_attendance_notification(
        name=payload.name,
        roll_number=payload.roll_number,
        session=payload.session,
        timing=payload.timing,
        date=payload.date,
    )

    # Push to any connected dashboard sockets
    await manager.broadcast({"type": "new_attendance", "data": {k: v for k, v in record.items() if k != "_id"}})

    return {"message": "Attendance marked successfully", "id": record["id"]}


# ---------- Admin: Auth ----------

@app.post("/api/admin/login", response_model=TokenOut)
async def admin_login(payload: OwnerLogin):
    owner = await owner_collection.find_one({"email": payload.email})
    if not owner or not verify_password(payload.password, owner["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    token = create_access_token(subject=owner["email"])
    return TokenOut(access_token=token)


# ---------- Admin: Dashboard / Filters / Search ----------

@app.get("/api/admin/attendance")
async def get_attendance(
    date: Optional[str] = Query(None, description="YYYY-MM-DD, defaults to today"),
    session: Optional[str] = Query(None, description="Morning or Evening"),
    search: Optional[str] = Query(None, description="Search by name or roll number"),
    owner_email: str = Depends(get_current_owner),
):
    query: dict = {}
    query["date"] = date or date_type.today().isoformat()
    if session:
        query["session"] = session
    if search:
        query["$or"] = [
            {"name": {"$regex": search, "$options": "i"}},
            {"roll_number": {"$regex": search, "$options": "i"}},
        ]

    cursor = attendance_collection.find(query).sort("created_at", -1)
    records = [serialize(doc) async for doc in cursor]

    morning_count = sum(1 for r in records if r["session"] == "Morning")
    evening_count = sum(1 for r in records if r["session"] == "Evening")

    return {
        "records": records,
        "total": len(records),
        "morning_count": morning_count,
        "evening_count": evening_count,
    }


@app.get("/api/admin/attendance/range")
async def get_attendance_range(
    start_date: str = Query(...),
    end_date: str = Query(...),
    owner_email: str = Depends(get_current_owner),
):
    query = {"date": {"$gte": start_date, "$lte": end_date}}
    cursor = attendance_collection.find(query).sort([("date", 1), ("created_at", 1)])
    records = [serialize(doc) async for doc in cursor]
    return {"records": records, "total": len(records)}


# ---------- Admin: Export ----------

@app.get("/api/admin/export")
async def export_attendance(
    start_date: str = Query(...),
    end_date: str = Query(...),
    file_format: str = Query("csv", pattern="^(csv|xlsx)$"),
    owner_email: str = Depends(get_current_owner),
):
    query = {"date": {"$gte": start_date, "$lte": end_date}}
    cursor = attendance_collection.find(query).sort([("date", 1), ("created_at", 1)])
    records = [serialize(doc) async for doc in cursor]

    headers = ["Date", "Name", "Roll Number", "Session", "Timing"]
    rows = [[r["date"], r["name"], r["roll_number"], r["session"], r["timing"]] for r in records]

    filename_base = f"attendance_{start_date}_to_{end_date}"

    if file_format == "csv":
        buffer = io.StringIO()
        writer = csv.writer(buffer)
        writer.writerow(headers)
        writer.writerows(rows)
        buffer.seek(0)
        return StreamingResponse(
            iter([buffer.getvalue()]),
            media_type="text/csv",
            headers={"Content-Disposition": f"attachment; filename={filename_base}.csv"},
        )

    # xlsx
    wb = openpyxl.Workbook()
    ws = wb.active
    ws.title = "Attendance"
    ws.append(headers)
    for row in rows:
        ws.append(row)
    for col_cells in ws.columns:
        length = max(len(str(cell.value)) for cell in col_cells)
        ws.column_dimensions[col_cells[0].column_letter].width = length + 4

    out_buffer = io.BytesIO()
    wb.save(out_buffer)
    out_buffer.seek(0)
    return StreamingResponse(
        out_buffer,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f"attachment; filename={filename_base}.xlsx"},
    )


@app.get("/api/health")
async def health():
    return {"status": "ok"}
