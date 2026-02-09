from typing import Optional, List
from pydantic import BaseModel
from datetime import datetime

# =============================================================================
# 管理员与组织入驻数据模式 (Admin Schemas)
# =============================================================================

# Admin Onboarding Request
class AdminOnboardingRequestBase(BaseModel):
    org_type: str
    school_name: str
    association_name: Optional[str] = None
    contact_name: str
    contact_email: str
    contact_phone: Optional[str] = None
    evidence_refs: Optional[str] = None # JSON string

class AdminOnboardingRequestCreate(AdminOnboardingRequestBase):
    pass

class AdminOnboardingRequestUpdate(BaseModel):
    status: str # approved, rejected
    rejected_reason: Optional[str] = None

class AdminOnboardingRequest(AdminOnboardingRequestBase):
    id: str
    user_id: str
    status: str
    reviewed_by: Optional[str] = None
    reviewed_at: Optional[datetime] = None
    rejected_reason: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

# Admin Role Creation (Superadmin creates admin directly)
class AdminRoleCreate(BaseModel):
    username: str
    password: str
    email: str
    full_name: str
    role_code: str # university_admin, etc.
    organization_id: Optional[str] = None # If null, create new org based on org_data
    
    # If organization_id is null, provide org data to create one
    org_type: Optional[str] = None
    school_id: Optional[str] = None # PKU
    org_display_name: Optional[str] = None

class AdminUserResponse(BaseModel):
    id: str
    username: str
    full_name: str
    email: str
    admin_roles: List[dict]


class OrganizationRef(BaseModel):
    id: str
    type: str
    display_name: Optional[str] = None
    school_id: Optional[str] = None
    aid_school_id: Optional[str] = None


class AdminRoleOut(BaseModel):
    role_code: str
    organization_id: Optional[str] = None
    organization: Optional[OrganizationRef] = None


class UserAccountResponse(BaseModel):
    id: str
    username: str
    full_name: Optional[str] = None
    email: Optional[str] = None
    role: str
    is_active: bool
    is_superuser: bool
    onboarding_status: str
    school_id: Optional[str] = None
    organization_id: Optional[str] = None
    admin_roles: List[AdminRoleOut]
