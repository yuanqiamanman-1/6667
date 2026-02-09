from typing import Any
from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
import os
import uuid

from app.api import deps
from app.db.session import get_db
from app.core.config import settings
from app.models.files import FileAsset
from app.models.user import User, VerificationRequest, AdminOnboardingRequest
from app.models.core import Organization
from app.schemas.files import FileAsset as FileAssetSchema


router = APIRouter()


def _is_hq(user: User) -> bool:
    return any(r.role_code == "association_hq" for r in user.admin_roles or [])


def _can_manage_type_for_school(db: Session, user: User, role_code: str, school_id: str | None) -> bool:
    if user.is_superuser:
        return True
    if not school_id:
        return False
    org_ids = [r.organization_id for r in (user.admin_roles or []) if r.role_code == role_code and r.organization_id]
    if not org_ids:
        return False
    orgs = db.query(Organization).filter(Organization.id.in_(org_ids)).all()
    return any(o.school_id == school_id for o in orgs if o.school_id)


def _can_manage_aid_for_target(user: User, target_aid_school_id: str | None) -> bool:
    if user.is_superuser:
        return True
    if not target_aid_school_id:
        return False
    if _is_hq(user):
        return True
    return user.school_id == target_aid_school_id


def _can_access_file(db: Session, current_user: User, file_id: str) -> bool:
    if current_user.is_superuser or _is_hq(current_user):
        return True

    vr_list = db.query(VerificationRequest).filter(VerificationRequest.evidence_refs.contains(file_id)).all()
    for r in vr_list:
        if r.applicant_id == current_user.id:
            return True
        if r.type == "university_student" and _can_manage_type_for_school(db, current_user, "university_admin", r.target_school_id):
            return True
        if r.type == "volunteer_teacher" and _can_manage_type_for_school(db, current_user, "university_association_admin", r.target_school_id):
            return True
        if r.type == "special_aid" and _can_manage_aid_for_target(current_user, r.target_school_id):
            return True
        if r.type == "general_basic":
            return False

    onboarding_list = db.query(AdminOnboardingRequest).filter(AdminOnboardingRequest.evidence_refs.contains(file_id)).all()
    for r in onboarding_list:
        if r.user_id == current_user.id:
            return True

    return False


@router.post("/upload", response_model=FileAssetSchema)
def upload_file(
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_active_user),
    file: UploadFile = File(...),
) -> Any:
    upload_root = os.path.join(os.path.dirname(__file__), "..", "..", "..", "uploads")
    upload_root = os.path.abspath(upload_root)
    os.makedirs(upload_root, exist_ok=True)

    file_id = str(uuid.uuid4())
    safe_name = os.path.basename(file.filename or "file")
    storage_name = f"{file_id}_{safe_name}"
    storage_path = os.path.join(upload_root, storage_name)

    content = file.file.read()
    with open(storage_path, "wb") as f:
        f.write(content)

    asset = FileAsset(
        id=file_id,
        uploader_id=current_user.id,
        original_name=safe_name,
        storage_path=storage_path,
        mime_type=file.content_type,
        size=len(content),
    )
    db.add(asset)
    db.commit()
    db.refresh(asset)

    base = settings.API_V1_STR.rstrip("/")
    url = f"{base}/files/{asset.id}"
    return {
        "id": asset.id,
        "name": asset.original_name,
        "url": url,
        "mime": asset.mime_type,
        "size": asset.size or 0,
        "created_at": asset.created_at.isoformat() if asset.created_at else None,
    }


@router.get("/{file_id}")
def read_file(
    file_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_active_user),
):
    asset = db.query(FileAsset).filter(FileAsset.id == file_id).first()
    if not asset:
        raise HTTPException(status_code=404, detail="File not found")

    if asset.uploader_id != current_user.id and not _can_access_file(db, current_user, file_id):
        raise HTTPException(status_code=403, detail="Not authorized")

    if not asset.storage_path or not os.path.exists(asset.storage_path):
        raise HTTPException(status_code=404, detail="File missing on server")

    return FileResponse(
        path=asset.storage_path,
        media_type=asset.mime_type or "application/octet-stream",
        filename=asset.original_name,
    )

