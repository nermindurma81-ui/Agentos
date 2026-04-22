from fastapi import APIRouter, HTTPException, WebSocket, WebSocketDisconnect
from app.models.schemas import AgentRunRequest, AgentRunResponse, AgentMessageRequest, ToolInstallRequest
from app.agents.orchestrator import DualAgentOrchestrator
from app.tools.registry import discover_tools
import asyncio
import subprocess

router = APIRouter(prefix="/api/v1")
orchestrator = DualAgentOrchestrator()
RUNS: dict[str, dict] = {}
CLIENTS: dict[str, list[WebSocket]] = {}


@router.post("/agents/run", response_model=AgentRunResponse)
async def create_run(payload: AgentRunRequest):
    plan = orchestrator.create_plan(payload.message)
    RUNS[plan.run_id] = {
        "status": "running",
        "session_id": payload.session_id,
        "messages": [payload.message],
        "plan": plan.hermes_plan,
    }
    return AgentRunResponse(run_id=plan.run_id, status="running")


@router.post("/agents/{run_id}/stop")
async def stop_run(run_id: str):
    if run_id not in RUNS:
        raise HTTPException(status_code=404, detail="run not found")
    RUNS[run_id]["status"] = "stopped"
    return {"ok": True, "status": "stopped"}


@router.post("/agents/{run_id}/messages")
async def push_message(run_id: str, payload: AgentMessageRequest):
    if run_id not in RUNS:
        raise HTTPException(status_code=404, detail="run not found")
    RUNS[run_id]["messages"].append(payload.message)
    return {"ok": True}


@router.get("/providers/status")
async def providers_status():
    return {
        "primary": "polinations",
        "chain": ["polinations", "groq", "openrouter", "mistral", "ollama"],
        "active": "polinations",
        "heartbeat": "green",
    }


@router.get("/tools")
async def list_tools():
    return {"tools": discover_tools()}


@router.post("/tools/install")
async def install_tool(payload: ToolInstallRequest):
    cmd = ["pip", "install", payload.package] if payload.manager == "pip" else ["npm", "install", payload.package]
    proc = subprocess.run(cmd, capture_output=True, text=True)
    return {"ok": proc.returncode == 0, "stdout": proc.stdout[-2000:], "stderr": proc.stderr[-2000:]}


@router.websocket("/ws/agent/{session_id}")
async def ws_agent(websocket: WebSocket, session_id: str):
    await websocket.accept()
    CLIENTS.setdefault(session_id, []).append(websocket)
    try:
        while True:
            data = await websocket.receive_text()
            await websocket.send_json({"type": "echo", "session_id": session_id, "data": data})
    except WebSocketDisconnect:
        CLIENTS[session_id].remove(websocket)


@router.post("/uploads/callback")
async def upload_callback(payload: dict):
    await asyncio.sleep(0)
    return {"ok": True, "received": payload}
