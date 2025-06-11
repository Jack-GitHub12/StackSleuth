// API Reference page functionality
document.addEventListener('DOMContentLoaded', function() {
    // Search functionality
    const searchInput = document.getElementById('api-search');
    const apiSections = document.querySelectorAll('.api-section');
    const apiMethods = document.querySelectorAll('.api-method');
    
    if (searchInput) {
        searchInput.addEventListener('input', function(e) {
            const searchTerm = e.target.value.toLowerCase();
            
            apiMethods.forEach(method => {
                const methodName = method.querySelector('h3').textContent.toLowerCase();
                const methodContent = method.textContent.toLowerCase();
                
                if (methodContent.includes(searchTerm)) {
                    method.style.display = 'block';
                } else {
                    method.style.display = 'none';
                }
            });
            
            // Hide sections with no visible methods
            apiSections.forEach(section => {
                const visibleMethods = section.querySelectorAll('.api-method:not([style*="display: none"])');
                section.style.display = visibleMethods.length > 0 ? 'block' : 'none';
            });
        });
    }
    
    // Smooth scrolling for sidebar navigation
    const navLinks = document.querySelectorAll('.api-nav a');
    
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            const targetId = this.getAttribute('href');
            const targetSection = document.querySelector(targetId);
            
            if (targetSection) {
                targetSection.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
                
                // Update active state
                navLinks.forEach(l => l.classList.remove('active'));
                this.classList.add('active');
            }
        });
    });
    
    // Intersection Observer for active link highlighting
    const sections = document.querySelectorAll('.api-section');
    const observerOptions = {
        rootMargin: '-100px 0px -70% 0px'
    };
    
    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const id = entry.target.getAttribute('id');
                const correspondingLink = document.querySelector(`.api-nav a[href="#${id}"]`);
                
                if (correspondingLink) {
                    navLinks.forEach(l => l.classList.remove('active'));
                    correspondingLink.classList.add('active');
                }
            }
        });
    }, observerOptions);
    
    sections.forEach(section => {
        observer.observe(section);
    });
    
    // Add copy buttons to code blocks
    document.querySelectorAll('pre').forEach(pre => {
        const wrapper = document.createElement('div');
        wrapper.className = 'code-wrapper';
        wrapper.style.position = 'relative';
        pre.parentNode.insertBefore(wrapper, pre);
        wrapper.appendChild(pre);
        
        const copyButton = document.createElement('button');
        copyButton.className = 'copy-button';
        copyButton.textContent = 'Copy';
        copyButton.onclick = async () => {
            const code = pre.querySelector('code').textContent;
            try {
                await navigator.clipboard.writeText(code);
                copyButton.textContent = 'Copied!';
                setTimeout(() => {
                    copyButton.textContent = 'Copy';
                }, 2000);
            } catch (err) {
                console.error('Failed to copy:', err);
            }
        };
        
        wrapper.appendChild(copyButton);
    });
}); 