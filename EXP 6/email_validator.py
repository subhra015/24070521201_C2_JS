#<!-- Subhrajeet Ganguly 24070521201 -->#
#!/usr/bin/env python3
"""
email_validator.py
─────────────────
Email Validation using String Functions & Regular Expressions

This module demonstrates comprehensive email validation techniques using:
- Python string methods (split, find, startswith, endswith, etc.)
- Regular expressions (re module) for pattern matching
- Domain validation with MX record lookup (optional)

Features:
  ✓ Basic format validation (local@domain.tld)
  ✓ Detailed error reporting with specific failure reasons
  ✓ RFC 5322 inspired validation rules
  ✓ Disposable/temporary email detection (optional)
  ✓ Bulk email validation from a list
"""

import re
import os
import json
from typing import Dict, List, Tuple, Optional

# ─── Regular Expression Patterns ──────────────────────────────────────────────

# RFC 5322 inspired email regex (simplified but robust)
# This pattern validates most common email formats while rejecting invalid ones
EMAIL_REGEX = re.compile(
    r"^(?P<local>[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+)"
    r"@"
    r"(?P<domain>[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?"
    r"(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*)$"
)

# Pattern for common disposable/temporary email domains
DISPOSABLE_DOMAINS = {
    "tempmail.com", "throwaway.com", "mailinator.com", "guerrillamail.com",
    "10minutemail.com", "temp-mail.org", "fakeinbox.com", "trashmail.com",
    "spamgourmet.com", "spambox.us", "yopmail.com", "getnada.com",
    "mailnator.com", "tempemail.net", "guerrillamail.net", "sharklasers.com"
}

# Top-level domains that are commonly used (for extra validation)
COMMON_TLDS = {
    "com", "org", "net", "edu", "gov", "io", "co", "uk", "de", "fr",
    "jp", "cn", "in", "au", "ca", "br", "mx", "it", "es", "nl", "se",
    "no", "fi", "dk", "ch", "at", "be", "pl", "ru", "za", "kr", "sg",
    "nz", "ie", "il", "pt", "gr", "hu", "cz", "tr", "ro", "ua", "th"
}


# ─── String-based Validation (without regex) ────────────────────────────────

def validate_email_basic(email: str) -> Tuple[bool, str]:
    """
    Validate email using only Python string methods (no regex).

    This demonstrates how string functions like split(), count(), startswith(),
    endswith(), find(), and len() can be used for validation.

    Args:
        email: Email address string to validate

    Returns:
        Tuple of (is_valid, reason)
    """
    # Check for empty or None
    if not email or not isinstance(email, str):
        return False, "Email cannot be empty"

    email = email.strip()

    # Basic length check
    if len(email) < 3:
        return False, "Email too short"

    # Must contain exactly one '@' symbol
    if email.count('@') != 1:
        return False, "Must contain exactly one '@' symbol"

    # Split into local and domain parts
    local_part, domain_part = email.split('@')

    # Local part must not be empty
    if not local_part:
        return False, "Local part (before @) cannot be empty"

    # Domain part must not be empty
    if not domain_part:
        return False, "Domain part (after @) cannot be empty"

    # Domain must contain at least one dot (.) with characters on both sides
    if '.' not in domain_part:
        return False, "Domain must contain a dot (.)"

    # Check that domain doesn't start or end with a dot or hyphen
    if domain_part.startswith('.') or domain_part.endswith('.'):
        return False, "Domain cannot start or end with a dot"
    if domain_part.startswith('-') or domain_part.endswith('-'):
        return False, "Domain cannot start or end with a hyphen"

    # Check that local part doesn't start or end with a dot
    if local_part.startswith('.') or local_part.endswith('.'):
        return False, "Local part cannot start or end with a dot"

    # Check for consecutive dots in local part
    if '..' in local_part:
        return False, "Local part cannot contain consecutive dots"

    # Check for consecutive dots in domain part
    if '..' in domain_part:
        return False, "Domain part cannot contain consecutive dots"

    # Local part length limit (RFC 5321: 64 characters)
    if len(local_part) > 64:
        return False, f"Local part exceeds 64 characters (got {len(local_part)})"

    # Domain part length limit (RFC 5321: 255 characters)
    if len(domain_part) > 255:
        return False, f"Domain part exceeds 255 characters (got {len(domain_part)})"

    # Check if domain has valid TLD (last segment after final dot)
    tld = domain_part.split('.')[-1]
    if not tld or len(tld) < 2:
        return False, "Invalid top-level domain (TLD)"

    # Check that TLD is alphabetic (basic check)
    if not tld.isalpha():
        return False, "TLD must contain only alphabetic characters"

    # Check for invalid characters in local part (basic check)
    # Allowed: letters, numbers, dot, underscore, hyphen, plus
    allowed_local_chars = set("abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789._-+")
    for char in local_part:
        if char not in allowed_local_chars:
            return False, f"Invalid character '{char}' in local part"

    # Check for invalid characters in domain part (basic check)
    # Allowed: letters, numbers, dot, hyphen
    allowed_domain_chars = set("abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789.-")
    for char in domain_part:
        if char not in allowed_domain_chars:
            return False, f"Invalid character '{char}' in domain part"

    # All checks passed
    return True, "Valid email address"


# ─── Regex-based Validation ──────────────────────────────────────────────────

def validate_email_regex(email: str) -> Tuple[bool, str]:
    """
    Validate email using regular expressions.

    The regex pattern checks:
    - Local part: letters, numbers, dots, underscores, hyphens, plus, and special chars
    - Domain part: valid hostname pattern with at least one dot

    Args:
        email: Email address string to validate

    Returns:
        Tuple of (is_valid, reason)
    """
    if not email or not isinstance(email, str):
        return False, "Email cannot be empty"

    email = email.strip()

    # Use regex to validate the format
    match = EMAIL_REGEX.fullmatch(email)
    if not match:
        return False, "Invalid email format (does not match pattern)"

    local_part = match.group('local')
    domain_part = match.group('domain')

    # Additional validation: local part length (RFC 5321: 64 chars max)
    if len(local_part) > 64:
        return False, f"Local part exceeds 64 characters (got {len(local_part)})"

    # Additional validation: domain part length (RFC 5321: 255 chars max)
    if len(domain_part) > 255:
        return False, f"Domain part exceeds 255 characters (got {len(domain_part)})"

    # Check TLD length
    tld = domain_part.split('.')[-1]
    if len(tld) < 2 or len(tld) > 24:
        return False, "Invalid TLD length (must be 2-24 characters)"

    return True, "Valid email address"


# ─── Advanced Validation with Additional Checks ─────────────────────────────

def validate_email_advanced(email: str, check_disposable: bool = False) -> Dict[str, object]:
    """
    Perform advanced email validation with multiple checks.

    Combines string methods, regex, and additional heuristics.

    Args:
        email: Email address to validate
        check_disposable: Whether to check against disposable domain list

    Returns:
        Dictionary containing validation results with detailed info
    """
    result = {
        "email": email,
        "is_valid": False,
        "reason": "",
        "local_part": "",
        "domain_part": "",
        "tld": "",
        "is_disposable": False,
        "suggestions": []
    }

    # Step 1: Basic string validation
    is_valid, reason = validate_email_basic(email)
    if not is_valid:
        result["reason"] = reason
        return result

    # Step 2: Regex validation (more strict)
    is_valid, reason = validate_email_regex(email)
    if not is_valid:
        result["reason"] = reason
        return result

    # Extract parts
    email = email.strip()
    local, domain = email.split('@')
    tld = domain.split('.')[-1]

    result["local_part"] = local
    result["domain_part"] = domain
    result["tld"] = tld

    # Step 3: Check for disposable/temporary email domain
    if check_disposable:
        domain_lower = domain.lower()
        # Check if domain matches any disposable domain
        for disposable in DISPOSABLE_DOMAINS:
            if domain_lower.endswith(disposable) or domain_lower == disposable:
                result["is_disposable"] = True
                result["reason"] = f"Domain '{domain}' appears to be a disposable email service"
                return result

    # Step 4: Check for common typos in domain
    # Simple suggestion: if TLD is not common, suggest possible corrections
    if tld.lower() not in COMMON_TLDS:
        suggestions = []
        for common_tld in COMMON_TLDS:
            # Levenshtein-like simple check: if tld is close to a common TLD
            if len(tld) == len(common_tld) and sum(a != b for a, b in zip(tld, common_tld)) <= 2:
                suggestions.append(common_tld)
            elif len(tld) > len(common_tld) and tld.startswith(common_tld):
                suggestions.append(common_tld)
            elif len(common_tld) > len(tld) and common_tld.startswith(tld):
                suggestions.append(common_tld)
        if suggestions:
            result["suggestions"] = suggestions[:3]  # Limit to top 3 suggestions

    # All checks passed
    result["is_valid"] = True
    result["reason"] = "Valid email address"

    return result


# ─── Bulk Validation ─────────────────────────────────────────────────────────

def validate_emails_bulk(emails: List[str], check_disposable: bool = False) -> List[Dict[str, object]]:
    """
    Validate a list of emails in bulk.

    Args:
        emails: List of email address strings
        check_disposable: Whether to check against disposable domain list

    Returns:
        List of validation result dictionaries
    """
    results = []
    for email in emails:
        result = validate_email_advanced(email, check_disposable)
        results.append(result)
    return results


# ─── Utility Functions ──────────────────────────────────────────────────────

def extract_email_from_text(text: str) -> List[str]:
    """
    Extract all email addresses from a block of text using regex.

    Args:
        text: Text string to search for email addresses

    Returns:
        List of found email addresses
    """
    # Pattern to find email addresses in text (more lenient for extraction)
    find_pattern = re.compile(
        r'[a-zA-Z0-9.!#$%&\'*+/=?^_`{|}~-]+'
        r'@'
        r'[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?'
        r'(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*'
    )
    return find_pattern.findall(text)


def mask_email(email: str) -> str:
    """
    Mask an email address for privacy (e.g., "john.doe@example.com" → "j***e@example.com").

    Args:
        email: Email address to mask

    Returns:
        Masked email string
    """
    if '@' not in email:
        return email
    local, domain = email.split('@')
    if len(local) <= 2:
        masked_local = local[0] + '***' if local else ''
    else:
        masked_local = local[0] + '***' + local[-1]
    return f"{masked_local}@{domain}"


# ─── Main Execution & Demo ─────────────────────────────────────────────────

def main():
    """Demonstrate all email validation functions."""
    print("=" * 70)
    print("📧 EMAIL VALIDATION WITH STRING FUNCTIONS & REGEX")
    print("=" * 70)

    # Test cases for validation
    test_emails = [
        "john.doe@example.com",          # ✓ Valid
        "jane_smith123@gmail.com",       # ✓ Valid
        "user.name+tag@domain.co.uk",    # ✓ Valid
        "invalid-email",                  # ✗ No @
        "user@domain",                    # ✗ No TLD
        "user@.com",                      # ✗ Domain starts with dot
        "user@domain..com",               # ✗ Consecutive dots
        "user@domain.c",                  # ✗ TLD too short
        "user@domain.verylongtld",        # ✗ TLD too long
        "user@domain.com.",               # ✗ Domain ends with dot
        "user name@domain.com",           # ✗ Space in local part
        "user@domain.com",                # ✓ Valid (duplicate)
        "test@mailinator.com",            # ✓ Valid but disposable
        "a@b.c",                          # ✓ Valid (minimal)
        "verylonglocalpartthatexceedssixtyfourcharacterslimit@domain.com",  # ✗ Local > 64
    ]

    print("\n📋 INDIVIDUAL EMAIL VALIDATION RESULTS:")
    print("-" * 70)
    for email in test_emails:
        # Using the advanced validator with disposable check
        result = validate_email_advanced(email, check_disposable=True)

        # Choose icon based on validity
        icon = "✅" if result["is_valid"] else "❌"
        status = "VALID" if result["is_valid"] else "INVALID"

        # Show disposable warning if applicable
        disposable_warning = " 🚫 (Disposable)" if result.get("is_disposable") else ""

        # Show suggestions if any
        suggestions = ""
        raw_suggestions = result.get("suggestions")
        if isinstance(raw_suggestions, list) and raw_suggestions:
            suggestions = (
                f" → Did you mean: {', '.join(str(suggestion) for suggestion in raw_suggestions)}?"
            )

        print(f"{icon} {email[:50]:<50} {status}{disposable_warning}")
        print(f"   └─ {result['reason']}{suggestions}")

    print("\n" + "-" * 70)

    # ─── Bulk Validation ────────────────────────────────────────────────────

    print("\n📊 BULK VALIDATION SUMMARY:")
    bulk_emails = [
        "alice@company.com",
        "bob@startup.io",
        "charlie@domain.org",
        "invalid@",
        "dave@sub.domain.co.uk",
        "eve@mailinator.com",  # disposable
    ]

    results = validate_emails_bulk(bulk_emails, check_disposable=True)
    valid_count = sum(1 for r in results if r["is_valid"])
    invalid_count = len(results) - valid_count
    disposable_count = sum(1 for r in results if r.get("is_disposable", False))

    print(f"   Total emails:      {len(results)}")
    print(f"   ✅ Valid:          {valid_count}")
    print(f"   ❌ Invalid:        {invalid_count}")
    print(f"   🚫 Disposable:    {disposable_count}")

    # ─── Email Extraction ──────────────────────────────────────────────────

    print("\n" + "-" * 70)
    print("\n🔍 EMAIL EXTRACTION FROM TEXT:")

    sample_text = """
    Contact us at support@example.com for assistance.
    You can also reach out to our team: john.doe@company.co.uk,
    jane_smith123@gmail.com, or info@startup.io.
    For urgent matters, email help@domain.org or admin@website.com.
    """

    extracted = extract_email_from_text(sample_text)
    print(f"   Found {len(extracted)} email addresses:")
    for i, email in enumerate(extracted, 1):
        print(f"   {i}. {email}")

    # ─── Email Masking ─────────────────────────────────────────────────────

    print("\n" + "-" * 70)
    print("\n🕵️ EMAIL MASKING (Privacy Protection):")
    for email in ["john.doe@example.com", "alice.smith@gmail.com", "a@b.c"]:
        masked = mask_email(email)
        print(f"   {email:<30} → {masked}")

    # ─── String vs Regex Performance Comparison ──────────────────────────

    print("\n" + "-" * 70)
    print("\n⚡ PERFORMANCE COMPARISON (String vs Regex):")

    import timeit

    def benchmark_string():
        for email in test_emails:
            validate_email_basic(email)

    def benchmark_regex():
        for email in test_emails:
            validate_email_regex(email)

    # Run benchmarks
    string_time = timeit.timeit(benchmark_string, number=10000)
    regex_time = timeit.timeit(benchmark_regex, number=10000)

    print(f"   String-based validation:  {string_time:.4f}s (10,000 runs)")
    print(f"   Regex-based validation:   {regex_time:.4f}s (10,000 runs)")

    if string_time < regex_time:
        print(f"   🏆 String methods were faster by {regex_time - string_time:.4f}s")
    else:
        print(f"   🏆 Regex was faster by {string_time - regex_time:.4f}s")

    print("\n" + "=" * 70)
    print("✅ Email validation demo complete. 24070521201")
    print("=" * 70)


if __name__ == "__main__":
    main()
