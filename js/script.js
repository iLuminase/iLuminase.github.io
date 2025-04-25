// Toggle navbar menu
const navbar = document.querySelector('.header .navbar');
const menuBtn = document.querySelector('#menu-btn');
const loginForm = document.querySelector('.login-form');
const loginBtn = document.querySelector('#login-btn');
const darkModeToggle = document.getElementById('darkModeToggle');
const body = document.body;

// Toggle navbar menu
menuBtn.onclick = () => {
    navbar.classList.toggle('active');
    loginForm.classList.remove('active');
};

// Toggle login form
loginBtn.onclick = () => {
    loginForm.classList.toggle('active');
    navbar.classList.remove('active');
};

// Remove active classes on scroll
window.onscroll = () => {
    navbar.classList.remove('active');
    loginForm.classList.remove('active');
};

// Initialize Swiper for review slider
const swiper = new Swiper(".review-slider", {
    spaceBetween: 20,
    centeredSlides: true,
    grabCursor: true,
    autoplay: {
        delay: 7500,
        disableOnInteraction: false,
    },
    loop: true,
    breakpoints: {
        0: {
            slidesPerView: 1,
        },
        768: {
            slidesPerView: 2,
        },
        991: {
            slidesPerView: 3,
        },
    },
});

// Handle responsive classes for mobile view
function handleResponsiveClasses() {
    const coursesBox = document.querySelectorAll('.courses .box-container .box');

    if (window.innerWidth <= 768) {
        navbar.classList.add('mobile-navbar'); // Add class for navbar
        coursesBox.forEach(box => box.classList.add('mobile-box')); // Add class for each box
    } else {
        navbar.classList.remove('mobile-navbar'); // Remove class for navbar
        coursesBox.forEach(box => box.classList.remove('mobile-box')); // Remove class for each box
    }
}

// Call responsive handler on load and resize
window.addEventListener('load', handleResponsiveClasses);
window.addEventListener('resize', handleResponsiveClasses);

// Dark Mode functionality
if (localStorage.getItem('dark-mode') === 'enabled') {
    body.classList.add('dark-mode');
    darkModeToggle.checked = true; // Set slider state
}

darkModeToggle.addEventListener('change', () => {
    if (darkModeToggle.checked) {
        body.classList.add('dark-mode');
        localStorage.setItem('dark-mode', 'enabled');
    } else {
        body.classList.remove('dark-mode');
        localStorage.setItem('dark-mode', 'disabled');
    }
});

// Smooth scrolling for navbar links
document.querySelectorAll('.navbar a').forEach(link => {
    link.addEventListener('click', (event) => {
        event.preventDefault();
        const targetId = link.getAttribute('href').substring(1);
        const targetElement = document.getElementById(targetId);
        if (targetElement) {
            targetElement.scrollIntoView({ behavior: 'smooth' });
        }
    });
});