from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.models.env_variable import EnvVariable
from app.core.deps import get_current_user, get_admin_user
from app.config import ENV_DESCRIPTIONS, _ENV_DEFAULTS, get_setting

router = APIRouter(prefix="/api/settings", tags=["settings"])


class SettingResponse(BaseModel):
    key: str
    value: str
    description: str


class SettingUpdate(BaseModel):
    key: str
    value: str


@router.get("/", response_model=list[SettingResponse])
def list_settings(db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    """List all configurable settings. Any authenticated user."""
    results = []
    for key in ENV_DESCRIPTIONS:
        value = get_setting(key)
        # Mask sensitive keys (show last 4 chars only)
        display_value = value
        if key.endswith("_KEY") or key == "DB_PASSWORD":
            if len(value) > 4:
                display_value = "•" * (len(value) - 4) + value[-4:]
        results.append(SettingResponse(
            key=key,
            value=display_value,
            description=ENV_DESCRIPTIONS[key],
        ))
    return results


@router.put("/", response_model=SettingResponse)
def update_setting(body: SettingUpdate, db: Session = Depends(get_db), _: User = Depends(get_admin_user)):
    """Update a setting value. Admin only."""
    if body.key not in ENV_DESCRIPTIONS:
        from fastapi import HTTPException
        raise HTTPException(status_code=400, detail=f"Unknown setting: {body.key}")

    row = db.query(EnvVariable).filter(EnvVariable.key == body.key).first()
    if row:
        row.value = body.value
    else:
        row = EnvVariable(key=body.key, value=body.value, description=ENV_DESCRIPTIONS[body.key])
        db.add(row)
    db.commit()
    db.refresh(row)

    display_value = body.value
    if body.key.endswith("_KEY") or body.key == "DB_PASSWORD":
        if len(body.value) > 4:
            display_value = "•" * (len(body.value) - 4) + body.value[-4:]
    return SettingResponse(key=row.key, value=display_value, description=ENV_DESCRIPTIONS[row.key])


@router.get("/validate")
def validate_settings(_: User = Depends(get_current_user)):
    """Check which required settings are missing."""
    missing = []
    required_keys = ["OPENAI_API_KEY", "DB_HOST", "DB_PORT", "DB_USER"]
    for key in required_keys:
        val = get_setting(key)
        if not val:
            missing.append(key)
    return {"valid": len(missing) == 0, "missing": missing}
