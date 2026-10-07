# Data Retention, Privacy & Audit Security Policy

## 1. Executive Summary & Privacy Principles
The **Corporate Software Developer Assessment Portal (V1)** enforces strict data minimization, role-based access restrictions, and privacy-preserving audit logging.

In compliance with modern institutional data protection standards, Candidate IP addresses, network telemetry, and evaluation logs are captured strictly for security auditing and malpractice verification, and are never exposed across candidate dashboards or standard tutor operational views.

---

## 2. Telemetry & IP Address Collection

### 2.1 What is Collected
* **Network Identifier**: Client IP address (captured from verified reverse-proxy headers `X-Forwarded-For` / standard socket metadata).
* **User Agent**: Client browser and OS runtime signature.
* **Timestamp**: ISO 8601 UTC timestamp of the assessment lifecycle event.

### 2.2 Legitimate Operational Purpose
* Detection of concurrent multi-session logins.
* Detection of network hijacking or unauthorized remote proxy usage during high-stakes recruitment assessments.
* Forensic audit trail in the event of disputed submission timestamps or network disconnection incidents.

### 2.3 Access Restrictions
* **Candidate View**: Candidates have **zero access** to raw network telemetry or IP audit logs.
* **Tutor Dashboard**: Standard tutor performance, cohort, and 360° analytics views do **not** display IP addresses or network logs. Tutors see only competency scores, submission outputs, accuracy rates, and time taken.
* **Security & Admin View**: Only users with explicit `Administrator` privileges can view the dedicated `security_audit_events` ledger for forensics.

---

## 3. Separation of Audit Event Streams

The system separates high-volume assessment lifecycle events from high-priority security events:

### Stream A: Assessment Lifecycle Audit (`assessment_audits`)
Logs state transitions of candidate assessment attempts:
* `ASSESSMENT_STARTED`: Candidate initiated a round attempt.
* `QUESTION_VIEWED`: Candidate loaded a specific question.
* `ANSWER_SAVED`: Candidate autosaved a draft answer/code snippet.
* `QUESTION_MARKED_REVIEW`: Candidate flagged a question for review.
* `CODE_EXECUTED`: Candidate triggered an isolated sandbox test execution.
* `SUBMISSION_CREATED`: Candidate submitted a formal test attempt.
* `ASSESSMENT_SUBMITTED`: Candidate completed the round.
* `ASSESSMENT_EXPIRED`: Candidate session timed out automatically.
* `EVALUATION_COMPLETED`: Automated evaluation engine finalized scores.

### Stream B: Security Audit Events (`security_audit_events`)
Logs critical security anomalies and authorization violations:
* `AUTHENTICATION_FAILURE`: Invalid institutional token or credentials.
* `AUTHORIZATION_FAILURE`: Attempt to access resources outside tutor/student scope.
* `INVALID_ATTEMPT_ACCESS`: Student attempted to access or mutate an attempt owned by another candidate.
* `SUSPICIOUS_REQUEST`: Malformed payload or tampered client identifiers.
* `RATE_LIMIT_TRIGGERED`: Rapid automated polling or replay attack detected.

---

## 4. Data Retention & Purging Schedule

| Data Category | Storage Location | Retention Period | Deletion / Purging Strategy |
| :--- | :--- | :--- | :--- |
| **Candidate Responses & Code** | `assessment_responses`, `coding_submissions` | 3 Years | Archived after active academic cycle |
| **Competency & Final Scores** | `assessment_results`, `competency_scores` | Permanent | Immutable historical record |
| **Assessment Lifecycle Audits** | `assessment_audits` | 1 Year | Automated rolling vacuum/purge |
| **Security Audit Logs (IPs)** | `security_audit_events` | 180 Days | Purged automatically after 6 months |
| **Sandboxed Ephemeral Files** | Sandbox container workspace | **Instant** | Purged immediately upon test completion |
| **Identity Metadata Cache** | In-memory Redis/RAM Cache | **15 Minutes** | Expired automatically (TTL) |

---

## 5. Non-Collection & Security Guarantees
* **No Password Storage**: The Assessment Portal never collects, handles, or stores plaintext passwords or password hashes. Authentication is validated strictly via the Existing NASC Portal integration client.
* **No Secret Leakage**: The database and API endpoints never log database connection strings, JWT signing keys, candidate secrets, or hidden question test cases.
