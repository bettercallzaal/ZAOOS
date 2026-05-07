/**
 * NEXUS V5 - Enhanced Auto-Tagging System
 * 
 * This script automatically generates and applies tags to links in the new optimized
 * data structure. It uses multiple strategies for tag generation:
 * 
 * 1. Domain extraction - Extracts meaningful tags from URL domains
 * 2. Keyword matching - Identifies relevant keywords in titles and descriptions
 * 3. Content analysis - Analyzes link content for relevant topics (optional)
 * 4. Tag relationships - Suggests tags based on related tags
 * 
 * The script also maintains the centralized tag registry with counts, colors, and relationships.
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const { URL } = require('url');

// Configuration
const CONFIG = {
  DATA_FILE: path.join(__dirname, 'src', 'data', 'links-new.json'),
  KEYWORD_MATCH_THRESHOLD: 0.7,  // Minimum confidence for keyword matching
  MAX_TAGS_PER_LINK: 10,         // Maximum number of tags to apply to a single link
  FETCH_CONTENT: false,          // Whether to fetch and analyze webpage content
  TAG_COLORS: {                  // Predefined colors for common tag categories
    development: "#3498db",
    finance: "#2ecc71",
    health: "#e74c3c",
    technology: "#9b59b6",
    education: "#f1c40f",
    news: "#34495e",
    social: "#1abc9c",
    entertainment: "#e67e22",
    business: "#7f8c8d",
    design: "#8e44ad",
    web3: "#2980b9",
    blockchain: "#27ae60",
    ethereum: "#8e44ad",
    music: "#f39c12",
    zao: "#c0392b"
  }
};

// Keyword maps for different categories
const KEYWORD_MAPS = {
  development: ['code', 'programming', 'developer', 'software', 'github', 'git', 'repository', 'coding', 'development'],
  finance: ['money', 'invest', 'stock', 'crypto', 'financial', 'bank', 'trading', 'finance', 'investment', 'economics'],
  health: ['fitness', 'exercise', 'diet', 'workout', 'health', 'medical', 'wellness', 'nutrition', 'healthcare'],
  technology: ['tech', 'technology', 'ai', 'artificial intelligence', 'machine learning', 'innovation', 'digital'],
  education: ['learn', 'course', 'tutorial', 'education', 'training', 'university', 'school', 'teaching', 'study'],
  news: ['news', 'article', 'blog', 'post', 'update', 'report', 'journalism', 'media', 'press'],
  social: ['social', 'community', 'network', 'forum', 'discussion', 'platform', 'connect', 'group'],
  entertainment: ['game', 'movie', 'music', 'video', 'stream', 'entertainment', 'play', 'fun', 'gaming'],
  business: ['business', 'company', 'startup', 'enterprise', 'corporate', 'industry', 'market', 'commerce'],
  design: ['design', 'ui', 'ux', 'interface', 'graphic', 'art', 'creative', 'visual', 'layout'],
  web3: ['web3', 'blockchain', 'crypto', 'ethereum', 'token', 'nft', 'dao', 'defi', 'decentralized'],
  music: ['music', 'song', 'track', 'album', 'artist', 'playlist', 'audio', 'band', 'concert'],
  festival: ['festival', 'event', 'concert', 'performance', 'live', 'show', 'stage', 'tour'],
  zao: ['zao', 'thezao', 'zaofestivals', 'zverse', 'zao-chella']
};

// Domain-specific tag mappings
const DOMAIN_TAG_MAPPINGS = {
  'github.com': ['development', 'code', 'opensource'],
  'ethereum.org': ['ethereum', 'blockchain', 'web3'],
  'optimism.io': ['optimism', 'ethereum', 'layer2'],
  'base.org': ['base', 'ethereum', 'layer2'],
  'zora.co': ['zora', 'nft', 'web3'],
  'youtube.com': ['video', 'content', 'streaming'],
  'twitter.com': ['social', 'twitter'],
  'medium.com': ['blog', 'article', 'content'],
  'discord.com': ['community', 'chat', 'social'],
  'zao.network': ['zao', 'official']
};

/**
 * Generate a color for a tag based on its name
 * @param {string} tag - The tag name
 * @returns {string} - A hex color code
 */
function generateTagColor(tag) {
  // Check if we have a predefined color
  if (CONFIG.TAG_COLORS[tag]) {
    return CONFIG.TAG_COLORS[tag];
  }
  
  // Generate a color based on the tag name
  let hash = 0;
  for (let i = 0; i < tag.length; i++) {
    hash = tag.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  // Convert to hex color
  const c = (hash & 0x00FFFFFF).toString(16).toUpperCase();
  return "#" + "00000".substring(0, 6 - c.length) + c;
}

/**
 * Extract domain-based tags from a URL
 * @param {string} url - The URL to extract tags from
 * @returns {string[]} - Array of tags
 */
function extractDomainTags(url) {
  const tags = [];
  
  try {
    const urlObj = new URL(url);
    const domain = urlObj.hostname;
    
    // Check if we have specific mappings for this domain
    if (DOMAIN_TAG_MAPPINGS[domain]) {
      tags.push(...DOMAIN_TAG_MAPPINGS[domain]);
    }
    
    // Extract the main domain part (e.g., 'github' from 'github.com')
    const domainParts = domain.split('.');
    if (domainParts.length > 1) {
      const mainDomain = domainParts[domainParts.length - 2];
      if (mainDomain && !['com', 'org', 'net', 'io', 'co', 'app', 'dev'].includes(mainDomain)) {
        tags.push(mainDomain);
      }
    }
    
    // Extract subdomain if it's meaningful
    if (domainParts.length > 2) {
      const subdomain = domainParts[0];
      if (subdomain && !['www', 'app', 'api', 'docs'].includes(subdomain)) {
        tags.push(subdomain);
      }
    }
    
    // Extract path components for potential tags
    const pathParts = urlObj.pathname.split('/').filter(part => part.length > 0);
    if (pathParts.length > 0) {
      // Only use the first path part if it seems meaningful
      const firstPath = pathParts[0].toLowerCase();
      if (firstPath.length > 3 && 
          !['api', 'docs', 'blog', 'about', 'help', 'support'].includes(firstPath)) {
        tags.push(firstPath);
      }
    }
  } catch (error) {
    // Ignore URL parsing errors
  }
  
  return tags;
}

/**
 * Extract keyword-based tags from text content
 * @param {string} content - The text content to analyze
 * @returns {string[]} - Array of tags
 */
function extractKeywordTags(content) {
  const tags = [];
  const lowerContent = content.toLowerCase();
  
  // Check each category's keywords
  Object.entries(KEYWORD_MAPS).forEach(([category, keywords]) => {
    // Count how many keywords match
    const matchCount = keywords.filter(keyword => lowerContent.includes(keyword)).length;
    const matchRatio = matchCount / keywords.length;
    
    // If enough keywords match, add the category as a tag
    if (matchRatio >= CONFIG.KEYWORD_MATCH_THRESHOLD || matchCount >= 3) {
      tags.push(category);
    }
    
    // Also add individual matching keywords as tags if they're significant
    keywords.forEach(keyword => {
      // Only add multi-word keywords or significant single words
      if ((keyword.includes(' ') || keyword.length > 5) && lowerContent.includes(keyword)) {
        tags.push(keyword);
      }
    });
  });
  
  return tags;
}

/**
 * Find related tags based on existing tags
 * @param {string[]} existingTags - The existing tags
 * @param {Object} tagRegistry - The tag registry
 * @returns {string[]} - Array of suggested related tags
 */
function findRelatedTags(existingTags, tagRegistry) {
  const relatedTags = new Set();
  
  existingTags.forEach(tag => {
    if (tagRegistry[tag] && tagRegistry[tag].related) {
      tagRegistry[tag].related.forEach(relatedTag => {
        // Don't add tags that already exist
        if (!existingTags.includes(relatedTag)) {
          relatedTags.add(relatedTag);
        }
      });
    }
  });
  
  return Array.from(relatedTags);
}

/**
 * Generate tags for a link
 * @param {Object} link - The link object
 * @param {Object} tagRegistry - The tag registry
 * @returns {string[]} - Array of tags
 */
function generateTagsForLink(link, tagRegistry) {
  const existingTags = link.tags || [];
  const newTags = new Set(existingTags);
  
  // Extract content for analysis
  const content = `${link.title} ${link.description || ''}`;
  
  // Extract domain-based tags
  extractDomainTags(link.url).forEach(tag => newTags.add(tag));
  
  // Extract keyword-based tags
  extractKeywordTags(content).forEach(tag => newTags.add(tag));
  
  // Find related tags based on existing tags
  if (existingTags.length > 0) {
    findRelatedTags(existingTags, tagRegistry).forEach(tag => newTags.add(tag));
  }
  
  // Limit the number of tags
  return Array.from(newTags).slice(0, CONFIG.MAX_TAGS_PER_LINK);
}

/**
 * Update the tag registry with a new tag
 * @param {string} tag - The tag to update
 * @param {Object} tagRegistry - The tag registry
 */
function updateTagRegistry(tag, tagRegistry) {
  if (!tagRegistry[tag]) {
    tagRegistry[tag] = {
      count: 1,
      color: generateTagColor(tag),
      related: []
    };
  } else {
    tagRegistry[tag].count++;
  }
}

/**
 * Update related tags in the tag registry
 * @param {Object} tagRegistry - The tag registry
 * @param {Array} links - The links array
 */
function updateRelatedTags(tagRegistry, links) {
  // For each tag, find other tags that commonly appear with it
  Object.keys(tagRegistry).forEach(tag => {
    // Find links that have this tag
    const linksWithTag = links.filter(link => link.tags && link.tags.includes(tag));
    
    // Count occurrences of other tags in these links
    const tagCounts = {};
    linksWithTag.forEach(link => {
      if (link.tags) {
        link.tags.forEach(t => {
          if (t !== tag) {
            tagCounts[t] = (tagCounts[t] || 0) + 1;
          }
        });
      }
    });
    
    // Sort by count and take top 5
    tagRegistry[tag].related = Object.entries(tagCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([relatedTag]) => relatedTag);
  });
}

/**
 * Main function to auto-tag all links
 */
async function enhancedAutoTagging() {
  console.log('Starting enhanced auto-tagging process...');
  
  try {
    // Read the data file
    const fileContent = fs.readFileSync(CONFIG.DATA_FILE, 'utf8');
    const data = JSON.parse(fileContent);
    
    console.log(`Found ${data.links.length} links in the database.`);
    
    let tagsAdded = 0;
    let linksUpdated = 0;
    
    // Process each link
    for (const link of data.links) {
      const existingTags = link.tags || [];
      const generatedTags = generateTagsForLink(link, data.tags);
      
      // Only update if we have new tags
      if (generatedTags.length > existingTags.length) {
        link.tags = generatedTags;
        tagsAdded += (generatedTags.length - existingTags.length);
        linksUpdated++;
        
        console.log(`Added tags to "${link.title}": ${generatedTags.filter(tag => !existingTags.includes(tag)).join(', ')}`);
        
        // Update the tag registry
        generatedTags.forEach(tag => updateTagRegistry(tag, data.tags));
      }
    }
    
    // Update related tags in the registry
    updateRelatedTags(data.tags, data.links);
    
    // Update metadata
    data.lastUpdated = new Date().toISOString();
    data.metadata.totalTags = Object.keys(data.tags).length;
    
    // Write the updated data back to the file
    fs.writeFileSync(CONFIG.DATA_FILE, JSON.stringify(data, null, 2), 'utf8');
    
    console.log(`\nEnhanced auto-tagging completed successfully!`);
    console.log(`Added ${tagsAdded} new tags to ${linksUpdated} links.`);
    console.log(`Total tags in registry: ${data.metadata.totalTags}`);
    
    return { tagsAdded, linksUpdated };
  } catch (error) {
    console.error('Error during auto-tagging:', error);
    throw error;
  }
}

// Run the enhanced auto-tagging
enhancedAutoTagging().catch(error => {
  console.error('Error:', error);
  process.exit(1);
});
