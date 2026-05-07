const fs = require('fs');
const path = require('path');

// Categories and subcategories
const categories = [
  {
    name: "Official Resources",
    subcategories: ["Main Sites", "Social Media", "Documentation", "Governance"]
  },
  {
    name: "DeFi",
    subcategories: ["DEXs", "Lending", "Yield Farming", "Staking", "Derivatives", "Insurance"]
  },
  {
    name: "NFTs",
    subcategories: ["Marketplaces", "Collections", "Tools", "Games"]
  },
  {
    name: "Tools",
    subcategories: ["Analytics", "Portfolio Trackers", "Tax Tools", "Development", "Security"]
  },
  {
    name: "Education",
    subcategories: ["Tutorials", "Courses", "Research", "News"]
  },
  {
    name: "Community",
    subcategories: ["Forums", "DAOs", "Events", "Grants"]
  },
  {
    name: "Infrastructure",
    subcategories: ["Layer 2", "Bridges", "Oracles", "Storage", "Identity"]
  },
  {
    name: "Wallets",
    subcategories: ["Browser Extensions", "Mobile", "Hardware", "Multisig"]
  }
];

// Generate a random link
function generateLink(categoryName, subcategoryName, index) {
  const domains = ["zao.network", "ethereum.org", "optimism.io", "base.org", "arbitrum.io", "polygon.technology", "solana.com", "avalabs.org"];
  const paths = ["docs", "blog", "community", "developers", "ecosystem", "tools", "resources", "learn"];
  const subpaths = ["guide", "tutorial", "overview", "reference", "api", "examples", "faq", "support"];
  
  const domain = domains[Math.floor(Math.random() * domains.length)];
  const path = paths[Math.floor(Math.random() * paths.length)];
  const subpath = subpaths[Math.floor(Math.random() * subpaths.length)];
  
  return {
    title: `${categoryName} - ${subcategoryName} Link ${index}`,
    url: `https://${domain}/${path}/${subpath}/${categoryName.toLowerCase().replace(/\s+/g, '-')}-${index}`,
    description: `A ${subcategoryName.toLowerCase()} resource for ${categoryName.toLowerCase()} in the ZAO ecosystem.`
  };
}

// Generate links data
function generateLinksData(totalLinks = 5000) {
  const data = {
    categories: []
  };
  
  let remainingLinks = totalLinks;
  const avgLinksPerSubcategory = Math.ceil(totalLinks / categories.reduce((sum, cat) => sum + cat.subcategories.length, 0));
  
  for (const category of categories) {
    const categoryData = {
      name: category.name,
      subcategories: []
    };
    
    for (const subcategoryName of category.subcategories) {
      if (remainingLinks <= 0) break;
      
      const linksCount = Math.min(
        avgLinksPerSubcategory + Math.floor(Math.random() * 10) - 5, // Add some randomness
        remainingLinks
      );
      
      const subcategoryData = {
        name: subcategoryName,
        links: []
      };
      
      for (let i = 0; i < linksCount; i++) {
        subcategoryData.links.push(generateLink(category.name, subcategoryName, i + 1));
      }
      
      remainingLinks -= linksCount;
      categoryData.subcategories.push(subcategoryData);
    }
    
    data.categories.push(categoryData);
    if (remainingLinks <= 0) break;
  }
  
  return data;
}

// Generate and save the data
const linksData = generateLinksData(5000);
fs.writeFileSync(
  path.join(__dirname, 'links-large.json'),
  JSON.stringify(linksData, null, 2)
);

console.log(`Generated ${linksData.categories.reduce(
  (sum, cat) => sum + cat.subcategories.reduce(
    (subSum, subcat) => subSum + subcat.links.length, 0
  ), 0
)} links across ${linksData.categories.length} categories and ${
  linksData.categories.reduce((sum, cat) => sum + cat.subcategories.length, 0)
} subcategories.`);
