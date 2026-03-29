import asyncio
import concurrent.futures

from mem0 import MemoryClient

from app.config import get_setting

_memory: MemoryClient | None = None
_memory_key: str = ""
_executor = concurrent.futures.ThreadPoolExecutor(max_workers=2)

MEMORY_TIMEOUT = 5  # seconds


def get_memory() -> MemoryClient:
    global _memory, _memory_key
    current_key = get_setting("MEM0_API_KEY")
    if _memory is None or current_key != _memory_key:
        _memory = MemoryClient(api_key=current_key)
        _memory_key = current_key
    return _memory


def search_memories(query: str, user_id: str, limit: int = 10) -> list[dict]:
    try:
        mem = get_memory()
        future = _executor.submit(mem.search, query, user_id=user_id, limit=limit)
        results = future.result(timeout=MEMORY_TIMEOUT)
        if isinstance(results, dict) and "results" in results:
            return results["results"]
        if isinstance(results, list):
            return results
    except Exception:
        pass
    return []


def add_memory(messages: list[dict], user_id: str) -> None:
    try:
        mem = get_memory()
        future = _executor.submit(mem.add, messages, user_id=user_id)
        future.result(timeout=MEMORY_TIMEOUT)
    except Exception:
        pass


def get_all_memories(user_id: str) -> list[dict]:
    try:
        mem = get_memory()
        future = _executor.submit(mem.get_all, user_id=user_id)
        result = future.result(timeout=MEMORY_TIMEOUT)
        if isinstance(result, dict) and "results" in result:
            return result["results"]
        if isinstance(result, list):
            return result
    except Exception:
        pass
    return []
