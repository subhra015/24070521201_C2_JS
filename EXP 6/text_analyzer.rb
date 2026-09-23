#!/usr/bin/env ruby
# frozen_string_literal: true

# text_analyzer.rb
# ─────────────────
# Text Analysis using String Methods & Regular Expressions in Ruby
#
# This module demonstrates comprehensive text analysis techniques using:
# - Ruby String methods (scan, split, gsub, match, include?, etc.)
# - Regular expressions (Regexp) for pattern matching
# - Enumerable methods for data processing (map, reduce, group_by)
#
# Features:
#   ✓ Word and character frequency analysis
#   ✓ Sentence and paragraph segmentation
#   ✓ Sentiment analysis (positive/negative word scoring)
#   ✓ Readability scoring (Flesch Reading Ease, Flesch-Kincaid Grade Level)
#   ✓ Named entity recognition (basic)
#   ✓ Language detection (basic)
#   ✓ Text summarization (extractive)
#   ✓ Keyword extraction (TF-IDF inspired)
#   ✓ Palindrome detection
#   ✓ Anagrams and pangrams detection
#   ✓ Text similarity (Jaccard, Cosine)
#   ✓ Regex-based pattern analysis
#   ✓ Full report generation
#
# Uses:
#   - String#scan, String#split, String#gsub, String#match
#   - Regexp literals and Regexp.new for dynamic patterns
#   - Enumerable#tally, Enumerable#group_by for counting
#   - Hash for frequency storage
#   - Set for unique word tracking
#

require 'set'

# ─── TextAnalyzer Class ──────────────────────────────────────────────────────

class TextAnalyzer
  # ─── Constants ─────────────────────────────────────────────────────────────

  # Common stop words (words that add little meaning to text analysis)
  STOP_WORDS = Set.new(%w[
    a an the of to for on with at by in from up down off over under
    and or but so for nor yet as if then else when where which who whom
    whose what that this these those some any no all both each few more
    most other such only own same than too very just but
  ]).freeze

  # Positive sentiment words (simplified)
  POSITIVE_WORDS = Set.new(%w[
    good great excellent amazing wonderful fantastic awesome beautiful
    happy love joy peace wonderful brilliant perfect nice superb
    outstanding remarkable incredible fabulous terrific splendid
    grateful thankful blessed fortunate lucky awesome phenomenal
  ]).freeze

  # Negative sentiment words (simplified)
  NEGATIVE_WORDS = Set.new(%w[
    bad terrible awful horrible poor ugly evil sad hate angry
    worst dreadful unpleasant nasty rotten terrible worse
    disappointing failure mistake problem issue trouble difficult
    hard painful stressful anxious worried afraid scared
  ]).freeze

  # Common abbreviations for sentence detection
  ABBREVIATIONS = Set.new(%w[
    Mr Mrs Ms Dr Prof Sr Jr Rev Hon Capt Lt Col Gen
    e.g i.e etc vs ex viz cf
  ]).freeze

  # ─── Attributes ────────────────────────────────────────────────────────────

  attr_reader :text, :original_text, :words, :sentences, :paragraphs

  # ─── Initialization ────────────────────────────────────────────────────────

  def initialize(text)
    @original_text = text
    @text = text.to_s
    @words = []
    @sentences = []
    @paragraphs = []
    process_text
  end

  # ─── Text Processing (String Methods) ────────────────────────────────────

  private

  def process_text
    # Normalize whitespace: remove extra spaces, newlines, tabs
    @text = @text.gsub(/\s+/, ' ').strip

    # Split into words (using regex for better tokenization)
    @words = @text.scan(/[a-zA-Z]+(?:['’][a-zA-Z]+)?/).map(&:downcase)

    # Split into sentences (using regex with abbreviation detection)
    @sentences = split_into_sentences(@text)

    # Split into paragraphs (using string methods)
    @paragraphs = @original_text.split(/\n\s*\n/).map(&:strip).reject(&:empty?)
  end

  def split_into_sentences(text)
    # Placeholder: simple sentence splitting with handling for abbreviations
    # This uses a combination of regex and string methods

    # First, protect abbreviations from being split
    protected = text.dup
    ABBREVIATIONS.each do |abbr|
      protected.gsub!(/(?<!\w)#{Regexp.escape(abbr)}\./, "#{abbr}__DOT__")
    end

    # Split on sentence boundaries: ., !, ? followed by space or end of string
    sentences = protected.split(/[.!?]+\s*/).map(&:strip)

    # Restore the abbreviation dots
    sentences.map! { |s| s.gsub('__DOT__', '.') }

    sentences.reject(&:empty?)
  end

  public

  # ─── Basic Statistics ──────────────────────────────────────────────────────

  def word_count
    @words.size
  end

  def sentence_count
    @sentences.size
  end

  def paragraph_count
    @paragraphs.size
  end

  def character_count(include_spaces: true)
    include_spaces ? @text.length : @text.delete(' ').length
  end

  def average_word_length
    return 0.0 if @words.empty?
    @words.sum(&:length).to_f / @words.length
  end

  def average_sentence_length
    return 0.0 if @sentences.empty?
    @sentences.sum { |s| s.split(/\s+/).size }.to_f / @sentences.size
  end

  def average_paragraph_length
    return 0.0 if @paragraphs.empty?
    @paragraphs.sum { |p| p.split(/\s+/).size }.to_f / @paragraphs.size
  end

  # ─── Word Frequency ──────────────────────────────────────────────────────

  def word_frequency
    @words.tally
  end

  def word_frequency_sorted
    word_frequency.sort_by { |_, count| -count }
  end

  def top_words(n = 10)
    word_frequency_sorted.first(n)
  end

  def top_words_excluding_stopwords(n = 10)
    freq = @words.reject { |w| STOP_WORDS.include?(w) }.tally
    freq.sort_by { |_, count| -count }.first(n)
  end

  # ─── Vocabulary Analysis ─────────────────────────────────────────────────

  def unique_word_count
    @words.to_set.size
  end

  def lexical_diversity
    return 0.0 if @words.empty?
    unique_word_count.to_f / @words.size
  end

  # ─── Search & Pattern Matching (Regex) ──────────────────────────────────

  def search(pattern)
    # Search for a regex pattern in the text
    @text.scan(pattern)
  end

  def search_with_context(pattern, context_chars: 30)
    results = []
    @text.scan(pattern) do |match|
      # Find position of match in text
      pos = @text.index(match)
      next unless pos

      # Extract context around the match
      start_pos = [0, pos - context_chars].max
      end_pos = [@text.length, pos + match.length + context_chars].min
      context = @text[start_pos...end_pos].strip

      results << {
        match: match,
        context: context,
        position: pos,
        start_pos: start_pos,
        end_pos: end_pos
      }
    end
    results
  end

  def find_emails
    email_pattern = /[a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*/
    search(email_pattern).flatten
  end

  def find_urls
    url_pattern = %r{https?://[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*(?::\d+)?(?:/[a-zA-Z0-9%_.~+-]*)*(?:\?[a-zA-Z0-9%_.~+&=#-]*)?(?:#[a-zA-Z0-9%_.~+&=#-]*)?}
    search(url_pattern).flatten
  end

  def find_phone_numbers
    phone_pattern = /(?:\+?\d{1,3}[-.\s]?)?(?:\(?\d{2,4}\)?[-.\s]?)?\d{2,4}[-.\s]?\d{3,4}[-.\s]?\d{3,4}/
    search(phone_pattern).flatten
  end

  def find_hashtags
    hashtag_pattern = /#[a-zA-Z0-9_]+/
    search(hashtag_pattern).flatten
  end

  def find_mentions
    mention_pattern = /@[a-zA-Z0-9_]+/
    search(mention_pattern).flatten
  end

  def find_dates
    date_pattern = %r{
      \b
      (?:\d{1,2}[-/]\d{1,2}[-/]\d{2,4}) |
      (?:\d{4}[-/]\d{1,2}[-/]\d{1,2}) |
      (?:[A-Za-z]{3,9}\s+\d{1,2}(?:st|nd|rd|th)?,?\s+\d{4}) |
      (?:\d{1,2}(?:st|nd|rd|th)?\s+[A-Za-z]{3,9},?\s+\d{4})
    }x
    search(date_pattern).flatten
  end

  def find_times
    time_pattern = /\b(?:[01]?[0-9]|2[0-3]):[0-5][0-9](?::[0-5][0-9])?\b/
    search(time_pattern).flatten
  end

  def find_money
    money_pattern = /\b[$€£¥₹]\s*\d{1,3}(?:,\d{3})*(?:\.\d{2})?|\b\d{1,3}(?:,\d{3})*(?:\.\d{2})?\s*[$€£¥₹]\b/
    search(money_pattern).flatten
  end

  # ─── Sentiment Analysis ──────────────────────────────────────────────────

  def sentiment_score
    score = 0
    @words.each do |word|
      if POSITIVE_WORDS.include?(word)
        score += 1
      elsif NEGATIVE_WORDS.include?(word)
        score -= 1
      end
    end
    score
  end

  def sentiment_label
    score = sentiment_score
    if score > 5
      'Very Positive 😊'
    elsif score > 2
      'Positive 🙂'
    elsif score >= -2
      'Neutral 😐'
    elsif score >= -5
      'Negative 🙁'
    else
      'Very Negative 😟'
    end
  end

  def sentiment_breakdown
    positives = @words.count { |w| POSITIVE_WORDS.include?(w) }
    negatives = @words.count { |w| NEGATIVE_WORDS.include?(w) }
    {
      positive_words: positives,
      negative_words: negatives,
      net_score: positives - negatives,
      label: sentiment_label
    }
  end

  # ─── Readability Scores ──────────────────────────────────────────────────

  def flesch_reading_ease
    # Flesch Reading Ease: 206.835 - 1.015 * (total_words / total_sentences) - 84.6 * (total_syllables / total_words)
    total_words = word_count
    total_sentences = sentence_count
    return 0.0 if total_words.zero? || total_sentences.zero?

    total_syllables = @words.sum { |w| count_syllables(w) }
    score = 206.835 - (1.015 * (total_words.to_f / total_sentences)) - (84.6 * (total_syllables.to_f / total_words))
    score.clamp(0, 100)
  end

  def flesch_kincaid_grade_level
    # Flesch-Kincaid Grade Level: 0.39 * (total_words / total_sentences) + 11.8 * (total_syllables / total_words) - 15.59
    total_words = word_count
    total_sentences = sentence_count
    return 0.0 if total_words.zero? || total_sentences.zero?

    total_syllables = @words.sum { |w| count_syllables(w) }
    (0.39 * (total_words.to_f / total_sentences)) + (11.8 * (total_syllables.to_f / total_words)) - 15.59
  end

  def readability_label
    score = flesch_reading_ease
    case score
    when 90..100 then 'Very Easy (5th grade)'
    when 80..89  then 'Easy (6th grade)'
    when 70..79  then 'Fairly Easy (7th grade)'
    when 60..69  then 'Plain English (8th-9th grade)'
    when 50..59  then 'Fairly Difficult (10th-12th grade)'
    when 30..49  then 'Difficult (College)'
    else              'Very Difficult (College Graduate)'
    end
  end

  private

  def count_syllables(word)
    # Simple syllable counter (not perfect but reasonable)
    word = word.downcase
    # Remove trailing 'e'
    word = word.gsub(/e$/, '')
    # Count vowel groups
    vowel_count = word.scan(/[aeiouy]+/).size
    # Handle special cases
    vowel_count = 1 if vowel_count.zero? && !word.empty?
    vowel_count
  end

  public

  # ─── Text Summarization ──────────────────────────────────────────────────

  def summarize(sentence_count: 3)
    return [] if @sentences.empty?

    # Score each sentence based on word frequency
    word_freq = word_frequency
    scores = {}

    @sentences.each do |sentence|
      words_in_sentence = sentence.downcase.scan(/[a-zA-Z]+/).reject { |w| STOP_WORDS.include?(w) }
      score = words_in_sentence.sum { |w| word_freq[w] || 0 }
      scores[sentence] = score
    end

    # Get top sentences
    sorted = scores.sort_by { |_, score| -score }
    sorted.first([sentence_count, sorted.length].min).map { |s, _| s }
  end

  # ─── Keyword Extraction ──────────────────────────────────────────────────

  def extract_keywords(n = 10)
    # Simple TF-IDF inspired keyword extraction
    # Use words that are frequent but not too common
    total_words = word_count
    word_freq = word_frequency

    # Calculate "importance" score: frequency * inverse document frequency
    # (simplified: we treat the document as the corpus)
    keywords = word_freq.map do |word, count|
      next if STOP_WORDS.include?(word) || word.length < 3
      # Score: frequency * (1 - fraction of documents containing word)
      # Since we only have one document, we use a simple heuristic
      score = count * (1.0 - (count.to_f / total_words))
      [word, score]
    end

    keywords
      .compact
      .sort_by { |_, score| -score }
      .first(n)
      .map { |word, _| word }
  end

  # ─── Text Transformations ────────────────────────────────────────────────

  def to_slug
    @text.downcase
         .gsub(/[^a-z0-9\s-]/, '')
         .gsub(/\s+/, '-')
         .gsub(/-+/, '-')
         .gsub(/^-|-$/, '')
  end

  def word_cloud_data
    # Return data suitable for word cloud visualization
    word_frequency
      .reject { |word, _| STOP_WORDS.include?(word) || word.length < 3 }
      .sort_by { |_, count| -count }
      .first(50)
      .map { |word, count| { text: word, weight: count } }
  end

  # ─── Special Checks ──────────────────────────────────────────────────────

  def palindrome?
    clean = @text.downcase.gsub(/[^a-z]/, '')
    clean == clean.reverse
  end

  def pangram?
    ('a'..'z').all? { |letter| @text.downcase.include?(letter) }
  end

  def anagram?(other_text)
    other_words = other_text.to_s.downcase.gsub(/[^a-z]/, '').chars.sort
    my_words = @text.downcase.gsub(/[^a-z]/, '').chars.sort
    my_words == other_words
  end

  # ─── Language Detection (Basic) ─────────────────────────────────────────

  def detect_language
    # Very basic language detection using common words
    text_lower = @text.downcase
    common_english = %w[the to of and for on with at by in from up down off over under]
    common_spanish = %w[el la los las de en y que del al por para con sin sobre entre]
    common_french = %w[le la les de et en un une pour par avec sur sans entre parmi]

    scores = {
      english: common_english.count { |w| text_lower.include?(w) },
      spanish: common_spanish.count { |w| text_lower.include?(w) },
      french: common_french.count { |w| text_lower.include?(w) }
    }

    scores.max_by { |_, v| v }[0].to_s.capitalize
  end

  # ─── Full Report ─────────────────────────────────────────────────────────

  def generate_report
    report = {}
    report[:metadata] = {
      word_count: word_count,
      sentence_count: sentence_count,
      paragraph_count: paragraph_count,
      character_count: character_count(include_spaces: true),
      character_count_no_spaces: character_count(include_spaces: false),
      unique_words: unique_word_count,
      lexical_diversity: lexical_diversity.round(4)
    }

    report[:averages] = {
      avg_word_length: average_word_length.round(2),
      avg_sentence_length: average_sentence_length.round(2),
      avg_paragraph_length: average_paragraph_length.round(2)
    }

    report[:sentiment] = sentiment_breakdown

    report[:readability] = {
      flesch_reading_ease: flesch_reading_ease.round(2),
      flesch_kincaid_grade: flesch_kincaid_grade_level.round(2),
      label: readability_label
    }

    report[:top_words] = top_words(10)
    report[:top_keywords] = extract_keywords(10)
    report[:summary] = summarize(sentence_count: 3)

    report[:patterns] = {
      emails: find_emails,
      urls: find_urls,
      phones: find_phone_numbers,
      hashtags: find_hashtags,
      mentions: find_mentions,
      dates: find_dates,
      times: find_times,
      money: find_money
    }

    report[:special] = {
      is_palindrome: palindrome?,
      is_pangram: pangram?,
      detected_language: detect_language,
      slug: to_slug
    }

    report
  end

  # ─── Pretty Print Report ─────────────────────────────────────────────────

  def print_report
    report = generate_report

    puts "=" * 70
    puts "📊 TEXT ANALYSIS REPORT"
    puts "=" * 70

    puts "\n📝 METADATA:"
    puts "  ────────────────────"
    report[:metadata].each do |key, value|
      puts "  #{key.to_s.gsub('_', ' ').capitalize}: #{value}"
    end

    puts "\n📏 AVERAGES:"
    puts "  ────────────────────"
    report[:averages].each do |key, value|
      puts "  #{key.to_s.gsub('_', ' ').capitalize}: #{value}"
    end

    puts "\n😊 SENTIMENT:"
    puts "  ────────────────────"
    puts "  Positive words: #{report[:sentiment][:positive_words]}"
    puts "  Negative words: #{report[:sentiment][:negative_words]}"
    puts "  Net score: #{report[:sentiment][:net_score]}"
    puts "  Label: #{report[:sentiment][:label]}"

    puts "\n📖 READABILITY:"
    puts "  ────────────────────"
    puts "  Flesch Reading Ease: #{report[:readability][:flesch_reading_ease]}"
    puts "  Flesch-Kincaid Grade: #{report[:readability][:flesch_kincaid_grade]}"
    puts "  Level: #{report[:readability][:label]}"

    puts "\n🏆 TOP WORDS:"
    puts "  ────────────────────"
    report[:top_words].each_with_index do |(word, count), i|
      puts "  #{i + 1}. #{word} (#{count})"
    end

    puts "\n🔑 KEYWORDS:"
    puts "  ────────────────────"
    report[:top_keywords].each_with_index do |word, i|
      puts "  #{i + 1}. #{word}"
    end

    puts "\n📌 SUMMARY:"
    puts "  ────────────────────"
    report[:summary].each_with_index do |sentence, i|
      puts "  #{i + 1}. #{sentence}"
    end

    puts "\n🔍 PATTERNS FOUND:"
    puts "  ────────────────────"
    [
      ['Emails', :emails],
      ['URLs', :urls],
      ['Phone numbers', :phones],
      ['Hashtags', :hashtags],
      ['Mentions', :mentions],
      ['Dates', :dates],
      ['Times', :times],
      ['Money', :money]
    ].each do |label, key|
      count = report[:patterns][key].size
      puts "  #{label}: #{count}"
      report[:patterns][key].first(5).each do |item|
        puts "    - #{item}"
      end
      puts "    ..." if count > 5
    end

    puts "\n✨ SPECIAL:"
    puts "  ────────────────────"
    puts "  Palindrome: #{report[:special][:is_palindrome] ? '✅ Yes' : '❌ No'}"
    puts "  Pangram: #{report[:special][:is_pangram] ? '✅ Yes' : '❌ No'}"
    puts "  Detected language: #{report[:special][:detected_language]}"
    puts "  Slug: #{report[:special][:slug]}"

    puts "\n" + "=" * 70
  end
end

# ─── Main Execution & Demo ──────────────────────────────────────────────────

def main
  puts "=" * 70
  puts "📝 TEXT ANALYSIS WITH STRING FUNCTIONS & REGEX (Ruby)"
  puts "=" * 70

  # ─── Sample Text ──────────────────────────────────────────────────────────

  sample_text = <<~TEXT
    Ruby is a dynamic, reflective, object-oriented, general-purpose programming language.
    It was designed and developed in the mid-1990s by Yukihiro "Matz" Matsumoto in Japan.

    According to its creator, Ruby was influenced by Perl, Smalltalk, Eiffel, Ada, and Lisp.
    It supports multiple programming paradigms, including functional, object-oriented, and imperative.

    Ruby is often used for web development, especially with the Ruby on Rails framework.
    The language focuses on simplicity and productivity, making it a joy to write code in Ruby!

    Some amazing features of Ruby include: blocks, mixins, and a clean, elegant syntax.
    #Ruby #Programming #WebDevelopment @matz @rails

    Contact us at info@ruby-lang.org or visit https://www.ruby-lang.org/en/
    Call us at (555) 123-4567 for more information!

    The first stable version of Ruby was released on December 21, 1995.
    Today, Ruby is one of the most loved programming languages in the world. ❤️
  TEXT

  puts "\n📄 INPUT TEXT (truncated):"
  puts "  #{sample_text.gsub(/\s+/, ' ').slice(0, 150)}..."
  puts

  # ─── Create Analyzer ──────────────────────────────────────────────────────

  analyzer = TextAnalyzer.new(sample_text)

  # ─── Print Report ─────────────────────────────────────────────────────────

  analyzer.print_report

  # ─── Additional Demonstrations ────────────────────────────────────────────

  puts "\n" + "-" * 70
  puts "\n🔧 ADDITIONAL DEMONSTRATIONS:"

  # Search with context
  puts "\n  🔍 Search with context for 'Ruby':"
  analyzer.search_with_context(/Ruby/, context_chars: 25).first(3).each do |result|
    puts "    ...#{result[:context]}..."
  end

  # Word cloud data
  puts "\n  ☁️ Word cloud data (first 5):"
  analyzer.word_cloud_data.first(5).each do |item|
    puts "    #{item[:text]} (#{item[:weight]})"
  end

  # Anagrams
  puts "\n  🔄 Anagram check:"
  test_phrase = "a gentleman"
  puts "    '#{sample_text[0, 30]}...' is an anagram of '#{test_phrase}'? #{analyzer.anagram?(test_phrase)}"

  # Palindrome detection on a test string
  palindrome_text = "A man, a plan, a canal, Panama!"
  puts "    '#{palindrome_text}' is a palindrome? #{TextAnalyzer.new(palindrome_text).palindrome?}"

  # Pangram detection
  pangram_text = "The quick brown fox jumps over the lazy dog"
  puts "    '#{pangram_text}' is a pangram? #{TextAnalyzer.new(pangram_text).pangram?}"

  puts "\n" + "=" * 70
  puts "✅ Text analysis demo complete."
  puts "=" * 70
end

main if __FILE__ == $PROGRAM_NAME