// GitBook-style functionality for StackSleuth Documentation
document.addEventListener('DOMContentLoaded', function() {
    // Initialize all components
    initializeMobileMenu();
    initializeSearch();
    initializeScrollProgress();
    initializeNavigation();
    initializeTabs();
    initializeCopyButtons();
    initializeTooltips();
    
    // Initialize performance monitoring
    trackPagePerformance();

    // Mobile menu functionality
    const mobileToggle = document.getElementById('mobile-toggle');
    const sidebar = document.getElementById('sidebar');
    const sidebarOverlay = document.getElementById('sidebar-overlay');

    function toggleSidebar() {
        sidebar.classList.toggle('open');
        sidebarOverlay.classList.toggle('show');
    }

    function closeSidebar() {
        sidebar.classList.remove('open');
        sidebarOverlay.classList.remove('show');
    }

    if (mobileToggle) {
        mobileToggle.addEventListener('click', toggleSidebar);
    }

    if (sidebarOverlay) {
        sidebarOverlay.addEventListener('click', closeSidebar);
    }

    // Smooth scrolling for anchor links
    const navLinks = document.querySelectorAll('.nav-link[href^="#"]');
    
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            const targetElement = document.querySelector(targetId);
            
            if (targetElement) {
                targetElement.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
                
                // Close mobile menu after navigation
                if (window.innerWidth <= 768) {
                    closeSidebar();
                }
                
                // Update active state
                updateActiveNavLink(this);
            }
        });
    });

    // Update active navigation link
    function updateActiveNavLink(activeLink) {
        navLinks.forEach(link => link.classList.remove('active'));
        activeLink.classList.add('active');
    }

    // Intersection Observer for auto-highlighting nav links
    const sections = document.querySelectorAll('section[id]');
    const observerOptions = {
        rootMargin: '-100px 0px -70% 0px',
        threshold: 0.1
    };

    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const id = entry.target.getAttribute('id');
                const correspondingLink = document.querySelector(`.nav-link[href="#${id}"]`);
                
                if (correspondingLink) {
                    updateActiveNavLink(correspondingLink);
                }
            }
        });
    }, observerOptions);

    sections.forEach(section => {
        observer.observe(section);
    });

    // Scroll progress indicator
    const scrollProgress = document.getElementById('scroll-progress');
    
    if (scrollProgress) {
        function updateScrollProgress() {
            const scrollTop = window.pageYOffset;
            const docHeight = document.documentElement.scrollHeight - window.innerHeight;
            const scrollPercent = (scrollTop / docHeight) * 100;
            
            scrollProgress.style.width = scrollPercent + '%';
        }

        window.addEventListener('scroll', updateScrollProgress);
        updateScrollProgress(); // Initial update
    }

    // Search functionality
    const searchInput = document.getElementById('header-search');
    
    if (searchInput) {
        let searchResults = null;
        let searchData = [];

        // Create search results container
        function createSearchResults() {
            searchResults = document.createElement('div');
            searchResults.className = 'search-results';
            searchInput.parentNode.appendChild(searchResults);
        }

        // Build search index
        function buildSearchIndex() {
            const searchableElements = document.querySelectorAll('h1, h2, h3, h4, p, .package-description');
            
            searchableElements.forEach(element => {
                const text = element.textContent.trim();
                const section = element.closest('section');
                const sectionId = section ? section.id : '';
                const sectionTitle = section ? section.querySelector('h2, h3') : null;
                
                if (text && text.length > 10) {
                    searchData.push({
                        title: sectionTitle ? sectionTitle.textContent : 'StackSleuth Documentation',
                        content: text,
                        url: sectionId ? `#${sectionId}` : '#',
                        element: element
                    });
                }
            });
        }

        // Perform search
        function performSearch(query) {
            if (!query || query.length < 2) {
                hideSearchResults();
                return;
            }

            const results = searchData.filter(item => {
                return item.title.toLowerCase().includes(query.toLowerCase()) ||
                       item.content.toLowerCase().includes(query.toLowerCase());
            }).slice(0, 8); // Limit to 8 results

            displaySearchResults(results, query);
        }

        // Display search results
        function displaySearchResults(results, query) {
            if (!searchResults) {
                createSearchResults();
            }

            if (results.length === 0) {
                searchResults.innerHTML = '<div class="search-result">No results found</div>';
            } else {
                searchResults.innerHTML = results.map(result => {
                    const excerpt = highlightQuery(result.content.substring(0, 150) + '...', query);
                    return `
                        <div class="search-result" data-url="${result.url}">
                            <div class="search-result-title">${highlightQuery(result.title, query)}</div>
                            <div class="search-result-excerpt">${excerpt}</div>
                        </div>
                    `;
                }).join('');

                // Add click handlers to search results
                searchResults.querySelectorAll('.search-result').forEach(result => {
                    result.addEventListener('click', function() {
                        const url = this.getAttribute('data-url');
                        if (url && url !== '#') {
                            const target = document.querySelector(url);
                            if (target) {
                                target.scrollIntoView({ behavior: 'smooth' });
                                hideSearchResults();
                                searchInput.blur();
                            }
                        }
                    });
                });
            }

            searchResults.style.display = 'block';
        }

        // Highlight query in text
        function highlightQuery(text, query) {
            const regex = new RegExp(`(${query})`, 'gi');
            return text.replace(regex, '<strong>$1</strong>');
        }

        // Hide search results
        function hideSearchResults() {
            if (searchResults) {
                searchResults.style.display = 'none';
            }
        }

        // Search input event handlers
        searchInput.addEventListener('input', function() {
            performSearch(this.value);
        });

        searchInput.addEventListener('focus', function() {
            if (this.value) {
                performSearch(this.value);
            }
        });

        // Hide search results when clicking outside
        document.addEventListener('click', function(e) {
            if (!searchInput.contains(e.target) && 
                (!searchResults || !searchResults.contains(e.target))) {
                hideSearchResults();
            }
        });

        // Build search index on load
        buildSearchIndex();
    }

    // Copy code functionality
    function addCopyButtons() {
        document.querySelectorAll('pre').forEach(pre => {
            // Skip if copy button already exists
            if (pre.querySelector('.code-copy')) return;

            const copyButton = document.createElement('button');
            copyButton.className = 'code-copy';
            copyButton.innerHTML = '<i class="fas fa-copy"></i>';
            copyButton.title = 'Copy code';

            copyButton.addEventListener('click', async function() {
                const code = pre.querySelector('code');
                const text = code ? code.textContent : pre.textContent;

                try {
                    await navigator.clipboard.writeText(text);
                    this.innerHTML = '<i class="fas fa-check"></i>';
                    this.style.backgroundColor = '#27ae60';
                    
                    setTimeout(() => {
                        this.innerHTML = '<i class="fas fa-copy"></i>';
                        this.style.backgroundColor = '';
                    }, 2000);
                } catch (err) {
                    console.error('Failed to copy code:', err);
                }
            });

            pre.appendChild(copyButton);
        });
    }

    // Add copy buttons to all code blocks
    addCopyButtons();

    // Handle window resize
    function handleResize() {
        if (window.innerWidth > 768) {
            closeSidebar();
        }
    }

    window.addEventListener('resize', handleResize);

    // Keyboard shortcuts
    document.addEventListener('keydown', function(e) {
        // Escape key to close sidebar
        if (e.key === 'Escape') {
            closeSidebar();
            hideSearchResults();
        }
        
        // Ctrl/Cmd + K to focus search
        if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
            e.preventDefault();
            if (searchInput) {
                searchInput.focus();
            }
        }
    });

    // Add fade-in animation to content
    const contentElements = document.querySelectorAll('.content-wrapper > *');
    
    const fadeInObserver = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('fade-in');
            }
        });
    }, {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    });

    contentElements.forEach(element => {
        fadeInObserver.observe(element);
    });

    // External link handling
    const externalLinks = document.querySelectorAll('a[href^="http"]');
    externalLinks.forEach(link => {
        if (!link.hostname.includes(window.location.hostname)) {
            link.setAttribute('target', '_blank');
            link.setAttribute('rel', 'noopener noreferrer');
        }
    });

    // Package card hover effects
    const packageCards = document.querySelectorAll('.package-card');
    packageCards.forEach(card => {
        card.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-2px)';
        });
        
        card.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0)';
        });
    });

    console.log('🚀 StackSleuth Documentation loaded successfully');
});

// Enhanced GitBook JavaScript functionality

document.addEventListener('DOMContentLoaded', function() {
    // Initialize all components
    initializeMobileMenu();
    initializeSearch();
    initializeScrollProgress();
    initializeNavigation();
    initializeTabs();
    initializeCopyButtons();
    initializeTooltips();
    
    // Initialize performance monitoring
    trackPagePerformance();
});

// Mobile menu functionality
function initializeMobileMenu() {
    const mobileToggle = document.getElementById('mobile-toggle');
    const sidebar = document.getElementById('sidebar');
    const sidebarOverlay = document.getElementById('sidebar-overlay');

    if (mobileToggle) {
        mobileToggle.addEventListener('click', function() {
            sidebar.classList.toggle('active');
            sidebarOverlay.classList.toggle('active');
            document.body.classList.toggle('sidebar-open');
        });
    }

    if (sidebarOverlay) {
        sidebarOverlay.addEventListener('click', function() {
            sidebar.classList.remove('active');
            sidebarOverlay.classList.remove('active');
            document.body.classList.remove('sidebar-open');
        });
    }

    // Close sidebar when clicking nav links on mobile
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        link.addEventListener('click', function() {
            if (window.innerWidth <= 768) {
                sidebar.classList.remove('active');
                sidebarOverlay.classList.remove('active');
                document.body.classList.remove('sidebar-open');
            }
        });
    });
}

// Enhanced search functionality
function initializeSearch() {
    const searchInput = document.getElementById('header-search');
    const searchResults = document.createElement('div');
    searchResults.className = 'search-results';
    searchResults.style.cssText = `
        position: absolute;
        top: 100%;
        left: 0;
        right: 0;
        background: var(--bg-primary);
        border: 1px solid var(--border-color);
        border-top: none;
        border-radius: 0 0 8px 8px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        max-height: 400px;
        overflow-y: auto;
        z-index: 1000;
        display: none;
    `;

    if (searchInput) {
        const searchContainer = searchInput.parentElement;
        searchContainer.style.position = 'relative';
        searchContainer.appendChild(searchResults);

        // Search content index
        const searchIndex = buildSearchIndex();

        let searchTimeout;
        searchInput.addEventListener('input', function() {
            const query = this.value.trim();
            
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                if (query.length >= 2) {
                    const results = performSearch(query, searchIndex);
                    displaySearchResults(results, searchResults);
                } else {
                    searchResults.style.display = 'none';
                }
            }, 300);
        });

        // Keyboard navigation
        searchInput.addEventListener('keydown', function(e) {
            if (e.key === 'Escape') {
                searchResults.style.display = 'none';
                searchInput.blur();
            } else if (e.key === 'Enter') {
                const firstResult = searchResults.querySelector('.search-result-item');
                if (firstResult) {
                    firstResult.click();
                }
            }
        });

        // Close search results when clicking outside
        document.addEventListener('click', function(e) {
            if (!searchContainer.contains(e.target)) {
                searchResults.style.display = 'none';
            }
        });

        // Keyboard shortcut (Ctrl+K or Cmd+K)
        document.addEventListener('keydown', function(e) {
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                searchInput.focus();
            }
        });
    }
}

// Build search index from page content
function buildSearchIndex() {
    const index = [];
    const contentSections = document.querySelectorAll('section, .nav-link');
    
    contentSections.forEach(section => {
        const id = section.id || section.getAttribute('href');
        const title = section.querySelector('h1, h2, h3, h4') || section;
        const content = section.textContent || '';
        
        if (id && title) {
            index.push({
                id: id,
                title: title.textContent.trim(),
                content: content.toLowerCase(),
                url: id.startsWith('#') ? id : `#${id}`,
                type: section.tagName === 'SECTION' ? 'content' : 'navigation'
            });
        }
    });
    
    return index;
}

// Perform search with ranking
function performSearch(query, index) {
    const searchTerms = query.toLowerCase().split(' ').filter(term => term.length > 1);
    const results = [];
    
    index.forEach(item => {
        let score = 0;
        const titleLower = item.title.toLowerCase();
        const contentLower = item.content;
        
        searchTerms.forEach(term => {
            // Title matches get higher score
            if (titleLower.includes(term)) {
                score += titleLower.indexOf(term) === 0 ? 10 : 5;
            }
            
            // Content matches
            if (contentLower.includes(term)) {
                score += 1;
            }
            
            // Exact phrase matches get bonus
            if (titleLower.includes(query.toLowerCase())) {
                score += 15;
            }
        });
        
        if (score > 0) {
            results.push({ ...item, score });
        }
    });
    
    return results.sort((a, b) => b.score - a.score).slice(0, 8);
}

// Display search results
function displaySearchResults(results, container) {
    if (results.length === 0) {
        container.innerHTML = '<div class="search-no-results">No results found</div>';
    } else {
        container.innerHTML = results.map(result => `
            <div class="search-result-item" onclick="navigateToResult('${result.url}')">
                <div class="search-result-title">${highlightQuery(result.title, searchInput.value)}</div>
                <div class="search-result-type">${result.type}</div>
            </div>
        `).join('');
    }
    
    container.style.display = 'block';
}

// Highlight search query in results
function highlightQuery(text, query) {
    if (!query) return text;
    
    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    return text.replace(regex, '<mark>$1</mark>');
}

// Navigate to search result
function navigateToResult(url) {
    document.querySelector('.search-results').style.display = 'none';
    document.getElementById('header-search').value = '';
    
    if (url.startsWith('#')) {
        const element = document.querySelector(url);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
        }
    } else {
        window.location.href = url;
    }
}

// Scroll progress indicator
function initializeScrollProgress() {
    const progressBar = document.getElementById('scroll-progress');
    
    if (progressBar) {
        window.addEventListener('scroll', function() {
            const scrollTop = window.pageYOffset;
            const docHeight = document.documentElement.scrollHeight - window.innerHeight;
            const scrollPercent = (scrollTop / docHeight) * 100;
            
            progressBar.style.width = `${Math.min(scrollPercent, 100)}%`;
        });
    }
}

// Navigation highlighting
function initializeNavigation() {
    const navLinks = document.querySelectorAll('.nav-link[href^="#"]');
    const sections = document.querySelectorAll('section[id]');
    
    if (sections.length === 0) return;
    
    // Intersection Observer for section highlighting
    const observerOptions = {
        rootMargin: '-20% 0px -70% 0px',
        threshold: 0
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            const navLink = document.querySelector(`.nav-link[href="#${entry.target.id}"]`);
            if (navLink) {
                if (entry.isIntersecting) {
                    // Remove active class from all nav links
                    navLinks.forEach(link => link.classList.remove('active'));
                    // Add active class to current section link
                    navLink.classList.add('active');
                }
            }
        });
    }, observerOptions);
    
    sections.forEach(section => observer.observe(section));
    
    // Smooth scrolling for navigation links
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            const targetElement = document.querySelector(targetId);
            
            if (targetElement) {
                targetElement.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
                
                // Update URL without triggering navigation
                history.replaceState(null, null, targetId);
            }
        });
    });
}

// Tab functionality
function initializeTabs() {
    const tabContainers = document.querySelectorAll('.tabs-container');
    
    tabContainers.forEach(container => {
        const tabButtons = container.querySelectorAll('.tab-button');
        const tabContents = container.querySelectorAll('.tab-content');
        
        tabButtons.forEach(button => {
            button.addEventListener('click', function() {
                const targetTab = this.getAttribute('data-tab');
                
                // Remove active class from all tabs and contents
                tabButtons.forEach(btn => btn.classList.remove('active'));
                tabContents.forEach(content => content.classList.remove('active'));
                
                // Add active class to clicked tab and corresponding content
                this.classList.add('active');
                const targetContent = container.querySelector(`#${targetTab}`);
                if (targetContent) {
                    targetContent.classList.add('active');
                }
                
                // Track tab interaction
                trackEvent('tab-change', {
                    tab: targetTab,
                    container: container.id || 'unknown'
                });
            });
        });
        
        // Keyboard navigation for tabs
        container.addEventListener('keydown', function(e) {
            if (e.target.classList.contains('tab-button')) {
                const tabs = Array.from(tabButtons);
                const currentIndex = tabs.indexOf(e.target);
                
                if (e.key === 'ArrowLeft' && currentIndex > 0) {
                    tabs[currentIndex - 1].click();
                    tabs[currentIndex - 1].focus();
                } else if (e.key === 'ArrowRight' && currentIndex < tabs.length - 1) {
                    tabs[currentIndex + 1].click();
                    tabs[currentIndex + 1].focus();
                }
            }
        });
    });
}

// Copy to clipboard functionality
function initializeCopyButtons() {
    const codeBlocks = document.querySelectorAll('pre[class*="language-"]');
    
    codeBlocks.forEach(block => {
        const wrapper = document.createElement('div');
        wrapper.className = 'code-block-wrapper';
        block.parentNode.insertBefore(wrapper, block);
        wrapper.appendChild(block);
        
        const copyButton = document.createElement('button');
        copyButton.className = 'copy-button';
        copyButton.innerHTML = '<i class="fas fa-copy"></i> Copy';
        copyButton.setAttribute('aria-label', 'Copy code to clipboard');
        
        copyButton.addEventListener('click', async function() {
            const code = block.querySelector('code').textContent;
            
            try {
                await navigator.clipboard.writeText(code);
                
                // Success feedback
                this.innerHTML = '<i class="fas fa-check"></i> Copied!';
                this.style.background = 'rgba(40, 167, 69, 0.2)';
                
                setTimeout(() => {
                    this.innerHTML = '<i class="fas fa-copy"></i> Copy';
                    this.style.background = '';
                }, 2000);
                
                trackEvent('code-copy', {
                    language: block.className.match(/language-(\w+)/)?.[1] || 'unknown',
                    codeLength: code.length
                });
                
            } catch (err) {
                // Fallback for older browsers
                fallbackCopyTextToClipboard(code);
                
                this.innerHTML = '<i class="fas fa-check"></i> Copied!';
                setTimeout(() => {
                    this.innerHTML = '<i class="fas fa-copy"></i> Copy';
                }, 2000);
            }
        });
        
        wrapper.appendChild(copyButton);
    });
}

// Fallback copy function for older browsers
function fallbackCopyTextToClipboard(text) {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.top = '0';
    textArea.style.left = '0';
    textArea.style.width = '2em';
    textArea.style.height = '2em';
    textArea.style.padding = '0';
    textArea.style.border = 'none';
    textArea.style.outline = 'none';
    textArea.style.boxShadow = 'none';
    textArea.style.background = 'transparent';
    
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    
    try {
        document.execCommand('copy');
    } catch (err) {
        console.error('Fallback: Could not copy text');
    }
    
    document.body.removeChild(textArea);
}

// Tooltip functionality
function initializeTooltips() {
    const tooltipElements = document.querySelectorAll('[data-tooltip]');
    
    tooltipElements.forEach(element => {
        let tooltip;
        
        element.addEventListener('mouseenter', function() {
            const tooltipText = this.getAttribute('data-tooltip');
            
            tooltip = document.createElement('div');
            tooltip.className = 'tooltip';
            tooltip.textContent = tooltipText;
            tooltip.style.cssText = `
                position: absolute;
                background: var(--text-primary);
                color: var(--bg-primary);
                padding: 0.5rem;
                border-radius: 4px;
                font-size: 0.8rem;
                white-space: nowrap;
                z-index: 1000;
                pointer-events: none;
                opacity: 0;
                transition: opacity 0.2s ease;
            `;
            
            document.body.appendChild(tooltip);
            
            const rect = this.getBoundingClientRect();
            const tooltipRect = tooltip.getBoundingClientRect();
            
            tooltip.style.left = `${rect.left + (rect.width / 2) - (tooltipRect.width / 2)}px`;
            tooltip.style.top = `${rect.top - tooltipRect.height - 8}px`;
            
            setTimeout(() => {
                tooltip.style.opacity = '1';
            }, 10);
        });
        
        element.addEventListener('mouseleave', function() {
            if (tooltip) {
                tooltip.style.opacity = '0';
                setTimeout(() => {
                    if (tooltip && tooltip.parentNode) {
                        tooltip.parentNode.removeChild(tooltip);
                    }
                }, 200);
            }
        });
    });
}

// Performance tracking
function trackPagePerformance() {
    // Track page load performance
    window.addEventListener('load', function() {
        setTimeout(() => {
            if (window.performance && window.performance.timing) {
                const timing = window.performance.timing;
                const loadTime = timing.loadEventEnd - timing.navigationStart;
                const domReady = timing.domContentLoadedEventEnd - timing.navigationStart;
                
                trackEvent('page-performance', {
                    loadTime,
                    domReady,
                    page: window.location.pathname
                });
            }
        }, 0);
    });
    
    // Track user engagement
    let startTime = Date.now();
    let isVisible = true;
    
    document.addEventListener('visibilitychange', function() {
        if (document.hidden) {
            if (isVisible) {
                const timeSpent = Date.now() - startTime;
                trackEvent('page-engagement', {
                    timeSpent,
                    page: window.location.pathname,
                    action: 'tab-hidden'
                });
                isVisible = false;
            }
        } else {
            startTime = Date.now();
            isVisible = true;
        }
    });
    
    // Track scroll depth
    let maxScrollDepth = 0;
    
    window.addEventListener('scroll', function() {
        const scrollTop = window.pageYOffset;
        const docHeight = document.documentElement.scrollHeight - window.innerHeight;
        const scrollPercent = Math.round((scrollTop / docHeight) * 100);
        
        if (scrollPercent > maxScrollDepth) {
            maxScrollDepth = scrollPercent;
            
            // Track scroll milestones
            if ([25, 50, 75, 90].includes(scrollPercent)) {
                trackEvent('scroll-depth', {
                    depth: scrollPercent,
                    page: window.location.pathname
                });
            }
        }
    });
}

// Event tracking utility
function trackEvent(eventName, eventData) {
    // Integration point for analytics
    if (typeof gtag !== 'undefined') {
        gtag('event', eventName, eventData);
    }
    
    // Console logging for development
    if (window.location.hostname === 'localhost') {
        console.log('Event tracked:', eventName, eventData);
    }
    
    // Could also integrate with StackSleuth here
    if (typeof stackSleuth !== 'undefined') {
        stackSleuth.trackEvent(eventName, eventData);
    }
}

// Utility functions
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

function throttle(func, limit) {
    let inThrottle;
    return function() {
        const args = arguments;
        const context = this;
        if (!inThrottle) {
            func.apply(context, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

// Add CSS for search results and tooltips
const additionalStyles = `
    .search-results {
        font-family: var(--font-primary);
    }
    
    .search-result-item {
        padding: 0.75rem 1rem;
        border-bottom: 1px solid var(--border-color);
        cursor: pointer;
        transition: background-color 0.2s ease;
    }
    
    .search-result-item:hover {
        background: var(--bg-secondary);
    }
    
    .search-result-item:last-child {
        border-bottom: none;
    }
    
    .search-result-title {
        font-weight: 500;
        margin-bottom: 0.25rem;
    }
    
    .search-result-title mark {
        background: var(--primary-color);
        color: white;
        padding: 0.1rem 0.2rem;
        border-radius: 2px;
    }
    
    .search-result-type {
        font-size: 0.8rem;
        color: var(--text-secondary);
        text-transform: capitalize;
    }
    
    .search-no-results {
        padding: 1rem;
        text-align: center;
        color: var(--text-secondary);
        font-style: italic;
    }
    
    .tooltip {
        font-family: var(--font-primary);
    }
`;

// Inject additional styles
const styleSheet = document.createElement('style');
styleSheet.textContent = additionalStyles;
document.head.appendChild(styleSheet); 