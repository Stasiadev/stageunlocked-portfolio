"""
Zephyr HR Platform — Pydantic Models
All request and response shapes for the Zephyr API.
"""

from pydantic import BaseModel, EmailStr, field_validator
from typing import Optional
from enum import Enum


# ─── Enums ────────────────────────────────────────────────────────────────────

class EmployeeStatus(str, Enum):
    active = "active"
    leave = "leave"
    onboarding = "onboarding"


class SeniorityLevel(str, Enum):
    junior = "Junior"
    mid = "Mid"
    senior = "Senior"
    manager = "Manager"


class Department(str, Enum):
    engineering = "Engineering"
    design = "Design"
    analytics = "Analytics"
    marketing = "Marketing"


class LeaveType(str, Enum):
    vacation = "Vacation"
    sick = "Sick Leave"
    parental = "Parental Leave"
    personal = "Personal Day"


class LeaveStatus(str, Enum):
    pending = "pending"
    approved = "approved"
    denied = "denied"


class TaskStatus(str, Enum):
    complete = "complete"
    incomplete = "incomplete"


# ─── Employee models ──────────────────────────────────────────────────────────

class Employee(BaseModel):
    id: int
    name: str
    role: str
    dept: Department
    location: str
    email: str
    phone: str
    joined: str
    status: EmployeeStatus
    avatar: str
    color: str
    level: SeniorityLevel
    manager: str


class CreateEmployeeRequest(BaseModel):
    name: str
    role: str
    dept: Department
    location: str
    email: str
    phone: str
    level: SeniorityLevel
    manager: str

    @field_validator("name")
    @classmethod
    def name_must_not_be_empty(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("Name cannot be empty")
        return v.strip()

    @field_validator("email")
    @classmethod
    def email_must_be_valid(cls, v: str) -> str:
        if "@" not in v:
            raise ValueError("Invalid email address")
        return v.lower()


class UpdateEmployeeStatusRequest(BaseModel):
    status: EmployeeStatus


# ─── Onboarding models ────────────────────────────────────────────────────────

class OnboardingTask(BaseModel):
    id: int
    label: str
    done: bool


class OnboardingRecord(BaseModel):
    employee_id: int
    employee_name: str
    role: str
    start_date: str
    tasks: list[OnboardingTask]
    progress_pct: int


class UpdateTaskRequest(BaseModel):
    done: bool


# ─── Leave models ─────────────────────────────────────────────────────────────

class LeaveRequest(BaseModel):
    id: int
    employee: str
    type: LeaveType
    start: str
    end: str
    days: int
    status: LeaveStatus


class CreateLeaveRequest(BaseModel):
    employee: str
    type: LeaveType
    start: str
    end: str
    days: int

    @field_validator("days")
    @classmethod
    def days_must_be_positive(cls, v: int) -> int:
        if v < 1:
            raise ValueError("Leave must be at least 1 day")
        return v


class UpdateLeaveStatusRequest(BaseModel):
    status: LeaveStatus


# ─── Analytics models ─────────────────────────────────────────────────────────

class DepartmentCount(BaseModel):
    dept: str
    count: int


class SeniorityCount(BaseModel):
    level: str
    count: int


class AnalyticsSummary(BaseModel):
    total_headcount: int
    active_count: int
    onboarding_count: int
    on_leave_count: int
    by_department: list[DepartmentCount]
    by_seniority: list[SeniorityCount]
    pending_leave_requests: int
    approved_leave_requests: int
