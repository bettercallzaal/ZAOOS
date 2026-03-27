/**
 * Text analysis utilities for ZAO OS.
 *
 * Ported from ZAOVideoEditor's Python NLP pipeline. All algorithms are pure
 * TypeScript with zero external dependencies — works in both Node.js and the
 * browser.
 *
 * Primary use-cases:
 * - Auto-tagging Farcaster casts and cross-posts
 * - Generating hashtags for social publishing
 * - Extracting discussion topics from community conversations
 * - Segmenting long-form text into titled sections
 */

// ---------------------------------------------------------------------------
// Stop words
// ---------------------------------------------------------------------------

/**
 * Comprehensive English stop-word list.
 *
 * Includes standard function words, contractions, conversational fillers,
 * and generic verbs/adjectives that carry little topical signal. Used by
 * every extraction function to filter noise.
 */
export const STOP_WORDS: Set<string> = new Set([
  // Articles, prepositions, conjunctions, pronouns
  "the", "a", "an", "is", "are", "was", "were", "be", "been", "being",
  "have", "has", "had", "do", "does", "did", "will", "would", "could",
  "should", "may", "might", "shall", "can", "need", "to", "of", "in",
  "for", "on", "with", "at", "by", "from", "as", "into", "through",
  "during", "before", "after", "above", "below", "between", "out",
  "off", "over", "under", "again", "further", "then", "once", "here",
  "there", "when", "where", "why", "how", "all", "both", "each", "few",
  "more", "most", "other", "some", "such", "no", "nor", "not", "only",
  "own", "same", "so", "than", "too", "very", "just", "because", "but",
  "and", "or", "if", "while", "about", "up", "it", "its", "i", "me",
  "my", "we", "our", "you", "your", "he", "him", "his", "she", "her",
  "they", "them", "their", "this", "that", "these", "those", "what",
  "which", "who", "whom",
  // Conversational fillers and generic modifiers
  "also", "back", "still", "even", "much", "many", "like", "really",
  "actually", "basically", "literally", "kind", "sort", "something",
  "stuff", "things", "thing", "gonna", "people", "think", "know",
  "right", "yeah", "okay", "well", "want", "need", "make", "take",
  "come", "look", "give", "tell", "talk", "get", "got", "said", "say",
  "going", "went", "done", "doing", "been", "made", "let", "put",
  "way", "time", "now", "good", "lot", "bit", "whole", "part",
  "called", "first", "last", "next", "new", "one", "two", "three",
  "long", "big", "little", "start", "started", "work", "worked",
  "working", "built", "build", "building", "cool", "awesome", "amazing",
  "great", "love", "pretty", "super", "feel", "feeling", "guess",
  "maybe", "probably", "able",
  // Contractions
  "don't", "doesn't", "didn't", "won't", "wouldn't", "couldn't",
  "shouldn't", "can't", "isn't", "aren't", "wasn't", "weren't",
  "i'm", "you're", "he's", "she's", "it's", "we're", "they're",
  "i've", "you've", "we've", "they've", "i'd", "you'd", "he'd",
  "she'd", "we'd", "they'd", "i'll", "you'll", "he'll", "she'll",
  "we'll", "they'll", "let's", "that's", "who's", "what's",
  "here's", "there's", "person", "guys", "everybody", "everyone",
]);

// ---------------------------------------------------------------------------
// Tokenisation helpers
// ---------------------------------------------------------------------------

/** Regex for words containing only lowercase letters, at least 4 chars. */
const WORD_RE = /\b[a-z]{4,}\b/g;

/**
 * Tokenise `text` into lowercase words of 4+ characters, excluding stop words.
 */
function tokenize(text: string): string[] {
  const matches = text.toLowerCase().match(WORD_RE);
  if (!matches) return [];
  return matches.filter((w) => !STOP_WORDS.has(w));
}

/**
 * Split text into sentences using common punctuation boundaries.
 * Falls back to splitting on double-newlines if no punctuation is found.
 */
function splitSentences(text: string): string[] {
  // Split on sentence-ending punctuation followed by whitespace or end-of-string
  const raw = text.split(/(?<=[.!?])\s+/);
  const sentences = raw
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
  if (sentences.length <= 1) {
    // Fallback: split on double newlines or single newlines
    return text
      .split(/\n{1,2}/)
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
  }
  return sentences;
}

// ---------------------------------------------------------------------------
// 1. TF-IDF keyword extraction
// ---------------------------------------------------------------------------

/**
 * Extract the top keywords from `text` using TF-IDF scoring.
 *
 * **Algorithm:**
 * 1. Split text into sentences (treated as individual "documents").
 * 2. Tokenise each sentence — lowercase, 4+ chars, stop words removed.
 * 3. Compute **term frequency (TF)** across the full text.
 * 4. Compute **inverse document frequency (IDF)** as
 *    `log(N / df) + 1` (smoothed), where `df` is the number of sentences
 *    containing the term.
 * 5. Final score = `TF_normalised * IDF * raw_frequency` (the raw frequency
 *    boost prevents very rare terms from dominating).
 * 6. Return the top `topN` terms sorted by score descending.
 *
 * @param text  - Input text to analyse.
 * @param topN  - Maximum number of keywords to return (default 10).
 * @returns Array of keywords sorted by TF-IDF score, highest first.
 */
export function extractKeywords(text: string, topN = 10): string[] {
  const sentences = splitSentences(text);
  if (sentences.length === 0) return [];

  // Build per-sentence word sets for IDF
  const sentenceWordSets: Set<string>[] = sentences.map(
    (s) => new Set(tokenize(s)),
  );

  // Document frequency: how many sentences contain each word
  const df = new Map<string, number>();
  for (const wordSet of sentenceWordSets) {
    for (const w of wordSet) {
      df.set(w, (df.get(w) ?? 0) + 1);
    }
  }

  // Term frequency across the full text
  const allTokens = tokenize(text);
  if (allTokens.length === 0) return [];

  const tf = new Map<string, number>();
  for (const w of allTokens) {
    tf.set(w, (tf.get(w) ?? 0) + 1);
  }

  // Compute TF-IDF scores
  const nDocs = sentenceWordSets.length;
  const scores: Array<[string, number]> = [];

  for (const [word, freq] of tf) {
    const docFreq = df.get(word) ?? 1;
    const idf = Math.log(nDocs / docFreq) + 1; // smoothed IDF
    const tfNorm = freq / allTokens.length;
    const score = tfNorm * idf * freq; // boost by raw frequency
    scores.push([word, score]);
  }

  scores.sort((a, b) => b[1] - a[1]);
  return scores.slice(0, topN).map(([word]) => word);
}

// ---------------------------------------------------------------------------
// 2. Named entity extraction
// ---------------------------------------------------------------------------

/**
 * Words that commonly start sentences but are not named entities.
 * Used to avoid false positives when detecting capitalised sequences.
 */
const SKIP_WORDS: Set<string> = new Set([
  "I", "So", "And", "But", "The", "This", "That", "Yeah", "Yes",
  "No", "Like", "Well", "Just", "Also", "Very", "Oh", "Really",
  "Actually", "Basically", "Because", "Right", "Okay", "Hey",
  "What", "How", "Why", "When", "Where", "Who", "Which",
  "If", "Or", "Not", "My", "We", "He", "She", "It", "They",
  "His", "Her", "Our", "Your", "Their", "There", "Here",
  "Some", "Any", "All", "Each", "Every", "Been", "Have",
  "Has", "Had", "Was", "Were", "Are", "Will", "Would", "Could",
  "Should", "Do", "Does", "Did", "Can", "May", "Might",
  "Thank", "Thanks", "Cool", "Nice", "Awesome", "Amazing",
  "Great", "Good", "Exactly", "Absolutely", "Definitely",
  "Another", "First", "Last", "Next", "New", "Old",
]);

/** Connecting words that can appear between proper-noun parts. */
const CONNECTORS: Set<string> = new Set([
  "and", "of", "the", "for", "in", "on", "at", "de",
]);

/** Phrases that look like entities but are not. */
const SKIP_PHRASES: Set<string> = new Set([
  "with fiat", "the time", "the moment", "the game",
  "the idea", "the plan", "at the", "on the",
]);

/**
 * Strip non-alphanumeric characters (except hyphens/apostrophes) from a word.
 */
function cleanWord(w: string): string {
  return w.replace(/[^A-Za-z0-9'-]/g, "");
}

/**
 * Extract named entities (proper nouns) from `text`.
 *
 * **Algorithm:**
 * 1. Split text into individual words.
 * 2. Walk through words looking for capitalised tokens (length >= 3) that
 *    are not in the `SKIP_WORDS` set.
 * 3. Extend the match through consecutive capitalised words, allowing
 *    small connecting words ("and", "of", "the", etc.) when followed by
 *    another capitalised word — this captures multi-word names like
 *    "Gods and Chain" or "Bank of America".
 * 4. Single capitalised words are only counted when they do not start a
 *    sentence (heuristic: word index > 0 within its sentence).
 * 5. Deduplicate and return unique entities sorted by frequency descending.
 *
 * @param text - Input text to analyse.
 * @returns Array of unique entity strings, most frequent first.
 */
export function extractEntities(text: string): string[] {
  const sentences = splitSentences(text);
  const entityCounts = new Map<string, number>();

  for (const sentence of sentences) {
    const words = sentence.split(/\s+/);
    let idx = 0;

    while (idx < words.length) {
      const w = cleanWord(words[idx]);
      if (!w || w.length < 3 || !isUpperFirst(w) || SKIP_WORDS.has(w)) {
        idx++;
        continue;
      }

      // Start of a potential entity — try to extend
      const phraseParts: string[] = [w];
      let j = idx + 1;

      while (j < words.length) {
        const nextW = cleanWord(words[j]);
        if (!nextW) break;

        if (isUpperFirst(nextW) && !SKIP_WORDS.has(nextW)) {
          phraseParts.push(nextW);
          j++;
        } else if (
          CONNECTORS.has(nextW.toLowerCase()) &&
          j + 1 < words.length
        ) {
          const after = cleanWord(words[j + 1]);
          if (after && isUpperFirst(after) && !SKIP_WORDS.has(after)) {
            phraseParts.push(nextW.toLowerCase());
            phraseParts.push(after);
            j += 2;
          } else {
            break;
          }
        } else {
          break;
        }
      }

      if (phraseParts.length >= 2) {
        const entity = phraseParts.join(" ");
        if (!SKIP_PHRASES.has(entity.toLowerCase())) {
          entityCounts.set(entity, (entityCounts.get(entity) ?? 0) + 1);
        }
        idx = j;
        continue;
      }

      // Single capitalised word — only count if not sentence-start
      if (idx > 0 && !STOP_WORDS.has(w.toLowerCase())) {
        entityCounts.set(w, (entityCounts.get(w) ?? 0) + 1);
      }

      idx++;
    }
  }

  // Sort by frequency descending, then alphabetically for ties
  return [...entityCounts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([entity]) => entity);
}

/** Check whether the first character of a string is uppercase. */
function isUpperFirst(s: string): boolean {
  return s.length > 0 && s[0] >= "A" && s[0] <= "Z";
}

// ---------------------------------------------------------------------------
// 3. Topic segmentation
// ---------------------------------------------------------------------------

/**
 * Segment `text` into topical sections with auto-generated titles.
 *
 * **Algorithm (vocabulary-shift detection):**
 * 1. Split text into sentences.
 * 2. For each sentence position, build a vocabulary window: the set of
 *    distinctive words (5+ chars, stop words removed) within a sliding
 *    window of neighbouring sentences.
 * 3. Score each position as a potential topic boundary using the
 *    **Jaccard distance** between the vocabulary of the preceding window
 *    and the following window. High distance = high vocabulary shift =
 *    likely topic change.
 * 4. Also boost the score for transition phrases ("let's talk about",
 *    "moving on", "another thing", etc.) and questions.
 * 5. Select the top-scoring boundaries ensuring a minimum sentence gap
 *    between them.
 * 6. For each resulting segment, generate a title from its top TF-IDF
 *    keywords.
 *
 * @param text              - Input text to segment.
 * @param minSegmentLength  - Minimum number of sentences per segment (default 3).
 * @returns Array of segments, each with a `title` and the segment `text`.
 */
export function segmentTopics(
  text: string,
  minSegmentLength = 3,
): Array<{ title: string; text: string }> {
  const sentences = splitSentences(text);

  if (sentences.length < minSegmentLength * 2) {
    // Too short to segment meaningfully
    const title = extractKeywords(text, 3).join(", ") || "Discussion";
    return [{ title, text }];
  }

  const windowSize = Math.max(3, Math.floor(sentences.length / 8));

  // Build vocabulary windows
  const vocabWindows: Set<string>[] = sentences.map((_, i) => {
    const start = Math.max(0, i - windowSize);
    const end = Math.min(sentences.length, i + windowSize);
    const windowText = sentences.slice(start, end).join(" ").toLowerCase();
    const words = new Set(
      (windowText.match(/\b[a-z]{5,}\b/g) ?? []).filter(
        (w) => !STOP_WORDS.has(w),
      ),
    );
    return words;
  });

  // Transition phrases that signal topic changes
  const transitionPhrases = [
    "let's talk", "moving on", "another thing", "next topic",
    "speaking of", "switching to", "i also want", "tell us",
    "i'd love to", "let me tell", "the idea for", "the plan",
    "so basically", "from there", "and then from",
    "what about", "how did you", "can you tell",
  ];

  // Score each sentence boundary
  const boundaryScores: Array<[number, number]> = [];

  for (let i = 1; i < sentences.length; i++) {
    let score = 0;

    // Vocabulary shift (Jaccard distance)
    const prevIdx = Math.max(0, i - windowSize);
    const currIdx = Math.min(sentences.length - 1, i + Math.floor(windowSize / 2));
    const prevVocab = vocabWindows[prevIdx];
    const currVocab = vocabWindows[currIdx];

    if (prevVocab.size > 0 && currVocab.size > 0) {
      let intersectionSize = 0;
      for (const w of prevVocab) {
        if (currVocab.has(w)) intersectionSize++;
      }
      const unionSize = new Set([...prevVocab, ...currVocab]).size;
      if (unionSize > 0) {
        const jaccardDist = 1.0 - intersectionSize / unionSize;
        score += jaccardDist * 3.0;
      }
    }

    // Transition phrase detection
    const sentenceLower = sentences[i].toLowerCase();
    if (transitionPhrases.some((p) => sentenceLower.includes(p))) {
      score += 2.0;
    }

    // Question detection
    if (sentenceLower.trimEnd().endsWith("?")) {
      score += 0.8;
    }

    boundaryScores.push([i, score]);
  }

  // Sort by score descending
  boundaryScores.sort((a, b) => b[1] - a[1]);

  // Select boundaries with minimum spacing
  const targetSegments = Math.max(
    2,
    Math.min(8, Math.floor(sentences.length / minSegmentLength)),
  );
  const selectedBoundaries: number[] = [0];
  const usedIndices = new Set<number>([0]);

  for (const [idx, _score] of boundaryScores) {
    if (selectedBoundaries.length >= targetSegments) break;
    // Ensure minimum spacing
    const tooClose = [...usedIndices].some(
      (used) => Math.abs(idx - used) < minSegmentLength,
    );
    if (tooClose) continue;
    selectedBoundaries.push(idx);
    usedIndices.add(idx);
  }

  // Sort boundaries in order
  selectedBoundaries.sort((a, b) => a - b);

  // Build segments with titles
  const segments: Array<{ title: string; text: string }> = [];

  for (let i = 0; i < selectedBoundaries.length; i++) {
    const start = selectedBoundaries[i];
    const end =
      i + 1 < selectedBoundaries.length
        ? selectedBoundaries[i + 1]
        : sentences.length;

    const segmentText = sentences.slice(start, end).join(" ");
    const keywords = extractKeywords(segmentText, 3);
    const title =
      keywords.length > 0
        ? keywords.map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(", ")
        : "Discussion";

    segments.push({ title, text: segmentText });
  }

  return segments;
}

// ---------------------------------------------------------------------------
// 4. Hashtag generation
// ---------------------------------------------------------------------------

/**
 * Generate hashtags from the text's top keywords.
 *
 * **Algorithm:**
 * 1. Extract keywords via TF-IDF.
 * 2. Extract named entities.
 * 3. Merge both lists (entities first for higher relevance).
 * 4. Convert each to `#camelCase` format — multi-word entities become
 *    a single camelCase tag (e.g., "Bank of America" -> "#bankOfAmerica").
 * 5. Filter out tags shorter than 4 characters or longer than 30.
 * 6. Deduplicate (case-insensitive) and return up to `maxTags`.
 *
 * @param text    - Input text to generate hashtags from.
 * @param maxTags - Maximum number of hashtags to return (default 10).
 * @returns Array of hashtag strings including the `#` prefix.
 */
export function generateHashtags(text: string, maxTags = 10): string[] {
  const keywords = extractKeywords(text, maxTags * 2);
  const entities = extractEntities(text);

  // Merge: entities first (typically more meaningful), then keywords
  const candidates: string[] = [...entities, ...keywords];
  const seen = new Set<string>();
  const hashtags: string[] = [];

  for (const candidate of candidates) {
    const tag = toCamelCaseTag(candidate);
    // Enforce length constraints (excluding the # prefix)
    const tagBody = tag.slice(1);
    if (tagBody.length < 3 || tagBody.length > 30) continue;

    const lower = tag.toLowerCase();
    if (seen.has(lower)) continue;
    seen.add(lower);
    hashtags.push(tag);

    if (hashtags.length >= maxTags) break;
  }

  return hashtags;
}

/**
 * Convert a word or phrase into a `#camelCase` hashtag.
 *
 * Examples:
 * - "machine learning" -> "#machineLearning"
 * - "Bank of America"  -> "#bankOfAmerica"
 * - "blockchain"       -> "#blockchain"
 */
function toCamelCaseTag(phrase: string): string {
  const parts = phrase
    .split(/[\s_-]+/)
    .filter((p) => p.length > 0);

  if (parts.length === 0) return "#";

  const camel = parts
    .map((p, i) =>
      i === 0
        ? p.toLowerCase()
        : p.charAt(0).toUpperCase() + p.slice(1).toLowerCase(),
    )
    .join("");

  return `#${camel}`;
}
