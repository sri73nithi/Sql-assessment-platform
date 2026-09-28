import pytest
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import AsyncSession
from app.main import app
from app.models.models import User
from app.core.database import get_db
from app.core.security import get_password_hash


@pytest.mark.asyncio
async def test_admin_change_password_and_login_flow(db_session: AsyncSession):
    async def override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = override_get_db

    # 1. Setup Admin user
    admin_email = "admin_pw_test@assessment.com"
    initial_pw = "InitialAdminPass123"

    admin_user = User(
        email=admin_email,
        full_name="Password Test Admin",
        role="admin",
        password_hash=get_password_hash(initial_pw),
        is_active=True
    )
    db_session.add(admin_user)
    await db_session.commit()
    await db_session.refresh(admin_user)

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # 2. Login with initial password to get token
        login_res = await client.post(
            "/api/auth/login",
            json={"email": admin_email, "password": initial_pw}
        )
        assert login_res.status_code == 200, f"Login failed: {login_res.text}"
        auth_data = login_res.json()
        token = auth_data["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        # 3. Test changing password without auth token -> 401
        unauth_res = await client.post(
            "/api/auth/change-password",
            json={
                "current_password": initial_pw,
                "new_password": "NewSecretPass2026!",
                "confirm_password": "NewSecretPass2026!"
            }
        )
        assert unauth_res.status_code == 401

        # 4. Test wrong current password -> 400
        wrong_curr_res = await client.post(
            "/api/auth/change-password",
            headers=headers,
            json={
                "current_password": "WrongCurrentPassword99",
                "new_password": "NewSecretPass2026!",
                "confirm_password": "NewSecretPass2026!"
            }
        )
        assert wrong_curr_res.status_code == 400
        assert "Current password is incorrect" in wrong_curr_res.json()["detail"]

        # 5. Test mismatched confirmation -> 400
        mismatch_res = await client.post(
            "/api/auth/change-password",
            headers=headers,
            json={
                "current_password": initial_pw,
                "new_password": "NewSecretPass2026!",
                "confirm_password": "DifferentPass2026!"
            }
        )
        assert mismatch_res.status_code == 400
        assert "do not match" in mismatch_res.json()["detail"]

        # 6. Test short password (< 8 chars) -> 422 or 400
        short_res = await client.post(
            "/api/auth/change-password",
            headers=headers,
            json={
                "current_password": initial_pw,
                "new_password": "short",
                "confirm_password": "short"
            }
        )
        assert short_res.status_code in (400, 422)

        # 7. Test identical password to current -> 400
        same_res = await client.post(
            "/api/auth/change-password",
            headers=headers,
            json={
                "current_password": initial_pw,
                "new_password": initial_pw,
                "confirm_password": initial_pw
            }
        )
        assert same_res.status_code == 400
        assert "must be different" in same_res.json()["detail"]

        # 8. Successful password change
        new_pw = "BrandNewSecurePass2026"
        change_res = await client.post(
            "/api/auth/change-password",
            headers=headers,
            json={
                "current_password": initial_pw,
                "new_password": new_pw,
                "confirm_password": new_pw
            }
        )
        assert change_res.status_code == 200
        assert "successfully updated" in change_res.json()["detail"]

        # 9. Verify login with OLD password now FAILS
        old_login_res = await client.post(
            "/api/auth/login",
            json={"email": admin_email, "password": initial_pw}
        )
        assert old_login_res.status_code == 401

        # 10. Verify login with NEW password SUCCEEDS
        new_login_res = await client.post(
            "/api/auth/login",
            json={"email": admin_email, "password": new_pw}
        )
        assert new_login_res.status_code == 200
        assert "access_token" in new_login_res.json()

    # Clean up overrides
    app.dependency_overrides.clear()
