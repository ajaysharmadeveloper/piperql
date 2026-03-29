import re
from dataclasses import dataclass


@dataclass
class SQLValidationResult:
    allowed: bool
    needs_confirmation: bool
    is_destructive: bool
    statement_type: str
    reason: str


ACCESS_RULES = {
    "read_only": {"SELECT"},
    "crud": {"SELECT", "INSERT", "UPDATE", "DELETE"},
    "full_access": {"SELECT", "INSERT", "UPDATE", "DELETE", "CREATE", "ALTER", "DROP", "TRUNCATE", "GRANT", "REVOKE"},
}

CONFIRMATION_REQUIRED = {"INSERT", "UPDATE", "DELETE", "CREATE", "ALTER", "DROP", "TRUNCATE", "GRANT", "REVOKE"}
DESTRUCTIVE_PATTERNS = {"DROP", "TRUNCATE"}


def _detect_statement_type(sql: str) -> str:
    cleaned = sql.strip().upper()
    cleaned = re.sub(r'--.*$', '', cleaned, flags=re.MULTILINE)
    cleaned = re.sub(r'/\*.*?\*/', '', cleaned, flags=re.DOTALL)
    cleaned = cleaned.strip()

    for keyword in ["SELECT", "INSERT", "UPDATE", "DELETE", "CREATE", "ALTER", "DROP", "TRUNCATE", "GRANT", "REVOKE"]:
        if cleaned.startswith(keyword):
            return keyword
    return "UNKNOWN"


def _has_multiple_statements(sql: str) -> bool:
    cleaned = re.sub(r"'[^']*'", "''", sql)
    cleaned = re.sub(r'"[^"]*"', '""', cleaned)
    cleaned = re.sub(r'--.*$', '', cleaned, flags=re.MULTILINE)
    cleaned = re.sub(r'/\*.*?\*/', '', cleaned, flags=re.DOTALL)
    statements = [s.strip() for s in cleaned.split(';') if s.strip()]
    return len(statements) > 1


def _is_delete_without_where(sql: str) -> bool:
    cleaned = sql.strip().upper()
    if not cleaned.startswith("DELETE"):
        return False
    return "WHERE" not in cleaned


def validate_sql(sql: str, access_mode: str) -> SQLValidationResult:
    sql = sql.strip()

    if not sql:
        return SQLValidationResult(
            allowed=False, needs_confirmation=False, is_destructive=False,
            statement_type="EMPTY", reason="Empty SQL statement"
        )

    if _has_multiple_statements(sql):
        return SQLValidationResult(
            allowed=False, needs_confirmation=False, is_destructive=False,
            statement_type="MULTIPLE", reason="Multiple statements not allowed"
        )

    statement_type = _detect_statement_type(sql)
    allowed_types = ACCESS_RULES.get(access_mode, set())

    if statement_type not in allowed_types:
        return SQLValidationResult(
            allowed=False, needs_confirmation=False, is_destructive=False,
            statement_type=statement_type,
            reason=f"{statement_type} not allowed in {access_mode} mode"
        )

    needs_confirmation = statement_type in CONFIRMATION_REQUIRED
    is_destructive = (
        statement_type in DESTRUCTIVE_PATTERNS
        or _is_delete_without_where(sql)
    )

    return SQLValidationResult(
        allowed=True,
        needs_confirmation=needs_confirmation,
        is_destructive=is_destructive,
        statement_type=statement_type,
        reason="OK"
    )
