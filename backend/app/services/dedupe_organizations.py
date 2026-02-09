from __future__ import annotations

from collections import defaultdict

from sqlalchemy.orm import Session

from app.models.core import Organization
from app.models.user import AdminRole, User, VerificationRequest
from app.models.content import CampusPost, CampusTopic
from app.models.association import AssociationRuleSet, AssociationTask
from app.models.core import Announcement


def dedupe_organizations(db: Session, dry_run: bool = True) -> dict:
    orgs = db.query(Organization).filter(Organization.type == "university").all()
    by_name: dict[str, list[Organization]] = defaultdict(list)
    for o in orgs:
        if not o.display_name:
            continue
        by_name[o.display_name.strip()].append(o)

    groups = {k: v for k, v in by_name.items() if len(v) > 1}
    changes: dict[str, dict] = {}
    for display_name, items in groups.items():
        canonical = None
        for o in items:
            if o.school_id and o.school_id.strip() == display_name:
                canonical = o
                break
        canonical = canonical or sorted(items, key=lambda x: (x.created_at is None, x.created_at))[0]
        canonical_school_id = canonical.school_id
        if not canonical_school_id:
            continue

        merged = []
        for dup in items:
            if dup.id == canonical.id:
                continue
            if not dup.school_id or dup.school_id == canonical_school_id:
                continue

            old_school_id = dup.school_id
            merged.append({"from_org_id": dup.id, "from_school_id": old_school_id})

            if not dry_run:
                db.query(User).filter(User.school_id == old_school_id).update({User.school_id: canonical_school_id})
                db.query(VerificationRequest).filter(VerificationRequest.target_school_id == old_school_id).update(
                    {VerificationRequest.target_school_id: canonical_school_id}
                )
                db.query(CampusTopic).filter(CampusTopic.school_id == old_school_id).update(
                    {CampusTopic.school_id: canonical_school_id}
                )
                db.query(CampusPost).filter(CampusPost.school_id == old_school_id).update(
                    {CampusPost.school_id: canonical_school_id}
                )
                db.query(AssociationTask).filter(AssociationTask.school_id == old_school_id).update(
                    {AssociationTask.school_id: canonical_school_id}
                )
                db.query(AssociationRuleSet).filter(AssociationRuleSet.school_id == old_school_id).update(
                    {AssociationRuleSet.school_id: canonical_school_id}
                )
                db.query(Announcement).filter(Announcement.school_id == old_school_id).update(
                    {Announcement.school_id: canonical_school_id}
                )
                db.query(Organization).filter(Organization.type == "university_association").filter(
                    Organization.school_id == old_school_id
                ).update({Organization.school_id: canonical_school_id})

                db.query(AdminRole).filter(AdminRole.role_code == "university_admin").filter(
                    AdminRole.organization_id == dup.id
                ).update({AdminRole.organization_id: canonical.id})

                db.delete(dup)

        if merged:
            changes[display_name] = {
                "canonical_org_id": canonical.id,
                "canonical_school_id": canonical_school_id,
                "merged": merged,
            }

    if not dry_run:
        db.commit()

    return {"dry_run": dry_run, "groups": len(groups), "changes": changes}

