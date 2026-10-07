"""
Migration Script: Seed 60 Curated C Debugging Questions into Round 25 (C Track, Round 4)
Replaces the legacy question bank with 60 standardized questions across 3 complexity levels:
- Level 1: Questions 1–20 (Easy / Very Easy)
- Level 2: Questions 21–45 (Medium)
- Level 3: Questions 46–60 (Hard)
Each question includes the title, problem description, buggy starter code template, and the debug hint.
"""

from app.database import SessionLocal
from app.models.assessment_models import (
    AssessmentRound,
    AssessmentQuestion,
    QuestionEvaluationConfig,
    Competency
)

QUESTIONS_DATA = [
    # ==========================================
    # Level 1 — Easy / Very Easy (Questions 1–20)
    # ==========================================
    {
        "num": 1,
        "title": "Find the Largest Number",
        "difficulty": "Easy",
        "problem": "Find the largest of two integers.",
        "code": """#include <stdio.h>

int main() {
    int a = 10, b = 20;

    if (a > b);
        printf("Largest = %d", a);
    else
        printf("Largest = %d", b);

    return 0;
}""",
        "debug_hint": "The program does not behave according to the if-else condition. Inspect the line with if (a > b);."
    },
    {
        "num": 2,
        "title": "Check Even or Odd",
        "difficulty": "Easy",
        "problem": "Determine whether a given integer is even or odd.",
        "code": """#include <stdio.h>

int main() {
    int n = 15;

    if (n % 2 = 0)
        printf("Even");
    else
        printf("Odd");

    return 0;
}""",
        "debug_hint": "Find the mistake in the condition. Check the difference between assignment and equality."
    },
    {
        "num": 3,
        "title": "Sum of Two Numbers",
        "difficulty": "Easy",
        "problem": "Read two integers and print their sum.",
        "code": """#include <stdio.h>

int main() {
    int a, b, sum;

    printf("Enter two numbers: ");
    scanf("%d %d", a, b);

    sum = a + b;

    printf("Sum = %d", sum);

    return 0;
}""",
        "debug_hint": "The program may crash or behave unpredictably when reading input. Check address arguments in scanf."
    },
    {
        "num": 4,
        "title": "Positive, Negative or Zero",
        "difficulty": "Easy",
        "problem": "Determine whether a number is positive, negative, or zero.",
        "code": """#include <stdio.h>

int main() {
    int n = -5;

    if (n > 0)
        printf("Positive");
    else if (n < 0);
        printf("Negative");
    else
        printf("Zero");

    return 0;
}""",
        "debug_hint": "The output is incorrect for some inputs. Watch for unexpected punctuation ending the else-if clause."
    },
    {
        "num": 5,
        "title": "Calculate Area of a Circle",
        "difficulty": "Easy",
        "problem": "Calculate the area of a circle using its radius.",
        "code": """#include <stdio.h>

int main() {
    float radius = 5;
    float area;

    area = 3.14 * radius * radius;

    printf("Area = %d", area);

    return 0;
}""",
        "debug_hint": "Find the formatting error. Check the printf conversion specifier for a float variable."
    },
    {
        "num": 6,
        "title": "Print Numbers 1 to 10",
        "difficulty": "Easy",
        "problem": "Print numbers from 1 to 10.",
        "code": """#include <stdio.h>

int main() {
    int i;

    for (i = 1; i < 10; i++)
        printf("%d ", i);

    return 0;
}""",
        "debug_hint": "The required final number is missing. Check the upper boundary condition of the for loop."
    },
    {
        "num": 7,
        "title": "Sum Numbers from 1 to N",
        "difficulty": "Easy",
        "problem": "Calculate the sum of numbers from 1 to N.",
        "code": """#include <stdio.h>

int main() {
    int n = 5;
    int sum;

    for (int i = 1; i <= n; i++)
        sum = sum + i;

    printf("Sum = %d", sum);

    return 0;
}""",
        "debug_hint": "The result is unpredictable. Ensure accumulator variables are initialized before accumulation."
    },
    {
        "num": 8,
        "title": "Factorial",
        "difficulty": "Easy",
        "problem": "Calculate the factorial of a number.",
        "code": """#include <stdio.h>

int main() {
    int n = 5;
    int fact = 0;

    for (int i = 1; i <= n; i++)
        fact = fact * i;

    printf("Factorial = %d", fact);

    return 0;
}""",
        "debug_hint": "The factorial is always incorrect. Multiplication by zero neutralizes subsequent products."
    },
    {
        "num": 9,
        "title": "Reverse a Number",
        "difficulty": "Easy",
        "problem": "Reverse the digits of an integer.",
        "code": """#include <stdio.h>

int main() {
    int n = 1234;
    int rev = 0;

    while (n > 0) {
        int digit = n % 10;
        rev = rev + digit;
        n = n / 10;
    }

    printf("Reverse = %d", rev);

    return 0;
}""",
        "debug_hint": "The program calculates the wrong result. The existing reversed digits must shift left in base 10."
    },
    {
        "num": 10,
        "title": "Check Prime Number",
        "difficulty": "Easy",
        "problem": "Determine whether a number is prime.",
        "code": """#include <stdio.h>

int main() {
    int n = 7;
    int prime = 1;

    for (int i = 2; i < n; i++) {
        if (n % i == 0)
            prime = 0;
        else
            prime = 1;
    }

    if (prime)
        printf("Prime");
    else
        printf("Not Prime");

    return 0;
}""",
        "debug_hint": "Some composite numbers are incorrectly identified as prime. The loop overwrites previous factor discoveries."
    },
    {
        "num": 11,
        "title": "Find Maximum in Array",
        "difficulty": "Easy",
        "problem": "Find the largest element in an array.",
        "code": """#include <stdio.h>

int main() {
    int arr[] = {10, 25, 5, 40, 15};
    int max = 0;

    for (int i = 0; i <= 5; i++) {
        if (arr[i] > max)
            max = arr[i];
    }

    printf("Maximum = %d", max);

    return 0;
}""",
        "debug_hint": "Identify the array-boundary error. An array of 5 elements is indexed from 0 to 4."
    },
    {
        "num": 12,
        "title": "Calculate Array Sum",
        "difficulty": "Easy",
        "problem": "Find the sum of all elements in an array.",
        "code": """#include <stdio.h>

int main() {
    int arr[] = {1, 2, 3, 4, 5};
    int sum = 0;

    for (int i = 0; i < 6; i++)
        sum += arr[i];

    printf("Sum = %d", sum);

    return 0;
}""",
        "debug_hint": "The loop accesses memory outside the array. Check the total number of elements in the array declaration."
    },
    {
        "num": 13,
        "title": "Print Array in Reverse",
        "difficulty": "Easy",
        "problem": "Print the elements of an array in reverse order.",
        "code": """#include <stdio.h>

int main() {
    int arr[] = {10, 20, 30, 40, 50};

    for (int i = 5; i >= 0; i--)
        printf("%d ", arr[i]);

    return 0;
}""",
        "debug_hint": "Find the invalid array index. A 5-element array does not have an element at index 5."
    },
    {
        "num": 14,
        "title": "Search an Element",
        "difficulty": "Easy",
        "problem": "Search for 30 in an array.",
        "code": """#include <stdio.h>

int main() {
    int arr[] = {10, 20, 30, 40, 50};
    int target = 30;
    int found = 0;

    for (int i = 0; i < 5; i++) {
        if (arr[i] = target) {
            found = 1;
            break;
        }
    }

    if (found)
        printf("Found");
    else
        printf("Not Found");

    return 0;
}""",
        "debug_hint": "The search condition contains a logical error. Use the comparison operator instead of assignment."
    },
    {
        "num": 15,
        "title": "Count Even Numbers",
        "difficulty": "Easy",
        "problem": "Count the number of even elements in an array.",
        "code": """#include <stdio.h>

int main() {
    int arr[] = {2, 5, 8, 9, 10};
    int count;

    for (int i = 0; i < 5; i++) {
        if (arr[i] % 2 == 0)
            count++;
    }

    printf("Even count = %d", count);

    return 0;
}""",
        "debug_hint": "The counter produces an unpredictable result. Local variables in C contain arbitrary garbage unless initialized."
    },
    {
        "num": 16,
        "title": "String Length",
        "difficulty": "Easy",
        "problem": "Find the length of a string without using strlen().",
        "code": """#include <stdio.h>

int main() {
    char str[] = "Hello";
    int length = 0;

    while (str[length] != '\\0');
        length++;

    printf("Length = %d", length);

    return 0;
}""",
        "debug_hint": "The program does not terminate correctly. Check if an unintentional semicolon creates an infinite loop."
    },
    {
        "num": 17,
        "title": "Copy a String",
        "difficulty": "Easy",
        "problem": "Copy one string into another without using strcpy().",
        "code": """#include <stdio.h>

int main() {
    char source[] = "Hello";
    char destination[20];
    int i;

    for (i = 0; source[i] != '\\0'; i++)
        destination[i] = source[i];

    printf("%s", destination);

    return 0;
}""",
        "debug_hint": "The copied string is not properly terminated. Null-terminate the destination string at index i after copying."
    },
    {
        "num": 18,
        "title": "Compare Two Strings",
        "difficulty": "Easy",
        "problem": "Determine whether two strings are equal without using strcmp().",
        "code": """#include <stdio.h>

int main() {
    char a[] = "hello";
    char b[] = "hello";
    int equal = 1;

    for (int i = 0; a[i] != '\\0'; i++) {
        if (a[i] != b[i])
            equal = 0;
    }

    if (equal)
        printf("Equal");
    else
        printf("Not Equal");

    return 0;
}""",
        "debug_hint": "Identify the missing condition that can cause incorrect results. Check what happens if string b is longer than a."
    },
    {
        "num": 19,
        "title": "Swap Two Numbers",
        "difficulty": "Easy",
        "problem": "Swap two integers using a function.",
        "code": """#include <stdio.h>

void swap(int a, int b) {
    int temp = a;
    a = b;
    b = temp;
}

int main() {
    int x = 10, y = 20;

    swap(x, y);

    printf("%d %d", x, y);

    return 0;
}""",
        "debug_hint": "The swap appears to execute but the values in main() do not change. C passes arguments by value."
    },
    {
        "num": 20,
        "title": "Find Second Largest",
        "difficulty": "Easy",
        "problem": "Find the second-largest element in an array.",
        "code": """#include <stdio.h>

int main() {
    int arr[] = {10, 20, 5, 40, 30};
    int largest = arr[0];
    int second = arr[0];

    for (int i = 1; i < 5; i++) {
        if (arr[i] > largest) {
            second = largest;
            largest = arr[i];
        }
    }

    printf("Second Largest = %d", second);

    return 0;
}""",
        "debug_hint": "The program fails for certain array arrangements. What happens if an element is less than largest but greater than second?"
    },

    # ==========================================
    # Level 2 — Medium (Questions 21–45)
    # ==========================================
    {
        "num": 21,
        "title": "Reverse an Array In-Place",
        "difficulty": "Medium",
        "problem": "Reverse an array without using another array.",
        "code": """#include <stdio.h>

int main() {
    int arr[] = {1, 2, 3, 4, 5};
    int n = 5;

    for (int i = 0; i < n; i++) {
        int temp = arr[i];
        arr[i] = arr[n - i];
        arr[n - i] = temp;
    }

    for (int i = 0; i < n; i++)
        printf("%d ", arr[i]);

    return 0;
}""",
        "debug_hint": "Identify the incorrect index and loop condition. Iterate only up to n/2 and use index n - 1 - i."
    },
    {
        "num": 22,
        "title": "Find Missing Number",
        "difficulty": "Medium",
        "problem": "An array contains numbers from 1 to N, with one number missing.",
        "code": """#include <stdio.h>

int main() {
    int arr[] = {1, 2, 4, 5};
    int n = 5;
    int sum = 0;

    for (int i = 0; i < n; i++)
        sum += arr[i];

    int expected = n * (n - 1) / 2;
    printf("Missing = %d", expected - sum);

    return 0;
}""",
        "debug_hint": "The expected sum calculation is incorrect. The sum of integers 1 to N is N * (N + 1) / 2."
    },
    {
        "num": 23,
        "title": "Move Zeros to End",
        "difficulty": "Medium",
        "problem": "Move all zeros to the end while preserving the order of non-zero elements.",
        "code": """#include <stdio.h>

int main() {
    int arr[] = {0, 1, 0, 3, 12};
    int n = 5;
    int pos = 0;

    for (int i = 0; i < n; i++) {
        if (arr[i] == 0)
            arr[pos++] = arr[i];
    }

    for (int i = 0; i < n; i++)
        printf("%d ", arr[i]);

    return 0;
}""",
        "debug_hint": "The algorithm places the wrong values into the front of the array. Collect non-zeros first, then fill remainder with zeros."
    },
    {
        "num": 24,
        "title": "Count Duplicate Elements",
        "difficulty": "Medium",
        "problem": "Count how many duplicate values exist in an array.",
        "code": """#include <stdio.h>

int main() {
    int arr[] = {1, 2, 2, 3, 4, 4};
    int n = 6;
    int count = 0;

    for (int i = 0; i < n; i++) {
        for (int j = i + 1; j < n; j++) {
            if (arr[i] = arr[j])
                count++;
        }
    }

    printf("Duplicates = %d", count);

    return 0;
}""",
        "debug_hint": "Identify the operator causing the incorrect comparison. An assignment modifies arr[i] rather than comparing values."
    },
    {
        "num": 25,
        "title": "Bubble Sort",
        "difficulty": "Medium",
        "problem": "Sort an array in ascending order using bubble sort.",
        "code": """#include <stdio.h>

int main() {
    int arr[] = {5, 2, 8, 1, 3};
    int n = 5;

    for (int i = 0; i < n; i++) {
        for (int j = 0; j < n; j++) {
            if (arr[j] > arr[j + 1]) {
                int temp = arr[j];
                arr[j] = arr[j + 1];
                arr[j + 1] = temp;
            }
        }
    }

    for (int i = 0; i < n; i++)
        printf("%d ", arr[i]);

    return 0;
}""",
        "debug_hint": "Find the condition that causes out-of-bounds access. When j == n - 1, arr[j + 1] references illegal memory."
    },
    {
        "num": 26,
        "title": "Binary Search",
        "difficulty": "Medium",
        "problem": "Search for a target in a sorted array using binary search.",
        "code": """#include <stdio.h>

int main() {
    int arr[] = {10, 20, 30, 40, 50};
    int low = 0, high = 4;
    int target = 40;

    while (low <= high) {
        int mid = low + high / 2;

        if (arr[mid] == target) {
            printf("Found");
            return 0;
        }
        else if (arr[mid] < target)
            low = mid + 1;
        else
            high = mid - 1;
    }

    printf("Not Found");

    return 0;
}""",
        "debug_hint": "The middle-index calculation is incorrect. Division has higher precedence than addition: use (low + high) / 2."
    },
    {
        "num": 27,
        "title": "Recursive Factorial",
        "difficulty": "Medium",
        "problem": "Calculate factorial recursively.",
        "code": """#include <stdio.h>

int factorial(int n) {
    if (n == 1)
        return 1;

    return n * factorial(n + 1);
}

int main() {
    printf("%d", factorial(5));
    return 0;
}""",
        "debug_hint": "The recursive call does not approach the base case. It increments instead of decrementing toward 1."
    },
    {
        "num": 28,
        "title": "Recursive Fibonacci",
        "difficulty": "Medium",
        "problem": "Return the Nth Fibonacci number.",
        "code": """#include <stdio.h>

int fibonacci(int n) {
    if (n == 0)
        return 0;

    if (n == 1)
        return 1;

    return fibonacci(n - 1) + fibonacci(n - 1);
}

int main() {
    printf("%d", fibonacci(6));
    return 0;
}""",
        "debug_hint": "Identify the incorrect recursive expression. Fibonacci is the sum of the preceding two distinct terms (n - 1) and (n - 2)."
    },
    {
        "num": 29,
        "title": "Swap Using Pointers",
        "difficulty": "Medium",
        "problem": "Swap two numbers using pointers.",
        "code": """#include <stdio.h>

void swap(int *a, int *b) {
    int temp = *a;
    *a = *b;
    b = &temp;
}

int main() {
    int x = 10, y = 20;

    swap(&x, &y);

    printf("%d %d", x, y);

    return 0;
}""",
        "debug_hint": "The second value is not updated correctly. Dereference pointer b (*b = temp) instead of repointing local pointer variable b."
    },
    {
        "num": 30,
        "title": "Dynamic Array Allocation",
        "difficulty": "Medium",
        "problem": "Dynamically allocate memory for five integers and store values.",
        "code": """#include <stdio.h>
#include <stdlib.h>

int main() {
    int *arr = malloc(5);

    for (int i = 0; i < 5; i++)
        arr[i] = i + 1;

    for (int i = 0; i < 5; i++)
        printf("%d ", arr[i]);

    free(arr);

    return 0;
}""",
        "debug_hint": "Find the memory-allocation error. malloc(5) allocates 5 bytes, whereas 5 integers require 5 * sizeof(int) bytes."
    },
    {
        "num": 31,
        "title": "Create a Node",
        "difficulty": "Medium",
        "problem": "Create a linked-list node dynamically.",
        "code": """#include <stdio.h>
#include <stdlib.h>

struct Node {
    int data;
    struct Node *next;
};

int main() {
    struct Node *newNode;

    newNode->data = 10;
    newNode->next = NULL;

    printf("%d", newNode->data);

    return 0;
}""",
        "debug_hint": "The pointer is used before valid memory is allocated. Allocate memory via malloc(sizeof(struct Node))."
    },
    {
        "num": 32,
        "title": "Insert at Beginning",
        "difficulty": "Medium",
        "problem": "Insert a new node at the beginning of a linked list.",
        "code": """#include <stdio.h>
#include <stdlib.h>

struct Node {
    int data;
    struct Node *next;
};

struct Node* insertBeginning(struct Node *head, int value) {
    struct Node *newNode = malloc(sizeof(struct Node));

    newNode->data = value;
    head = newNode;

    return head;
}""",
        "debug_hint": "The newly created node does not properly connect to the existing list. Set newNode->next = head before updating head."
    },
    {
        "num": 33,
        "title": "Traverse a Linked List",
        "difficulty": "Medium",
        "problem": "Print all nodes in a linked list.",
        "code": """#include <stdio.h>

struct Node {
    int data;
    struct Node *next;
};

void display(struct Node *head) {
    while (head->next != NULL) {
        printf("%d ", head->data);
        head = head->next;
    }
}""",
        "debug_hint": "The final node is not displayed. The loop condition terminates prematurely before printing the last element."
    },
    {
        "num": 34,
        "title": "Delete First Node",
        "difficulty": "Medium",
        "problem": "Delete the first node from a linked list.",
        "code": """#include <stdio.h>
#include <stdlib.h>

struct Node {
    int data;
    struct Node *next;
};

struct Node* deleteFirst(struct Node *head) {
    if (head == NULL)
        return NULL;

    free(head);

    head = head->next;

    return head;
}""",
        "debug_hint": "A freed pointer is being accessed. Store head->next in a temporary pointer before calling free(head)."
    },
    {
        "num": 35,
        "title": "Find Length of Linked List",
        "difficulty": "Medium",
        "problem": "Count the number of nodes.",
        "code": """#include <stdio.h>

struct Node {
    int data;
    struct Node *next;
};

int length(struct Node *head) {
    int count = 0;

    while (head != NULL) {
        count++;
        head = head->next;
        head = head->next;
    }

    return count;
}""",
        "debug_hint": "The function does not count every node. head is advanced twice per iteration."
    },
    {
        "num": 36,
        "title": "Reverse Linked List",
        "difficulty": "Medium",
        "problem": "Reverse a singly linked list.",
        "code": """#include <stdio.h>

struct Node {
    int data;
    struct Node *next;
};

struct Node* reverse(struct Node *head) {
    struct Node *prev = NULL;
    struct Node *current = head;

    while (current != NULL) {
        current = current->next;
        current->next = prev;
        prev = current;
    }

    return prev;
}""",
        "debug_hint": "The current node is lost before its pointer is changed. Use a next temporary pointer to retain the unreversed chain."
    },
    {
        "num": 37,
        "title": "Search Linked List",
        "difficulty": "Medium",
        "problem": "Search for a value in a linked list.",
        "code": """#include <stdio.h>

struct Node {
    int data;
    struct Node *next;
};

int search(struct Node *head, int key) {
    while (head != NULL) {
        if (head->data = key)
            return 1;

        head = head->next;
    }

    return 0;
}""",
        "debug_hint": "Identify the comparison error. Assignment (=) overwrites the node data and always evaluates truthy."
    },
    {
        "num": 38,
        "title": "Insert at End",
        "difficulty": "Medium",
        "problem": "Insert a new node at the end of a linked list.",
        "code": """#include <stdio.h>
#include <stdlib.h>

struct Node {
    int data;
    struct Node *next;
};

struct Node* insertEnd(struct Node *head, int value) {
    struct Node *newNode = malloc(sizeof(struct Node));
    newNode->data = value;
    newNode->next = NULL;

    struct Node *temp = head;

    while (temp->next != NULL)
        temp = temp->next;

    temp = newNode;

    return head;
}""",
        "debug_hint": "The new node is not actually attached to the list. Assign temp->next = newNode rather than overwriting temp."
    },
    {
        "num": 39,
        "title": "Find Middle Node",
        "difficulty": "Medium",
        "problem": "Find the middle node using slow and fast pointers.",
        "code": """#include <stdio.h>

struct Node {
    int data;
    struct Node *next;
};

struct Node* findMiddle(struct Node *head) {
    struct Node *slow = head;
    struct Node *fast = head;

    while (fast != NULL) {
        slow = slow->next;
        fast = fast->next;
    }

    return slow;
}""",
        "debug_hint": "The fast pointer does not move at the required speed. Advance fast by two steps: fast = fast->next->next."
    },
    {
        "num": 40,
        "title": "Detect Cycle",
        "difficulty": "Medium",
        "problem": "Detect whether a linked list contains a cycle.",
        "code": """#include <stdio.h>

struct Node {
    int data;
    struct Node *next;
};

int hasCycle(struct Node *head) {
    struct Node *slow = head;
    struct Node *fast = head;

    while (fast != NULL && fast->next != NULL) {
        slow = slow->next;
        fast = fast->next;

        if (slow == fast)
            return 1;
    }

    return 0;
}""",
        "debug_hint": "The algorithm is close to correct. Floyd's cycle detector requires fast to advance by two nodes each iteration."
    },
    {
        "num": 41,
        "title": "Stack Push",
        "difficulty": "Medium",
        "problem": "Implement push() for an array-based stack.",
        "code": """#include <stdio.h>

#define SIZE 5

int stack[SIZE];
int top = -1;

void push(int value) {
    if (top == SIZE)
        printf("Stack Overflow");
    else
        stack[top++] = value;
}""",
        "debug_hint": "Identify both the overflow condition and indexing problem. Overflow occurs at top == SIZE - 1, and pre-increment stack[++top] is needed."
    },
    {
        "num": 42,
        "title": "Stack Pop",
        "difficulty": "Medium",
        "problem": "Remove and return the top element.",
        "code": """#include <stdio.h>

#define SIZE 5

int stack[SIZE];
int top = -1;

int pop() {
    if (top == -1)
        return -1;

    return stack[top--];
}""",
        "debug_hint": "Check stack indexing and decrement semantics to ensure the current valid top element is accessed before decrementing."
    },
    {
        "num": 43,
        "title": "Queue Enqueue",
        "difficulty": "Medium",
        "problem": "Insert an element into an array-based queue.",
        "code": """#include <stdio.h>

#define SIZE 5

int queue[SIZE];
int front = 0;
int rear = 0;

void enqueue(int value) {
    if (rear == SIZE)
        printf("Queue Full");
    else
        queue[rear] = value;
}""",
        "debug_hint": "The queue's rear position is not updated. Increment rear after placing the element into queue[rear++]."
    },
    {
        "num": 44,
        "title": "Queue Dequeue",
        "difficulty": "Medium",
        "problem": "Remove an element from a queue.",
        "code": """#include <stdio.h>

#define SIZE 5

int queue[SIZE];
int front = 0;
int rear = 0;

int dequeue() {
    if (front == rear)
        return -1;

    return queue[front++];
}""",
        "debug_hint": "Analyze whether this implementation correctly handles queue state after repeated operations. Linear queues without index resets become permanently exhausted."
    },
    {
        "num": 45,
        "title": "Parentheses Matching",
        "difficulty": "Medium",
        "problem": "Use a stack to check whether parentheses are balanced.",
        "code": """#include <stdio.h>

int isMatching(char *str) {
    for (int i = 0; str[i] != '\\0'; i++) {
        if (str[i] == '(')
            push(str[i]);

        else if (str[i] == ')') {
            if (pop() != '(')
                return 0;
        }
    }

    return 1;
}""",
        "debug_hint": "Find the case where the program incorrectly reports balanced parentheses when unmatched opening brackets remain on stack."
    },

    # ==========================================
    # Level 3 — Hard (Questions 46–60)
    # ==========================================
    {
        "num": 46,
        "title": "Remove Duplicates from Sorted Linked List",
        "difficulty": "Hard",
        "problem": "Remove duplicate nodes from a sorted linked list.",
        "code": """#include <stdio.h>
#include <stdlib.h>

struct Node {
    int data;
    struct Node *next;
};

void removeDuplicates(struct Node *head) {
    struct Node *current = head;

    while (current != NULL) {
        if (current->data == current->next->data) {
            struct Node *temp = current->next;
            current->next = temp->next;
            free(temp);
        }
        else {
            current = current->next;
        }
    }
}""",
        "debug_hint": "Identify the condition that can cause invalid memory access. current->next must be checked for NULL before accessing current->next->data."
    },
    {
        "num": 47,
        "title": "Reverse Linked List Recursively",
        "difficulty": "Hard",
        "problem": "Reverse a linked list using recursion.",
        "code": """#include <stdio.h>

struct Node {
    int data;
    struct Node *next;
};

struct Node* reverse(struct Node *head) {
    if (head == NULL || head->next == NULL)
        return head;

    struct Node *newHead = reverse(head->next);

    head->next->next = head;

    return newHead;
}""",
        "debug_hint": "The reversed list contains a cycle. Set head->next = NULL after repointing head->next->next = head."
    },
    {
        "num": 48,
        "title": "Merge Two Sorted Linked Lists",
        "difficulty": "Hard",
        "problem": "Merge two sorted linked lists into one sorted list.",
        "code": """#include <stdio.h>

struct Node {
    int data;
    struct Node *next;
};

struct Node* merge(struct Node *a, struct Node *b) {
    struct Node *result = NULL;

    while (a != NULL && b != NULL) {
        if (a->data < b->data) {
            result = a;
            a = a->next;
        } else {
            result = b;
            b = b->next;
        }
    }

    return result;
}""",
        "debug_hint": "The algorithm does not preserve all selected nodes. Use a tail pointer to append nodes, or recursion, and attach remaining elements."
    },
    {
        "num": 49,
        "title": "Find Nth Node from End",
        "difficulty": "Hard",
        "problem": "Find the Nth node from the end using two pointers.",
        "code": """#include <stdio.h>

struct Node {
    int data;
    struct Node *next;
};

struct Node* nthFromEnd(struct Node *head, int n) {
    struct Node *first = head;
    struct Node *second = head;

    for (int i = 0; i < n; i++)
        first = first->next;

    while (first != NULL) {
        first = first->next;
        second = second->next;
    }

    return second;
}""",
        "debug_hint": "Analyze what happens when n is greater than the list length. first becomes NULL inside the initial loop, causing a segfault on first->next."
    },
    {
        "num": 50,
        "title": "Detect Starting Point of Cycle",
        "difficulty": "Hard",
        "problem": "Find the node where a linked-list cycle begins.",
        "code": """#include <stdio.h>

struct Node {
    int data;
    struct Node *next;
};

struct Node* cycleStart(struct Node *head) {
    struct Node *slow = head;
    struct Node *fast = head;

    while (fast != NULL && fast->next != NULL) {
        slow = slow->next;
        fast = fast->next->next;

        if (slow == fast)
            break;
    }

    slow = head;

    while (slow != fast) {
        slow = slow->next;
        fast = fast->next;
    }

    return slow;
}""",
        "debug_hint": "What happens when the linked list has no cycle? If fast or fast->next is NULL, slow resets and enters an infinite loop or segfaults."
    },
    {
        "num": 51,
        "title": "Binary Search Tree Insertion",
        "difficulty": "Hard",
        "problem": "Insert a value into a binary search tree.",
        "code": """#include <stdio.h>
#include <stdlib.h>

struct Node {
    int data;
    struct Node *left, *right;
};

struct Node* insert(struct Node *root, int value) {
    if (root == NULL) {
        root->data = value;
        root->left = NULL;
        root->right = NULL;
        return root;
    }

    if (value < root->data)
        root->left = insert(root->left, value);
    else
        root->right = insert(root->right, value);

    return root;
}""",
        "debug_hint": "The program crashes when inserting into an empty tree. root is NULL and cannot be dereferenced without calling malloc."
    },
    {
        "num": 52,
        "title": "BST Search",
        "difficulty": "Hard",
        "problem": "Search for a value in a binary search tree.",
        "code": """#include <stdio.h>

struct Node {
    int data;
    struct Node *left, *right;
};

struct Node* search(struct Node *root, int key) {
    if (root->data == key)
        return root;

    if (key < root->data)
        return search(root->left, key);
    else
        return search(root->right, key);
}""",
        "debug_hint": "Find the missing base case. If root is NULL (key not in tree), dereferencing root->data causes a segmentation fault."
    },
    {
        "num": 53,
        "title": "Tree Height",
        "difficulty": "Hard",
        "problem": "Calculate the height of a binary tree.",
        "code": """#include <stdio.h>

struct Node {
    int data;
    struct Node *left, *right;
};

int height(struct Node *root) {
    if (root == NULL)
        return 0;

    int left = height(root->left);
    int right = height(root->right);

    return left > right ? left : right;
}""",
        "debug_hint": "The recursive height step must add 1 for the current edge/node level: 1 + (left > right ? left : right)."
    },
    {
        "num": 54,
        "title": "Inorder Traversal",
        "difficulty": "Hard",
        "problem": "Print a binary tree using inorder traversal.",
        "code": """#include <stdio.h>

struct Node {
    int data;
    struct Node *left, *right;
};

void inorder(struct Node *root) {
    if (root = NULL)
        return;

    inorder(root->left);
    printf("%d ", root->data);
    inorder(root->right);
}""",
        "debug_hint": "Identify the condition error. Assignment (=) sets root to NULL and never executes traversal."
    },
    {
        "num": 55,
        "title": "Binary Tree Node Allocation",
        "difficulty": "Hard",
        "problem": "Dynamically create a binary tree node.",
        "code": """#include <stdio.h>
#include <stdlib.h>

struct Node {
    int data;
    struct Node *left, *right;
};

struct Node* createNode(int value) {
    struct Node *node;

    node->data = value;
    node->left = NULL;
    node->right = NULL;

    return node;
}""",
        "debug_hint": "Identify the memory-management error. node is an uninitialized wild pointer. Allocate via malloc(sizeof(struct Node))."
    },
    {
        "num": 56,
        "title": "Queue Using Linked List",
        "difficulty": "Hard",
        "problem": "Implement enqueue for a linked-list queue.",
        "code": """#include <stdio.h>
#include <stdlib.h>

struct Node {
    int data;
    struct Node *next;
};

void enqueue(struct Node **rear, int value) {
    struct Node *newNode = malloc(sizeof(struct Node));

    newNode->data = value;
    newNode->next = NULL;

    if (*rear == NULL) {
        *rear = newNode;
        return;
    }

    (*rear)->next = newNode;
}""",
        "debug_hint": "The queue uses both front and rear. Update rear to point to the new last node (*rear = newNode)."
    },
    {
        "num": 57,
        "title": "Stack Using Linked List",
        "difficulty": "Hard",
        "problem": "Push an element onto a linked-list stack.",
        "code": """#include <stdio.h>
#include <stdlib.h>

struct Node {
    int data;
    struct Node *next;
};

void push(struct Node **top, int value) {
    struct Node *newNode = malloc(sizeof(struct Node));

    newNode->data = value;
    (*top)->next = newNode;

    *top = newNode;
}""",
        "debug_hint": "The program fails when the stack is empty (*top == NULL) and links the wrong direction. Assign newNode->next = *top; *top = newNode."
    },
    {
        "num": 58,
        "title": "Dynamic Memory Reallocation",
        "difficulty": "Hard",
        "problem": "Increase an integer array from 5 elements to 10 elements.",
        "code": """#include <stdio.h>
#include <stdlib.h>

int main() {
    int *arr = malloc(5 * sizeof(int));

    for (int i = 0; i < 5; i++)
        arr[i] = i;

    arr = realloc(arr, 10);

    for (int i = 5; i < 10; i++)
        arr[i] = i;

    return 0;
}""",
        "debug_hint": "Identify the memory-allocation error: realloc(arr, 10) allocates 10 bytes instead of 10 * sizeof(int)."
    },
    {
        "num": 59,
        "title": "LRU-Style Doubly Linked List Removal",
        "difficulty": "Hard",
        "problem": "Remove a node from a doubly linked list.",
        "code": """#include <stdio.h>
#include <stdlib.h>

struct Node {
    int data;
    struct Node *prev;
    struct Node *next;
};

void removeNode(struct Node *node) {
    node->prev->next = node->next;
    node->next->prev = node->prev;

    free(node);
}""",
        "debug_hint": "Identify the cases that can cause segmentation faults. If node is head (node->prev is NULL) or tail (node->next is NULL), guard pointers."
    },
    {
        "num": 60,
        "title": "Recursive Tree Search",
        "difficulty": "Hard",
        "problem": "Search for a value in a binary tree and return 1 if found.",
        "code": """#include <stdio.h>

struct Node {
    int data;
    struct Node *left, *right;
};

int search(struct Node *root, int key) {
    if (root->data == key)
        return 1;

    if (search(root->left, key))
        return 1;

    if (search(root->right, key))
        return 1;

    return 0;
}""",
        "debug_hint": "The program crashes when it reaches a NULL child. Add the base condition if (root == NULL) return 0; at the start."
    }
]

def run_seeding():
    db = SessionLocal()
    try:
        round_obj = db.query(AssessmentRound).filter(AssessmentRound.id == 25).first()
        if not round_obj:
            print("[ERROR] Round ID 25 does not exist!")
            return

        print(f"[INFO] Target Round: #{round_obj.id} - '{round_obj.title}' (Domain ID: {round_obj.domain_id})")

        # 1. Archive existing questions in Round 25
        legacy_qs = db.query(AssessmentQuestion).filter(
            AssessmentQuestion.round_id == 25,
            AssessmentQuestion.status == "Active"
        ).all()
        for lq in legacy_qs:
            lq.status = "Archived"
        db.flush()
        print(f"[INFO] Archived {len(legacy_qs)} legacy questions in Round 25.")

        # 2. Seed all 60 C debugging questions
        c_debug_comp = db.query(Competency).filter(Competency.code == "C_DEBUG").first()
        comp_id = c_debug_comp.id if c_debug_comp else 77

        seeded_count = 0
        for item in QUESTIONS_DATA:
            full_title = f"D{item['num']:02d}: {item['title']}"
            formatted_content = f"Problem Statement:\n{item['problem']}\n\nDebug Hint:\n{item['debug_hint']}"

            q = AssessmentQuestion(
                round_id=25,
                competency_id=comp_id,
                question_type="debugging",
                title=full_title,
                candidate_content=formatted_content,
                candidate_code_template=item["code"],
                options_json={"debug_hint": item["debug_hint"], "problem": item["problem"]},
                difficulty=item["difficulty"],
                marks=10.0,
                time_limit_seconds=300,
                status="Active"
            )
            db.add(q)
            db.flush()

            # Add QuestionEvaluationConfig
            cfg = QuestionEvaluationConfig(
                question_id=q.id,
                evaluation_type="AIEvaluation",
                correct_answer=item["debug_hint"],
                reference_solution=f"Resolution: {item['debug_hint']}",
                scoring_rules_json={"rubric": "systems_debugging", "language": "c", "max_score": 10.0}
            )
            db.add(cfg)
            seeded_count += 1

        db.commit()
        print(f"\n=======================================================")
        print(f">>> SUCCESSFULLY SEEDED {seeded_count} C DEBUGGING QUESTIONS! <<<")
        print(f"=======================================================")
        print(f"• Easy Questions: 20 (D01–D20)")
        print(f"• Medium Questions: 25 (D21–D45)")
        print(f"• Hard Questions: 15 (D46–D60)")
        print(f"• Round 25 active question count: {seeded_count}")
        print("=======================================================\n")

    except Exception as e:
        db.rollback()
        print(f"[ERROR] Seeding failed: {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()

if __name__ == "__main__":
    run_seeding()
