from pydantic import BaseModel, Field
from typing import Any, Literal


class AgentRunRequest(BaseModel):
    session_id: str
    message: str
    system_prompt: str | None = None


class AgentRunResponse(BaseModel):
    run_id: str
    status: str


class AgentMessageRequest(BaseModel):
    message: str


class ToolInstallRequest(BaseModel):
    package: str
    manager: Literal["pip", "npm"]


class ToolResult(BaseModel):
    ok: bool
    stdout: str = ""
    stderr: str = ""
    artifacts: list[str] = Field(default_factory=list)
    metrics: dict[str, Any] = Field(default_factory=dict)
