# Nexus v5.7 - Hierarchical Link Management System

A scalable, hierarchical link management system built with Next.js that organizes links into categories and subcategories with rich metadata, tagging, and filtering capabilities. Designed with ZAO branding colors and styles for a cohesive user experience.

## New Directory Structure

```
src/
├── app/                    # Next.js App Router
│   └── page.jsx            # Main application page
├── components/             # React components
│   ├── categories/         # Category-related components
│   │   └── CategoryNavigation.jsx
│   ├── layout/             # Layout components
│   │   └── MainLayout.jsx
│   ├── links/              # Link display components
│   │   ├── LinkCard.jsx
│   │   ├── LinkList.jsx
│   │   └── LinkRow.jsx
│   ├── tags/               # Tag-related components
│   │   ├── TagBadge.jsx
│   │   └── TagSelector.jsx
│   └── ui/                 # Reusable UI components
├── data/                   # Data management
│   ├── schema/             # Schema definitions
│   │   ├── categories.js   # Category hierarchy
│   │   ├── tags.js         # Tag taxonomy
│   │   └── validators.js   # Data validation
│   ├── links/              # Individual link files
│   │   ├── web3/           # Web3 related links
│   │   ├── music/          # Music and media links
│   │   ├── community/      # Community resources
│   │   └── ...             # Other category folders
│   └── index.js            # Main data export
```

## Key Features

### 1. Hierarchical Directory Structure

- **Categories & Subcategories**: Organized in a hierarchical tree structure (max 3 levels deep)
- **Centralized Definitions**: All categories and subcategories defined in one place
- **Rich Metadata**: Icons, colors, and descriptions for better UI representation
- **Collapsible Directories**: Expandable/collapsible sections with visual indicators
- **ZAO Theme Integration**: Consistent color scheme and styling throughout

### 2. Dual Navigation Views

- **Directory View**: Tree-based hierarchical navigation with folder icons and expand/collapse controls
- **List View**: Traditional flat category listing for simpler navigation
- **View Toggle**: Easy switching between directory and list views with persistent user preference
- **Breadcrumb Navigation**: Dynamic breadcrumbs showing the current location in the hierarchy
- **Persistent State**: Remembers expanded/collapsed state across sessions

### 3. Rich Tagging System

- **Tag Properties**: Each tag has a name, description, color, and icon
- **Tag Relationships**: Tags can be related to other tags
- **Hierarchical Tags**: Support for parent-child relationships between tags
- **Cross-Category Tagging**: Connect content across different branches of the hierarchy

### 4. Modular Link Storage

- **Domain/Category Based**: Links stored in separate files by domain/category
- **Easier Maintenance**: Update links without touching the entire dataset
- **Better Performance**: Only load necessary links
- **Category Association**: Links can belong to main categories or specific subcategories

### 5. Advanced UI Features

- **Visual Indicators**: Icons, colors, and badges for categories, subcategories, and tags
- **Responsive Design**: Works seamlessly on mobile, tablet, and desktop
- **Multiple Views**: Grid and list views for links with thumbnails and metadata
- **Advanced Filtering**: Filter by multiple tags, search, and sort options
- **Dark Mode Support**: Full dark mode implementation with theme persistence
- **Accessibility**: ARIA attributes and keyboard navigation support

## Getting Started

1. Install dependencies:
   ```
   npm install
   ```

2. Run the development server:
   ```
   npm run dev
   ```

3. Open [http://localhost:3000](http://localhost:3000) in your browser

4. Navigate to [http://localhost:3000/directory](http://localhost:3000/directory) to see the hierarchical directory structure in action

## Usage Guide

### Navigating the Directory

1. **Switching Views**: Toggle between directory and list views using the view mode button in the sidebar
2. **Expanding/Collapsing**: Click on the chevron icons to expand or collapse categories
3. **Selecting Categories**: Click on a category name to view its content
4. **Viewing Links**: Links associated with a category will be displayed in the main content area
5. **Breadcrumb Navigation**: Use the breadcrumb trail at the top to navigate back up the hierarchy

### Filtering and Sorting

1. **Search**: Use the search box to find links by title, description, or tags
2. **Tag Filtering**: Select tags to filter links by specific criteria
3. **Sorting**: Sort links by popularity, date added, or title
4. **View Options**: Switch between grid and list views for links

## Adding New Links

To add new links to the system:

1. Create or identify the appropriate category folder in `src/data/links/`
2. Add your links to an existing file or create a new one following this structure:
   ```javascript
   export default [
     {
       id: 'unique-link-id',
       title: 'Link Title',
       url: 'https://example.com',
       description: 'Brief description of the link',
       category: 'main-category-id',
       subcategory: 'subcategory-id', // Optional
       tags: ['tag1', 'tag2'],
       dateAdded: '2023-07-15',
       popularity: 85, // 0-100 scale
       favicon: '/path/to/favicon.ico' // Optional
     }
   ];
   ```
3. Export your links and import them in `src/data/index.js`

## Customizing the Hierarchy

### Modifying Categories

- Edit `src/data/schema/categories.js` to modify the category structure
- Follow this structure for main categories:
  ```javascript
  {
    id: 'category-id',
    name: 'Category Name',
    description: 'Category description',
    icon: 'lucide-icon-name',
    color: '#hexcolor',
    isExpanded: true, // Optional, default expanded state
    subcategories: [] // Array of subcategory objects
  }
  ```

### Adding or Modifying Tags

- Edit `src/data/schema/tags.js` to add or modify tags
- Follow this structure for tags:
  ```javascript
  {
    id: 'tag-id',
    name: 'Tag Name',
    color: '#hexcolor',
    icon: 'icon-name',
    description: 'Tag description',
    related: ['related-tag-id1', 'related-tag-id2'],
    synonyms: ['alternative', 'names'],
    parent: 'parent-tag-id' // Optional, for hierarchical tags
  }
  ```

## Implementation Details

### Directory Structure Components

- **CategoryDirectory.jsx**: Main component for rendering the hierarchical directory tree
- **CategoryNavigation.jsx**: Traditional list-based category navigation component
- **MainLayout.jsx**: Layout component with toggle between directory and list views
- **LinkList.jsx**: Component for displaying links with filtering and sorting
- **LinkCard.jsx & LinkRow.jsx**: Components for displaying links in different views

### Data Architecture

- **categories.js**: Schema defining the hierarchical structure of categories and subcategories
- **links.js**: Schema defining links with category and subcategory associations
- **tags.js**: Schema defining the taxonomy of tags with relationships
- **index.js**: Central data API with helper functions for traversing the hierarchy

### Key Helper Functions

- **getSubcategories()**: Retrieves subcategories for a given category
- **getCategoryBreadcrumb()**: Builds the breadcrumb path for a category
- **getCategoryLinkCount()**: Counts links in a category including subcategories
- **getLinksByCategory()**: Retrieves links for a category with option to include subcategories

## Best Practices

### Hierarchy Design

- Keep category hierarchy to a maximum of 3 levels deep for usability
- Use consistent naming conventions for IDs (kebab-case)
- Include rich metadata (colors, icons, descriptions) for better user experience
- Ensure each category has a unique color for visual distinction
- Use appropriate icons from lucide-react that represent the category content

### Component Organization

- Separate UI components from data management
- Use recursive rendering for nested hierarchical structures
- Implement client-side hydration guards for server-side rendering
- Store user preferences in localStorage for persistence
- Use React hooks for state management and side effects

### Accessibility

- Include proper ARIA attributes for tree structures
- Ensure keyboard navigation works for the directory structure
- Provide visual indicators for selected and expanded states
- Maintain sufficient color contrast for text and background
- Include descriptive alt text and aria-labels

### Performance

- Lazy load content for collapsed sections
- Group related links in the same file for better code organization
- Use tags to create cross-category relationships
- Implement virtualization for large lists when needed
- Optimize state updates to prevent unnecessary re-renders
