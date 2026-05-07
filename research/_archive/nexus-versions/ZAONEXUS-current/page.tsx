'use client';

import { useState, useMemo, useEffect } from 'react';
import { Search, ChevronDown, ChevronUp, Moon, Sun, Maximize2, Minimize2, Hash, Share2, Copy, Check, ExternalLink } from 'lucide-react';
import { linksData, type MainCategory, type Subcategory } from './data/links';

export default function Home() {
  const [searchQuery, setSearchQuery] = useState('');
  const [darkMode, setDarkMode] = useState(true);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [expandedSubcategories, setExpandedSubcategories] = useState<Set<string>>(new Set());
  const [isSearchSticky, setIsSearchSticky] = useState(false);
  const [copiedLink, setCopiedLink] = useState<string | null>(null);

  const totalLinks = useMemo(() => {
    return linksData.reduce((total, category) => {
      return total + category.subcategories.reduce((sum, sub) => sum + sub.links.length, 0);
    }, 0);
  }, []);

  const totalCategories = linksData.length;
  const totalSubcategories = useMemo(() => {
    return linksData.reduce((total, category) => total + category.subcategories.length, 0);
  }, []);

  const filteredData = useMemo(() => {
    if (!searchQuery.trim()) return linksData;

    const query = searchQuery.toLowerCase();
    return linksData
      .map(category => ({
        ...category,
        subcategories: category.subcategories
          .map(sub => ({
            ...sub,
            links: sub.links.filter(
              link =>
                link.title.toLowerCase().includes(query) ||
                link.description.toLowerCase().includes(query) ||
                link.url.toLowerCase().includes(query)
            ),
          }))
          .filter(sub => sub.links.length > 0),
      }))
      .filter(category => category.subcategories.length > 0);
  }, [searchQuery]);

  // Auto-expand categories and subcategories when searching
  useEffect(() => {
    if (searchQuery.trim()) {
      // Expand all categories that have results
      const categoriesToExpand = new Set(filteredData.map(cat => cat.mainCategory));
      setExpandedCategories(categoriesToExpand);

      // Expand all subcategories that have results
      const subCategoriesToExpand = new Set<string>();
      filteredData.forEach(cat => {
        cat.subcategories.forEach(sub => {
          subCategoriesToExpand.add(`${cat.mainCategory}-${sub.subTitle}`);
        });
      });
      setExpandedSubcategories(subCategoriesToExpand);
    }
  }, [searchQuery, filteredData]);

  const toggleCategory = (categoryName: string) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(categoryName)) {
        newSet.delete(categoryName);
      } else {
        newSet.add(categoryName);
      }
      return newSet;
    });
  };

  const toggleSubcategory = (key: string) => {
    setExpandedSubcategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(key)) {
        newSet.delete(key);
      } else {
        newSet.add(key);
      }
      return newSet;
    });
  };

  const expandAll = () => {
    const dataToExpand = searchQuery.trim() ? filteredData : linksData;
    setExpandedCategories(new Set(dataToExpand.map(c => c.mainCategory)));
    const allSubKeys: string[] = [];
    dataToExpand.forEach(cat => {
      cat.subcategories.forEach(sub => {
        allSubKeys.push(`${cat.mainCategory}-${sub.subTitle}`);
      });
    });
    setExpandedSubcategories(new Set(allSubKeys));
  };

  const collapseAll = () => {
    setExpandedCategories(new Set());
    setExpandedSubcategories(new Set());
  };

  const scrollToCategory = (categoryId: string) => {
    const element = document.getElementById(categoryId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const copyLink = async (url: string, title: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopiedLink(url);
      setTimeout(() => setCopiedLink(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const shareToX = (url: string, title: string) => {
    const text = `I found "${title}" on the ZAO NEXUS! You should check it out: ${url}`;
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
    window.open(twitterUrl, '_blank', 'width=550,height=420');
  };

  const shareToFarcaster = (url: string, title: string) => {
    const text = `I found "${title}" on the ZAO NEXUS! You should check it out: ${url}`;
    const farcasterUrl = `https://warpcast.com/~/compose?text=${encodeURIComponent(text)}`;
    window.open(farcasterUrl, '_blank', 'width=550,height=600');
  };

  return (
    <div className={darkMode ? 'dark-mode' : ''}>
      <div className="min-h-screen transition-colors duration-300" style={{ backgroundColor: 'var(--bg-color)', color: 'var(--text-color)' }}>
        <div className="max-w-5xl mx-auto px-4 py-4">
          {/* Quick Navigation */}
          <div className="mb-6 fade-in">
            <div className="flex items-center gap-2 mb-3 justify-center">
              <Hash size={16} className="opacity-60" />
              <span className="text-sm font-semibold opacity-75">Quick Jump:</span>
            </div>
            <div className="flex flex-wrap justify-center gap-2">
              {linksData.map((cat) => (
                <button
                  key={cat.mainCategory}
                  onClick={() => scrollToCategory(cat.mainCategory.toLowerCase().replace(/\s+/g, '-'))}
                  className="px-3 py-1.5 text-sm rounded-md transition-all duration-200 hover:scale-105"
                  style={{
                    backgroundColor: 'var(--accent-bg)',
                    color: 'var(--accent-text)',
                    opacity: 0.8,
                  }}
                >
                  {cat.mainCategory}
                </button>
              ))}
            </div>
          </div>

          <div className="mb-8 space-y-4 sticky top-0 z-50 py-4" style={{ backgroundColor: 'var(--bg-color)' }}>
            <div className="relative max-w-2xl mx-auto">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 opacity-60" size={20} />
              <input
                type="text"
                placeholder="Search links, descriptions, or URLs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 rounded-lg border-2 transition-all duration-200 focus:outline-none focus:ring-2 shadow-lg"
                style={{
                  backgroundColor: 'var(--bg-color)',
                  color: 'var(--text-color)',
                  borderColor: 'var(--text-color)',
                }}
              />
            </div>

            <div className="flex justify-center gap-3 flex-wrap">
              <button
                onClick={expandAll}
                className="flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 hover:scale-105"
                style={{
                  backgroundColor: 'var(--accent-bg)',
                  color: 'var(--accent-text)',
                }}
              >
                <Maximize2 size={16} />
                Expand All
              </button>
              <button
                onClick={collapseAll}
                className="flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 hover:scale-105"
                style={{
                  backgroundColor: 'var(--accent-bg)',
                  color: 'var(--accent-text)',
                }}
              >
                <Minimize2 size={16} />
                Collapse All
              </button>
              <button
                onClick={() => setDarkMode(!darkMode)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 hover:scale-105"
                style={{
                  backgroundColor: 'var(--accent-bg)',
                  color: 'var(--accent-text)',
                }}
              >
                {darkMode ? <Sun size={16} /> : <Moon size={16} />}
                {darkMode ? 'Light Mode' : 'Dark Mode'}
              </button>
            </div>
          </div>

          <div className="space-y-6">
            {filteredData.map((category, idx) => (
              <div
                key={category.mainCategory}
                id={category.mainCategory.toLowerCase().replace(/\s+/g, '-')}
                className="rounded-xl shadow-lg overflow-hidden transition-all duration-300 fade-in scroll-mt-32"
                style={{
                  backgroundColor: 'var(--accent-bg)',
                  color: 'var(--accent-text)',
                  animationDelay: `${idx * 0.1}s`,
                }}
              >
                <button
                  onClick={() => toggleCategory(category.mainCategory)}
                  className="w-full px-6 py-4 flex items-center justify-between hover:opacity-80 transition-opacity"
                >
                  <h2 className="text-2xl font-bold">{category.mainCategory}</h2>
                  {expandedCategories.has(category.mainCategory) ? (
                    <ChevronUp size={24} />
                  ) : (
                    <ChevronDown size={24} />
                  )}
                </button>

                {expandedCategories.has(category.mainCategory) && (
                  <div className="px-6 pb-6 space-y-4">
                    {category.subcategories.map((sub) => {
                      const subKey = `${category.mainCategory}-${sub.subTitle}`;
                      return (
                        <div key={subKey} className="border-t pt-4" style={{ borderColor: 'rgba(224, 221, 170, 0.2)' }}>
                          <button
                            onClick={() => toggleSubcategory(subKey)}
                            className="w-full flex items-center justify-between mb-3 hover:opacity-80 transition-opacity"
                          >
                            <h3 className="text-lg font-semibold">
                              {sub.subTitle} ({sub.links.length})
                            </h3>
                            {expandedSubcategories.has(subKey) ? (
                              <ChevronUp size={20} />
                            ) : (
                              <ChevronDown size={20} />
                            )}
                          </button>

                          {expandedSubcategories.has(subKey) && (
                            <ul className="space-y-1.5">
                              {sub.links.map((link, linkIdx) => (
                                <li key={linkIdx} className="group">
                                  <div
                                    className="p-3 rounded-lg transition-all duration-200 hover:shadow-md border-2"
                                    style={{
                                      backgroundColor: 'var(--link-bg)',
                                      borderColor: 'transparent',
                                    }}
                                    onMouseEnter={(e) => {
                                      e.currentTarget.style.borderColor = 'var(--accent-bg)';
                                    }}
                                    onMouseLeave={(e) => {
                                      e.currentTarget.style.borderColor = 'transparent';
                                    }}
                                  >
                                    <div className="flex items-start justify-between gap-3">
                                      <a
                                        href={link.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex-1 min-w-0 group/link"
                                      >
                                        <div className="font-semibold group-hover/link:underline inline-flex items-center gap-1.5" style={{ color: 'var(--text-color)' }}>
                                          {link.title}
                                          <ExternalLink size={14} className="opacity-40 group-hover/link:opacity-70 transition-opacity" />
                                        </div>
                                        {link.description && (
                                          <div className="text-sm mt-1" style={{ color: 'var(--text-color)', opacity: 0.75 }}>
                                            {link.description}
                                          </div>
                                        )}
                                      </a>
                                      <div className="flex items-center gap-1.5 flex-shrink-0">
                                        <button
                                          onClick={() => copyLink(link.url, link.title)}
                                          className="group/btn relative p-2 rounded-md transition-all duration-200"
                                          style={{
                                            backgroundColor: copiedLink === link.url ? 'var(--accent-bg)' : 'transparent',
                                            color: copiedLink === link.url ? 'var(--accent-text)' : 'var(--text-color)',
                                          }}
                                          onMouseEnter={(e) => {
                                            if (copiedLink !== link.url) {
                                              e.currentTarget.style.backgroundColor = 'var(--accent-bg)';
                                              e.currentTarget.style.color = 'var(--accent-text)';
                                              e.currentTarget.style.transform = 'scale(1.05)';
                                            }
                                          }}
                                          onMouseLeave={(e) => {
                                            if (copiedLink !== link.url) {
                                              e.currentTarget.style.backgroundColor = 'transparent';
                                              e.currentTarget.style.color = 'var(--text-color)';
                                              e.currentTarget.style.transform = 'scale(1)';
                                            }
                                          }}
                                        >
                                          {copiedLink === link.url ? <Check size={16} /> : <Copy size={16} />}
                                          <span className="absolute -top-8 left-1/2 transform -translate-x-1/2 px-2 py-1 text-xs rounded opacity-0 group-hover/btn:opacity-100 transition-opacity whitespace-nowrap pointer-events-none" style={{ backgroundColor: 'var(--accent-text)', color: 'var(--accent-bg)' }}>
                                            {copiedLink === link.url ? 'Copied!' : 'Copy link'}
                                          </span>
                                        </button>
                                        <div className="h-4 w-px" style={{ backgroundColor: 'var(--text-color)', opacity: 0.2 }}></div>
                                        <button
                                          onClick={() => shareToX(link.url, link.title)}
                                          className="group/btn relative p-2 rounded-md transition-all duration-200"
                                          style={{ color: 'var(--text-color)' }}
                                          onMouseEnter={(e) => {
                                            e.currentTarget.style.backgroundColor = 'var(--accent-bg)';
                                            e.currentTarget.style.color = 'var(--accent-text)';
                                            e.currentTarget.style.transform = 'scale(1.05)';
                                          }}
                                          onMouseLeave={(e) => {
                                            e.currentTarget.style.backgroundColor = 'transparent';
                                            e.currentTarget.style.color = 'var(--text-color)';
                                            e.currentTarget.style.transform = 'scale(1)';
                                          }}
                                        >
                                          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                                          </svg>
                                          <span className="absolute -top-8 left-1/2 transform -translate-x-1/2 px-2 py-1 text-xs rounded opacity-0 group-hover/btn:opacity-100 transition-opacity whitespace-nowrap pointer-events-none" style={{ backgroundColor: 'var(--accent-text)', color: 'var(--accent-bg)' }}>
                                            Share to X
                                          </span>
                                        </button>
                                        <button
                                          onClick={() => shareToFarcaster(link.url, link.title)}
                                          className="group/btn relative p-2 rounded-md transition-all duration-200"
                                          style={{ color: 'var(--text-color)' }}
                                          onMouseEnter={(e) => {
                                            e.currentTarget.style.backgroundColor = 'var(--accent-bg)';
                                            e.currentTarget.style.color = 'var(--accent-text)';
                                            e.currentTarget.style.transform = 'scale(1.05)';
                                          }}
                                          onMouseLeave={(e) => {
                                            e.currentTarget.style.backgroundColor = 'transparent';
                                            e.currentTarget.style.color = 'var(--text-color)';
                                            e.currentTarget.style.transform = 'scale(1)';
                                          }}
                                        >
                                          <svg width="16" height="16" viewBox="0 0 1000 1000" fill="currentColor">
                                            <path d="M257.778 155.556H742.222V844.445H671.111V528.889H670.414C662.554 441.677 589.258 373.333 500 373.333C410.742 373.333 337.446 441.677 329.586 528.889H328.889V844.445H257.778V155.556Z"/>
                                            <path d="M128.889 253.333L157.778 351.111H182.222V746.667C169.949 746.667 160 756.616 160 768.889V795.556H155.556C143.283 795.556 133.333 805.505 133.333 817.778V844.445H382.222V817.778C382.222 805.505 372.273 795.556 360 795.556H355.556V768.889C355.556 756.616 345.606 746.667 333.333 746.667H306.667V253.333H128.889Z"/>
                                            <path d="M871.111 253.333L842.222 351.111H817.778V746.667C830.051 746.667 840 756.616 840 768.889V795.556H844.444C856.717 795.556 866.667 805.505 866.667 817.778V844.445H617.778V817.778C617.778 805.505 627.727 795.556 640 795.556H644.444V768.889C644.444 756.616 654.394 746.667 666.667 746.667H693.333V253.333H871.111Z"/>
                                          </svg>
                                          <span className="absolute -top-8 left-1/2 transform -translate-x-1/2 px-2 py-1 text-xs rounded opacity-0 group-hover/btn:opacity-100 transition-opacity whitespace-nowrap pointer-events-none" style={{ backgroundColor: 'var(--accent-text)', color: 'var(--accent-bg)' }}>
                                            Share to Farcaster
                                          </span>
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>

          {filteredData.length === 0 && (
            <div className="text-center py-12 opacity-75">
              <p className="text-xl">No links found matching "{searchQuery}"</p>
              <p className="text-sm mt-2">Try a different search term</p>
            </div>
          )}

          <footer className="text-center mt-16 pb-8">
            <div className="mb-6 p-6 rounded-xl" style={{ backgroundColor: 'var(--accent-bg)', color: 'var(--accent-text)' }}>
              <div className="flex flex-wrap justify-center gap-8 text-center">
                <div>
                  <div className="text-3xl font-bold">{totalLinks}</div>
                  <div className="text-sm opacity-75 mt-1">Total Links</div>
                </div>
                <div>
                  <div className="text-3xl font-bold">{totalSubcategories}</div>
                  <div className="text-sm opacity-75 mt-1">Subcategories</div>
                </div>
                <div>
                  <div className="text-3xl font-bold">{totalCategories}</div>
                  <div className="text-sm opacity-75 mt-1">Categories</div>
                </div>
              </div>
            </div>
            <p className="text-sm opacity-75">
              ZAO NEXUS © {new Date().getFullYear()} | Built with ❤️ for the ZAO Community
            </p>
          </footer>
        </div>
      </div>
    </div>
  );
}
