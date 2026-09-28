from typing import Optional, Any, Dict
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.models import AuditLog


class AuditService:
    async def log_action(
        self,
        db: AsyncSession,
        action: str,
        entity_type: str,
        actor_id: Optional[str] = None,
        entity_id: Optional[str] = None,
        details_json: Optional[Dict[str, Any]] = None,
        ip_address: Optional[str] = None
    ) -> AuditLog:
        log_entry = AuditLog(
            actor_id=actor_id,
            action=action,
            entity_type=entity_type,
            entity_id=entity_id,
            details_json=details_json or {},
            ip_address=ip_address
        )
        db.add(log_entry)
        await db.commit()
        await db.refresh(log_entry)
        return log_entry


audit_service = AuditService()
