import pytest
from httpx import AsyncClient, ASGITransport
from datetime import datetime, timedelta

from app.main import app
from app.models.models import User, Assessment, Topic, Question
from app.core.database import get_db
from app.core.security import get_password_hash, create_access_token


@pytest.mark.asyncio
async def test_assessment_admin_lifecycle_and_permissions(db_session):
    async def override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = override_get_db
    """
    Comprehensive test of Test Admins management and permission enforcement:
    1. Superadmin creates an assessment.
    2. Add new admin 'Monisha R' to the assessment.
    3. Verify Monisha appears in the assessment's admin list.
    4. Duplicate prevention: Attempt to add Monisha again -> returns 400.
    5. Point of contact: Change POC to Monisha -> persists.
    6. Permissions: Monisha logs in -> can access and update assessment settings.
    7. Permissions: Third unauthorized admin 'Random User' -> gets 403 Forbidden.
    8. Admin removal: Remove Monisha from assessment.
    9. Permissions revocation: Monisha gets 403 Forbidden after removal.
    """
    # 1. Create Superadmin and Assessment in DB
    superadmin = User(
        email="superadmin_test@assessment.com",
        password_hash=get_password_hash("admin123"),
        full_name="Super Administrator",
        role="admin",
        is_active=True
    )
    db_session.add(superadmin)
    await db_session.flush()

    assessment = Assessment(
        title="Fullstack SQL Assessment",
        description="Assessment for Data & SQL Engineers",
        job_role="Data Engineer",
        duration_minutes=90,
        start_date=datetime.utcnow(),
        end_date=datetime.utcnow() + timedelta(days=7),
        timezone="UTC",
        status="DRAFT",
        created_by=superadmin.id,
        point_of_contact_id=superadmin.id
    )
    db_session.add(assessment)
    await db_session.commit()
    await db_session.refresh(assessment)

    transport = ASGITransport(app=app)
    super_token = create_access_token(data={"sub": superadmin.id, "role": "admin"})

    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        # 2. Add 'Monisha R' as test admin
        add_res = await ac.post(
            f"/api/assessments/{assessment.id}/admins",
            json={
                "name": "Monisha R",
                "email": "monisha.test@agilisium.com",
                "role": "All access"
            },
            headers={"Authorization": f"Bearer {super_token}"}
        )
        assert add_res.status_code == 200, add_res.text
        data = add_res.json()
        assert len(data["admins"]) >= 2
        monisha_entry = next((a for a in data["admins"] if a["email"] == "monisha.test@agilisium.com"), None)
        assert monisha_entry is not None
        assert monisha_entry["name"] == "Monisha R"
        assert monisha_entry["role"] == "All access"
        monisha_user_id = monisha_entry["user_id"]

        # 3. Verify get admins endpoint
        admins_res = await ac.get(
            f"/api/assessments/{assessment.id}/admins",
            headers={"Authorization": f"Bearer {super_token}"}
        )
        assert admins_res.status_code == 200
        admins_list = admins_res.json()
        assert any(a["email"] == "monisha.test@agilisium.com" for a in admins_list)

        # 4. Duplicate prevention test
        dup_res = await ac.post(
            f"/api/assessments/{assessment.id}/admins",
            json={
                "name": "Monisha R",
                "email": "monisha.test@agilisium.com",
                "role": "All access"
            },
            headers={"Authorization": f"Bearer {super_token}"}
        )
        assert dup_res.status_code == 400
        assert "already added to this assessment" in dup_res.json()["detail"]

        # 5. Change Point of Contact to Monisha
        poc_res = await ac.put(
            f"/api/assessments/{assessment.id}/point-of-contact",
            json={"user_id": monisha_user_id},
            headers={"Authorization": f"Bearer {super_token}"}
        )
        assert poc_res.status_code == 200
        poc_data = poc_res.json()
        assert poc_data["point_of_contact_id"] == monisha_user_id
        assert poc_data["point_of_contact_name"] == "Monisha R"
        monisha_in_resp = next((a for a in poc_data["admins"] if a["user_id"] == monisha_user_id), None)
        assert monisha_in_resp is not None
        assert monisha_in_resp["is_poc"] is True

        # 6. Test Monisha's permissions
        monisha_token = create_access_token(data={"sub": monisha_user_id, "role": "admin"})

        # Monisha should be able to view assessment
        m_view = await ac.get(
            f"/api/assessments/{assessment.id}",
            headers={"Authorization": f"Bearer {monisha_token}"}
        )
        assert m_view.status_code == 200

        # Monisha should be able to update assessment settings
        m_update = await ac.put(
            f"/api/assessments/{assessment.id}/settings",
            json={"duration_minutes": 120, "description": "Updated by Monisha"},
            headers={"Authorization": f"Bearer {monisha_token}"}
        )
        assert m_update.status_code == 200
        assert m_update.json()["duration_minutes"] == 120

        # 7. Create third unauthorized admin
        unauthorized_admin = User(
            email="unauth_admin@agilisium.com",
            password_hash=get_password_hash("admin123"),
            full_name="Unauthorized Admin",
            role="admin",
            is_active=True
        )
        db_session.add(unauthorized_admin)
        await db_session.commit()
        await db_session.refresh(unauthorized_admin)

        unauth_token = create_access_token(data={"sub": unauthorized_admin.id, "role": "admin"})

        # Unauthorized admin trying to access assessment -> 403 Forbidden
        unauth_view = await ac.get(
            f"/api/assessments/{assessment.id}",
            headers={"Authorization": f"Bearer {unauth_token}"}
        )
        assert unauth_view.status_code == 403
        assert "permission" in unauth_view.json()["detail"].lower()

        unauth_update = await ac.put(
            f"/api/assessments/{assessment.id}/settings",
            json={"duration_minutes": 60},
            headers={"Authorization": f"Bearer {unauth_token}"}
        )
        assert unauth_update.status_code == 403

        # 8. Remove Monisha from the assessment
        del_res = await ac.delete(
            f"/api/assessments/{assessment.id}/admins/{monisha_user_id}",
            headers={"Authorization": f"Bearer {super_token}"}
        )
        assert del_res.status_code == 200
        del_data = del_res.json()
        assert not any(a["user_id"] == monisha_user_id for a in del_data["admins"])

        # POC should have automatically reverted from Monisha
        assert del_data["point_of_contact_id"] != monisha_user_id

        # 9. Verify Monisha's permission is revoked (now gets 403 Forbidden)
        revoked_view = await ac.get(
            f"/api/assessments/{assessment.id}",
            headers={"Authorization": f"Bearer {monisha_token}"}
        )
        assert revoked_view.status_code == 403
        assert "permission" in revoked_view.json()["detail"].lower()

        revoked_update = await ac.put(
            f"/api/assessments/{assessment.id}/settings",
            json={"duration_minutes": 45},
            headers={"Authorization": f"Bearer {monisha_token}"}
        )
        assert revoked_update.status_code == 403
