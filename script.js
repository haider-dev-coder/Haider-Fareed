const canvas = document.getElementById('scroll-canvas');
const context = canvas.getContext('2d');

const frameCount = 240;
const currentFrame = index => `./frames/frame_${index.toString().padStart(6, '0')}.png`;

const images = [];

// Preload images
for (let i = 0; i < frameCount; i++) {
    const img = new Image();
    img.src = currentFrame(i);
    images.push(img);
}

// Initial draw when the first frame loads
images[0].onload = () => {
    canvas.width = images[0].naturalWidth || 1920;
    canvas.height = images[0].naturalHeight || 1080;
    context.drawImage(images[0], 0, 0);
};

let currentFrameIndex = 0;

window.addEventListener('scroll', () => {
    const scrollTop = document.documentElement.scrollTop;
    const maxScrollTop = document.documentElement.scrollHeight - window.innerHeight;
    const scrollFraction = scrollTop / maxScrollTop;
    
    let frameIndex = Math.floor(scrollFraction * frameCount);
    frameIndex = Math.min(frameCount - 1, Math.max(0, frameIndex));
    
    if (frameIndex !== currentFrameIndex) {
        currentFrameIndex = frameIndex;
        requestAnimationFrame(() => updateImage(frameIndex));
    }
});

function updateImage(index) {
    if (images[index] && images[index].complete) {
        context.drawImage(images[index], 0, 0);
    }
}

// Liquid Navigation & Active State
document.addEventListener('DOMContentLoaded', () => {
    const sections = document.querySelectorAll('section[id]');
    const navItems = document.querySelectorAll('#main-nav .nav-item');
    const indicator = document.getElementById('nav-indicator');
    const footerNavItems = document.querySelectorAll('.footer-nav-item');

    // --- Hamburger menu ---
    const hamburger = document.getElementById('hamburger');
    const mainNav = document.getElementById('main-nav');
    if (hamburger && mainNav) {
        hamburger.addEventListener('click', () => {
            const isOpen = mainNav.classList.toggle('mobile-open');
            hamburger.classList.toggle('open', isOpen);
            hamburger.setAttribute('aria-expanded', isOpen);
        });
        // Close nav when a nav item is clicked
        mainNav.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', () => {
                mainNav.classList.remove('mobile-open');
                hamburger.classList.remove('open');
                hamburger.setAttribute('aria-expanded', 'false');
            });
        });
        // Close nav on outside click
        document.addEventListener('click', (e) => {
            if (!mainNav.contains(e.target) && !hamburger.contains(e.target)) {
                mainNav.classList.remove('mobile-open');
                hamburger.classList.remove('open');
                hamburger.setAttribute('aria-expanded', 'false');
            }
        });
    }


    function updateIndicator(activeItem) {
        if (!activeItem || !indicator) return;
        const navRect = activeItem.parentElement.getBoundingClientRect();
        const itemRect = activeItem.getBoundingClientRect();
        
        indicator.style.opacity = '1';
        indicator.style.width = `${itemRect.width}px`;
        indicator.style.left = `${itemRect.left - navRect.left}px`;
    }

    // Initialize indicator
    setTimeout(() => {
        const initialActive = document.querySelector('#main-nav .nav-item.active') || navItems[0];
        if (initialActive) {
            initialActive.classList.add('active');
            updateIndicator(initialActive);
        }
    }, 100);

    const observerOptions = {
        root: null,
        rootMargin: '-40% 0px -60% 0px', 
        threshold: 0
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const currentId = entry.target.getAttribute('id');
                
                navItems.forEach(item => {
                    item.classList.remove('active');
                    if (item.getAttribute('href') === `#${currentId}`) {
                        item.classList.add('active');
                        updateIndicator(item);
                    }
                });
                
                footerNavItems.forEach(item => {
                    item.classList.remove('active');
                    if (item.getAttribute('href') === `#${currentId}`) {
                        item.classList.add('active');
                    }
                });
            }
        });
    }, observerOptions);

    sections.forEach(section => observer.observe(section));

    // Handle scroll at top to keep "About" active if above it
    window.addEventListener('scroll', () => {
        const aboutSection = document.getElementById('about');
        if (aboutSection) {
            const rect = aboutSection.getBoundingClientRect();
            // If about section is below the middle of the screen
            if (rect.top > window.innerHeight / 2) {
                navItems.forEach(item => item.classList.remove('active'));
                if (navItems.length > 0) {
                    navItems[0].classList.add('active');
                    updateIndicator(navItems[0]);
                }
                
                footerNavItems.forEach(item => item.classList.remove('active'));
                if (footerNavItems.length > 0) {
                    footerNavItems[0].classList.add('active');
                }
            }
        }
    });

    navItems.forEach(item => {
        item.addEventListener('click', function(e) {
            navItems.forEach(nav => nav.classList.remove('active'));
            this.classList.add('active');
            updateIndicator(this);
        });
    });

    window.addEventListener('resize', () => {
        const activeItem = document.querySelector('#main-nav .nav-item.active');
        if (activeItem) updateIndicator(activeItem);
    });
});

// Contact Form Handling
document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('contact-form');
    const result = document.getElementById('form-result');
    const submitBtn = document.getElementById('submit-btn');

    if (form) {
        form.addEventListener('submit', function(e) {
            e.preventDefault();

            // Basic validation
            const emailInput = document.getElementById('email');
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(emailInput.value)) {
                result.style.display = 'block';
                result.style.color = '#ea6c31'; // use primary color for error
                result.innerHTML = 'Please enter a valid email address.';
                return;
            }

            const formData = new FormData(form);
            const object = Object.fromEntries(formData);
            const json = JSON.stringify(object);

            // UI Loading state
            const originalBtnHtml = submitBtn.innerHTML;
            submitBtn.innerHTML = 'Sending...';
            submitBtn.disabled = true;
            submitBtn.style.opacity = '0.7';
            submitBtn.style.cursor = 'not-allowed';
            result.style.display = 'none';

            fetch('https://api.web3forms.com/submit', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: json
            })
            .then(async (response) => {
                let jsonResponse = await response.json();
                if (response.status === 200) {
                    result.innerHTML = "Message sent successfully! I'll get back to you soon.";
                    result.style.color = '#4ade80'; // Success green
                    result.style.display = 'block';
                    form.reset();
                } else {
                    console.log(jsonResponse);
                    result.innerHTML = jsonResponse.message || "Something went wrong!";
                    result.style.color = '#ef4444'; // Error red
                    result.style.display = 'block';
                }
            })
            .catch((error) => {
                console.log(error);
                result.innerHTML = "Something went wrong!";
                result.style.color = '#ef4444';
                result.style.display = 'block';
            })
            .finally(() => {
                // Restore button state
                submitBtn.innerHTML = originalBtnHtml;
                submitBtn.disabled = false;
                submitBtn.style.opacity = '1';
                submitBtn.style.cursor = 'pointer';
                
                // Hide success message after 5 seconds
                setTimeout(() => {
                    if (result.style.color === 'rgb(74, 222, 128)' || result.style.color === '#4ade80') {
                         result.style.display = 'none';
                    }
                }, 5000);
            });
        });
    }
});

