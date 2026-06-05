"""
Auth endpoints.

`signup` creates an already-confirmed user via the service_role admin API, so NO
confirmation email is sent. This sidesteps Supabase's free-tier email rate limit
(which was blocking all new sign-ups with "email rate limit exceeded"). The
`on_auth_user_created` trigger still fires and populates `public.profiles` from
the `username` metadata, so username-based login keeps working unchanged.
"""

import logging

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.database import supabase  # service_role client (can use auth.admin)

log = logging.getLogger("ballerzhq.auth")

router = APIRouter()


class SignupRequest(BaseModel):
    username: str
    email: str
    password: str


@router.post("/signup")
async def signup(req: SignupRequest):
    username = req.username.strip()
    email = req.email.strip().lower()

    if not username or not email or len(req.password) < 6:
        raise HTTPException(
            status_code=400,
            detail="Username, email, and a password of at least 6 characters are required.",
        )

    try:
        supabase.auth.admin.create_user(
            {
                "email": email,
                "password": req.password,
                "email_confirm": True,  # mark confirmed — no (rate-limited) email is sent
                "user_metadata": {"username": username},
            }
        )
    except Exception as e:  # noqa: BLE001 — surface a friendly message, log the rest
        msg = str(e).lower()
        if any(k in msg for k in ("already", "registered", "exists", "duplicate")):
            raise HTTPException(status_code=409, detail="That email or username is already taken.")
        log.error("Signup failed: %s", e)
        raise HTTPException(status_code=400, detail="Could not create the account. Please try again.")

    return {"ok": True}
