import logging
import json
from app.db.session import SessionLocal, engine, Base
from app.models.user import User, AdminRole
from app.models.core import Organization, Tag
from app.core.security import get_password_hash
import uuid

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# =============================================================================
# 真实演示数据集 (Demo Dataset)
# =============================================================================

# 1. Organizations
# 按 spec 要求，需要 University, University Association, Aid School
# 关键：school_id 的聚合
ORG_DATA = [
    # PKU (北京大学) - Active Board
    {
        "id": "org_uni_pku",
        "type": "university",
        "display_name": "北京大学",
        "school_id": "PKU",
        "certified": True
    },
    {
        "id": "org_assoc_pku",
        "type": "university_association",
        "display_name": "北京大学志愿者协会",
        "school_id": "PKU",
        "certified": True
    },
    # THU (清华大学) - Active Board
    {
        "id": "org_uni_thu",
        "type": "university",
        "display_name": "清华大学",
        "school_id": "THU",
        "certified": True
    },
    {
        "id": "org_assoc_thu",
        "type": "university_association",
        "display_name": "清华大学志愿者协会",
        "school_id": "THU",
        "certified": True
    },
    # FDU (复旦大学) - Only University (No Assoc)
    {
        "id": "org_uni_fdu",
        "type": "university",
        "display_name": "复旦大学",
        "school_id": "FDU",
        "certified": True
    },
    # ZT1Z (昭通一中) - Aid School
    {
        "id": "org_aid_zt1z",
        "type": "aid_school",
        "display_name": "云南省昭通市第一中学",
        "aid_school_id": "ZT1Z",
        "certified": True
    },
    # HQ (协会总号) - No school_id binding
    # Usually HQ doesn't need an Organization entity for "governance" unless it wants to show up in lists,
    # but let's create one for reference if needed.
]

# 2. Users & Roles
USER_DATA = [
    # --- Platform Governance ---
    {
        "id": "superadmin",
        "username": "superadmin",
        "full_name": "平台超级管理员",
        "email": "admin@yunzhijiao.com",
        "role": "governance",
        "is_superuser": True,
        "admin_roles": [
            {"role_code": "superadmin", "organization_id": None}
        ],
        "profile": {"avatar": "/avatars/avatar-09.jpg", "bio": "平台运维与风控"}
    },
    {
        "id": "associationHq1",
        "username": "associationHq1",
        "full_name": "志愿者协会总号",
        "email": "hq@volunteer.org",
        "role": "governance",
        "admin_roles": [
            {"role_code": "association_hq", "organization_id": None}
        ],
        "profile": {"avatar": "/avatars/avatar-09.jpg", "bio": "全国志愿者协会治理"}
    },
    
    # --- PKU Governance ---
    {
        "id": "pku_admin",
        "username": "pku_admin",
        "full_name": "北京大学校级管理",
        "email": "admin@pku.edu.cn",
        "role": "governance",
        "school_id": "PKU",
        "admin_roles": [
            {"role_code": "university_admin", "organization_id": "org_uni_pku"}
        ],
        "profile": {"avatar": "/avatars/avatar-07.jpg", "bio": "北大共学社区管理"}
    },
    {
        "id": "pku_assoc_admin",
        "username": "pku_assoc_admin",
        "full_name": "北京大学志愿者协会",
        "email": "assoc@pku.edu.cn",
        "role": "governance",
        "school_id": "PKU",
        "admin_roles": [
            {"role_code": "university_association_admin", "organization_id": "org_assoc_pku"}
        ],
        "profile": {"avatar": "/avatars/avatar-08.jpg", "bio": "北大志愿讲师与任务管理"}
    },

    # --- ZT1Z Governance ---
    {
        "id": "zt1z_admin",
        "username": "zt1z_admin",
        "full_name": "昭通一中专项管理",
        "email": "aid@zt1z.edu.cn",
        "role": "governance",
        "school_id": "ZT1Z",
        "admin_roles": [
            {"role_code": "aid_school_admin", "organization_id": "org_aid_zt1z"}
        ],
        "profile": {"avatar": "/avatars/avatar-06.jpg", "bio": "专项援助学生批次管理"}
    },

    # --- Students & Teachers (PKU) ---
    {
        "id": "student_pku",
        "username": "student_pku",
        "full_name": "北大赵同学",
        "email": "zhao@pku.edu.cn",
        "role": "university_student",
        "school_id": "PKU",
        "profile": {
            "avatar": "/avatars/avatar-03.jpg", 
            "grade": "大二", 
            "bio": "北大中文系",
            "tags": ["文学", "写作"],
            "verification": {"student": "verified", "teacher": "none"}
        }
    },
    {
        "id": "teacher_pku",
        "username": "teacher_pku",
        "full_name": "北大陈老师",
        "email": "chen@pku.edu.cn",
        "role": "volunteer_teacher",
        "school_id": "PKU",
        "profile": {
            "avatar": "/illustrations/avatar-teacher1.jpg", 
            "grade": "研一", 
            "bio": "数学系研究生",
            "tags": ["数学", "奥数"],
            "verification": {"student": "verified", "teacher": "verified"}
        }
    },

    # --- General Users ---
    {
        "id": "student1",
        "username": "student1",
        "full_name": "李明",
        "email": "liming@example.com",
        "role": "general_student",
        "profile": {
            "avatar": "/illustrations/avatar-student1.jpg",
            "grade": "高二",
            "tags": ["数学", "物理"],
            "verification": {"student": "none", "teacher": "none"}
        }
    },
    {
        "id": "guest",
        "username": "guest",
        "full_name": "游客",
        "email": "guest@example.com",
        "role": "guest",
        "profile": {
            "avatar": "/illustrations/avatar-guest.jpg",
            "bio": "只是来看看",
            "verification": {"student": "none", "teacher": "none"}
        }
    }
]

TAG_DATA = [
    {"name": "数学", "category": "subject"},
    {"name": "物理", "category": "subject"},
    {"name": "英语", "category": "subject"},
    {"name": "编程", "category": "skill"},
    {"name": "高二", "category": "grade"},
    {"name": "升学", "category": "topic"},
    {"name": "心理", "category": "topic"}
]

def init_db():
    logger.info("Creating initial data...")
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    
    try:
        # 1. Create Organizations
        for org_data in ORG_DATA:
            org = db.query(Organization).filter(Organization.id == org_data["id"]).first()
            if not org:
                logger.info(f"Creating org: {org_data['display_name']}")
                org = Organization(**org_data)
                db.add(org)
            else:
                for k, v in org_data.items():
                    setattr(org, k, v)
                db.add(org)
        db.commit()

        # 2. Create Tags
        for tag_data in TAG_DATA:
            tag = db.query(Tag).filter(Tag.name == tag_data["name"]).first()
            if not tag:
                tag = Tag(id=str(uuid.uuid4()), **tag_data)
                db.add(tag)
        db.commit()

        # 3. Create Users & Admin Roles
        for user_data in USER_DATA:
            user = db.query(User).filter(User.username == user_data["username"]).first()
            logger.info(f"Upserting user: {user_data['username']}")

            admin_roles_data = user_data.get("admin_roles", [])
            profile_data = user_data.get("profile", {})

            if not user:
                user = User(id=user_data["id"], username=user_data["username"])

            user.email = user_data["email"]
            user.full_name = user_data["full_name"]
            user.hashed_password = get_password_hash("123456")
            user.role = user_data["role"]
            user.school_id = user_data.get("school_id")
            user.is_superuser = user_data.get("is_superuser", False)
            user.onboarding_status = "approved"
            user.profile = json.dumps(profile_data, ensure_ascii=False)

            db.add(user)
            db.commit()

            existing_roles = {(r.role_code, r.organization_id) for r in user.admin_roles}
            for role_data in admin_roles_data:
                key = (role_data.get("role_code"), role_data.get("organization_id"))
                if key in existing_roles:
                    continue
                admin_role = AdminRole(
                    id=str(uuid.uuid4()),
                    user_id=user.id,
                    role_code=role_data["role_code"],
                    organization_id=role_data.get("organization_id"),
                )
                db.add(admin_role)
            db.commit()
                
        logger.info("Initialization completed successfully!")
        
    except Exception as e:
        logger.error(f"Error during initialization: {e}")
        db.rollback()
        raise e
    finally:
        db.close()

if __name__ == "__main__":
    init_db()
