from dataclasses import dataclass
import uuid


@dataclass
class Plan:
    run_id: str
    hermes_plan: list[str]


class DualAgentOrchestrator:
    def create_plan(self, message: str) -> Plan:
        return Plan(
            run_id=str(uuid.uuid4()),
            hermes_plan=[
                f"analyze:{message}",
                "select_tools",
                "execute_goose",
                "validate_hermes",
                "stream_output",
            ],
        )
