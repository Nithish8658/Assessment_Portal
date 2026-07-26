import sys
import os
import datetime
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy.orm import Session
from app.database import engine, SessionLocal, Base
from app.models.models import (
    Role, User, School, Department, Programme, AcademicYear, Semester, Batch, Section,
    StudentProfile, FacultyProfile, Course, CourseAllocation, CourseEnrolment,
    ProgrammeOutcome, ProgrammeSpecificOutcome, CourseOutcome, COPOMapping,
    Question, QuestionOption, QuestionPaper, QuestionPaperQuestion,
    Assessment, AssessmentAttempt, StudentAnswer, Assignment, AssignmentSubmission,
    Rubric, RubricCriteria, RubricLevel, Mark, Result, Notification, AuditLog
)
from app.auth.jwt import get_password_hash

def seed_database():
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    
    db: Session = SessionLocal()
    try:
        print("Seeding NASC Assessment Portal Data...")
        
        # 1. Roles
        role_names = ["Student", "Faculty", "Class Tutor", "HoD", "Assessment Coordinator", "Administrator"]
        roles_dict = {}
        for rname in role_names:
            role = Role(name=rname, description=f"{rname} role permissions")
            db.add(role)
            roles_dict[rname] = role
        db.flush()
        
        # 2. Master Academic Infrastructure
        school = School(code="SOCS", name="School of Computer Studies")
        db.add(school)
        db.flush()
        
        d_cs = Department(code="CS", name="Department of Computer Science & Applications", school_id=school.id)
        d_com = Department(code="COM", name="Department of Commerce", school_id=school.id)
        d_mat = Department(code="MAT", name="Department of Mathematics", school_id=school.id)
        db.add_all([d_cs, d_com, d_mat])
        db.flush()
        
        p_bca = Programme(code="BCA", name="Bachelor of Computer Applications", degree_type="UG", department_id=d_cs.id, duration_years=3)
        p_bcom = Programme(code="BCOM", name="Bachelor of Commerce", degree_type="UG", department_id=d_com.id, duration_years=3)
        p_bsc_m = Programme(code="BSCM", name="Bachelor of Science in Mathematics", degree_type="UG", department_id=d_mat.id, duration_years=3)
        db.add_all([p_bca, p_bcom, p_bsc_m])
        db.flush()
        
        ay = AcademicYear(year_code="2025-2026", is_current=True)
        sem = Semester(number=4, name="Semester IV", academic_year="2025-2026")
        batch = Batch(name="2023-2026", start_year=2023, end_year=2026)
        sec = Section(name="A")
        db.add_all([ay, sem, batch, sec])
        db.flush()

        # 3. Programme Outcomes (POs)
        pos = []
        po_texts = [
            ("PO1", "Disciplinary Knowledge: Demonstrate comprehensive knowledge of computer science/applications."),
            ("PO2", "Problem Analysis: Identify, formulate, and analyze complex academic and real-world problems."),
            ("PO3", "Design & Development: Design solutions for complex computing problems meeting specified needs."),
            ("PO4", "Conduct Investigations: Use research-based knowledge and methods to analyze data."),
            ("PO5", "Modern Tool Usage: Apply appropriate modern IT tools and technical resources.")
        ]
        for code, stmt in po_texts:
            po = ProgrammeOutcome(code=code, statement=stmt, programme_id=p_bca.id)
            db.add(po)
            pos.append(po)
        db.flush()

        # 4. Courses & COs
        courses_data = [
            ("23BCA401", "Data Structures & Algorithms", "Theory", 4.0, 4, p_bca.id),
            ("23BCA402", "Web Technology & Frameworks", "Theory + Practical", 4.0, 4, p_bca.id),
            ("23BCA403", "Database Management Systems", "Theory", 4.0, 4, p_bca.id),
            ("23BCA404", "Python Programming Lab", "Practical", 2.0, 4, p_bca.id),
            ("23BCOM401", "Corporate Accounting", "Theory", 4.0, 4, p_bcom.id),
            ("23BCOM402", "Financial Management", "Theory", 4.0, 4, p_bcom.id),
            ("23BSCM401", "Abstract Algebra", "Theory", 4.0, 4, p_bsc_m.id),
            ("23BSCM402", "Real Analysis", "Theory", 4.0, 4, p_bsc_m.id),
            ("23BCA405", "Value Added Course: AI Ethics", "Value Added Course", 2.0, 4, p_bca.id),
            ("23BCA406", "Software Engineering Project", "Project", 4.0, 4, p_bca.id)
        ]
        courses = []
        for code, title, ctype, creds, sem_n, pid in courses_data:
            c = Course(code=code, title=title, course_type=ctype, credits=creds, semester_num=sem_n, programme_id=pid)
            db.add(c)
            courses.append(c)
        db.flush()
        
        # Course Outcomes for Course 1 (Data Structures)
        ds_course = courses[0]
        cos = []
        co_texts = [
            ("CO1", "Understand linear data structures like Arrays, Stacks, and Queues.", "Understand"),
            ("CO2", "Apply Linked Lists and Trees for efficient data representation.", "Apply"),
            ("CO3", "Analyze Graph traversal algorithms and shortest path methods.", "Analyze"),
            ("CO4", "Evaluate Sorting and Searching algorithm time complexities.", "Evaluate"),
            ("CO5", "Design dynamic memory allocation solutions for complex systems.", "Create")
        ]
        for code, stmt, bloom in co_texts:
            co = CourseOutcome(code=code, statement=stmt, bloom_level=bloom, course_id=ds_course.id)
            db.add(co)
            cos.append(co)
        db.flush()
        
        # Map COs to POs
        for idx, co in enumerate(cos):
            mapping = COPOMapping(co_id=co.id, po_id=pos[idx % len(pos)].id, weightage=3)
            db.add(mapping)

        # 5. Core Institutional Demo Accounts
        # Admin
        u_admin = User(username="admin", email="admin@nasccbe.ac.in", full_name="Dr. K. Rajkumar (Administrator)", hashed_password=get_password_hash("admin123"))
        u_admin.roles.append(roles_dict["Administrator"])
        
        # HoD
        u_hod = User(username="hod.cs", email="hod.cs@nasccbe.ac.in", full_name="Dr. S. Meenakshi (HoD CS)", hashed_password=get_password_hash("hod123"))
        u_hod.roles.append(roles_dict["HoD"])
        u_hod.roles.append(roles_dict["Faculty"])
        
        # Coordinator
        u_coord = User(username="coord.eval", email="coord@nasccbe.ac.in", full_name="Prof. R. Vance (Controller of Assessment)", hashed_password=get_password_hash("coord123"))
        u_coord.roles.append(roles_dict["Assessment Coordinator"])

        # Class Tutor
        u_tutor = User(username="tutor.cs", email="tutor.cs@nasccbe.ac.in", full_name="Prof. M. Selvam (Class Tutor)", hashed_password=get_password_hash("tutor123"))
        u_tutor.roles.append(roles_dict["Class Tutor"])
        u_tutor.roles.append(roles_dict["Faculty"])

        # Faculty Members (10 Faculty)
        faculty_users = [u_hod, u_tutor]
        faculty_profiles = []
        
        fac_names = [
            ("faculty.smith", "Prof. John Smith", "Assistant Professor", d_cs.id),
            ("faculty.anita", "Dr. Anita Sharma", "Associate Professor", d_cs.id),
            ("faculty.ramesh", "Dr. N. Ramesh", "Professor", d_com.id),
            ("faculty.kavitha", "Prof. P. Kavitha", "Assistant Professor", d_com.id),
            ("faculty.sundar", "Dr. V. Sundaram", "Associate Professor", d_mat.id),
            ("faculty.geetha", "Prof. R. Geetha", "Assistant Professor", d_mat.id),
            ("faculty.vijay", "Dr. M. Vijay", "Assistant Professor", d_cs.id),
            ("faculty.deepa", "Prof. S. Deepa", "Assistant Professor", d_cs.id)
        ]
        
        for idx, (uname, fname, desig, deptid) in enumerate(fac_names):
            fu = User(username=uname, email=f"{uname}@nasccbe.ac.in", full_name=fname, hashed_password=get_password_hash("faculty123"))
            fu.roles.append(roles_dict["Faculty"])
            faculty_users.append(fu)
            
        db.add_all(faculty_users + [u_admin, u_coord])
        db.flush()
        
        for idx, fu in enumerate(faculty_users):
            dept_id = d_cs.id if idx % 2 == 0 else d_com.id
            fp = FacultyProfile(user_id=fu.id, employee_id=f"EMP{1001+idx}", designation="Assistant Professor", department_id=dept_id)
            db.add(fp)
            faculty_profiles.append(fp)
        db.flush()

        # Allocate Courses to Faculty
        for idx, course in enumerate(courses):
            fac = faculty_profiles[idx % len(faculty_profiles)]
            alloc = CourseAllocation(faculty_id=fac.id, course_id=course.id, academic_year="2025-2026", semester_num=4, section_name="A")
            db.add(alloc)
        db.flush()

        # 6. Students (60 Students)
        students = []
        student_users = []
        for i in range(1, 61):
            if i <= 25:
                reg = f"23UBCA{i:03d}"
                name = f"Student BCA {i}"
                prog_id = p_bca.id
            elif i <= 45:
                reg = f"23UBCOM{i-25:03d}"
                name = f"Student Commerce {i-25}"
                prog_id = p_bcom.id
            else:
                reg = f"23UMAT{i-45:03d}"
                name = f"Student Maths {i-45}"
                prog_id = p_bsc_m.id
                
            pwd = get_password_hash("student123")
            su = User(username=reg, email=f"{reg.lower()}@nasccbe.ac.in", full_name=name, hashed_password=pwd)
            su.roles.append(roles_dict["Student"])
            student_users.append(su)
            
        db.add_all(student_users)
        db.flush()
        
        for idx, su in enumerate(student_users):
            reg_num = su.username
            prog_id = p_bca.id if "UBCA" in reg_num else (p_bcom.id if "UBCOM" in reg_num else p_bsc_m.id)
            sp = StudentProfile(user_id=su.id, register_number=reg_num, programme_id=prog_id, batch_name="2023-2026", semester_num=4, section_name="A")
            db.add(sp)
            students.append(sp)
        db.flush()

        # Enrol Students in Courses
        for s in students:
            for c in courses:
                if c.programme_id == s.programme_id:
                    enr = CourseEnrolment(student_id=s.id, course_id=c.id, academic_year="2025-2026")
                    db.add(enr)
        db.flush()

        # 7. Centralized Question Bank
        sample_questions_data = [
            ("What is the time complexity of searching an element in a binary search tree in the worst case?", ds_course.id, 1, 2.0, "Easy", "Remember", "Multiple Choice", cos[0].id, "O(n) in worst case skewed tree",
             [("O(1)", False), ("O(log n)", False), ("O(n)", True), ("O(n log n)", False)]),
             
            ("Which of the following data structures operates on a LIFO (Last In First Out) basis?", ds_course.id, 1, 2.0, "Easy", "Remember", "Multiple Choice", cos[0].id, "Stack operates on LIFO principle.",
             [("Queue", False), ("Stack", True), ("Array", False), ("Linked List", False)]),
             
            ("Explain the working of Quick Sort algorithm with an example partition trace.", ds_course.id, 2, 5.0, "Medium", "Apply", "Descriptive", cos[1].id, "Quick Sort uses divide and conquer algorithm by choosing a pivot.", []),
            
            ("Analyze Dijkstra's algorithm for single-source shortest paths and state its limitation with negative weight edges.", ds_course.id, 3, 10.0, "Hard", "Analyze", "Descriptive", cos[2].id, "Dijkstra cannot handle negative edge weights correctly.", []),
            
            ("Stack overflow occurs when attempting to push onto a full stack. (True/False)", ds_course.id, 1, 1.0, "Easy", "Understand", "True/False", cos[0].id, "True",
             [("True", True), ("False", False)]),
             
            ("Evaluate the trade-offs between dynamic arrays and singly linked lists for frequent insertion at head.", ds_course.id, 4, 5.0, "Hard", "Evaluate", "Descriptive", cos[3].id, "Linked list achieves O(1) head insertion without array resizing overhead.", []),
            
            ("In React, which hook is primarily used for handling side-effects during component rendering lifecycle?", courses[1].id, 1, 2.0, "Medium", "Understand", "Multiple Choice", None, "useEffect hook handles side-effects.",
             [("useState", False), ("useEffect", True), ("useContext", False), ("useReducer", False)])
        ]
        
        q_objs = []
        for qtxt, cid, unit, marks, diff, bloom, qtype, coid, sol, opts in sample_questions_data:
            q = Question(
                question_text=qtxt, course_id=cid, unit=unit, marks=marks, difficulty=diff,
                bloom_level=bloom, question_type=qtype, co_id=coid, solution_answer=sol,
                created_by_id=faculty_users[0].id, status="Active"
            )
            db.add(q)
            db.flush()
            q_objs.append(q)
            
            for otxt, is_corr in opts:
                opt = QuestionOption(question_id=q.id, option_text=otxt, is_correct=is_corr)
                db.add(opt)
        db.flush()

        # 8. Question Paper
        qp = QuestionPaper(
            title="Internal Assessment Test 1 — Data Structures",
            course_id=ds_course.id,
            max_marks=50.0,
            duration_minutes=90,
            created_by_id=faculty_users[0].id,
            status="Approved"
        )
        db.add(qp)
        db.flush()
        
        for order_i, q in enumerate(q_objs[:5]):
            pq = QuestionPaperQuestion(paper_id=qp.id, question_id=q.id, section_name="Section A", order_num=order_i+1)
            db.add(pq)

        # 9. Assessments & Online Attempts
        ass1 = Assessment(
            title="CIA Test I — Data Structures & Algorithms",
            assessment_type="Internal Test 1",
            course_id=ds_course.id,
            max_marks=50.0,
            weightage_percent=20.0,
            duration_minutes=60,
            instructions="Answer all questions carefully. Time limit is 60 minutes.",
            is_online=True,
            status="Published",
            question_paper_id=qp.id,
            created_by_id=faculty_users[0].id
        )
        db.add(ass1)
        db.flush()

        # Create online attempt for first student (23UBCA001)
        st1 = students[0]
        att1 = AssessmentAttempt(
            assessment_id=ass1.id,
            student_id=st1.id,
            start_time=datetime.datetime.utcnow() - datetime.timedelta(minutes=30),
            submit_time=datetime.datetime.utcnow(),
            status="Submitted",
            total_score=42.0
        )
        db.add(att1)
        db.flush()

        # Answers for attempt 1
        ans1 = StudentAnswer(attempt_id=att1.id, question_id=q_objs[0].id, selected_option_id=1, marks_awarded=2.0)
        ans2 = StudentAnswer(attempt_id=att1.id, question_id=q_objs[1].id, selected_option_id=6, marks_awarded=2.0)
        ans3 = StudentAnswer(attempt_id=att1.id, question_id=q_objs[2].id, descriptive_text="Quick sort divides array based on pivot point...", marks_awarded=4.5, evaluator_feedback="Good explanation")
        db.add_all([ans1, ans2, ans3])
        db.flush()

        # 10. Assignments & Rubrics
        rubric = Rubric(title="Technical Documentation Rubric", description="Evaluates technical reports and programming assignments", created_by_id=faculty_users[0].id)
        db.add(rubric)
        db.flush()
        
        rc1 = RubricCriteria(rubric_id=rubric.id, criterion_name="Code Correctness", max_marks=5.0)
        rc2 = RubricCriteria(rubric_id=rubric.id, criterion_name="Documentation & Comments", max_marks=5.0)
        db.add_all([rc1, rc2])
        db.flush()

        asgn1 = Assignment(
            title="Assignment 1: Linked List Implementation in Python",
            description="Implement Singly and Doubly Linked Lists with insertion, deletion, and reverse functions.",
            course_id=ds_course.id,
            max_marks=10.0,
            due_date=datetime.datetime.utcnow() + datetime.timedelta(days=7),
            rubric_id=rubric.id,
            created_by_id=faculty_users[0].id
        )
        db.add(asgn1)
        db.flush()

        asgn_sub = AssignmentSubmission(
            assignment_id=asgn1.id,
            student_id=st1.id,
            submission_text="Here is my Python implementation of Linked List with all operations.",
            status="Evaluated",
            marks_awarded=9.0,
            feedback="Excellent structure and docstrings!"
        )
        db.add(asgn_sub)

        # 11. Marks & Results
        for s in students[:20]:
            m = Mark(
                student_id=s.id,
                course_id=ds_course.id,
                assessment_id=ass1.id,
                marks_obtained=38.0 + (s.id % 12),
                is_absent=False,
                status="Verified"
            )
            db.add(m)
            
            res = Result(
                student_id=s.id,
                course_id=ds_course.id,
                academic_year="2025-2026",
                semester_num=4,
                cia_score=42.0,
                cia_max=50.0,
                percentage=84.0,
                status="Pass",
                is_published=True,
                published_at=datetime.datetime.utcnow()
            )
            db.add(res)

        # 12. Notifications & Audit Logs
        n1 = Notification(user_id=st1.user_id, title="Assessment Published", message="CIA Test I for Data Structures is now live.", type="info")
        n2 = Notification(user_id=faculty_users[0].id, title="Evaluation Required", message="5 student submissions awaiting your evaluation.", type="warning")
        db.add_all([n1, n2])
        
        audit1 = AuditLog(user_id=u_admin.id, action="SYSTEM_INIT", module="System", new_value="NASC Assessment Portal seeded with master demo data.")
        db.add(audit1)

        db.commit()
        print("Database Seeding Completed Successfully!")
    except Exception as e:
        db.rollback()
        print(f"Error seeding database: {e}")
        raise e
    finally:
        db.close()

if __name__ == "__main__":
    seed_database()
