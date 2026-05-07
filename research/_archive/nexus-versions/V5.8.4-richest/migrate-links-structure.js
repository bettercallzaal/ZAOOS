/**
 * NEXUS V5 - Links Data Structure Migration Script
 * 
 * This script migrates the existing links.json data to the new optimized structure
 * with improved organization, metadata, and tag management.
 * 
 * Features:
 * - Converts flat links to structured format with proper IDs
 * - Creates centralized tag registry with metadata
 * - Establishes hierarchical category structure
 * - Adds metadata for tracking link health and popularity
 * - Preserves all existing data while enhancing the structure
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// File paths
const SOURCE_FILE = path.join(__dirname, 'src', 'data', 'links.json');
const TARGET_FILE = path.join(__dirname, 'src', 'data', 'links-new.json');
const LARGE_SOURCE_FILE = path.join(__dirname, 'src', 'data', 'links-large.json');

// Helper function to generate a unique ID for links that don't have one
function generateLinkId(link) {
  if (link.id) return link.id;
  
  // Create a deterministic ID based on URL and title
  const baseString = `${link.url}|${link.title}`;
  const hash = crypto.createHash('sha256').update(baseString).digest('base64');
  return `link_${hash.substring(0, 20).replace(/[+/=]/g, '').toLowerCase()}`;
}

// Helper function to extract domain from URL
function extractDomain(url) {
  try {
    const domain = new URL(url).hostname;
    return domain;
  } catch (error) {
    return null;
  }
}

// Helper function to generate a favicon URL from the domain
function generateFaviconUrl(url) {
  const domain = extractDomain(url);
  if (!domain) return null;
  
  // Try common favicon locations
  return `https://${domain}/favicon.ico`;
}

// Helper function to generate a color for a tag
function generateTagColor(tag) {
  // Simple hash function to generate consistent colors
  let hash = 0;
  for (let i = 0; i < tag.length; i++) {
    hash = tag.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  // Convert to hex color
  const c = (hash & 0x00FFFFFF).toString(16).toUpperCase();
  return "#" + "00000".substring(0, 6 - c.length) + c;
}

// Helper function to find related tags
function findRelatedTags(tag, allTags, links) {
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
  return Object.entries(tagCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([relatedTag]) => relatedTag);
}

// Main migration function
async function migrateLinksStructure() {
  console.log('Starting links data structure migration...');
  
  try {
    // Read the source data
    let sourceData;
    try {
      const sourceContent = fs.readFileSync(SOURCE_FILE, 'utf8');
      sourceData = JSON.parse(sourceContent);
      console.log(`Successfully read source data from ${SOURCE_FILE}`);
    } catch (error) {
      console.warn(`Error reading ${SOURCE_FILE}: ${error.message}`);
      console.log('Trying to read from large data file...');
      
      // Try the large data file as a fallback
      try {
        const largeSourceContent = fs.readFileSync(LARGE_SOURCE_FILE, 'utf8');
        sourceData = JSON.parse(largeSourceContent);
        console.log(`Successfully read source data from ${LARGE_SOURCE_FILE}`);
      } catch (largeError) {
        throw new Error(`Failed to read both source files: ${largeError.message}`);
      }
    }
    
    // Initialize the new structure
    const newStructure = {
      version: "1.0",
      lastUpdated: new Date().toISOString(),
      metadata: {
        totalLinks: 0,
        totalCategories: 0,
        totalTags: 0
      },
      links: [],
      categories: [],
      tags: {}
    };
    
    // Process links from the top-level links array
    const processedLinkIds = new Set();
    if (sourceData.links && Array.isArray(sourceData.links)) {
      for (const link of sourceData.links) {
        const linkId = generateLinkId(link);
        processedLinkIds.add(linkId);
        
        // Create the enhanced link object
        const enhancedLink = {
          id: linkId,
          title: link.title,
          url: link.url,
          description: link.description || "",
          favicon: link.favicon || generateFaviconUrl(link.url),
          screenshot: link.screenshot || null,
          tags: link.tags || [],
          metadata: {
            createdAt: link.createdAt || new Date().toISOString(),
            updatedAt: link.updatedAt || new Date().toISOString(),
            addedBy: link.addedBy || "admin",
            clicks: link.clicks || 0,
            popularity: link.popularity || 0,
            isArchived: link.isArchived || false,
            isDead: link.isDead || false,
            lastChecked: link.lastChecked || new Date().toISOString()
          }
        };
        
        // Add to the new links array
        newStructure.links.push(enhancedLink);
        
        // Process tags
        if (enhancedLink.tags) {
          enhancedLink.tags.forEach(tag => {
            if (!newStructure.tags[tag]) {
              newStructure.tags[tag] = {
                count: 1,
                color: generateTagColor(tag),
                related: []
              };
            } else {
              newStructure.tags[tag].count++;
            }
          });
        }
      }
    }
    
    // Process categories and subcategories
    if (sourceData.categories && Array.isArray(sourceData.categories)) {
      for (const category of sourceData.categories) {
        const categoryId = `cat_${category.name.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
        
        const newCategory = {
          id: categoryId,
          name: category.name,
          description: category.description || `${category.name} resources and links`,
          icon: category.icon || "folder",
          color: category.color || generateTagColor(category.name),
          subcategories: []
        };
        
        // Process subcategories
        if (category.subcategories && Array.isArray(category.subcategories)) {
          for (const subcategory of category.subcategories) {
            const subcategoryId = `subcat_${subcategory.name.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
            
            const newSubcategory = {
              id: subcategoryId,
              name: subcategory.name,
              description: subcategory.description || `${subcategory.name} in ${category.name}`,
              links: []
            };
            
            // Process links in subcategory
            if (subcategory.links && Array.isArray(subcategory.links)) {
              for (const link of subcategory.links) {
                // If it's already a string ID, use it directly
                if (typeof link === 'string') {
                  newSubcategory.links.push(link);
                  continue;
                }
                
                // Otherwise, it's a link object that needs processing
                const linkId = generateLinkId(link);
                
                // Check if we've already processed this link
                if (!processedLinkIds.has(linkId)) {
                  processedLinkIds.add(linkId);
                  
                  // Create the enhanced link object
                  const enhancedLink = {
                    id: linkId,
                    title: link.title,
                    url: link.url,
                    description: link.description || "",
                    favicon: link.favicon || generateFaviconUrl(link.url),
                    screenshot: link.screenshot || null,
                    tags: link.tags || [],
                    metadata: {
                      createdAt: link.createdAt || new Date().toISOString(),
                      updatedAt: link.updatedAt || new Date().toISOString(),
                      addedBy: link.addedBy || "admin",
                      clicks: link.clicks || 0,
                      popularity: link.popularity || 0,
                      isArchived: link.isArchived || false,
                      isDead: link.isDead || false,
                      lastChecked: link.lastChecked || new Date().toISOString()
                    }
                  };
                  
                  // Add to the new links array
                  newStructure.links.push(enhancedLink);
                  
                  // Process tags
                  if (enhancedLink.tags) {
                    enhancedLink.tags.forEach(tag => {
                      if (!newStructure.tags[tag]) {
                        newStructure.tags[tag] = {
                          count: 1,
                          color: generateTagColor(tag),
                          related: []
                        };
                      } else {
                        newStructure.tags[tag].count++;
                      }
                    });
                  }
                }
                
                // Add the link ID to the subcategory
                newSubcategory.links.push(linkId);
              }
            }
            
            newCategory.subcategories.push(newSubcategory);
          }
        }
        
        newStructure.categories.push(newCategory);
      }
    }
    
    // Calculate related tags now that we have all tags
    Object.keys(newStructure.tags).forEach(tag => {
      newStructure.tags[tag].related = findRelatedTags(tag, Object.keys(newStructure.tags), newStructure.links);
    });
    
    // Update metadata
    newStructure.metadata.totalLinks = newStructure.links.length;
    newStructure.metadata.totalCategories = newStructure.categories.length;
    newStructure.metadata.totalTags = Object.keys(newStructure.tags).length;
    
    // Write the new structure to the target file
    fs.writeFileSync(TARGET_FILE, JSON.stringify(newStructure, null, 2), 'utf8');
    
    console.log(`Migration completed successfully!`);
    console.log(`- Total links: ${newStructure.metadata.totalLinks}`);
    console.log(`- Total categories: ${newStructure.metadata.totalCategories}`);
    console.log(`- Total tags: ${newStructure.metadata.totalTags}`);
    console.log(`New structure written to ${TARGET_FILE}`);
    
    return newStructure;
  } catch (error) {
    console.error(`Migration failed: ${error.message}`);
    throw error;
  }
}

// Run the migration
migrateLinksStructure().catch(error => {
  console.error('Error:', error);
  process.exit(1);
});
