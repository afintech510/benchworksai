from pydantic import BaseModel


class LogoutResponse(BaseModel):
    status: str = "logged_out"


class SessionResponse(BaseModel):
    user_id: str
    email: str
    role: str
    is_valid: bool
