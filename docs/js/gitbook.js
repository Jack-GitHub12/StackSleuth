// GitBook-style functionality for StackSleuth Documentation
document.addEventListener('DOMContentLoaded', function() {
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