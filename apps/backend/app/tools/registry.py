from pathlib import Path
import importlib.util


def discover_tools(base_dir: str = "app/tools") -> list[dict]:
    tools = []
    root = Path(base_dir)
    if not root.exists():
        return tools
    for py in root.glob("*.py"):
        if py.name in {"registry.py", "__init__.py"}:
            continue
        spec = importlib.util.spec_from_file_location(py.stem, py)
        if spec and spec.loader:
            mod = importlib.util.module_from_spec(spec)
            spec.loader.exec_module(mod)
            if hasattr(mod, "TOOL"):
                tools.append(mod.TOOL)
    return tools
