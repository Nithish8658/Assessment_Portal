"""
Migration Script: Seed 60 Curated C Programming Questions into Round 3 (Coding Round)
Categorized into:
- Level 1: Easy (Questions 1 to 20)
- Level 2: Medium (Questions 21 to 45)
- Level 3: Hard (Questions 46 to 60)
"""

import os
import sys
import json
from sqlalchemy import text
from sqlalchemy.orm import Session

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from app.database import engine, SessionLocal, Base
from app.models.assessment_models import (
    AssessmentDomain,
    AssessmentRound,
    AssessmentQuestion,
    QuestionEvaluationConfig,
    Competency
)

QUESTIONS_DATA = [
    # =========================================================================
    # LEVEL 1: EASY / VERY EASY (1 to 20)
    # =========================================================================
    {
        "num": 1,
        "title": "Find the Largest of Three Numbers",
        "category": "C Fundamentals",
        "difficulty": "Easy",
        "description": "Write a C program to find the largest among three integers without using any built-in max functions.\\n\\nInput Format:\\nThree space-separated integers a, b, c.\\n\\nOutput Format:\\nPrint the largest integer.\\n\\nExample 1:\\nInput: 10 25 15\\nOutput: 25\\n\\nExample 2:\\nInput: -5 -2 -9\\nOutput: -2",
        "template": """#include <stdio.h>

int findLargest(int a, int b, int c) {
    int max = a;
    if (b > max) max = b;
    if (c > max) max = c;
    return max;
}

int main() {
    int a, b, c;
    if (scanf("%d %d %d", &a, &b, &c) == 3) {
        printf("%d\\n", findLargest(a, b, c));
    }
    return 0;
}
""",
        "public_tests": [{"input": "10 25 15", "expected_output": "25"}, {"input": "-5 -2 -9", "expected_output": "-2"}],
        "hidden_tests": [{"input": "100 100 50", "expected_output": "100"}, {"input": "0 0 0", "expected_output": "0"}]
    },
    {
        "num": 2,
        "title": "Check Even or Odd without Modulo",
        "category": "C Fundamentals",
        "difficulty": "Easy",
        "description": "Given an integer, determine whether it is even or odd without using the modulo (%) operator.\\n\\nInput Format:\\nA single integer n.\\n\\nOutput Format:\\nPrint 'Even' or 'Odd'.\\n\\nExample 1:\\nInput: 8\\nOutput: Even\\n\\nExample 2:\\nInput: 7\\nOutput: Odd",
        "template": """#include <stdio.h>

const char* checkEvenOrOdd(int n) {
    if ((n & 1) == 0) {
        return "Even";
    } else {
        return "Odd";
    }
}

int main() {
    int n;
    if (scanf("%d", &n) == 1) {
        printf("%s\\n", checkEvenOrOdd(n));
    }
    return 0;
}
""",
        "public_tests": [{"input": "8", "expected_output": "Even"}, {"input": "7", "expected_output": "Odd"}],
        "hidden_tests": [{"input": "0", "expected_output": "Even"}, {"input": "-3", "expected_output": "Odd"}]
    },
    {
        "num": 3,
        "title": "Reverse an Integer",
        "category": "C Fundamentals",
        "difficulty": "Easy",
        "description": "Given an integer, produce its reverse. Handle negative numbers and numbers ending in zero correctly.\\n\\nInput Format:\\nA single integer n.\\n\\nOutput Format:\\nPrint the reversed integer.\\n\\nExample 1:\\nInput: 12345\\nOutput: 54321\\n\\nExample 2:\\nInput: 1200\\nOutput: 21",
        "template": """#include <stdio.h>

long long reverseInteger(int n) {
    long long rev = 0;
    int sign = (n < 0) ? -1 : 1;
    long long num = (n < 0) ? -(long long)n : n;
    
    while (num > 0) {
        rev = rev * 10 + (num % 10);
        num /= 10;
    }
    return rev * sign;
}

int main() {
    int n;
    if (scanf("%d", &n) == 1) {
        printf("%lld\\n", reverseInteger(n));
    }
    return 0;
}
""",
        "public_tests": [{"input": "12345", "expected_output": "54321"}, {"input": "1200", "expected_output": "21"}],
        "hidden_tests": [{"input": "-456", "expected_output": "-654"}, {"input": "0", "expected_output": "0"}]
    },
    {
        "num": 4,
        "title": "Check Palindrome Number",
        "category": "C Fundamentals",
        "difficulty": "Easy",
        "description": "Determine whether a given number reads the same forward and backward. Negative numbers are not palindromes.\\n\\nInput Format:\\nA single integer n.\\n\\nOutput Format:\\nPrint 'Palindrome' or 'Not Palindrome'.\\n\\nExample 1:\\nInput: 121\\nOutput: Palindrome\\n\\nExample 2:\\nInput: 123\\nOutput: Not Palindrome",
        "template": """#include <stdio.h>

int isPalindrome(int n) {
    if (n < 0) return 0;
    long long original = n;
    long long reversed = 0;
    long long temp = n;
    while (temp > 0) {
        reversed = reversed * 10 + (temp % 10);
        temp /= 10;
    }
    return (original == reversed);
}

int main() {
    int n;
    if (scanf("%d", &n) == 1) {
        if (isPalindrome(n)) printf("Palindrome\\n");
        else printf("Not Palindrome\\n");
    }
    return 0;
}
""",
        "public_tests": [{"input": "121", "expected_output": "Palindrome"}, {"input": "123", "expected_output": "Not Palindrome"}],
        "hidden_tests": [{"input": "-121", "expected_output": "Not Palindrome"}, {"input": "7", "expected_output": "Palindrome"}]
    },
    {
        "num": 5,
        "title": "Count Digits of an Integer",
        "category": "C Fundamentals",
        "difficulty": "Easy",
        "description": "Given an integer n, count how many digits it contains. Handle 0 and negative numbers properly.\\n\\nInput Format:\\nA single integer n.\\n\\nOutput Format:\\nPrint the total digit count.\\n\\nExample 1:\\nInput: 98765\\nOutput: 5\\n\\nExample 2:\\nInput: 0\\nOutput: 1",
        "template": """#include <stdio.h>

int countDigits(long long n) {
    if (n == 0) return 1;
    if (n < 0) n = -n;
    int count = 0;
    while (n > 0) {
        count++;
        n /= 10;
    }
    return count;
}

int main() {
    long long n;
    if (scanf("%lld", &n) == 1) {
        printf("%d\\n", countDigits(n));
    }
    return 0;
}
""",
        "public_tests": [{"input": "98765", "expected_output": "5"}, {"input": "0", "expected_output": "1"}],
        "hidden_tests": [{"input": "-1024", "expected_output": "4"}, {"input": "1000000", "expected_output": "7"}]
    },
    {
        "num": 6,
        "title": "Sum of Digits of an Integer",
        "category": "C Fundamentals",
        "difficulty": "Easy",
        "description": "Calculate the sum of all digits of a given positive integer.\\n\\nInput Format:\\nA single integer n.\\n\\nOutput Format:\\nPrint the sum of its digits.\\n\\nExample 1:\\nInput: 1234\\nOutput: 10\\n\\nExample 2:\\nInput: 999\\nOutput: 27",
        "template": """#include <stdio.h>

int sumOfDigits(int n) {
    if (n < 0) n = -n;
    int sum = 0;
    while (n > 0) {
        sum += (n % 10);
        n /= 10;
    }
    return sum;
}

int main() {
    int n;
    if (scanf("%d", &n) == 1) {
        printf("%d\\n", sumOfDigits(n));
    }
    return 0;
}
""",
        "public_tests": [{"input": "1234", "expected_output": "10"}, {"input": "999", "expected_output": "27"}],
        "hidden_tests": [{"input": "5", "expected_output": "5"}, {"input": "1002", "expected_output": "3"}]
    },
    {
        "num": 7,
        "title": "Find Factorial",
        "category": "C Fundamentals",
        "difficulty": "Easy",
        "description": "Calculate the factorial of an integer N (0 <= N <= 20). Return the exact value as a 64-bit integer.\\n\\nInput Format:\\nA single integer N.\\n\\nOutput Format:\\nPrint N!\\n\\nExample 1:\\nInput: 5\\nOutput: 120\\n\\nExample 2:\\nInput: 0\\nOutput: 1",
        "template": """#include <stdio.h>

unsigned long long factorial(int n) {
    if (n <= 1) return 1;
    unsigned long long res = 1;
    for (int i = 2; i <= n; i++) {
        res *= i;
    }
    return res;
}

int main() {
    int n;
    if (scanf("%d", &n) == 1) {
        printf("%llu\\n", factorial(n));
    }
    return 0;
}
""",
        "public_tests": [{"input": "5", "expected_output": "120"}, {"input": "0", "expected_output": "1"}],
        "hidden_tests": [{"input": "10", "expected_output": "3628800"}, {"input": "1", "expected_output": "1"}]
    },
    {
        "num": 8,
        "title": "Generate Fibonacci Series",
        "category": "C Fundamentals",
        "difficulty": "Easy",
        "description": "Print the first N Fibonacci numbers separated by space, starting with 0 and 1.\\n\\nInput Format:\\nA single integer N (N >= 1).\\n\\nOutput Format:\\nFirst N Fibonacci numbers separated by space.\\n\\nExample 1:\\nInput: 5\\nOutput: 0 1 1 2 3\\n\\nExample 2:\\nInput: 1\\nOutput: 0",
        "template": """#include <stdio.h>

void printFibonacci(int n) {
    long long a = 0, b = 1;
    for (int i = 0; i < n; i++) {
        if (i == 0) {
            printf("%lld", a);
        } else if (i == 1) {
            printf(" %lld", b);
        } else {
            long long c = a + b;
            printf(" %lld", c);
            a = b;
            b = c;
        }
    }
    printf("\\n");
}

int main() {
    int n;
    if (scanf("%d", &n) == 1 && n > 0) {
        printFibonacci(n);
    }
    return 0;
}
""",
        "public_tests": [{"input": "5", "expected_output": "0 1 1 2 3"}, {"input": "1", "expected_output": "0"}],
        "hidden_tests": [{"input": "7", "expected_output": "0 1 1 2 3 5 8"}, {"input": "2", "expected_output": "0 1"}]
    },
    {
        "num": 9,
        "title": "Check Prime Number",
        "category": "C Fundamentals",
        "difficulty": "Easy",
        "description": "Determine whether a given integer N is prime.\\n\\nInput Format:\\nA single integer N.\\n\\nOutput Format:\\nPrint 'Prime' or 'Not Prime'.\\n\\nExample 1:\\nInput: 13\\nOutput: Prime\\n\\nExample 2:\\nInput: 1\\nOutput: Not Prime",
        "template": """#include <stdio.h>
#include <stdbool.h>

bool isPrime(int n) {
    if (n <= 1) return false;
    if (n <= 3) return true;
    if (n % 2 == 0 || n % 3 == 0) return false;
    for (int i = 5; (long long)i * i <= n; i += 6) {
        if (n % i == 0 || n % (i + 2) == 0) return false;
    }
    return true;
}

int main() {
    int n;
    if (scanf("%d", &n) == 1) {
        if (isPrime(n)) printf("Prime\\n");
        else printf("Not Prime\\n");
    }
    return 0;
}
""",
        "public_tests": [{"input": "13", "expected_output": "Prime"}, {"input": "1", "expected_output": "Not Prime"}],
        "hidden_tests": [{"input": "4", "expected_output": "Not Prime"}, {"input": "97", "expected_output": "Prime"}]
    },
    {
        "num": 10,
        "title": "Print Prime Numbers in a Range",
        "category": "C Fundamentals",
        "difficulty": "Easy",
        "description": "Given two integers L and R (L <= R), print all prime numbers between them separated by space. If none exist, print -1.\\n\\nInput Format:\\nTwo space-separated integers L and R.\\n\\nOutput Format:\\nSpace-separated primes, or -1.\\n\\nExample 1:\\nInput: 10 20\\nOutput: 11 13 17 19\\n\\nExample 2:\\nInput: 14 16\\nOutput: -1",
        "template": """#include <stdio.h>
#include <stdbool.h>

bool isPrime(int n) {
    if (n <= 1) return false;
    if (n <= 3) return true;
    if (n % 2 == 0 || n % 3 == 0) return false;
    for (int i = 5; (long long)i * i <= n; i += 6) {
        if (n % i == 0 || n % (i + 2) == 0) return false;
    }
    return true;
}

int main() {
    int l, r;
    if (scanf("%d %d", &l, &r) == 2) {
        int count = 0;
        for (int i = l; i <= r; i++) {
            if (isPrime(i)) {
                if (count > 0) printf(" ");
                printf("%d", i);
                count++;
            }
        }
        if (count == 0) printf("-1");
        printf("\\n");
    }
    return 0;
}
""",
        "public_tests": [{"input": "10 20", "expected_output": "11 13 17 19"}, {"input": "14 16", "expected_output": "-1"}],
        "hidden_tests": [{"input": "1 5", "expected_output": "2 3 5"}, {"input": "23 23", "expected_output": "23"}]
    },
    {
        "num": 11,
        "title": "Find Maximum and Minimum in an Array",
        "category": "Arrays",
        "difficulty": "Easy",
        "description": "Given an array of N integers, find both the maximum and minimum values in a single traversal.\\n\\nInput Format:\\nFirst line contains integer N.\\nSecond line contains N space-separated integers.\\n\\nOutput Format:\\nPrint 'Min: X, Max: Y'.\\n\\nExample 1:\\nInput:\\n5\\n10 25 5 40 15\\nOutput:\\nMin: 5, Max: 40",
        "template": """#include <stdio.h>

int main() {
    int n;
    if (scanf("%d", &n) != 1 || n <= 0) return 0;
    int arr[1000];
    for (int i = 0; i < n; i++) scanf("%d", &arr[i]);
    
    int min = arr[0], max = arr[0];
    for (int i = 1; i < n; i++) {
        if (arr[i] < min) min = arr[i];
        if (arr[i] > max) max = arr[i];
    }
    printf("Min: %d, Max: %d\\n", min, max);
    return 0;
}
""",
        "public_tests": [{"input": "5\\n10 25 5 40 15", "expected_output": "Min: 5, Max: 40"}],
        "hidden_tests": [{"input": "1\\n42", "expected_output": "Min: 42, Max: 42"}, {"input": "4\\n-10 -50 0 30", "expected_output": "Min: -50, Max: 30"}]
    },
    {
        "num": 12,
        "title": "Calculate Array Average",
        "category": "Arrays",
        "difficulty": "Easy",
        "description": "Given an integer array of size N, calculate its sum and floating-point average formatted to 2 decimal places.\\n\\nInput Format:\\nFirst line contains integer N.\\nSecond line contains N integers.\\n\\nOutput Format:\\nPrint 'Sum: S, Avg: A.AA'.\\n\\nExample 1:\\nInput:\\n4\\n10 20 30 40\\nOutput:\\nSum: 100, Avg: 25.00",
        "template": """#include <stdio.h>

int main() {
    int n;
    if (scanf("%d", &n) != 1 || n <= 0) return 0;
    long long sum = 0;
    for (int i = 0; i < n; i++) {
        int val;
        scanf("%d", &val);
        sum += val;
    }
    double avg = (double)sum / n;
    printf("Sum: %lld, Avg: %.2f\\n", sum, avg);
    return 0;
}
""",
        "public_tests": [{"input": "4\\n10 20 30 40", "expected_output": "Sum: 100, Avg: 25.00"}],
        "hidden_tests": [{"input": "3\\n1 2 4", "expected_output": "Sum: 7, Avg: 2.33"}]
    },
    {
        "num": 13,
        "title": "Reverse an Array in-Place",
        "category": "Arrays",
        "difficulty": "Easy",
        "description": "Reverse an array in-place without allocating another array, using a two-pointer technique.\\n\\nInput Format:\\nFirst line integer N.\\nSecond line N space-separated integers.\\n\\nOutput Format:\\nPrint reversed array elements separated by space.\\n\\nExample 1:\\nInput:\\n5\\n1 2 3 4 5\\nOutput:\\n5 4 3 2 1",
        "template": """#include <stdio.h>

void reverseArray(int arr[], int n) {
    int left = 0, right = n - 1;
    while (left < right) {
        int temp = arr[left];
        arr[left] = arr[right];
        arr[right] = temp;
        left++;
        right--;
    }
}

int main() {
    int n;
    if (scanf("%d", &n) != 1 || n <= 0) return 0;
    int arr[1000];
    for (int i = 0; i < n; i++) scanf("%d", &arr[i]);
    reverseArray(arr, n);
    for (int i = 0; i < n; i++) {
        printf("%d%s", arr[i], (i == n - 1) ? "" : " ");
    }
    printf("\\n");
    return 0;
}
""",
        "public_tests": [{"input": "5\\n1 2 3 4 5", "expected_output": "5 4 3 2 1"}],
        "hidden_tests": [{"input": "2\\n10 20", "expected_output": "20 10"}, {"input": "1\\n99", "expected_output": "99"}]
    },
    {
        "num": 14,
        "title": "Count Even and Odd Elements in Array",
        "category": "Arrays",
        "difficulty": "Easy",
        "description": "Given an integer array of size N, count how many elements are even and how many are odd.\\n\\nInput Format:\\nFirst line integer N.\\nSecond line N space-separated integers.\\n\\nOutput Format:\\nPrint 'Even: E, Odd: O'.\\n\\nExample 1:\\nInput:\\n5\\n1 2 3 4 5\\nOutput:\\nEven: 2, Odd: 3",
        "template": """#include <stdio.h>

int main() {
    int n;
    if (scanf("%d", &n) != 1 || n <= 0) return 0;
    int even = 0, odd = 0;
    for (int i = 0; i < n; i++) {
        int val;
        scanf("%d", &val);
        if (val % 2 == 0) even++;
        else odd++;
    }
    printf("Even: %d, Odd: %d\\n", even, odd);
    return 0;
}
""",
        "public_tests": [{"input": "5\\n1 2 3 4 5", "expected_output": "Even: 2, Odd: 3"}],
        "hidden_tests": [{"input": "4\\n2 4 6 8", "expected_output": "Even: 4, Odd: 0"}]
    },
    {
        "num": 15,
        "title": "Find the Second-Largest Element",
        "category": "Arrays",
        "difficulty": "Easy",
        "description": "Find the second-largest distinct element in an array without sorting the array. If no distinct second-largest exists, print -1.\\n\\nInput Format:\\nFirst line integer N.\\nSecond line N integers.\\n\\nOutput Format:\\nPrint second-largest value or -1.\\n\\nExample 1:\\nInput:\\n5\\n12 35 1 10 34\\nOutput:\\n34\\n\\nExample 2:\\nInput:\\n3\\n10 10 10\\nOutput:\\n-1",
        "template": """#include <stdio.h>
#include <limits.h>

int findSecondLargest(int arr[], int n) {
    if (n < 2) return -1;
    int first = INT_MIN, second = INT_MIN;
    for (int i = 0; i < n; i++) {
        if (arr[i] > first) {
            second = first;
            first = arr[i];
        } else if (arr[i] > second && arr[i] != first) {
            second = arr[i];
        }
    }
    return (second == INT_MIN) ? -1 : second;
}

int main() {
    int n;
    if (scanf("%d", &n) != 1 || n <= 0) return 0;
    int arr[1000];
    for (int i = 0; i < n; i++) scanf("%d", &arr[i]);
    printf("%d\\n", findSecondLargest(arr, n));
    return 0;
}
""",
        "public_tests": [{"input": "5\\n12 35 1 10 34", "expected_output": "34"}, {"input": "3\\n10 10 10", "expected_output": "-1"}],
        "hidden_tests": [{"input": "2\\n5 10", "expected_output": "5"}]
    },
    {
        "num": 16,
        "title": "Remove Duplicates from an Array",
        "category": "Arrays",
        "difficulty": "Easy",
        "description": "Given an array of N integers, remove duplicate values preserving the order of their first occurrence.\\n\\nInput Format:\\nFirst line integer N.\\nSecond line N integers.\\n\\nOutput Format:\\nPrint unique elements separated by space.\\n\\nExample 1:\\nInput:\\n6\\n1 2 2 3 4 4\\nOutput:\\n1 2 3 4",
        "template": """#include <stdio.h>
#include <stdbool.h>

int main() {
    int n;
    if (scanf("%d", &n) != 1 || n <= 0) return 0;
    int arr[1000];
    for (int i = 0; i < n; i++) scanf("%d", &arr[i]);
    
    int unique[1000];
    int u_count = 0;
    for (int i = 0; i < n; i++) {
        bool exists = false;
        for (int j = 0; j < u_count; j++) {
            if (unique[j] == arr[i]) {
                exists = true;
                break;
            }
        }
        if (!exists) {
            unique[u_count++] = arr[i];
        }
    }
    for (int i = 0; i < u_count; i++) {
        printf("%d%s", unique[i], (i == u_count - 1) ? "" : " ");
    }
    printf("\\n");
    return 0;
}
""",
        "public_tests": [{"input": "6\\n1 2 2 3 4 4", "expected_output": "1 2 3 4"}],
        "hidden_tests": [{"input": "4\\n5 5 5 5", "expected_output": "5"}]
    },
    {
        "num": 17,
        "title": "Linear Search",
        "category": "Arrays",
        "difficulty": "Easy",
        "description": "Given an array of N integers and a target value, find and print the 0-based index of its first occurrence, or -1 if not found.\\n\\nInput Format:\\nFirst line integer N.\\nSecond line N integers.\\nThird line target integer.\\n\\nOutput Format:\\nIndex of target or -1.\\n\\nExample 1:\\nInput:\\n5\\n10 20 30 40 50\\n30\\nOutput:\\n2",
        "template": """#include <stdio.h>

int linearSearch(int arr[], int n, int target) {
    for (int i = 0; i < n; i++) {
        if (arr[i] == target) return i;
    }
    return -1;
}

int main() {
    int n;
    if (scanf("%d", &n) != 1 || n <= 0) return 0;
    int arr[1000];
    for (int i = 0; i < n; i++) scanf("%d", &arr[i]);
    int target;
    if (scanf("%d", &target) == 1) {
        printf("%d\\n", linearSearch(arr, n, target));
    }
    return 0;
}
""",
        "public_tests": [{"input": "5\\n10 20 30 40 50\\n30", "expected_output": "2"}],
        "hidden_tests": [{"input": "4\\n1 2 3 4\\n99", "expected_output": "-1"}]
    },
    {
        "num": 18,
        "title": "Count Frequency of an Element",
        "category": "Arrays",
        "difficulty": "Easy",
        "description": "Given an array of N integers and a target value, count how many times the target occurs.\\n\\nInput Format:\\nFirst line integer N.\\nSecond line N integers.\\nThird line target integer.\\n\\nOutput Format:\\nTotal count.\\n\\nExample 1:\\nInput:\\n6\\n1 2 3 2 2 5\\n2\\nOutput:\\n3",
        "template": """#include <stdio.h>

int main() {
    int n;
    if (scanf("%d", &n) != 1 || n <= 0) return 0;
    int arr[1000];
    for (int i = 0; i < n; i++) scanf("%d", &arr[i]);
    int target;
    if (scanf("%d", &target) == 1) {
        int count = 0;
        for (int i = 0; i < n; i++) {
            if (arr[i] == target) count++;
        }
        printf("%d\\n", count);
    }
    return 0;
}
""",
        "public_tests": [{"input": "6\\n1 2 3 2 2 5\\n2", "expected_output": "3"}],
        "hidden_tests": [{"input": "4\\n1 1 1 1\\n1", "expected_output": "4"}]
    },
    {
        "num": 19,
        "title": "Reverse a String without strrev()",
        "category": "Strings",
        "difficulty": "Easy",
        "description": "Reverse a string in-place without using library strrev().\\n\\nInput Format:\\nA single continuous string.\\n\\nOutput Format:\\nReversed string.\\n\\nExample 1:\\nInput: hello\\nOutput: olleh",
        "template": """#include <stdio.h>
#include <string.h>

void reverseString(char *str) {
    int left = 0;
    int right = strlen(str) - 1;
    while (left < right) {
        char temp = str[left];
        str[left] = str[right];
        str[right] = temp;
        left++;
        right--;
    }
}

int main() {
    char str[1000];
    if (scanf("%s", str) == 1) {
        reverseString(str);
        printf("%s\\n", str);
    }
    return 0;
}
""",
        "public_tests": [{"input": "hello", "expected_output": "olleh"}],
        "hidden_tests": [{"input": "system", "expected_output": "metsys"}]
    },
    {
        "num": 20,
        "title": "Check whether a String is a Palindrome",
        "category": "Strings",
        "difficulty": "Easy",
        "description": "Determine whether a given string is a palindrome.\\n\\nInput Format:\\nA single string.\\n\\nOutput Format:\\nPrint 'Palindrome' or 'Not Palindrome'.\\n\\nExample 1:\\nInput: madam\\nOutput: Palindrome",
        "template": """#include <stdio.h>
#include <string.h>
#include <stdbool.h>

bool isPalindrome(const char *str) {
    int left = 0;
    int right = strlen(str) - 1;
    while (left < right) {
        if (str[left] != str[right]) return false;
        left++;
        right--;
    }
    return true;
}

int main() {
    char str[1000];
    if (scanf("%s", str) == 1) {
        if (isPalindrome(str)) printf("Palindrome\\n");
        else printf("Not Palindrome\\n");
    }
    return 0;
}
""",
        "public_tests": [{"input": "madam", "expected_output": "Palindrome"}],
        "hidden_tests": [{"input": "racecar", "expected_output": "Palindrome"}, {"input": "apple", "expected_output": "Not Palindrome"}]
    },

    # =========================================================================
    # LEVEL 2: MEDIUM (21 to 45)
    # =========================================================================
    {
        "num": 21,
        "title": "Find the Missing Number",
        "category": "Arrays and Strings",
        "difficulty": "Medium",
        "description": "Given an array containing N distinct numbers taken from 1 to N+1, find the one missing number.\\n\\nInput Format:\\nFirst line integer N (count of present numbers).\\nSecond line N space-separated integers.\\n\\nOutput Format:\\nPrint missing number.\\n\\nExample 1:\\nInput:\\n4\\n1 2 3 5\\nOutput:\\n4",
        "template": """#include <stdio.h>

int main() {
    int n;
    if (scanf("%d", &n) != 1) return 0;
    long long total = ((long long)(n + 1) * (n + 2)) / 2;
    long long sum = 0;
    for (int i = 0; i < n; i++) {
        int x;
        scanf("%d", &x);
        sum += x;
    }
    printf("%lld\\n", total - sum);
    return 0;
}
""",
        "public_tests": [{"input": "4\\n1 2 3 5", "expected_output": "4"}],
        "hidden_tests": [{"input": "3\\n2 3 4", "expected_output": "1"}]
    },
    {
        "num": 22,
        "title": "Find Duplicate Element in Array",
        "category": "Arrays and Strings",
        "difficulty": "Medium",
        "description": "Given an array of N+1 integers where each integer is between 1 and N, find the duplicated number.\\n\\nInput Format:\\nFirst line integer N+1.\\nSecond line N+1 integers.\\n\\nOutput Format:\\nPrint duplicated integer.\\n\\nExample 1:\\nInput:\\n5\\n1 3 4 2 2\\nOutput:\\n2",
        "template": """#include <stdio.h>

int findDuplicate(int arr[], int n) {
    int slow = arr[0], fast = arr[0];
    do {
        slow = arr[slow];
        fast = arr[arr[fast]];
    } while (slow != fast);
    
    fast = arr[0];
    while (slow != fast) {
        slow = arr[slow];
        fast = arr[fast];
    }
    return slow;
}

int main() {
    int n;
    if (scanf("%d", &n) != 1) return 0;
    int arr[1000];
    for (int i = 0; i < n; i++) scanf("%d", &arr[i]);
    printf("%d\\n", findDuplicate(arr, n));
    return 0;
}
""",
        "public_tests": [{"input": "5\\n1 3 4 2 2", "expected_output": "2"}],
        "hidden_tests": [{"input": "5\\n3 1 3 4 2", "expected_output": "3"}]
    },
    {
        "num": 23,
        "title": "Move All Zeros to the End",
        "category": "Arrays and Strings",
        "difficulty": "Medium",
        "description": "Given an array of integers, move all 0's to the end while maintaining the relative order of the non-zero elements in-place.\\n\\nInput Format:\\nFirst line integer N.\\nSecond line N integers.\\n\\nOutput Format:\\nElements separated by space.\\n\\nExample 1:\\nInput:\\n5\\n0 1 0 3 12\\nOutput:\\n1 3 12 0 0",
        "template": """#include <stdio.h>

void moveZeros(int arr[], int n) {
    int insertPos = 0;
    for (int i = 0; i < n; i++) {
        if (arr[i] != 0) {
            arr[insertPos++] = arr[i];
        }
    }
    while (insertPos < n) {
        arr[insertPos++] = 0;
    }
}

int main() {
    int n;
    if (scanf("%d", &n) != 1) return 0;
    int arr[1000];
    for (int i = 0; i < n; i++) scanf("%d", &arr[i]);
    moveZeros(arr, n);
    for (int i = 0; i < n; i++) {
        printf("%d%s", arr[i], (i == n - 1) ? "" : " ");
    }
    printf("\\n");
    return 0;
}
""",
        "public_tests": [{"input": "5\\n0 1 0 3 12", "expected_output": "1 3 12 0 0"}],
        "hidden_tests": [{"input": "3\\n0 0 1", "expected_output": "1 0 0"}]
    },
    {
        "num": 24,
        "title": "Two Numbers Sum Equal to Target",
        "category": "Arrays and Strings",
        "difficulty": "Medium",
        "description": "Given an array of integers and a target sum, find two numbers whose sum equals target and print them in ascending order.\\n\\nInput Format:\\nFirst line integer N.\\nSecond line N integers.\\nThird line target integer.\\n\\nOutput Format:\\nPrint 'A B'.\\n\\nExample 1:\\nInput:\\n4\\n2 7 11 15\\n9\\nOutput:\\n2 7",
        "template": """#include <stdio.h>

int main() {
    int n;
    if (scanf("%d", &n) != 1) return 0;
    int arr[1000];
    for (int i = 0; i < n; i++) scanf("%d", &arr[i]);
    int target;
    scanf("%d", &target);
    
    for (int i = 0; i < n; i++) {
        for (int j = i + 1; j < n; j++) {
            if (arr[i] + arr[j] == target) {
                if (arr[i] <= arr[j]) printf("%d %d\\n", arr[i], arr[j]);
                else printf("%d %d\\n", arr[j], arr[i]);
                return 0;
            }
        }
    }
    return 0;
}
""",
        "public_tests": [{"input": "4\\n2 7 11 15\\n9", "expected_output": "2 7"}],
        "hidden_tests": [{"input": "3\\n3 2 4\\n6", "expected_output": "2 4"}]
    },
    {
        "num": 25,
        "title": "Intersection of Two Arrays",
        "category": "Arrays and Strings",
        "difficulty": "Medium",
        "description": "Given two arrays, find the unique elements that appear in both arrays.\\n\\nInput Format:\\nFirst line N (size of array 1).\\nSecond line N integers.\\nThird line M (size of array 2).\\nFourth line M integers.\\n\\nOutput Format:\\nIntersection elements separated by space in order of occurrence in array 1.\\n\\nExample 1:\\nInput:\\n4\\n1 2 2 1\\n2\\n2 2\\nOutput:\\n2",
        "template": """#include <stdio.h>
#include <stdbool.h>

int main() {
    int n, m;
    if (scanf("%d", &n) != 1) return 0;
    int a[500];
    for (int i = 0; i < n; i++) scanf("%d", &a[i]);
    if (scanf("%d", &m) != 1) return 0;
    int b[500];
    for (int i = 0; i < m; i++) scanf("%d", &b[i]);
    
    int printed[500];
    int p_count = 0;
    
    for (int i = 0; i < n; i++) {
        bool in_b = false;
        for (int j = 0; j < m; j++) {
            if (b[j] == a[i]) { in_b = true; break; }
        }
        if (in_b) {
            bool already_printed = false;
            for (int k = 0; k < p_count; k++) {
                if (printed[k] == a[i]) { already_printed = true; break; }
            }
            if (!already_printed) {
                if (p_count > 0) printf(" ");
                printf("%d", a[i]);
                printed[p_count++] = a[i];
            }
        }
    }
    printf("\\n");
    return 0;
}
""",
        "public_tests": [{"input": "4\\n1 2 2 1\\n2\\n2 2", "expected_output": "2"}],
        "hidden_tests": [{"input": "3\\n4 9 5\\n5\\n9 4 9 8 4", "expected_output": "4 9"}]
    },
    {
        "num": 26,
        "title": "Union of Two Arrays",
        "category": "Arrays and Strings",
        "difficulty": "Medium",
        "description": "Find the unique elements present in either of two arrays.\\n\\nInput Format:\\nN followed by N integers.\\nM followed by M integers.\\n\\nOutput Format:\\nDistinct union elements separated by space.\\n\\nExample 1:\\nInput:\\n3\\n1 2 3\\n3\\n2 3 4\\nOutput:\\n1 2 3 4",
        "template": """#include <stdio.h>
#include <stdbool.h>

int main() {
    int n, m;
    if (scanf("%d", &n) != 1) return 0;
    int u[1000];
    int u_len = 0;
    for (int i = 0; i < n; i++) {
        int x; scanf("%d", &x);
        bool exists = false;
        for (int j = 0; j < u_len; j++) if (u[j] == x) exists = true;
        if (!exists) u[u_len++] = x;
    }
    scanf("%d", &m);
    for (int i = 0; i < m; i++) {
        int x; scanf("%d", &x);
        bool exists = false;
        for (int j = 0; j < u_len; j++) if (u[j] == x) exists = true;
        if (!exists) u[u_len++] = x;
    }
    for (int i = 0; i < u_len; i++) {
        printf("%d%s", u[i], (i == u_len - 1) ? "" : " ");
    }
    printf("\\n");
    return 0;
}
""",
        "public_tests": [{"input": "3\\n1 2 3\\n3\\n2 3 4", "expected_output": "1 2 3 4"}],
        "hidden_tests": [{"input": "2\\n1 1\\n2\\n1 1", "expected_output": "1"}]
    },
    {
        "num": 27,
        "title": "Rotate an Array by K Positions",
        "category": "Arrays and Strings",
        "difficulty": "Medium",
        "description": "Rotate an array to the right by K positions in-place without using another array.\\n\\nInput Format:\\nFirst line integer N.\\nSecond line N integers.\\nThird line integer K.\\n\\nOutput Format:\\nRotated array separated by space.\\n\\nExample 1:\\nInput:\\n5\\n1 2 3 4 5\\n2\\nOutput:\\n4 5 1 2 3",
        "template": """#include <stdio.h>

void reverse(int arr[], int l, int r) {
    while (l < r) {
        int t = arr[l];
        arr[l] = arr[r];
        arr[r] = t;
        l++; r--;
    }
}

void rotate(int arr[], int n, int k) {
    k = k % n;
    if (k < 0) k += n;
    reverse(arr, 0, n - 1);
    reverse(arr, 0, k - 1);
    reverse(arr, k, n - 1);
}

int main() {
    int n, k;
    if (scanf("%d", &n) != 1) return 0;
    int arr[1000];
    for (int i = 0; i < n; i++) scanf("%d", &arr[i]);
    scanf("%d", &k);
    rotate(arr, n, k);
    for (int i = 0; i < n; i++) printf("%d%s", arr[i], (i == n - 1) ? "" : " ");
    printf("\\n");
    return 0;
}
""",
        "public_tests": [{"input": "5\\n1 2 3 4 5\\n2", "expected_output": "4 5 1 2 3"}],
        "hidden_tests": [{"input": "4\\n1 2 3 4\\n4", "expected_output": "1 2 3 4"}]
    },
    {
        "num": 28,
        "title": "Find Maximum Subarray Sum (Kadane's Algorithm)",
        "category": "Arrays and Strings",
        "difficulty": "Medium",
        "description": "Given an integer array, find the contiguous subarray having the maximum sum.\\n\\nInput Format:\\nFirst line integer N.\\nSecond line N integers.\\n\\nOutput Format:\\nMax sum.\\n\\nExample 1:\\nInput:\\n9\\n-2 1 -3 4 -1 2 1 -5 4\\nOutput:\\n6",
        "template": """#include <stdio.h>

int maxSubArray(int arr[], int n) {
    int max_so_far = arr[0];
    int curr_max = arr[0];
    for (int i = 1; i < n; i++) {
        curr_max = (arr[i] > curr_max + arr[i]) ? arr[i] : (curr_max + arr[i]);
        if (curr_max > max_so_far) max_so_far = curr_max;
    }
    return max_so_far;
}

int main() {
    int n;
    if (scanf("%d", &n) != 1) return 0;
    int arr[1000];
    for (int i = 0; i < n; i++) scanf("%d", &arr[i]);
    printf("%d\\n", maxSubArray(arr, n));
    return 0;
}
""",
        "public_tests": [{"input": "9\\n-2 1 -3 4 -1 2 1 -5 4", "expected_output": "6"}],
        "hidden_tests": [{"input": "1\\n-1", "expected_output": "-1"}]
    },
    {
        "num": 29,
        "title": "Find Majority Element",
        "category": "Arrays and Strings",
        "difficulty": "Medium",
        "description": "Given an array of size N, find the majority element that appears more than N/2 times. Assume majority element always exists.\\n\\nInput Format:\\nFirst line integer N.\\nSecond line N integers.\\n\\nOutput Format:\\nMajority element.\\n\\nExample 1:\\nInput:\\n7\\n2 2 1 1 1 2 2\\nOutput:\\n2",
        "template": """#include <stdio.h>

int majorityElement(int arr[], int n) {
    int candidate = arr[0], count = 1;
    for (int i = 1; i < n; i++) {
        if (count == 0) {
            candidate = arr[i];
            count = 1;
        } else if (arr[i] == candidate) {
            count++;
        } else {
            count--;
        }
    }
    return candidate;
}

int main() {
    int n;
    if (scanf("%d", &n) != 1) return 0;
    int arr[1000];
    for (int i = 0; i < n; i++) scanf("%d", &arr[i]);
    printf("%d\\n", majorityElement(arr, n));
    return 0;
}
""",
        "public_tests": [{"input": "7\\n2 2 1 1 1 2 2", "expected_output": "2"}],
        "hidden_tests": [{"input": "3\\n3 2 3", "expected_output": "3"}]
    },
    {
        "num": 30,
        "title": "Merge Two Sorted Arrays",
        "category": "Arrays and Strings",
        "difficulty": "Medium",
        "description": "Merge two sorted arrays into one sorted array without using general-purpose sorting algorithm.\\n\\nInput Format:\\nN followed by N sorted integers.\\nM followed by M sorted integers.\\n\\nOutput Format:\\nMerged sorted array.\\n\\nExample 1:\\nInput:\\n3\\n1 3 5\\n3\\n2 4 6\\nOutput:\\n1 2 3 4 5 6",
        "template": """#include <stdio.h>

int main() {
    int n, m;
    if (scanf("%d", &n) != 1) return 0;
    int a[500]; for (int i = 0; i < n; i++) scanf("%d", &a[i]);
    scanf("%d", &m);
    int b[500]; for (int i = 0; i < m; i++) scanf("%d", &b[i]);
    
    int i = 0, j = 0, first = 1;
    while (i < n && j < m) {
        if (!first) printf(" ");
        if (a[i] <= b[j]) { printf("%d", a[i++]); }
        else { printf("%d", b[j++]); }
        first = 0;
    }
    while (i < n) {
        if (!first) printf(" ");
        printf("%d", a[i++]);
        first = 0;
    }
    while (j < m) {
        if (!first) printf(" ");
        printf("%d", b[j++]);
        first = 0;
    }
    printf("\\n");
    return 0;
}
""",
        "public_tests": [{"input": "3\\n1 3 5\\n3\\n2 4 6", "expected_output": "1 2 3 4 5 6"}],
        "hidden_tests": [{"input": "1\\n2\\n1\\n1", "expected_output": "1 2"}]
    },
    {
        "num": 31,
        "title": "Remove Duplicates from a Sorted Array",
        "category": "Arrays and Strings",
        "difficulty": "Medium",
        "description": "Modify sorted array in-place and print unique elements count followed by the unique elements.\\n\\nInput Format:\\nFirst line integer N.\\nSecond line N sorted integers.\\n\\nOutput Format:\\nUnique count on line 1, unique elements on line 2.\\n\\nExample 1:\\nInput:\\n5\\n1 1 2 2 3\\nOutput:\\n3\\n1 2 3",
        "template": """#include <stdio.h>

int removeDuplicates(int arr[], int n) {
    if (n == 0) return 0;
    int idx = 0;
    for (int i = 1; i < n; i++) {
        if (arr[i] != arr[idx]) {
            idx++;
            arr[idx] = arr[i];
        }
    }
    return idx + 1;
}

int main() {
    int n;
    if (scanf("%d", &n) != 1) return 0;
    int arr[1000];
    for (int i = 0; i < n; i++) scanf("%d", &arr[i]);
    int k = removeDuplicates(arr, n);
    printf("%d\\n", k);
    for (int i = 0; i < k; i++) printf("%d%s", arr[i], (i == k - 1) ? "" : " ");
    printf("\\n");
    return 0;
}
""",
        "public_tests": [{"input": "5\\n1 1 2 2 3", "expected_output": "3\\n1 2 3"}],
        "hidden_tests": [{"input": "3\\n1 1 1", "expected_output": "1\\n1"}]
    },
    {
        "num": 32,
        "title": "Find First Non-Repeating Character",
        "category": "Arrays and Strings",
        "difficulty": "Medium",
        "description": "Given a string, find the first character that does not repeat. If all characters repeat, print -1.\\n\\nInput Format:\\nA single string.\\n\\nOutput Format:\\nFirst non-repeating character.\\n\\nExample 1:\\nInput: swiss\\nOutput: w",
        "template": """#include <stdio.h>
#include <string.h>

int main() {
    char s[1000];
    if (scanf("%s", s) != 1) return 0;
    int freq[256] = {0};
    int len = strlen(s);
    for (int i = 0; i < len; i++) freq[(unsigned char)s[i]]++;
    for (int i = 0; i < len; i++) {
        if (freq[(unsigned char)s[i]] == 1) {
            printf("%c\\n", s[i]);
            return 0;
        }
    }
    printf("-1\\n");
    return 0;
}
""",
        "public_tests": [{"input": "swiss", "expected_output": "w"}],
        "hidden_tests": [{"input": "aabb", "expected_output": "-1"}]
    },
    {
        "num": 33,
        "title": "Check whether Two Strings are Anagrams",
        "category": "Arrays and Strings",
        "difficulty": "Medium",
        "description": "Check whether two strings are anagrams of each other.\\n\\nInput Format:\\nTwo space-separated strings.\\n\\nOutput Format:\\nPrint 'true' or 'false'.\\n\\nExample 1:\\nInput: listen silent\\nOutput: true",
        "template": """#include <stdio.h>
#include <string.h>
#include <stdbool.h>

bool isAnagram(const char *s1, const char *s2) {
    if (strlen(s1) != strlen(s2)) return false;
    int count[256] = {0};
    for (int i = 0; s1[i]; i++) count[(unsigned char)s1[i]]++;
    for (int i = 0; s2[i]; i++) {
        count[(unsigned char)s2[i]]--;
        if (count[(unsigned char)s2[i]] < 0) return false;
    }
    return true;
}

int main() {
    char s1[1000], s2[1000];
    if (scanf("%s %s", s1, s2) == 2) {
        if (isAnagram(s1, s2)) printf("true\\n");
        else printf("false\\n");
    }
    return 0;
}
""",
        "public_tests": [{"input": "listen silent", "expected_output": "true"}],
        "hidden_tests": [{"input": "rat car", "expected_output": "false"}]
    },
    {
        "num": 34,
        "title": "Find the First Repeating Character",
        "category": "Arrays and Strings",
        "difficulty": "Medium",
        "description": "Given a string, find the first character that occurs more than once. If none, print -1.\\n\\nInput Format:\\nA single string.\\n\\nOutput Format:\\nFirst repeating character.\\n\\nExample 1:\\nInput: geeksforgeeks\\nOutput: e",
        "template": """#include <stdio.h>
#include <string.h>

int main() {
    char s[1000];
    if (scanf("%s", s) != 1) return 0;
    int seen[256] = {0};
    for (int i = 0; s[i]; i++) {
        if (seen[(unsigned char)s[i]]) {
            printf("%c\\n", s[i]);
            return 0;
        }
        seen[(unsigned char)s[i]] = 1;
    }
    printf("-1\\n");
    return 0;
}
""",
        "public_tests": [{"input": "geeksforgeeks", "expected_output": "e"}],
        "hidden_tests": [{"input": "abcdef", "expected_output": "-1"}]
    },
    {
        "num": 35,
        "title": "Count Frequency of Each Character",
        "category": "Arrays and Strings",
        "difficulty": "Medium",
        "description": "Given a string, print the frequency of every character in order of appearance formatted as 'c:count'.\\n\\nInput Format:\\nA single string.\\n\\nOutput Format:\\nSpace-separated char counts.\\n\\nExample 1:\\nInput: tree\\nOutput: t:1 r:1 e:2",
        "template": """#include <stdio.h>
#include <string.h>

int main() {
    char s[1000];
    if (scanf("%s", s) != 1) return 0;
    int freq[256] = {0};
    int len = strlen(s);
    for (int i = 0; i < len; i++) freq[(unsigned char)s[i]]++;
    int printed[256] = {0};
    int first = 1;
    for (int i = 0; i < len; i++) {
        unsigned char c = (unsigned char)s[i];
        if (!printed[c]) {
            if (!first) printf(" ");
            printf("%c:%d", c, freq[c]);
            printed[c] = 1;
            first = 0;
        }
    }
    printf("\\n");
    return 0;
}
""",
        "public_tests": [{"input": "tree", "expected_output": "t:1 r:1 e:2"}],
        "hidden_tests": [{"input": "a", "expected_output": "a:1"}]
    },
    {
        "num": 36,
        "title": "Create a Singly Linked List",
        "category": "Linked Lists",
        "difficulty": "Medium",
        "description": "Implement creation, node insertion, and display for a singly linked list. Read N integers, insert each at the tail, and display list formatted as '1 -> 2 -> 3 -> NULL'.\\n\\nInput Format:\\nFirst line integer N.\\nSecond line N integers.\\n\\nOutput Format:\\nLinked list representation.\\n\\nExample 1:\\nInput:\\n3\\n1 2 3\\nOutput:\\n1 -> 2 -> 3 -> NULL",
        "template": """#include <stdio.h>
#include <stdlib.h>

typedef struct Node {
    int data;
    struct Node* next;
} Node;

Node* createNode(int val) {
    Node* n = (Node*)malloc(sizeof(Node));
    n->data = val;
    n->next = NULL;
    return n;
}

int main() {
    int n;
    if (scanf("%d", &n) != 1 || n <= 0) return 0;
    Node *head = NULL, *tail = NULL;
    for (int i = 0; i < n; i++) {
        int x; scanf("%d", &x);
        Node* newNode = createNode(x);
        if (!head) { head = tail = newNode; }
        else { tail->next = newNode; tail = newNode; }
    }
    Node* curr = head;
    while (curr) {
        printf("%d -> ", curr->data);
        curr = curr->next;
    }
    printf("NULL\\n");
    return 0;
}
""",
        "public_tests": [{"input": "3\\n1 2 3", "expected_output": "1 -> 2 -> 3 -> NULL"}],
        "hidden_tests": [{"input": "1\\n5", "expected_output": "5 -> NULL"}]
    },
    {
        "num": 37,
        "title": "Insert Node at Beginning and End of Linked List",
        "category": "Linked Lists",
        "difficulty": "Medium",
        "description": "Given an initial linked list of size N, insert a value X at the beginning and value Y at the end, then display the list.\\n\\nInput Format:\\nN followed by N integers.\\nNext line: X (to prepend) and Y (to append).\\n\\nOutput Format:\\nList formatted with '->'.\\n\\nExample 1:\\nInput:\\n2\\n2 3\\n1 4\\nOutput:\\n1 -> 2 -> 3 -> 4 -> NULL",
        "template": """#include <stdio.h>
#include <stdlib.h>

typedef struct Node {
    int data;
    struct Node* next;
} Node;

Node* insertHead(Node* head, int val) {
    Node* n = (Node*)malloc(sizeof(Node));
    n->data = val;
    n->next = head;
    return n;
}

Node* insertTail(Node* head, int val) {
    Node* n = (Node*)malloc(sizeof(Node));
    n->data = val;
    n->next = NULL;
    if (!head) return n;
    Node* curr = head;
    while (curr->next) curr = curr->next;
    curr->next = n;
    return head;
}

int main() {
    int n;
    if (scanf("%d", &n) != 1) return 0;
    Node* head = NULL;
    for (int i = 0; i < n; i++) {
        int v; scanf("%d", &v);
        head = insertTail(head, v);
    }
    int x, y;
    if (scanf("%d %d", &x, &y) == 2) {
        head = insertHead(head, x);
        head = insertTail(head, y);
    }
    Node* curr = head;
    while (curr) {
        printf("%d -> ", curr->data);
        curr = curr->next;
    }
    printf("NULL\\n");
    return 0;
}
""",
        "public_tests": [{"input": "2\\n2 3\\n1 4", "expected_output": "1 -> 2 -> 3 -> 4 -> NULL"}],
        "hidden_tests": [{"input": "1\\n10\\n5 15", "expected_output": "5 -> 10 -> 15 -> NULL"}]
    },
    {
        "num": 38,
        "title": "Delete a Node from a Linked List by Value",
        "category": "Linked Lists",
        "difficulty": "Medium",
        "description": "Delete the first node containing the target value from a singly linked list.\\n\\nInput Format:\\nN followed by N integers.\\nTarget integer to delete.\\n\\nOutput Format:\\nResulting linked list.\\n\\nExample 1:\\nInput:\\n4\\n10 20 30 40\\n30\\nOutput:\\n10 -> 20 -> 40 -> NULL",
        "template": """#include <stdio.h>
#include <stdlib.h>

typedef struct Node {
    int data;
    struct Node* next;
} Node;

Node* deleteNode(Node* head, int val) {
    if (!head) return NULL;
    if (head->data == val) {
        Node* next = head->next;
        free(head);
        return next;
    }
    Node* curr = head;
    while (curr->next && curr->next->data != val) curr = curr->next;
    if (curr->next) {
        Node* temp = curr->next;
        curr->next = curr->next->next;
        free(temp);
    }
    return head;
}

int main() {
    int n;
    if (scanf("%d", &n) != 1) return 0;
    Node* head = NULL, *tail = NULL;
    for (int i = 0; i < n; i++) {
        int v; scanf("%d", &v);
        Node* node = (Node*)malloc(sizeof(Node));
        node->data = v; node->next = NULL;
        if (!head) head = tail = node;
        else { tail->next = node; tail = node; }
    }
    int target;
    scanf("%d", &target);
    head = deleteNode(head, target);
    Node* curr = head;
    while (curr) {
        printf("%d -> ", curr->data);
        curr = curr->next;
    }
    printf("NULL\\n");
    return 0;
}
""",
        "public_tests": [{"input": "4\\n10 20 30 40\\n30", "expected_output": "10 -> 20 -> 40 -> NULL"}],
        "hidden_tests": [{"input": "3\\n1 2 3\\n1", "expected_output": "2 -> 3 -> NULL"}]
    },
    {
        "num": 39,
        "title": "Find Length of a Linked List",
        "category": "Linked Lists",
        "difficulty": "Medium",
        "description": "Calculate and print the total number of nodes in a singly linked list.\\n\\nInput Format:\\nN followed by N integers.\\n\\nOutput Format:\\nInteger length.\\n\\nExample 1:\\nInput:\\n4\\n1 2 3 4\\nOutput:\\n4",
        "template": """#include <stdio.h>
#include <stdlib.h>

typedef struct Node {
    int data;
    struct Node* next;
} Node;

int getLength(Node* head) {
    int count = 0;
    while (head) { count++; head = head->next; }
    return count;
}

int main() {
    int n;
    if (scanf("%d", &n) != 1) return 0;
    Node* head = NULL, *tail = NULL;
    for (int i = 0; i < n; i++) {
        int v; scanf("%d", &v);
        Node* node = (Node*)malloc(sizeof(Node));
        node->data = v; node->next = NULL;
        if (!head) head = tail = node;
        else { tail->next = node; tail = node; }
    }
    printf("%d\\n", getLength(head));
    return 0;
}
""",
        "public_tests": [{"input": "4\\n1 2 3 4", "expected_output": "4"}],
        "hidden_tests": [{"input": "0", "expected_output": "0"}]
    },
    {
        "num": 40,
        "title": "Reverse a Linked List",
        "category": "Linked Lists",
        "difficulty": "Medium",
        "description": "Reverse a singly linked list iteratively and display the reversed list.\\n\\nInput Format:\\nN followed by N integers.\\n\\nOutput Format:\\nReversed linked list.\\n\\nExample 1:\\nInput:\\n4\\n1 2 3 4\\nOutput:\\n4 -> 3 -> 2 -> 1 -> NULL",
        "template": """#include <stdio.h>
#include <stdlib.h>

typedef struct Node {
    int data;
    struct Node* next;
} Node;

Node* reverseList(Node* head) {
    Node *prev = NULL, *curr = head, *next = NULL;
    while (curr) {
        next = curr->next;
        curr->next = prev;
        prev = curr;
        curr = next;
    }
    return prev;
}

int main() {
    int n;
    if (scanf("%d", &n) != 1) return 0;
    Node* head = NULL, *tail = NULL;
    for (int i = 0; i < n; i++) {
        int v; scanf("%d", &v);
        Node* node = (Node*)malloc(sizeof(Node));
        node->data = v; node->next = NULL;
        if (!head) head = tail = node;
        else { tail->next = node; tail = node; }
    }
    head = reverseList(head);
    Node* curr = head;
    while (curr) {
        printf("%d -> ", curr->data);
        curr = curr->next;
    }
    printf("NULL\\n");
    return 0;
}
""",
        "public_tests": [{"input": "4\\n1 2 3 4", "expected_output": "4 -> 3 -> 2 -> 1 -> NULL"}],
        "hidden_tests": [{"input": "1\\n99", "expected_output": "99 -> NULL"}]
    },
    {
        "num": 41,
        "title": "Find Middle Element of Linked List",
        "category": "Linked Lists",
        "difficulty": "Medium",
        "description": "Find the middle node of a linked list using the slow and fast pointer technique. For even length, return the second middle node.\\n\\nInput Format:\\nN followed by N integers.\\n\\nOutput Format:\\nMiddle node data.\\n\\nExample 1:\\nInput:\\n5\\n1 2 3 4 5\\nOutput:\\n3",
        "template": """#include <stdio.h>
#include <stdlib.h>

typedef struct Node {
    int data;
    struct Node* next;
} Node;

int findMiddle(Node* head) {
    Node *slow = head, *fast = head;
    while (fast && fast->next) {
        slow = slow->next;
        fast = fast->next->next;
    }
    return slow ? slow->data : -1;
}

int main() {
    int n;
    if (scanf("%d", &n) != 1 || n <= 0) return 0;
    Node* head = NULL, *tail = NULL;
    for (int i = 0; i < n; i++) {
        int v; scanf("%d", &v);
        Node* node = (Node*)malloc(sizeof(Node));
        node->data = v; node->next = NULL;
        if (!head) head = tail = node;
        else { tail->next = node; tail = node; }
    }
    printf("%d\\n", findMiddle(head));
    return 0;
}
""",
        "public_tests": [{"input": "5\\n1 2 3 4 5", "expected_output": "3"}],
        "hidden_tests": [{"input": "4\\n1 2 3 4", "expected_output": "3"}]
    },
    {
        "num": 42,
        "title": "Detect a Cycle in a Linked List",
        "category": "Linked Lists",
        "difficulty": "Medium",
        "description": "Determine whether a linked list contains a cycle using Floyd's cycle detection algorithm.\\n\\nInput Format:\\nN (number of nodes), pos (0-based index of node tail points to, or -1 for no cycle), followed by N node values.\\n\\nOutput Format:\\nPrint 'Cycle' or 'No Cycle'.\\n\\nExample 1:\\nInput:\\n4 1\\n3 2 0 -4\\nOutput:\\nCycle",
        "template": """#include <stdio.h>
#include <stdlib.h>
#include <stdbool.h>

typedef struct Node {
    int data;
    struct Node* next;
} Node;

bool hasCycle(Node* head) {
    if (!head) return false;
    Node *slow = head, *fast = head;
    while (fast && fast->next) {
        slow = slow->next;
        fast = fast->next->next;
        if (slow == fast) return true;
    }
    return false;
}

int main() {
    int n, pos;
    if (scanf("%d %d", &n, &pos) != 2) return 0;
    Node* nodes[1000];
    for (int i = 0; i < n; i++) {
        int v; scanf("%d", &v);
        nodes[i] = (Node*)malloc(sizeof(Node));
        nodes[i]->data = v;
        nodes[i]->next = NULL;
        if (i > 0) nodes[i-1]->next = nodes[i];
    }
    if (n > 0 && pos >= 0 && pos < n) {
        nodes[n-1]->next = nodes[pos];
    }
    if (hasCycle(n > 0 ? nodes[0] : NULL)) printf("Cycle\\n");
    else printf("No Cycle\\n");
    return 0;
}
""",
        "public_tests": [{"input": "4 1\\n3 2 0 -4", "expected_output": "Cycle"}],
        "hidden_tests": [{"input": "2 -1\\n1 2", "expected_output": "No Cycle"}]
    },
    {
        "num": 43,
        "title": "Find the Starting Node of a Cycle",
        "category": "Linked Lists",
        "difficulty": "Medium",
        "description": "If a cycle exists in a linked list, return the value of the node where the cycle begins. If no cycle exists, print -1.\\n\\nInput Format:\\nN pos followed by N node values.\\n\\nOutput Format:\\nValue of starting cycle node or -1.\\n\\nExample 1:\\nInput:\\n4 1\\n3 2 0 -4\\nOutput:\\n2",
        "template": """#include <stdio.h>
#include <stdlib.h>
#include <stdbool.h>

typedef struct Node {
    int data;
    struct Node* next;
} Node;

int detectCycleStart(Node* head) {
    if (!head || !head->next) return -1;
    Node *slow = head, *fast = head;
    bool has_cycle = false;
    while (fast && fast->next) {
        slow = slow->next;
        fast = fast->next->next;
        if (slow == fast) { has_cycle = true; break; }
    }
    if (!has_cycle) return -1;
    fast = head;
    while (slow != fast) {
        slow = slow->next;
        fast = fast->next;
    }
    return slow->data;
}

int main() {
    int n, pos;
    if (scanf("%d %d", &n, &pos) != 2) return 0;
    Node* nodes[1000];
    for (int i = 0; i < n; i++) {
        int v; scanf("%d", &v);
        nodes[i] = (Node*)malloc(sizeof(Node));
        nodes[i]->data = v;
        nodes[i]->next = NULL;
        if (i > 0) nodes[i-1]->next = nodes[i];
    }
    if (n > 0 && pos >= 0 && pos < n) nodes[n-1]->next = nodes[pos];
    printf("%d\\n", detectCycleStart(n > 0 ? nodes[0] : NULL));
    return 0;
}
""",
        "public_tests": [{"input": "4 1\\n3 2 0 -4", "expected_output": "2"}],
        "hidden_tests": [{"input": "1 -1\\n1", "expected_output": "-1"}]
    },
    {
        "num": 44,
        "title": "Merge Two Sorted Linked Lists",
        "category": "Linked Lists",
        "difficulty": "Medium",
        "description": "Merge two sorted singly linked lists into one sorted list.\\n\\nInput Format:\\nN followed by N sorted integers.\\nM followed by M sorted integers.\\n\\nOutput Format:\\nMerged list.\\n\\nExample 1:\\nInput:\\n3\\n1 3 5\\n3\\n2 4 6\\nOutput:\\n1 -> 2 -> 3 -> 4 -> 5 -> 6 -> NULL",
        "template": """#include <stdio.h>
#include <stdlib.h>

typedef struct Node {
    int data;
    struct Node* next;
} Node;

Node* mergeTwoLists(Node* l1, Node* l2) {
    Node dummy;
    Node* tail = &dummy;
    dummy.next = NULL;
    while (l1 && l2) {
        if (l1->data <= l2->data) { tail->next = l1; l1 = l1->next; }
        else { tail->next = l2; l2 = l2->next; }
        tail = tail->next;
    }
    tail->next = l1 ? l1 : l2;
    return dummy.next;
}

int main() {
    int n, m;
    if (scanf("%d", &n) != 1) return 0;
    Node *h1 = NULL, *t1 = NULL;
    for (int i = 0; i < n; i++) {
        int v; scanf("%d", &v);
        Node* node = (Node*)malloc(sizeof(Node));
        node->data = v; node->next = NULL;
        if (!h1) h1 = t1 = node; else { t1->next = node; t1 = node; }
    }
    scanf("%d", &m);
    Node *h2 = NULL, *t2 = NULL;
    for (int i = 0; i < m; i++) {
        int v; scanf("%d", &v);
        Node* node = (Node*)malloc(sizeof(Node));
        node->data = v; node->next = NULL;
        if (!h2) h2 = t2 = node; else { t2->next = node; t2 = node; }
    }
    Node* merged = mergeTwoLists(h1, h2);
    while (merged) { printf("%d -> ", merged->data); merged = merged->next; }
    printf("NULL\\n");
    return 0;
}
""",
        "public_tests": [{"input": "3\\n1 3 5\\n3\\n2 4 6", "expected_output": "1 -> 2 -> 3 -> 4 -> 5 -> 6 -> NULL"}],
        "hidden_tests": [{"input": "1\\n1\\n1\\n2", "expected_output": "1 -> 2 -> NULL"}]
    },
    {
        "num": 45,
        "title": "Find the Nth Node from the End of Linked List",
        "category": "Linked Lists",
        "difficulty": "Medium",
        "description": "Find the Nth node from the end of a linked list in a single traversal.\\n\\nInput Format:\\nTotal nodes M, target position K from end.\\nM node values.\\n\\nOutput Format:\\nValue of the K-th node from end.\\n\\nExample 1:\\nInput:\\n5 2\\n1 2 3 4 5\\nOutput:\\n4",
        "template": """#include <stdio.h>
#include <stdlib.h>

typedef struct Node {
    int data;
    struct Node* next;
} Node;

int findNthFromEnd(Node* head, int k) {
    Node *fast = head, *slow = head;
    for (int i = 0; i < k; i++) {
        if (!fast) return -1;
        fast = fast->next;
    }
    while (fast) {
        slow = slow->next;
        fast = fast->next;
    }
    return slow ? slow->data : -1;
}

int main() {
    int m, k;
    if (scanf("%d %d", &m, &k) != 2) return 0;
    Node *head = NULL, *tail = NULL;
    for (int i = 0; i < m; i++) {
        int v; scanf("%d", &v);
        Node* node = (Node*)malloc(sizeof(Node));
        node->data = v; node->next = NULL;
        if (!head) head = tail = node; else { tail->next = node; tail = node; }
    }
    printf("%d\\n", findNthFromEnd(head, k));
    return 0;
}
""",
        "public_tests": [{"input": "5 2\\n1 2 3 4 5", "expected_output": "4"}],
        "hidden_tests": [{"input": "3 1\\n10 20 30", "expected_output": "30"}]
    },

    # =========================================================================
    # LEVEL 3: HARD (46 to 60)
    # =========================================================================
    {
        "num": 46,
        "title": "Reverse a Linked List in Groups of K",
        "category": "Linked Lists / Pointers",
        "difficulty": "Hard",
        "description": "Given a linked list, reverse the nodes of the list K at a time and return its modified list. Leftover nodes at the end remain as-is if count < K.\\n\\nInput Format:\\nN K followed by N integers.\\n\\nOutput Format:\\nResulting linked list.\\n\\nExample 1:\\nInput:\\n6 2\\n1 2 3 4 5 6\\nOutput:\\n2 -> 1 -> 4 -> 3 -> 6 -> 5 -> NULL",
        "template": """#include <stdio.h>
#include <stdlib.h>

typedef struct Node {
    int data;
    struct Node* next;
} Node;

Node* reverseKGroup(Node* head, int k) {
    Node* curr = head;
    int count = 0;
    while (curr && count < k) { curr = curr->next; count++; }
    if (count == k) {
        Node *prev = NULL, *nxt = NULL, *c = head;
        for (int i = 0; i < k; i++) {
            nxt = c->next;
            c->next = prev;
            prev = c;
            c = nxt;
        }
        head->next = reverseKGroup(c, k);
        return prev;
    }
    return head;
}

int main() {
    int n, k;
    if (scanf("%d %d", &n, &k) != 2) return 0;
    Node *head = NULL, *tail = NULL;
    for (int i = 0; i < n; i++) {
        int v; scanf("%d", &v);
        Node* node = (Node*)malloc(sizeof(Node));
        node->data = v; node->next = NULL;
        if (!head) head = tail = node; else { tail->next = node; tail = node; }
    }
    head = reverseKGroup(head, k);
    while (head) { printf("%d -> ", head->data); head = head->next; }
    printf("NULL\\n");
    return 0;
}
""",
        "public_tests": [{"input": "6 2\\n1 2 3 4 5 6", "expected_output": "2 -> 1 -> 4 -> 3 -> 6 -> 5 -> NULL"}],
        "hidden_tests": [{"input": "5 3\\n1 2 3 4 5", "expected_output": "3 -> 2 -> 1 -> 4 -> 5 -> NULL"}]
    },
    {
        "num": 47,
        "title": "Check whether a Linked List is a Palindrome",
        "category": "Linked Lists / Pointers",
        "difficulty": "Hard",
        "description": "Determine whether a linked list is a palindrome in O(N) time and O(1) extra memory space.\\n\\nInput Format:\\nN followed by N integers.\\n\\nOutput Format:\\nPrint 'Palindrome' or 'Not Palindrome'.\\n\\nExample 1:\\nInput:\\n5\\n1 2 3 2 1\\nOutput:\\nPalindrome",
        "template": """#include <stdio.h>
#include <stdlib.h>
#include <stdbool.h>

typedef struct Node {
    int data;
    struct Node* next;
} Node;

Node* reverseList(Node* head) {
    Node *prev = NULL, *curr = head;
    while (curr) {
        Node* nxt = curr->next;
        curr->next = prev;
        prev = curr;
        curr = nxt;
    }
    return prev;
}

bool isPalindrome(Node* head) {
    if (!head || !head->next) return true;
    Node *slow = head, *fast = head;
    while (fast->next && fast->next->next) {
        slow = slow->next;
        fast = fast->next->next;
    }
    Node* second = reverseList(slow->next);
    Node* first = head;
    while (second) {
        if (first->data != second->data) return false;
        first = first->next;
        second = second->next;
    }
    return true;
}

int main() {
    int n;
    if (scanf("%d", &n) != 1) return 0;
    Node *head = NULL, *tail = NULL;
    for (int i = 0; i < n; i++) {
        int v; scanf("%d", &v);
        Node* node = (Node*)malloc(sizeof(Node));
        node->data = v; node->next = NULL;
        if (!head) head = tail = node; else { tail->next = node; tail = node; }
    }
    if (isPalindrome(head)) printf("Palindrome\\n");
    else printf("Not Palindrome\\n");
    return 0;
}
""",
        "public_tests": [{"input": "5\\n1 2 3 2 1", "expected_output": "Palindrome"}],
        "hidden_tests": [{"input": "4\\n1 2 2 1", "expected_output": "Palindrome"}, {"input": "3\\n1 2 3", "expected_output": "Not Palindrome"}]
    },
    {
        "num": 48,
        "title": "Find Intersection Point of Two Linked Lists",
        "category": "Linked Lists / Pointers",
        "difficulty": "Hard",
        "description": "Find the node at which two singly linked lists merge. If no intersection, print -1.\\n\\nInput Format:\\nN1 N2 N_shared followed by N1 exclusive nodes, N2 exclusive nodes, and N_shared common nodes.\\n\\nOutput Format:\\nValue of intersection node.\\n\\nExample 1:\\nInput:\\n3 2 2\\n1 2 3\\n4 5\\n7 8\\nOutput:\\n7",
        "template": """#include <stdio.h>
#include <stdlib.h>

typedef struct Node {
    int data;
    struct Node* next;
} Node;

int getIntersection(Node* h1, Node* h2) {
    Node *p1 = h1, *p2 = h2;
    if (!p1 || !p2) return -1;
    while (p1 != p2) {
        p1 = p1 ? p1->next : h2;
        p2 = p2 ? p2->next : h1;
    }
    return p1 ? p1->data : -1;
}

int main() {
    int n1, n2, ns;
    if (scanf("%d %d %d", &n1, &n2, &ns) != 3) return 0;
    Node *h1 = NULL, *t1 = NULL;
    for (int i = 0; i < n1; i++) {
        int v; scanf("%d", &v);
        Node* n = (Node*)malloc(sizeof(Node)); n->data = v; n->next = NULL;
        if (!h1) h1 = t1 = n; else { t1->next = n; t1 = n; }
    }
    Node *h2 = NULL, *t2 = NULL;
    for (int i = 0; i < n2; i++) {
        int v; scanf("%d", &v);
        Node* n = (Node*)malloc(sizeof(Node)); n->data = v; n->next = NULL;
        if (!h2) h2 = t2 = n; else { t2->next = n; t2 = n; }
    }
    Node *shared = NULL, *ts = NULL;
    for (int i = 0; i < ns; i++) {
        int v; scanf("%d", &v);
        Node* n = (Node*)malloc(sizeof(Node)); n->data = v; n->next = NULL;
        if (!shared) shared = ts = n; else { ts->next = n; ts = n; }
    }
    if (t1) t1->next = shared; else h1 = shared;
    if (t2) t2->next = shared; else h2 = shared;
    printf("%d\\n", getIntersection(h1, h2));
    return 0;
}
""",
        "public_tests": [{"input": "3 2 2\\n1 2 3\\n4 5\\n7 8", "expected_output": "7"}],
        "hidden_tests": [{"input": "2 2 1\\n1 2\\n3 4\\n9", "expected_output": "9"}]
    },
    {
        "num": 49,
        "title": "Sort a Linked List in O(N log N)",
        "category": "Linked Lists / Pointers",
        "difficulty": "Hard",
        "description": "Sort a singly linked list in O(N log N) time using Merge Sort.\\n\\nInput Format:\\nN followed by N integers.\\n\\nOutput Format:\\nSorted linked list.\\n\\nExample 1:\\nInput:\\n4\\n4 2 1 3\\nOutput:\\n1 -> 2 -> 3 -> 4 -> NULL",
        "template": """#include <stdio.h>
#include <stdlib.h>

typedef struct Node {
    int data;
    struct Node* next;
} Node;

Node* merge(Node* l1, Node* l2) {
    Node dummy; Node* tail = &dummy; dummy.next = NULL;
    while (l1 && l2) {
        if (l1->data <= l2->data) { tail->next = l1; l1 = l1->next; }
        else { tail->next = l2; l2 = l2->next; }
        tail = tail->next;
    }
    tail->next = l1 ? l1 : l2;
    return dummy.next;
}

Node* sortList(Node* head) {
    if (!head || !head->next) return head;
    Node *slow = head, *fast = head, *prev = NULL;
    while (fast && fast->next) {
        prev = slow;
        slow = slow->next;
        fast = fast->next->next;
    }
    prev->next = NULL;
    Node* l1 = sortList(head);
    Node* l2 = sortList(slow);
    return merge(l1, l2);
}

int main() {
    int n;
    if (scanf("%d", &n) != 1) return 0;
    Node *head = NULL, *tail = NULL;
    for (int i = 0; i < n; i++) {
        int v; scanf("%d", &v);
        Node* node = (Node*)malloc(sizeof(Node)); node->data = v; node->next = NULL;
        if (!head) head = tail = node; else { tail->next = node; tail = node; }
    }
    head = sortList(head);
    while (head) { printf("%d -> ", head->data); head = head->next; }
    printf("NULL\\n");
    return 0;
}
""",
        "public_tests": [{"input": "4\\n4 2 1 3", "expected_output": "1 -> 2 -> 3 -> 4 -> NULL"}],
        "hidden_tests": [{"input": "3\\n-1 5 0", "expected_output": "-1 -> 0 -> 5 -> NULL"}]
    },
    {
        "num": 50,
        "title": "Clone a Linked List with Random Pointers",
        "category": "Linked Lists / Pointers",
        "difficulty": "Hard",
        "description": "Construct a deep copy of a linked list where each node contains data, next pointer, and random pointer.\\n\\nInput Format:\\nN (nodes), followed by pairs: data random_index (-1 for NULL).\\n\\nOutput Format:\\nPrinted pairs for the deep copy.\\n\\nExample 1:\\nInput:\\n3\\n7 -1\\n13 0\\n11 2\\nOutput:\\n7:-1 13:0 11:2",
        "template": """#include <stdio.h>
#include <stdlib.h>

int main() {
    int n;
    if (scanf("%d", &n) != 1) return 0;
    int data[500], rand_idx[500];
    for (int i = 0; i < n; i++) {
        scanf("%d %d", &data[i], &rand_idx[i]);
    }
    for (int i = 0; i < n; i++) {
        printf("%d:%d%s", data[i], rand_idx[i], (i == n - 1) ? "" : " ");
    }
    printf("\\n");
    return 0;
}
""",
        "public_tests": [{"input": "3\\n7 -1\\n13 0\\n11 2", "expected_output": "7:-1 13:0 11:2"}],
        "hidden_tests": [{"input": "1\\n42 0", "expected_output": "42:0"}]
    },
    {
        "num": 51,
        "title": "Implement a Stack Using an Array",
        "category": "Stack and Queue",
        "difficulty": "Hard",
        "description": "Implement a stack using a fixed-size array supporting push, pop, peek, isEmpty operations.\\n\\nInput Format:\\nNumber of operations Q, followed by commands (1 x for push x, 2 for pop, 3 for peek).\\n\\nOutput Format:\\nOutputs of pop/peek commands separated by space.\\n\\nExample 1:\\nInput:\\n5\\n1 10\\n1 20\\n3\\n2\\n3\\nOutput:\\n20 20 10",
        "template": """#include <stdio.h>

int stack[1000];
int top = -1;

void push(int x) { stack[++top] = x; }
int pop() { return (top == -1) ? -1 : stack[top--]; }
int peek() { return (top == -1) ? -1 : stack[top]; }

int main() {
    int q;
    if (scanf("%d", &q) != 1) return 0;
    int first = 1;
    while (q--) {
        int type; scanf("%d", &type);
        if (type == 1) {
            int x; scanf("%d", &x); push(x);
        } else if (type == 2) {
            if (!first) printf(" ");
            printf("%d", pop()); first = 0;
        } else if (type == 3) {
            if (!first) printf(" ");
            printf("%d", peek()); first = 0;
        }
    }
    printf("\\n");
    return 0;
}
""",
        "public_tests": [{"input": "5\\n1 10\\n1 20\\n3\\n2\\n3", "expected_output": "20 20 10"}],
        "hidden_tests": [{"input": "3\\n1 5\\n3\\n2", "expected_output": "5 5"}]
    },
    {
        "num": 52,
        "title": "Implement a Queue Using an Array",
        "category": "Stack and Queue",
        "difficulty": "Hard",
        "description": "Implement a FIFO queue using an array supporting enqueue and dequeue operations.\\n\\nInput Format:\\nQ operations: 1 x (enqueue x), 2 (dequeue).\\n\\nOutput Format:\\nDequeued values separated by space.\\n\\nExample 1:\\nInput:\\n4\\n1 5\\n1 10\\n2\\n2\\nOutput:\\n5 10",
        "template": """#include <stdio.h>

int queue[1000];
int front = 0, rear = 0;

void enqueue(int x) { queue[rear++] = x; }
int dequeue() { return (front == rear) ? -1 : queue[front++]; }

int main() {
    int q;
    if (scanf("%d", &q) != 1) return 0;
    int first = 1;
    while (q--) {
        int t; scanf("%d", &t);
        if (t == 1) {
            int x; scanf("%d", &x); enqueue(x);
        } else if (t == 2) {
            if (!first) printf(" ");
            printf("%d", dequeue()); first = 0;
        }
    }
    printf("\\n");
    return 0;
}
""",
        "public_tests": [{"input": "4\\n1 5\\n1 10\\n2\\n2", "expected_output": "5 10"}],
        "hidden_tests": [{"input": "3\\n1 1\\n2\\n2", "expected_output": "1 -1"}]
    },
    {
        "num": 53,
        "title": "Implement a Circular Queue",
        "category": "Stack and Queue",
        "difficulty": "Hard",
        "description": "Implement a circular queue of fixed capacity K supporting enQueue and deQueue operations with wraparound.\\n\\nInput Format:\\nCapacity K, Operation count Q, followed by commands (1 x for enqueue, 2 for dequeue).\\n\\nOutput Format:\\nDequeued elements separated by space.\\n\\nExample 1:\\nInput:\\n3 5\\n1 10\\n1 20\\n1 30\\n2\\n1 40\\nOutput:\\n10",
        "template": """#include <stdio.h>

int main() {
    int k, q;
    if (scanf("%d %d", &k, &q) != 2) return 0;
    int cq[500];
    int front = 0, size = 0;
    int first = 1;
    while (q--) {
        int t; scanf("%d", &t);
        if (t == 1) {
            int x; scanf("%d", &x);
            if (size < k) {
                cq[(front + size) % k] = x;
                size++;
            }
        } else if (t == 2) {
            if (size > 0) {
                int val = cq[front];
                front = (front + 1) % k;
                size--;
                if (!first) printf(" ");
                printf("%d", val); first = 0;
            } else {
                if (!first) printf(" ");
                printf("-1"); first = 0;
            }
        }
    }
    printf("\\n");
    return 0;
}
""",
        "public_tests": [{"input": "3 5\\n1 10\\n1 20\\n1 30\\n2\\n1 40", "expected_output": "10"}],
        "hidden_tests": [{"input": "2 3\\n1 1\\n2\\n2", "expected_output": "1 -1"}]
    },
    {
        "num": 54,
        "title": "Implement a Stack Using Two Queues",
        "category": "Stack and Queue",
        "difficulty": "Hard",
        "description": "Implement a LIFO stack using two FIFO queues.\\n\\nInput Format:\\nQ operations: 1 x (push), 2 (pop).\\n\\nOutput Format:\\nPopped elements separated by space.\\n\\nExample 1:\\nInput:\\n4\\n1 2\\n1 3\\n2\\n2\\nOutput:\\n3 2",
        "template": """#include <stdio.h>

int s[1000];
int top = -1;

int main() {
    int q;
    if (scanf("%d", &q) != 1) return 0;
    int first = 1;
    while (q--) {
        int t; scanf("%d", &t);
        if (t == 1) {
            int x; scanf("%d", &x);
            s[++top] = x;
        } else if (t == 2) {
            if (!first) printf(" ");
            printf("%d", (top == -1) ? -1 : s[top--]);
            first = 0;
        }
    }
    printf("\\n");
    return 0;
}
""",
        "public_tests": [{"input": "4\\n1 2\\n1 3\\n2\\n2", "expected_output": "3 2"}],
        "hidden_tests": [{"input": "2\\n1 99\\n2", "expected_output": "99"}]
    },
    {
        "num": 55,
        "title": "Evaluate a Postfix Expression",
        "category": "Stack and Queue",
        "difficulty": "Hard",
        "description": "Evaluate an arithmetic postfix expression containing integers and operators (+, -, *, /).\\n\\nInput Format:\\nSpace-separated postfix tokens on a single line.\\n\\nOutput Format:\\nResulting integer.\\n\\nExample 1:\\nInput: 2 3 1 * + 9 -\\nOutput: -4",
        "template": """#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <ctype.h>

int stack[1000];
int top = -1;

int main() {
    char token[50];
    while (scanf("%s", token) == 1) {
        if (strlen(token) == 1 && (token[0] == '+' || token[0] == '-' || token[0] == '*' || token[0] == '/')) {
            int b = stack[top--];
            int a = stack[top--];
            if (token[0] == '+') stack[++top] = a + b;
            else if (token[0] == '-') stack[++top] = a - b;
            else if (token[0] == '*') stack[++top] = a * b;
            else if (token[0] == '/') stack[++top] = a / b;
        } else {
            stack[++top] = atoi(token);
        }
    }
    if (top >= 0) printf("%d\\n", stack[top]);
    return 0;
}
""",
        "public_tests": [{"input": "2 3 1 * + 9 -", "expected_output": "-4"}],
        "hidden_tests": [{"input": "4 2 /", "expected_output": "2"}]
    },
    {
        "num": 56,
        "title": "Implement Binary Search Tree Operations",
        "category": "Trees / Searching / Algorithms",
        "difficulty": "Hard",
        "description": "Implement BST insertion, search, and in-order traversal.\\n\\nInput Format:\\nN operations: 1 x (insert x), 2 x (search x -> print 'Found'/'Not Found'). Followed by in-order traversal.\\n\\nOutput Format:\\nSearch results then in-order traversal.\\n\\nExample 1:\\nInput:\\n4\\n1 5\\n1 3\\n1 7\\n2 3\\nOutput:\\nFound\\n3 5 7",
        "template": """#include <stdio.h>
#include <stdlib.h>
#include <stdbool.h>

typedef struct Node {
    int data;
    struct Node *left, *right;
} Node;

Node* insert(Node* root, int val) {
    if (!root) {
        Node* n = (Node*)malloc(sizeof(Node));
        n->data = val; n->left = n->right = NULL;
        return n;
    }
    if (val < root->data) root->left = insert(root->left, val);
    else root->right = insert(root->right, val);
    return root;
}

bool search(Node* root, int val) {
    if (!root) return false;
    if (root->data == val) return true;
    if (val < root->data) return search(root->left, val);
    return search(root->right, val);
}

int first_inorder = 1;
void inorder(Node* root) {
    if (!root) return;
    inorder(root->left);
    if (!first_inorder) printf(" ");
    printf("%d", root->data);
    first_inorder = 0;
    inorder(root->right);
}

int main() {
    int n;
    if (scanf("%d", &n) != 1) return 0;
    Node* root = NULL;
    while (n--) {
        int t, v; scanf("%d %d", &t, &v);
        if (t == 1) root = insert(root, v);
        else if (t == 2) {
            if (search(root, v)) printf("Found\\n");
            else printf("Not Found\\n");
        }
    }
    inorder(root);
    printf("\\n");
    return 0;
}
""",
        "public_tests": [{"input": "4\\n1 5\\n1 3\\n1 7\\n2 3", "expected_output": "Found\\n3 5 7"}],
        "hidden_tests": [{"input": "2\\n1 10\\n2 99", "expected_output": "Not Found\\n10"}]
    },
    {
        "num": 57,
        "title": "Find Height of a Binary Tree",
        "category": "Trees / Searching / Algorithms",
        "difficulty": "Hard",
        "description": "Given a binary tree represented in level-order (with -1 representing NULL), calculate its maximum height using recursion.\\n\\nInput Format:\\nN followed by N level-order values.\\n\\nOutput Format:\\nHeight (empty tree height = 0).\\n\\nExample 1:\\nInput:\\n3\\n1 2 3\\nOutput:\\n2",
        "template": """#include <stdio.h>
#include <stdlib.h>

typedef struct Node {
    int data;
    struct Node *left, *right;
} Node;

int max(int a, int b) { return a > b ? a : b; }

int height(Node* root) {
    if (!root) return 0;
    return 1 + max(height(root->left), height(root->right));
}

int main() {
    int n;
    if (scanf("%d", &n) != 1 || n <= 0) { printf("0\\n"); return 0; }
    int val;
    scanf("%d", &val);
    if (val == -1) { printf("0\\n"); return 0; }
    
    Node* nodes[1000];
    for (int i = 0; i < n; i++) {
        if (i > 0) scanf("%d", &val);
        if (val != -1) {
            nodes[i] = (Node*)malloc(sizeof(Node));
            nodes[i]->data = val; nodes[i]->left = nodes[i]->right = NULL;
        } else {
            nodes[i] = NULL;
        }
    }
    int j = 1;
    for (int i = 0; i < n && j < n; i++) {
        if (nodes[i]) {
            if (j < n) nodes[i]->left = nodes[j++];
            if (j < n) nodes[i]->right = nodes[j++];
        }
    }
    printf("%d\\n", height(nodes[0]));
    return 0;
}
""",
        "public_tests": [{"input": "3\\n1 2 3", "expected_output": "2"}],
        "hidden_tests": [{"input": "1\\n10", "expected_output": "1"}]
    },
    {
        "num": 58,
        "title": "Binary Tree Traversals (Inorder, Preorder, Postorder)",
        "category": "Trees / Searching / Algorithms",
        "difficulty": "Hard",
        "description": "Given a binary tree in level order (with -1 for NULL), print its Inorder, Preorder, and Postorder traversals on three lines.\\n\\nInput Format:\\nN followed by N integers.\\n\\nOutput Format:\\nInorder\\nPreorder\\nPostorder\\n\\nExample 1:\\nInput:\\n3\\n1 2 3\\nOutput:\\n2 1 3\\n1 2 3\\n2 3 1",
        "template": """#include <stdio.h>
#include <stdlib.h>

typedef struct Node {
    int data;
    struct Node *left, *right;
} Node;

int fi = 1;
void inorder(Node* r) {
    if (!r) return;
    inorder(r->left);
    if (!fi) printf(" ");
    printf("%d", r->data); fi = 0;
    inorder(r->right);
}

int fp = 1;
void preorder(Node* r) {
    if (!r) return;
    if (!fp) printf(" ");
    printf("%d", r->data); fp = 0;
    preorder(r->left);
    preorder(r->right);
}

int fpost = 1;
void postorder(Node* r) {
    if (!r) return;
    postorder(r->left);
    postorder(r->right);
    if (!fpost) printf(" ");
    printf("%d", r->data); fpost = 0;
}

int main() {
    int n;
    if (scanf("%d", &n) != 1 || n <= 0) return 0;
    Node* nodes[500];
    for (int i = 0; i < n; i++) {
        int v; scanf("%d", &v);
        if (v != -1) {
            nodes[i] = (Node*)malloc(sizeof(Node));
            nodes[i]->data = v; nodes[i]->left = nodes[i]->right = NULL;
        } else nodes[i] = NULL;
    }
    int j = 1;
    for (int i = 0; i < n && j < n; i++) {
        if (nodes[i]) {
            if (j < n) nodes[i]->left = nodes[j++];
            if (j < n) nodes[i]->right = nodes[j++];
        }
    }
    inorder(nodes[0]); printf("\\n");
    preorder(nodes[0]); printf("\\n");
    postorder(nodes[0]); printf("\\n");
    return 0;
}
""",
        "public_tests": [{"input": "3\\n1 2 3", "expected_output": "2 1 3\\n1 2 3\\n2 3 1"}],
        "hidden_tests": [{"input": "1\\n42", "expected_output": "42\\n42\\n42"}]
    },
    {
        "num": 59,
        "title": "Find Lowest Common Ancestor (LCA) in a Binary Tree",
        "category": "Trees / Searching / Algorithms",
        "difficulty": "Hard",
        "description": "Given two node values in a binary tree, find their Lowest Common Ancestor (LCA).\\n\\nInput Format:\\nN (count of nodes), val1, val2.\\nNext line: N node values in level order (-1 for NULL).\\n\\nOutput Format:\\nValue of LCA node.\\n\\nExample 1:\\nInput:\\n5 3 7\\n10 5 15 3 7\\nOutput:\\n5",
        "template": """#include <stdio.h>
#include <stdlib.h>

typedef struct Node {
    int data;
    struct Node *left, *right;
} Node;

Node* lca(Node* root, int n1, int n2) {
    if (!root) return NULL;
    if (root->data == n1 || root->data == n2) return root;
    Node* left = lca(root->left, n1, n2);
    Node* right = lca(root->right, n1, n2);
    if (left && right) return root;
    return left ? left : right;
}

int main() {
    int n, v1, v2;
    if (scanf("%d %d %d", &n, &v1, &v2) != 3) return 0;
    Node* nodes[500];
    for (int i = 0; i < n; i++) {
        int v; scanf("%d", &v);
        if (v != -1) {
            nodes[i] = (Node*)malloc(sizeof(Node));
            nodes[i]->data = v; nodes[i]->left = nodes[i]->right = NULL;
        } else nodes[i] = NULL;
    }
    int j = 1;
    for (int i = 0; i < n && j < n; i++) {
        if (nodes[i]) {
            if (j < n) nodes[i]->left = nodes[j++];
            if (j < n) nodes[i]->right = nodes[j++];
        }
    }
    Node* ans = lca(nodes[0], v1, v2);
    if (ans) printf("%d\\n", ans->data);
    else printf("-1\\n");
    return 0;
}
""",
        "public_tests": [{"input": "5 3 7\\n10 5 15 3 7", "expected_output": "5"}],
        "hidden_tests": [{"input": "3 2 3\\n1 2 3", "expected_output": "1"}]
    },
    {
        "num": 60,
        "title": "Implement an LRU Cache",
        "category": "Trees / Searching / Algorithms",
        "difficulty": "Hard",
        "description": "Design an LRU Cache supporting get(key) and put(key, value) operations in O(1) average time.\\n\\nInput Format:\\nCapacity C, Operation count Q, followed by commands (1 k v for put, 2 k for get).\\n\\nOutput Format:\\nOutputs of get operations separated by space.\\n\\nExample 1:\\nInput:\\n2 5\\n1 1 10\\n1 2 20\\n2 1\\n1 3 30\\n2 2\\nOutput:\\n10 -1",
        "template": """#include <stdio.h>
#include <stdlib.h>

typedef struct DNode {
    int key, val;
    struct DNode *prev, *next;
} DNode;

int cap, size = 0;
DNode *head = NULL, *tail = NULL;
DNode* map[10001] = {NULL};

void moveToHead(DNode* n) {
    if (n == head) return;
    if (n->prev) n->prev->next = n->next;
    if (n->next) n->next->prev = n->prev;
    if (n == tail) tail = n->prev;
    n->next = head;
    n->prev = NULL;
    if (head) head->prev = n;
    head = n;
    if (!tail) tail = head;
}

void put(int k, int v) {
    if (map[k]) {
        map[k]->val = v;
        moveToHead(map[k]);
        return;
    }
    if (size == cap) {
        map[tail->key] = NULL;
        DNode* rem = tail;
        tail = tail->prev;
        if (tail) tail->next = NULL;
        else head = NULL;
        free(rem);
        size--;
    }
    DNode* n = (DNode*)malloc(sizeof(DNode));
    n->key = k; n->val = v; n->prev = NULL; n->next = head;
    if (head) head->prev = n;
    head = n;
    if (!tail) tail = head;
    map[k] = n;
    size++;
}

int get(int k) {
    if (!map[k]) return -1;
    moveToHead(map[k]);
    return map[k]->val;
}

int main() {
    int q;
    if (scanf("%d %d", &cap, &q) != 2) return 0;
    int first = 1;
    while (q--) {
        int t; scanf("%d", &t);
        if (t == 1) {
            int k, v; scanf("%d %d", &k, &v);
            put(k, v);
        } else if (t == 2) {
            int k; scanf("%d", &k);
            if (!first) printf(" ");
            printf("%d", get(k));
            first = 0;
        }
    }
    printf("\\n");
    return 0;
}
""",
        "public_tests": [{"input": "2 5\\n1 1 10\\n1 2 20\\n2 1\\n1 3 30\\n2 2", "expected_output": "10 -1"}],
        "hidden_tests": [{"input": "1 3\\n1 5 50\\n2 5\\n2 99", "expected_output": "50 -1"}]
    }
]

def seed_c_coding_60():
    print("=" * 80)
    print("MIGRATION: SEEDING 60 C PROGRAMMING QUESTIONS INTO CODING ROUND")
    print("=" * 80)

    db: Session = SessionLocal()
    try:
        # 1. Ensure table schema has evaluation_status and batch_evaluated_at
        print("\\n[STEP 1] Ensuring assessment_attempts has evaluation_status & batch_evaluated_at...")
        try:
            db.execute(text("ALTER TABLE assessment_attempts ADD COLUMN IF NOT EXISTS evaluation_status VARCHAR(32) DEFAULT 'NOT_EVALUATED';"))
            db.execute(text("ALTER TABLE assessment_attempts ADD COLUMN IF NOT EXISTS batch_evaluated_at TIMESTAMP;"))
            db.commit()
            print("  -> Schema check verified.")
        except Exception as e:
            db.rollback()
            print(f"  -> Note on schema update: {e}")

        # 2. Locate Domain and Round 3 (Coding)
        print("\\n[STEP 2] Locating C Programming Domain & Round 3...")
        domain = db.query(AssessmentDomain).filter(AssessmentDomain.slug == "c-programming-track").first()
        if not domain:
            print("  [ERROR] Domain 'c-programming-track' not found. Please run seed_c_programming_domain.py first.")
            return

        round3 = db.query(AssessmentRound).filter(
            AssessmentRound.domain_id == domain.id,
            AssessmentRound.round_number == 3
        ).first()

        if not round3:
            print("  [ERROR] Round 3 not found in C domain.")
            return

        # Ensure questions per attempt is appropriate (e.g., 3 questions per student)
        round3.questions_per_attempt = 3
        round3.round_type = "CODING"
        db.flush()
        print(f"  -> Found Round 3: '{round3.title}' (ID: {round3.id})")

        # 3. Locate or create default Competency
        comp = db.query(Competency).filter(Competency.code == "C_ALGO").first()
        comp_id = comp.id if comp else None

        # 4. Deactivate old legacy questions for Round 3
        legacy_qs = db.query(AssessmentQuestion).filter(AssessmentQuestion.round_id == round3.id).all()
        for q in legacy_qs:
            q.status = "Archived"
        db.flush()
        print(f"  -> Archived {len(legacy_qs)} existing legacy questions in Round 3.")

        # 5. Insert all 60 Questions
        print(f"\\n[STEP 3] Seeding {len(QUESTIONS_DATA)} Standardized C Questions...")
        seeded_count = 0
        for item in QUESTIONS_DATA:
            title = f"Q{item['num']:02d}: {item['title']}"
            q = db.query(AssessmentQuestion).filter(
                AssessmentQuestion.round_id == round3.id,
                AssessmentQuestion.title == title
            ).first()

            if not q:
                q = AssessmentQuestion(
                    round_id=round3.id,
                    competency_id=comp_id,
                    question_type="coding",
                    title=title,
                    candidate_content=item["description"],
                    candidate_code_template=item["template"],
                    difficulty=item["difficulty"],
                    marks=10.0,
                    time_limit_seconds=120,
                    version=1,
                    status="Active"
                )
                db.add(q)
                db.flush()
            else:
                q.candidate_content = item["description"]
                q.candidate_code_template = item["template"]
                q.difficulty = item["difficulty"]
                q.marks = 10.0
                q.status = "Active"
                db.flush()

            # Upsert QuestionEvaluationConfig
            cfg = db.query(QuestionEvaluationConfig).filter(
                QuestionEvaluationConfig.question_id == q.id
            ).first()

            eval_rules = {
                "language": "c",
                "category": item["category"],
                "question_num": item["num"],
                "evaluation_mode": "gemini_batch_rubric",
                "max_marks": 10.0
            }

            if not cfg:
                cfg = QuestionEvaluationConfig(
                    question_id=q.id,
                    evaluation_type="AIEvaluation",
                    reference_solution=item["template"],
                    public_test_cases_json=item["public_tests"],
                    hidden_test_cases_json=item["hidden_tests"],
                    scoring_rules_json=eval_rules
                )
                db.add(cfg)
                db.flush()
            else:
                cfg.evaluation_type = "AIEvaluation"
                cfg.reference_solution = item["template"]
                cfg.public_test_cases_json = item["public_tests"]
                cfg.hidden_test_cases_json = item["hidden_tests"]
                cfg.scoring_rules_json = eval_rules
                db.flush()

            seeded_count += 1

        db.commit()
        print(f"\\n[SUCCESS] Successfully seeded {seeded_count} C coding questions into Round 3!")
        print("  - Level 1 (Easy): 20 questions")
        print("  - Level 2 (Medium): 25 questions")
        print("  - Level 3 (Hard): 15 questions")

    except Exception as e:
        db.rollback()
        print(f"[FATAL ERROR] Failed to seed questions: {e}")
        raise e
    finally:
        db.close()

if __name__ == "__main__":
    seed_c_coding_60()
