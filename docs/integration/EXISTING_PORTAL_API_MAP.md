# Existing NASC Portal — API Integration Map

## 1. Overview
This document defines the exact contract of every external API exposed by the **Existing NASC Portal** (FastAPI backend running on PostgreSQL 16.12 at `http://localhost:8000`) consumed by the new standalone **Corporate Assessment Portal**.

---

## 2. Authentication & Identity APIs

### 2.1 User Login
* **Endpoint**: `POST /api/v1/auth/login`
* **Purpose**: Authenticate an existing institutional user (Student, Class Tutor, HoD, Faculty, Administrator) using single source-of-truth credentials.
* **Authentication**: None (Public)
* **Request Headers**: `Content-Type: application/json`
* **Request Schema**:
  ```json
  {
    "username": "25UGCI001",
    "password": "initial_password_or_user_password"
  }
  ```
* **Response Schema (200 OK)**:
  ```json
  {
    "access_token": "eyJhbGciOiJIUzI1NiIsIn...",
    "token_type": "bearer",
    "user_id": 6,
    "username": "25UGCI001",
    "full_name": "Abdul Basith A",
    "roles": ["Student"],
    "student_id": 1,
    "faculty_id": null,
    "assigned_class_name": "II-B.Com IT",
    "assigned_class_code": "2025-B.COM IT",
    "assigned_programme_name": "Bachelor of Commerce Information technology",
    "assigned_programme_code": "B.COM IT",
    "assigned_batch": "2025-2028",
    "assigned_section": "A",
    "assigned_department_name": "B.Com IT & M.COM FC"
  }
  ```
* **Error Responses**:
  - `401 Unauthorized`: `{"detail": "Incorrect username or password"}`
  - `403 Forbidden`: `{"detail": "User account is inactive. Please contact administrator."}`
* **Source File**: [`backend/app/routers/auth.py`](file:///c:/Users/HP/Desktop/Assessment_Portal/backend/app/routers/auth.py#L65)
* **Used By**: Assessment Portal Login, Authenticated Handoff

---

### 2.2 Authenticated User Profile (`/auth/me`)
* **Endpoint**: `GET /api/v1/auth/me`
* **Purpose**: Retrieve authenticated user identity, role claims, and academic assignment metadata.
* **Authentication**: Bearer JWT (`Authorization: Bearer <token>`)
* **Request Headers**: `Authorization: Bearer <access_token>`
* **Response Schema (200 OK)**:
  ```json
  {
    "id": 6,
    "username": "25UGCI001",
    "email": "abdulbashida001.bcomit25@nehrucolleges.com",
    "full_name": "Abdul Basith A",
    "mobile": null,
    "is_active": true,
    "roles": ["Student"],
    "student_id": 1,
    "faculty_id": null,
    "assigned_class_name": "II-B.Com IT",
    "assigned_class_code": "2025-B.COM IT",
    "assigned_programme_name": "Bachelor of Commerce Information technology",
    "assigned_programme_code": "B.COM IT",
    "assigned_batch": "2025-2028",
    "assigned_section": "A",
    "assigned_department_name": "B.Com IT & M.COM FC"
  }
  ```
* **Error Responses**:
  - `401 Unauthorized`: `{"detail": "Could not validate credentials"}`
* **Source File**: [`backend/app/routers/auth.py`](file:///c:/Users/HP/Desktop/Assessment_Portal/backend/app/routers/auth.py#L112)
* **Used By**: Student Dashboard, Tutor Workspace, Assessment Eligibility Guard

---

## 3. Student Roster APIs

### 3.1 Student Roster Listing
* **Endpoint**: `GET /api/v1/users/students`
* **Purpose**: Retrieve institutional student roster with register numbers and class information.
* **Authentication**: Bearer JWT (`Authorization: Bearer <token>`)
* **Query Parameters**:
  - `programme_id` (Optional[int])
  - `department_id` (Optional[int])
  - `batch_name` (Optional[str])
  - `section_name` (Optional[str])
  - `search` (Optional[str])
* **Scoped Authorization**:
  - **Administrator**: Accesses all students across the institution.
  - **HoD**: Automatically scoped to students within the HoD's department.
  - **Class Tutor**: Automatically scoped to students in the tutor's assigned `(programme_id, batch, section)`.
* **Response Schema (200 OK)**:
  ```json
  [
    {
      "id": 1,
      "user_id": 6,
      "register_number": "25UGCI001",
      "full_name": "Abdul Basith A",
      "email": "abdulbashida001.bcomit25@nehrucolleges.com",
      "programme_name": "Bachelor of Commerce Information technology",
      "programme_code": "B.COM IT",
      "batch_name": "2025-2028",
      "semester_num": 3,
      "section_name": "A",
      "status": "Active"
    }
  ]
  ```
* **Source File**: [`backend/app/routers/users.py`](file:///c:/Users/HP/Desktop/Assessment_Portal/backend/app/routers/users.py#L50)
* **Used By**: Tutor Dashboard, Student Performance Matrix, Cohort Analytics

---

## 4. Faculty & Tutor APIs

### 4.1 Faculty & Tutor Listing
* **Endpoint**: `GET /api/v1/users/faculty`
* **Purpose**: Retrieve faculty members, designations, department associations, and class tutor assignments.
* **Authentication**: Bearer JWT (`Authorization: Bearer <token>`)
* **Query Parameters**: `department_id` (Optional[int])
* **Response Schema (200 OK)**:
  ```json
  [
    {
      "id": 7,
      "user_id": 55,
      "employee_id": "e6504",
      "full_name": "Prof. Tutor Name",
      "email": "tutor@nasccbe.ac.in",
      "designation": "Class Tutor",
      "department_name": "Department of IOT and AIML",
      "department_id": 4,
      "status": "Active",
      "allocated_courses": ["23IOT012 (Artificial intelligence)"],
      "assigned_programme_id": 3,
      "assigned_programme_code": "BSCIOT",
      "assigned_programme_name": "Bachelor of IOT",
      "assigned_batch": "2024-2027",
      "assigned_section": "A"
    }
  ]
  ```
* **Source File**: [`backend/app/routers/users.py`](file:///c:/Users/HP/Desktop/Assessment_Portal/backend/app/routers/users.py#L110)
* **Used By**: Tutor Management, Role Permission Validation

---

## 5. Academic Master APIs

### 5.1 Departments
* **Endpoint**: `GET /api/v1/master/departments`
* **Response Schema (200 OK)**:
  ```json
  [
    {
      "id": 1,
      "code": "COM",
      "name": "B.Com IT & M.COM FC",
      "school_name": "School of Computer Science",
      "programme_count": 1,
      "faculty_count": 1,
      "hod_id": 5,
      "hod_name": "HOD Test 2"
    }
  ]
  ```
* **Source File**: [`backend/app/routers/master.py`](file:///c:/Users/HP/Desktop/Assessment_Portal/backend/app/routers/master.py#L23)

### 5.2 Programmes
* **Endpoint**: `GET /api/v1/master/programmes`
* **Query Parameters**: `department_id` (Optional[int])
* **Response Schema (200 OK)**:
  ```json
  [
    {
      "id": 2,
      "code": "B.COM IT",
      "name": "Bachelor of Commerce Information technology",
      "degree_type": "UG",
      "department_name": "B.Com IT & M.COM FC",
      "department_id": 1,
      "duration_years": 3,
      "course_count": 2,
      "student_count": 48
    }
  ]
  ```
* **Source File**: [`backend/app/routers/master.py`](file:///c:/Users/HP/Desktop/Assessment_Portal/backend/app/routers/master.py#L77)

### 5.3 Academic Classes
* **Endpoint**: `GET /api/v1/master/classes`
* **Response Schema (200 OK)**:
  ```json
  [
    {
      "id": 2,
      "class_code": "2025-B.COM IT",
      "name": "II-B.Com IT",
      "programme_id": 2,
      "programme_name": "Bachelor of Commerce Information technology",
      "batch_name": "2025-2028",
      "semester_num": 3,
      "section_name": "A",
      "tutor_id": 7,
      "tutor_name": "Class Tutor Name"
    }
  ]
  ```
* **Source File**: [`backend/app/routers/master.py`](file:///c:/Users/HP/Desktop/Assessment_Portal/backend/app/routers/master.py#L210)

### 5.4 Courses
* **Endpoint**: `GET /api/v1/master/courses`
* **Response Schema (200 OK)**:
  ```json
  [
    {
      "id": 2,
      "code": "25U5CIC303",
      "title": "Python Programming",
      "course_type": "Theory",
      "credits": 4.0,
      "semester_num": 3,
      "regulation": "2025",
      "programme_id": 2
    }
  ]
  ```
* **Source File**: [`backend/app/routers/master.py`](file:///c:/Users/HP/Desktop/Assessment_Portal/backend/app/routers/master.py#L140)

---

## 6. Integration Reliability & Network Policies

* **Base URL**: `http://localhost:8000` (configurable via `EXISTING_PORTAL_API_URL`)
* **HTTP Client**: `httpx` (Async HTTP Client with connection pooling)
* **Timeout**:
  - Connect Timeout: `3.0s`
  - Read/Write Timeout: `5.0s`
* **Retry Policy**:
  - Max Retries: `3`
  - Backoff Factor: `0.5s` exponential backoff
  - Idempotent Methods Only: Retries strictly applied to `GET` and safe queries. `POST`/state-mutating calls are never automatically retried.
* **Circuit Breaker**: Returns cached academic metadata (TTL: 5 minutes) when institutional master services undergo transient downtime.
