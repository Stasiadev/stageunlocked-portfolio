"""
Zephyr — HR & People Operations Platform
FastAPI Backend

Endpoints:
  GET    /api/employees                              — All employees (filterable)
  GET    /api/employees/{id}                         — Single employee
  POST   /api/employees                              — Add employee
  PATCH  /api/employees/{id}/status                 — Update employee status
  GET    /api/onboarding                             — All onboarding records
  GET    /api/onboarding/{employee_id}              — Single onboarding record
  PATCH  /api/onboarding/{employee_id}/tasks/{task_id} — Complete/uncomplete task
  GET    /api/leave                                  — All leave requests (filterable)
  POST   /api/leave                                  — Submit leave request
  PATCH  /api/leave/{id}/status                     — Approve or deny request
  GET    /api/analytics                              — Headcount analytics

Run locally:
  pip install -r requirements.txt
  uvicorn main:app --reload --port 8001

Docs at: http://localhost:8001/docs
"""

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from typing import Optional
from datetime import datetime
import math

from models import (
    Employee, EmployeeStatus, Department,
    OnboardingRecord, UpdateTaskRequest,
    LeaveRequest, LeaveStatus,
    CreateEmployeeRequest, UpdateEmployeeStatusRequest,
    CreateLeaveRequest, UpdateLeaveStatusRequest,
    AnalyticsSummary, DepartmentCount, SeniorityCount,
)
from data import (
    EMPLOYEES, ONBOARDING, LEAVE_REQUESTS,
    get_next_employee_id, get_next_leave_id,
)

app = FastAPI(
    title="Zephyr HR API",
    description="HR and people operations backend for Zephyr by Stage Labs",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ─── Employee endpoints ───────────────────────────────────────────────────────

@app.get("/api/employees", response_model=list[Employee], tags=["Employees"])
async def get_employees(
    dept: Optional[Department] = Query(None, description="Filter by department"),
    status: Optional[EmployeeStatus] = Query(None, description="Filter by status"),
    search: Optional[str] = Query(None, description="Search by name or role"),
):
    """
    Return all employees.
    Supports filtering by department, status, and name/role search.
    """
    results = EMPLOYEES.copy()

    if dept:
        results = [e for e in results if e.dept == dept]

    if status:
        results = [e for e in results if e.status == status]

    if search:
        query = search.lower()
        results = [
            e for e in results
            if query in e.name.lower() or query in e.role.lower()
        ]

    return results


@app.get("/api/employees/{employee_id}", response_model=Employee, tags=["Employees"])
async def get_employee(employee_id: int):
    """Return a single employee by ID."""
    employee = next((e for e in EMPLOYEES if e.id == employee_id), None)
    if not employee:
        raise HTTPException(status_code=404, detail=f"Employee {employee_id} not found")
    return employee


@app.post("/api/employees", response_model=Employee, status_code=201, tags=["Employees"])
async def create_employee(body: CreateEmployeeRequest):
    """
    Add a new employee.
    New employees always start with onboarding status.
    """
    # Check for duplicate email
    existing = next((e for e in EMPLOYEES if e.email == body.email.lower()), None)
    if existing:
        raise HTTPException(
            status_code=409,
            detail=f"An employee with email {body.email} already exists"
        )

    # Generate avatar initials from name
    name_parts = body.name.strip().split()
    avatar = "".join(p[0].upper() for p in name_parts[:2])

    # Format join date
    joined = datetime.now().strftime("%b %Y")

    new_employee = Employee(
        id=get_next_employee_id(),
        name=body.name,
        role=body.role,
        dept=body.dept,
        location=body.location,
        email=body.email.lower(),
        phone=body.phone,
        joined=joined,
        status=EmployeeStatus.onboarding,
        avatar=avatar,
        color="#6366F1",  # default indigo
        level=body.level,
        manager=body.manager,
    )

    EMPLOYEES.append(new_employee)
    return new_employee


@app.patch(
    "/api/employees/{employee_id}/status",
    response_model=Employee,
    tags=["Employees"]
)
async def update_employee_status(employee_id: int, body: UpdateEmployeeStatusRequest):
    """Update an employee's status."""
    employee = next((e for e in EMPLOYEES if e.id == employee_id), None)
    if not employee:
        raise HTTPException(status_code=404, detail=f"Employee {employee_id} not found")

    employee.status = body.status
    return employee


# ─── Onboarding endpoints ─────────────────────────────────────────────────────

@app.get("/api/onboarding", response_model=list[OnboardingRecord], tags=["Onboarding"])
async def get_all_onboarding():
    """Return all active onboarding records."""
    return _with_computed_progress(ONBOARDING)


@app.get(
    "/api/onboarding/{employee_id}",
    response_model=OnboardingRecord,
    tags=["Onboarding"]
)
async def get_onboarding_record(employee_id: int):
    """Return the onboarding record for a specific employee."""
    record = next((r for r in ONBOARDING if r.employee_id == employee_id), None)
    if not record:
        raise HTTPException(
            status_code=404,
            detail=f"No onboarding record found for employee {employee_id}"
        )
    return _compute_progress(record)


@app.patch(
    "/api/onboarding/{employee_id}/tasks/{task_id}",
    response_model=OnboardingRecord,
    tags=["Onboarding"]
)
async def update_onboarding_task(
    employee_id: int,
    task_id: int,
    body: UpdateTaskRequest,
):
    """Mark an onboarding task as complete or incomplete."""
    record = next((r for r in ONBOARDING if r.employee_id == employee_id), None)
    if not record:
        raise HTTPException(
            status_code=404,
            detail=f"No onboarding record found for employee {employee_id}"
        )

    task = next((t for t in record.tasks if t.id == task_id), None)
    if not task:
        raise HTTPException(
            status_code=404,
            detail=f"Task {task_id} not found in onboarding record"
        )

    task.done = body.done
    return _compute_progress(record)


def _compute_progress(record: OnboardingRecord) -> OnboardingRecord:
    """Recalculate progress percentage from task completion state."""
    completed = sum(1 for t in record.tasks if t.done)
    record.progress_pct = math.floor((completed / len(record.tasks)) * 100)
    return record


def _with_computed_progress(records: list[OnboardingRecord]) -> list[OnboardingRecord]:
    return [_compute_progress(r) for r in records]


# ─── Leave endpoints ──────────────────────────────────────────────────────────

@app.get("/api/leave", response_model=list[LeaveRequest], tags=["Leave"])
async def get_leave_requests(
    status: Optional[LeaveStatus] = Query(None, description="Filter by status"),
    employee: Optional[str] = Query(None, description="Filter by employee name"),
):
    """
    Return all leave requests.
    Supports filtering by status and employee name.
    """
    results = LEAVE_REQUESTS.copy()

    if status:
        results = [r for r in results if r.status == status]

    if employee:
        results = [r for r in results if employee.lower() in r.employee.lower()]

    return results


@app.post("/api/leave", response_model=LeaveRequest, status_code=201, tags=["Leave"])
async def create_leave_request(body: CreateLeaveRequest):
    """
    Submit a new leave request.
    All new requests start with pending status.
    """
    # Validate employee exists
    employee_exists = any(
        body.employee.lower() in e.name.lower() for e in EMPLOYEES
    )
    if not employee_exists:
        raise HTTPException(
            status_code=404,
            detail=f"Employee '{body.employee}' not found"
        )

    new_request = LeaveRequest(
        id=get_next_leave_id(),
        employee=body.employee,
        type=body.type,
        start=body.start,
        end=body.end,
        days=body.days,
        status=LeaveStatus.pending,
    )

    LEAVE_REQUESTS.append(new_request)
    return new_request


@app.patch(
    "/api/leave/{request_id}/status",
    response_model=LeaveRequest,
    tags=["Leave"]
)
async def update_leave_status(request_id: int, body: UpdateLeaveStatusRequest):
    """
    Approve or deny a leave request.
    Only pending requests can be approved or denied.
    """
    request = next((r for r in LEAVE_REQUESTS if r.id == request_id), None)
    if not request:
        raise HTTPException(
            status_code=404,
            detail=f"Leave request {request_id} not found"
        )

    if request.status != LeaveStatus.pending:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot update a request that is already '{request.status}'"
        )

    request.status = body.status
    return request


# ─── Analytics endpoint ───────────────────────────────────────────────────────

@app.get("/api/analytics", response_model=AnalyticsSummary, tags=["Analytics"])
async def get_analytics():
    """Return headcount and leave analytics."""
    dept_counts: dict[str, int] = {}
    seniority_counts: dict[str, int] = {}

    for emp in EMPLOYEES:
        dept_counts[emp.dept.value] = dept_counts.get(emp.dept.value, 0) + 1
        seniority_counts[emp.level.value] = seniority_counts.get(emp.level.value, 0) + 1

    return AnalyticsSummary(
        total_headcount=len(EMPLOYEES),
        active_count=sum(1 for e in EMPLOYEES if e.status == EmployeeStatus.active),
        onboarding_count=sum(1 for e in EMPLOYEES if e.status == EmployeeStatus.onboarding),
        on_leave_count=sum(1 for e in EMPLOYEES if e.status == EmployeeStatus.leave),
        by_department=[
            DepartmentCount(dept=dept, count=count)
            for dept, count in sorted(dept_counts.items(), key=lambda x: x[1], reverse=True)
        ],
        by_seniority=[
            SeniorityCount(level=level, count=count)
            for level, count in seniority_counts.items()
        ],
        pending_leave_requests=sum(1 for r in LEAVE_REQUESTS if r.status == LeaveStatus.pending),
        approved_leave_requests=sum(1 for r in LEAVE_REQUESTS if r.status == LeaveStatus.approved),
    )


# ─── Health check ─────────────────────────────────────────────────────────────

@app.get("/health", tags=["System"])
async def health_check():
    """Confirm the API is running."""
    return {
        "status": "ok",
        "service": "Zephyr HR API",
        "version": "1.0.0",
    }
