"""
Zephyr HR Platform — In-Memory Data Store
In production this would be a PostgreSQL database with SQLAlchemy ORM.
State resets on server restart — intended for demo and portfolio purposes.
"""

from models import (
    Employee, EmployeeStatus, SeniorityLevel, Department,
    OnboardingRecord, OnboardingTask,
    LeaveRequest, LeaveType, LeaveStatus,
)

EMPLOYEES: list[Employee] = [
    Employee(id=1,  name="Jordan Pierce",   role="Senior Engineer",     dept=Department.engineering, location="Atlanta, GA",  email="j.pierce@co.io",   phone="404-555-0182", joined="Jan 2022", status=EmployeeStatus.active,      avatar="JP", color="#0EA5E9", level=SeniorityLevel.senior,  manager="Alex Kim"),
    Employee(id=2,  name="Camille Dubois",  role="Product Designer",    dept=Department.design,      location="Remote",       email="c.dubois@co.io",   phone="404-555-0241", joined="Mar 2021", status=EmployeeStatus.active,      avatar="CD", color="#D4178A", level=SeniorityLevel.mid,     manager="Sam Torres"),
    Employee(id=3,  name="Marcus Webb",     role="Data Analyst",        dept=Department.analytics,   location="New York, NY", email="m.webb@co.io",     phone="212-555-0198", joined="Jun 2023", status=EmployeeStatus.active,      avatar="MW", color="#F59E0B", level=SeniorityLevel.junior,  manager="Jordan Pierce"),
    Employee(id=4,  name="Priya Sharma",    role="Engineering Manager", dept=Department.engineering, location="Atlanta, GA",  email="p.sharma@co.io",   phone="404-555-0317", joined="Aug 2020", status=EmployeeStatus.active,      avatar="PS", color="#10B981", level=SeniorityLevel.manager, manager="Alex Kim"),
    Employee(id=5,  name="Devon Carter",    role="UX Researcher",       dept=Department.design,      location="Remote",       email="d.carter@co.io",   phone="404-555-0429", joined="Nov 2022", status=EmployeeStatus.leave,       avatar="DC", color="#8B5CF6", level=SeniorityLevel.mid,     manager="Sam Torres"),
    Employee(id=6,  name="Aisha Okonkwo",   role="Frontend Engineer",   dept=Department.engineering, location="Chicago, IL",  email="a.okonkwo@co.io",  phone="312-555-0156", joined="Feb 2024", status=EmployeeStatus.onboarding,  avatar="AO", color="#F97316", level=SeniorityLevel.junior,  manager="Priya Sharma"),
    Employee(id=7,  name="Lucas Ferreira",  role="Growth Marketer",     dept=Department.marketing,   location="Remote",       email="l.ferreira@co.io", phone="404-555-0538", joined="Sep 2021", status=EmployeeStatus.active,      avatar="LF", color="#0EA5E9", level=SeniorityLevel.senior,  manager="Sam Torres"),
    Employee(id=8,  name="Naomi Osei",      role="Backend Engineer",    dept=Department.engineering, location="Atlanta, GA",  email="n.osei@co.io",     phone="404-555-0617", joined="Apr 2023", status=EmployeeStatus.active,      avatar="NO", color="#10B981", level=SeniorityLevel.mid,     manager="Priya Sharma"),
]

ONBOARDING: list[OnboardingRecord] = [
    OnboardingRecord(
        employee_id=6,
        employee_name="Aisha Okonkwo",
        role="Frontend Engineer",
        start_date="Jul 7, 2026",
        progress_pct=65,
        tasks=[
            OnboardingTask(id=1, label="IT Setup & Equipment",        done=True),
            OnboardingTask(id=2, label="System Access & Credentials", done=True),
            OnboardingTask(id=3, label="Benefits Enrollment",         done=True),
            OnboardingTask(id=4, label="Meet Your Team",              done=False),
            OnboardingTask(id=5, label="30-Day Check-In",             done=False),
            OnboardingTask(id=6, label="First Project Assignment",    done=False),
        ]
    )
]

LEAVE_REQUESTS: list[LeaveRequest] = [
    LeaveRequest(id=1, employee="Devon Carter",   type=LeaveType.parental,  start="Jun 15", end="Aug 15", days=43, status=LeaveStatus.approved),
    LeaveRequest(id=2, employee="Marcus Webb",    type=LeaveType.vacation,  start="Jul 20", end="Jul 27", days=5,  status=LeaveStatus.pending),
    LeaveRequest(id=3, employee="Lucas Ferreira", type=LeaveType.sick,      start="Jul 10", end="Jul 11", days=2,  status=LeaveStatus.approved),
    LeaveRequest(id=4, employee="Naomi Osei",     type=LeaveType.personal,  start="Jul 18", end="Jul 18", days=1,  status=LeaveStatus.pending),
]

# Auto-increment counters
_next_employee_id: int = 9
_next_leave_id: int = 5

def get_next_employee_id() -> int:
    global _next_employee_id
    current = _next_employee_id
    _next_employee_id += 1
    return current

def get_next_leave_id() -> int:
    global _next_leave_id
    current = _next_leave_id
    _next_leave_id += 1
    return current
