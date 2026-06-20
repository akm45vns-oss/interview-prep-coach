# pyrefly: ignore [missing-import]
from sqlalchemy.ext.asyncio import AsyncSession
# pyrefly: ignore [missing-import]
from sqlalchemy import select
# pyrefly: ignore [missing-import]
from fastapi import HTTPException, status

from app.models.user import User
from app.schemas.auth import UserRegister, UserLogin, TokenResponse, UserOut
from app.utils.security import hash_password, verify_password, create_access_token


class AuthService:

    @staticmethod
    async def register(data: UserRegister, db: AsyncSession) -> TokenResponse:
        # Check existing
        result = await db.execute(select(User).where(User.email == data.email))
        if result.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Email already registered"
            )

        user = User(
            name=data.name,
            email=data.email,
            password_hash=hash_password(data.password),
        )
        db.add(user)
        await db.flush()
        await db.refresh(user)

        token = create_access_token({"sub": str(user.id)})
        return TokenResponse(
            access_token=token,
            user=UserOut.model_validate(user)
        )

    @staticmethod
    async def login(data: UserLogin, db: AsyncSession) -> TokenResponse:
        result = await db.execute(select(User).where(User.email == data.email))
        user = result.scalar_one_or_none()
        if not user or not verify_password(data.password, user.password_hash):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password"
            )
        if not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Account is inactive"
            )

        token = create_access_token({"sub": str(user.id)})
        return TokenResponse(
            access_token=token,
            user=UserOut.model_validate(user)
        )
