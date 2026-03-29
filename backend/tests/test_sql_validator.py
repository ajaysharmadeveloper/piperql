import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.agent.sql_validator import validate_sql


def test_select_allowed_in_read_only():
    result = validate_sql("SELECT * FROM users", "read_only")
    assert result.allowed is True
    assert result.statement_type == "SELECT"


def test_insert_blocked_in_read_only():
    result = validate_sql("INSERT INTO users (name) VALUES ('test')", "read_only")
    assert result.allowed is False


def test_delete_needs_confirmation_in_crud():
    result = validate_sql("DELETE FROM users WHERE id = 1", "crud")
    assert result.allowed is True
    assert result.needs_confirmation is True


def test_select_no_confirmation_in_crud():
    result = validate_sql("SELECT * FROM users", "crud")
    assert result.allowed is True
    assert result.needs_confirmation is False


def test_drop_blocked_in_crud():
    result = validate_sql("DROP TABLE users", "crud")
    assert result.allowed is False


def test_drop_allowed_in_full_access_with_confirmation():
    result = validate_sql("DROP TABLE users", "full_access")
    assert result.allowed is True
    assert result.needs_confirmation is True
    assert result.is_destructive is True


def test_multiple_statements_rejected():
    result = validate_sql("SELECT 1; DROP TABLE users", "full_access")
    assert result.allowed is False
    assert "multiple" in result.reason.lower()


def test_truncate_is_destructive():
    result = validate_sql("TRUNCATE TABLE users", "full_access")
    assert result.allowed is True
    assert result.is_destructive is True


def test_delete_without_where_is_destructive():
    result = validate_sql("DELETE FROM users", "crud")
    assert result.allowed is True
    assert result.is_destructive is True


def test_update_needs_confirmation():
    result = validate_sql("UPDATE users SET name = 'x' WHERE id = 1", "crud")
    assert result.allowed is True
    assert result.needs_confirmation is True
