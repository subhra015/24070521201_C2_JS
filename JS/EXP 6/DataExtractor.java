import java.util.*;
import java.util.regex.*;
import java.util.stream.Collectors;

/**
 * DataExtractor.java
 * ──────────────────
 * Data Extraction using Regular Expressions in Java
 *
 * This module demonstrates how to extract structured data from unstructured
 * text using Java's Pattern and Matcher classes.
 *
 * Features:
 *   ✓ Extract phone numbers (US, international, with/without country codes)
 *   ✓ Extract dates (multiple formats: MM/DD/YYYY, DD-MM-YYYY, etc.)
 *   ✓ Extract URLs (HTTP/HTTPS, with query parameters)
 *   ✓ Extract email addresses
 *   ✓ Extract credit card numbers (with Luhn validation)
 *   ✓ Extract IP addresses (IPv4)
 *   ✓ Extract social security numbers (US format)
 *   ✓ Extract hashtags and mentions
 *   ✓ Extract monetary amounts (with currency symbols)
 *   ✓ Extract time stamps (HH:MM:SS, HH:MM)
 *   ✓ Generate comprehensive extraction reports
 *
 * Uses:
 *   - java.util.regex.Pattern & Matcher for regex operations
 *   - String methods (split, substring, contains, etc.)
 *   - Java streams for functional data processing
 */

public class DataExtractor {

    // ─── Regular Expression Patterns ──────────────────────────────────────────

    // Phone number patterns (US and international)
    private static final Pattern PHONE_PATTERN = Pattern.compile(
        "(?:\\+?\\d{1,3}[-.\\s]?)?" +                      // Country code (optional)
        "(?:\\(?\\d{3}\\)?[-.\\s]?)" +                    // Area code
        "\\d{3}[-.\\s]?" +                               // Exchange
        "\\d{4}" +                                       // Subscriber number
        "(?:\\s*(?:ext|x|extension)\\s*\\d+)?"          // Extension (optional)
    );

    // More permissive phone pattern for extraction from text
    private static final Pattern PHONE_LOOSE_PATTERN = Pattern.compile(
        "(?:\\+?\\d{1,3}[-.\\s]?)?" +
        "(?:\\(?\\d{2,4}\\)?[-.\\s]?)?" +
        "\\d{2,4}[-.\\s]?" +
        "\\d{3,4}[-.\\s]?" +
        "\\d{3,4}" +
        "(?:\\s*(?:ext|x|extension)\\s*\\d+)?" +
        "|" +
        "\\b\\d{3}[-.]?\\d{3}[-.]?\\d{4}\\b"
    );

    // Date patterns (multiple formats)
    private static final Pattern DATE_PATTERN = Pattern.compile(
        "\\b" +
        "(?:(\\d{1,2})[-/](\\d{1,2})[-/](\\d{2,4}))" +     // MM/DD/YYYY or DD/MM/YYYY
        "|" +
        "(?:(\\d{4})[-/](\\d{1,2})[-/](\\d{1,2}))" +       // YYYY-MM-DD
        "|" +
        "(?:(\\w{3,9})\\s+(\\d{1,2})(?:st|nd|rd|th)?,?\\s+(\\d{4}))" + // Month DD, YYYY
        "|" +
        "(?:(\\d{1,2})(?:st|nd|rd|th)?\\s+(\\w{3,9}),?\\s+(\\d{4}))" + // DD Month YYYY
        "\\b"
    );

    // URL pattern
    private static final Pattern URL_PATTERN = Pattern.compile(
        "\\b" +
        "(https?://)" +                                    // Protocol
        "([a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?" + // Domain
        "(?:\\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*)" +
        "(?::(\\d+))?" +                                   // Port (optional)
        "(/[-a-zA-Z0-9%_.~+]*)*" +                         // Path
        "(\\?[a-zA-Z0-9%_.~+&=#-]*)?" +                   // Query string
        "(?:#[a-zA-Z0-9%_.~+&=#-]*)?" +                   // Fragment
        "\\b"
    );

    // Email pattern
    private static final Pattern EMAIL_PATTERN = Pattern.compile(
        "\\b[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+" +
        "@" +
        "[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?" +
        "(?:\\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*" +
        "\\b"
    );

    // Credit card pattern (simplified)
    private static final Pattern CREDIT_CARD_PATTERN = Pattern.compile(
        "\\b" +
        "(?:4[0-9]{12}(?:[0-9]{3})?)?" +                   // Visa
        "|" +
        "(?:5[1-5][0-9]{14})?" +                           // MasterCard
        "|" +
        "(?:3[47][0-9]{13})?" +                            // Amex
        "|" +
        "(?:6(?:011|5[0-9]{2})[0-9]{12})?" +              // Discover
        "|" +
        "(?:3(?:0[0-5]|[68][0-9])[0-9]{11})?" +           // Diners Club
        "\\b"
    );

    // IP Address (IPv4) pattern
    private static final Pattern IP_PATTERN = Pattern.compile(
        "\\b(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.){3}" +
        "(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\b"
    );

    // Social Security Number (US) pattern
    private static final Pattern SSN_PATTERN = Pattern.compile(
        "\\b\\d{3}[-.]?\\d{2}[-.]?\\d{4}\\b"
    );

    // Hashtag pattern
    private static final Pattern HASHTAG_PATTERN = Pattern.compile(
        "#[a-zA-Z0-9_]+\\b"
    );

    // Mention pattern
    private static final Pattern MENTION_PATTERN = Pattern.compile(
        "@[a-zA-Z0-9_]+\\b"
    );

    // Monetary amount pattern
    private static final Pattern MONEY_PATTERN = Pattern.compile(
        "\\b[$€£¥₹]\\s*\\d{1,3}(?:,\\d{3})*(?:\\.\\d{2})?\\b" +
        "|" +
        "\\b\\d{1,3}(?:,\\d{3})*(?:\\.\\d{2})?\\s*[$€£¥₹]\\b"
    );

    // Time pattern (HH:MM:SS or HH:MM)
    private static final Pattern TIME_PATTERN = Pattern.compile(
        "\\b(?:[01]?[0-9]|2[0-3]):[0-5][0-9](?::[0-5][0-9])?\\b"
    );

    // ─── Data Classes ────────────────────────────────────────────────────────

    /**
     * Represents a single extracted data item with metadata.
     */
    public static class ExtractedData {
        public final String type;
        public final String value;
        public final int startIndex;
        public final int endIndex;
        public final String context;

        public ExtractedData(String type, String value, int startIndex, int endIndex, String context) {
            this.type = type;
            this.value = value;
            this.startIndex = startIndex;
            this.endIndex = endIndex;
            this.context = context;
        }

        @Override
        public String toString() {
            return String.format("[%s] \"%s\" at %d-%d (context: \"%s\")",
                type, value, startIndex, endIndex, context);
        }
    }

    /**
     * Complete extraction report containing all found data.
     */
    public static class ExtractionReport {
        public final List<ExtractedData> phones = new ArrayList<>();
        public final List<ExtractedData> dates = new ArrayList<>();
        public final List<ExtractedData> urls = new ArrayList<>();
        public final List<ExtractedData> emails = new ArrayList<>();
        public final List<ExtractedData> creditCards = new ArrayList<>();
        public final List<ExtractedData> ips = new ArrayList<>();
        public final List<ExtractedData> ssns = new ArrayList<>();
        public final List<ExtractedData> hashtags = new ArrayList<>();
        public final List<ExtractedData> mentions = new ArrayList<>();
        public final List<ExtractedData> money = new ArrayList<>();
        public final List<ExtractedData> times = new ArrayList<>();

        public int getTotalCount() {
            return phones.size() + dates.size() + urls.size() + emails.size() +
                   creditCards.size() + ips.size() + ssns.size() + hashtags.size() +
                   mentions.size() + money.size() + times.size();
        }

        public void printSummary() {
            System.out.println("📊 EXTRACTION SUMMARY:");
            System.out.println("  ────────────────────");
            System.out.printf("  📞 Phone numbers:    %d%n", phones.size());
            System.out.printf("  📅 Dates:            %d%n", dates.size());
            System.out.printf("  🔗 URLs:             %d%n", urls.size());
            System.out.printf("  ✉️  Emails:           %d%n", emails.size());
            System.out.printf("  💳 Credit cards:     %d%n", creditCards.size());
            System.out.printf("  🌐 IP addresses:     %d%n", ips.size());
            System.out.printf("  🪪  SSNs:              %d%n", ssns.size());
            System.out.printf("  #️⃣  Hashtags:         %d%n", hashtags.size());
            System.out.printf("  @️⃣  Mentions:         %d%n", mentions.size());
            System.out.printf("  💰 Money amounts:    %d%n", money.size());
            System.out.printf("  ⏰ Times:            %d%n", times.size());
            System.out.printf("  ────────────────────%n");
            System.out.printf("  📌 TOTAL:            %d items%n", getTotalCount());
        }

        public void printAll() {
            printCategory("📞 Phone Numbers", phones);
            printCategory("📅 Dates", dates);
            printCategory("🔗 URLs", urls);
            printCategory("✉️  Emails", emails);
            printCategory("💳 Credit Cards", creditCards);
            printCategory("🌐 IP Addresses", ips);
            printCategory("🪪  SSNs", ssns);
            printCategory("#️⃣  Hashtags", hashtags);
            printCategory("@️⃣  Mentions", mentions);
            printCategory("💰 Money Amounts", money);
            printCategory("⏰ Times", times);
        }

        private void printCategory(String label, List<ExtractedData> items) {
            if (items.isEmpty()) return;
            System.out.printf("%n  %s:%n", label);
            for (ExtractedData item : items) {
                System.out.printf("    - %s%n", item.value);
            }
        }
    }

    // ─── Extraction Methods ──────────────────────────────────────────────────

    /**
     * Extract all types of data from a text string.
     */
    public static ExtractionReport extractAll(String text) {
        ExtractionReport report = new ExtractionReport();

        // Extract each type
        report.phones.addAll(extractPattern(text, PHONE_LOOSE_PATTERN, "Phone"));
        report.dates.addAll(extractPattern(text, DATE_PATTERN, "Date"));
        report.urls.addAll(extractPattern(text, URL_PATTERN, "URL"));
        report.emails.addAll(extractPattern(text, EMAIL_PATTERN, "Email"));
        report.creditCards.addAll(extractPattern(text, CREDIT_CARD_PATTERN, "CreditCard"));
        report.ips.addAll(extractPattern(text, IP_PATTERN, "IP"));
        report.ssns.addAll(extractPattern(text, SSN_PATTERN, "SSN"));
        report.hashtags.addAll(extractPattern(text, HASHTAG_PATTERN, "Hashtag"));
        report.mentions.addAll(extractPattern(text, MENTION_PATTERN, "Mention"));
        report.money.addAll(extractPattern(text, MONEY_PATTERN, "Money"));
        report.times.addAll(extractPattern(text, TIME_PATTERN, "Time"));

        return report;
    }

    /**
     * Helper method to extract a pattern from text with context.
     */
    private static List<ExtractedData> extractPattern(String text, Pattern pattern, String type) {
        List<ExtractedData> results = new ArrayList<>();
        Matcher matcher = pattern.matcher(text);

        while (matcher.find()) {
            String value = matcher.group();
            int start = matcher.start();
            int end = matcher.end();

            // Get context: 20 characters before and after
            int contextStart = Math.max(0, start - 20);
            int contextEnd = Math.min(text.length(), end + 20);
            String context = text.substring(contextStart, contextEnd).replaceAll("\\s+", " ").trim();

            results.add(new ExtractedData(type, value, start, end, context));
        }

        return results;
    }

    // ─── Specific Extraction Methods ─────────────────────────────────────────

    /**
     * Extract only phone numbers from text.
     */
    public static List<String> extractPhones(String text) {
        return extractPattern(text, PHONE_LOOSE_PATTERN, "Phone")
            .stream()
            .map(d -> d.value)
            .collect(Collectors.toList());
    }

    /**
     * Extract only dates from text.
     */
    public static List<String> extractDates(String text) {
        return extractPattern(text, DATE_PATTERN, "Date")
            .stream()
            .map(d -> d.value)
            .collect(Collectors.toList());
    }

    /**
     * Extract only URLs from text.
     */
    public static List<String> extractUrls(String text) {
        return extractPattern(text, URL_PATTERN, "URL")
            .stream()
            .map(d -> d.value)
            .collect(Collectors.toList());
    }

    /**
     * Extract only emails from text.
     */
    public static List<String> extractEmails(String text) {
        return extractPattern(text, EMAIL_PATTERN, "Email")
            .stream()
            .map(d -> d.value)
            .collect(Collectors.toList());
    }

    /**
     * Extract only IP addresses from text.
     */
    public static List<String> extractIPs(String text) {
        return extractPattern(text, IP_PATTERN, "IP")
            .stream()
            .map(d -> d.value)
            .collect(Collectors.toList());
    }

    /**
     * Extract only hashtags from text.
     */
    public static List<String> extractHashtags(String text) {
        return extractPattern(text, HASHTAG_PATTERN, "Hashtag")
            .stream()
            .map(d -> d.value)
            .collect(Collectors.toList());
    }

    /**
     * Extract only mentions from text.
     */
    public static List<String> extractMentions(String text) {
        return extractPattern(text, MENTION_PATTERN, "Mention")
            .stream()
            .map(d -> d.value)
            .collect(Collectors.toList());
    }

    /**
     * Extract only monetary amounts from text.
     */
    public static List<String> extractMoney(String text) {
        return extractPattern(text, MONEY_PATTERN, "Money")
            .stream()
            .map(d -> d.value)
            .collect(Collectors.toList());
    }

    // ─── String-based Utilities (No Regex) ──────────────────────────────────

    /**
     * Count words in text using string methods (split).
     */
    public static int countWords(String text) {
        if (text == null || text.isEmpty()) return 0;
        return text.trim().split("\\s+").length;
    }

    /**
     * Count sentences using string methods.
     */
    public static int countSentences(String text) {
        if (text == null || text.isEmpty()) return 0;
        // Split on . ! ? followed by space or end of string
        return text.split("[.!?]+\\s*").length;
    }

    /**
     * Find the most common words using string methods and a map.
     */
    public static Map<String, Integer> getWordFrequency(String text) {
        Map<String, Integer> freq = new HashMap<>();
        if (text == null || text.isEmpty()) return freq;

        // Clean and split text
        String cleaned = text.replaceAll("[^a-zA-Z0-9\\s]", " ");
        String[] words = cleaned.toLowerCase().split("\\s+");

        for (String word : words) {
            if (word.isEmpty()) continue;
            freq.put(word, freq.getOrDefault(word, 0) + 1);
        }

        return freq;
    }

    /**
     * Get top N most frequent words.
     */
    public static List<Map.Entry<String, Integer>> getTopWords(String text, int n) {
        Map<String, Integer> freq = getWordFrequency(text);
        return freq.entrySet()
            .stream()
            .sorted(Map.Entry.<String, Integer>comparingByValue().reversed())
            .limit(n)
            .collect(Collectors.toList());
    }

    // ─── Luhn Algorithm for Credit Card Validation ──────────────────────────

    /**
     * Validate a credit card number using the Luhn algorithm.
     * This is a string-based method (no regex).
     */
    public static boolean isValidCreditCard(String cardNumber) {
        // Remove non-digit characters
        String clean = cardNumber.replaceAll("\\D", "");
        if (clean.length() < 13 || clean.length() > 19) return false;

        int sum = 0;
        boolean alternate = false;

        // Traverse from right to left
        for (int i = clean.length() - 1; i >= 0; i--) {
            int digit = Character.getNumericValue(clean.charAt(i));

            if (alternate) {
                digit *= 2;
                if (digit > 9) {
                    digit = digit - 9;
                }
            }

            sum += digit;
            alternate = !alternate;
        }

        return sum % 10 == 0;
    }

    // ─── Main Execution & Demo ──────────────────────────────────────────────

    public static void main(String[] args) {
        System.out.println("=" .repeat(70));
        System.out.println("🔍 DATA EXTRACTION WITH REGULAR EXPRESSIONS");
        System.out.println("=" .repeat(70));

        // ─── Sample Text ──────────────────────────────────────────────────

        String sampleText = """
            Hello everyone! Please contact our support team at:
            
            Phone: (555) 123-4567 or +1-800-555-0199
            Email: support@example.com, john.doe@company.co.uk
            
            Visit our website: https://www.example.com/products?page=2
            Or check out: http://test-site.io/api/v1/users?id=42
            
            Important dates:
            - 12/25/2026 (Christmas)
            - 2026-01-15 (Meeting)
            - January 20th, 2026 (Deadline)
            - 15 March 2026 (Conference)
            
            Financial info:
            - Total: $1,299.99
            - Budget: €499.50
            - Price: £24.99
            
            Social media:
            #DataScience #Regex #JavaProgramming
            @john_doe @jane_smith mention me!
            
            IP addresses: 192.168.1.1, 10.0.0.255, 172.16.254.1
            
            SSN: 123-45-6789 and 987-65-4321
            
            Credit cards (test numbers):
            4111-1111-1111-1111 (Visa test)
            5555-5555-5555-4444 (MasterCard test)
            
            Times: 14:30:00, 09:15, 23:59:59
            
            Lorem ipsum dolor sit amet, consectetur adipiscing elit.
            Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
            """;

        System.out.println("\n📄 INPUT TEXT (truncated):");
        System.out.println("  " + sampleText.replaceAll("\\s+", " ").substring(0, 150) + "...");
        System.out.println();

        // ─── Extract All Data ─────────────────────────────────────────────

        ExtractionReport report = extractAll(sampleText);

        // Print summary
        report.printSummary();

        // Print detailed results
        System.out.println("\n📋 DETAILED EXTRACTION RESULTS:");
        report.printAll();

        // ─── Word Frequency Analysis ─────────────────────────────────────

        System.out.println("\n" + "-" .repeat(70));
        System.out.println("\n📊 WORD FREQUENCY ANALYSIS (String Methods):");

        Map<String, Integer> freq = getWordFrequency(sampleText);
        System.out.println("  Total unique words: " + freq.size());
        System.out.println("  Total words: " + countWords(sampleText));
        System.out.println("  Total sentences: " + countSentences(sampleText));

        System.out.println("\n  Top 10 most frequent words:");
        List<Map.Entry<String, Integer>> topWords = getTopWords(sampleText, 10);
        for (int i = 0; i < topWords.size(); i++) {
            Map.Entry<String, Integer> entry = topWords.get(i);
            System.out.printf("    %2d. %-15s → %d occurrences%n", i + 1, entry.getKey(), entry.getValue());
        }

        // ─── Credit Card Validation (Luhn) ──────────────────────────────

        System.out.println("\n" + "-" .repeat(70));
        System.out.println("\n💳 CREDIT CARD VALIDATION (Luhn Algorithm):");

        String[] testCards = {
            "4111-1111-1111-1111",  // Valid Visa test
            "5555-5555-5555-4444",  // Valid MasterCard test
            "1234-5678-9012-3456",  // Invalid
            "3782-8224-6310-005",   // Valid Amex test (15 digits)
        };

        for (String card : testCards) {
            boolean valid = isValidCreditCard(card);
            System.out.printf("  %-25s → %s%n", card, valid ? "✅ VALID" : "❌ INVALID");
        }

        // ─── String vs Regex Comparison ──────────────────────────────────

        System.out.println("\n" + "-" .repeat(70));
        System.out.println("\n⚡ STRING vs REGEX COMPARISON:");

        // Using string methods to find emails (simple approach)
        long stringStart = System.nanoTime();
        Set<String> emailsFound = new HashSet<>();
        for (String part : sampleText.split("\\s+")) {
            if (part.contains("@") && part.contains(".")) {
                // Simple check: has @ and . after it
                int atIndex = part.indexOf('@');
                if (atIndex > 0 && atIndex < part.length() - 1) {
                    int dotIndex = part.indexOf('.', atIndex);
                    if (dotIndex > atIndex + 1) {
                        emailsFound.add(part.replaceAll("[^a-zA-Z0-9@._-]", ""));
                    }
                }
            }
        }
        long stringEnd = System.nanoTime();

        // Using regex to find emails
        long regexStart = System.nanoTime();
        List<String> regexEmails = extractEmails(sampleText);
        long regexEnd = System.nanoTime();

        System.out.printf("  String method (split + contains):  %6d μs%n", (stringEnd - stringStart) / 1000);
        System.out.printf("  Regex method (Pattern + Matcher):  %6d μs%n", (regexEnd - regexStart) / 1000);
        System.out.println("  Emails found (string): " + emailsFound);
        System.out.println("  Emails found (regex):  " + regexEmails);

        System.out.println("\n" + "=" .repeat(70));
        System.out.println("✅ Data extraction demo complete.");
        System.out.println("=" .repeat(70));
    }
}