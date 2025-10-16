const nav = document.querySelector(".nav");
const navMenu = document.querySelector(".nav-items");
const btnToggleNav = document.querySelector(".menu-btn");
const workEls = document.querySelectorAll(".work-box");
const workGalleries = document.querySelectorAll(".work-gallery");
const mainEl = document.querySelector("main");
const yearEl = document.querySelector(".footer-text span");

const toggleNav = () => {
  nav.classList.toggle("hidden");

  // Prevent screen from scrolling when menu is opened
  document.body.classList.toggle("lock-screen");

  if (nav.classList.contains("hidden")) {
    btnToggleNav.textContent = "menu";
  } else {
    // When menu is opened after transition change text respectively
    setTimeout(() => {
      btnToggleNav.textContent = "close";
    }, 475);
  }
};

btnToggleNav.addEventListener("click", toggleNav);

navMenu.addEventListener("click", (e) => {
  if (e.target.localName === "a") {
    toggleNav();
  }
});

document.body.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && !nav.classList.contains("hidden")) {
    toggleNav();
  }
});

// Animating work instances on scroll

workGalleries.forEach((workGallery) => workGallery.classList.add("transform"));

let observer = new IntersectionObserver(
  (entries) => {
    const [entry] = entries;
    const [textbox, gallery] = Array.from(entry.target.children);
    if (entry.isIntersecting) {
      gallery.classList.remove("transform");
      Array.from(textbox.children).forEach(
        (el) => (el.style.animationPlayState = "running")
      );
    }
  },
  { threshold: 0.3 }
);

workEls.forEach((workEl) => {
  observer.observe(workEl);
});

// Toggle theme and store user preferred theme for future

const switchThemeEl = document.querySelector('input[type="checkbox"]');
const storedTheme = localStorage.getItem("theme");

// Default to light theme (unchecked)
switchThemeEl.checked = storedTheme === "dark";

switchThemeEl.addEventListener("click", () => {
  const isChecked = switchThemeEl.checked;

  if (!isChecked) {
    document.body.classList.remove("dark");
    document.body.classList.add("light");
    localStorage.setItem("theme", "light");
  } else {
    document.body.classList.add("dark");
    document.body.classList.remove("light");
    localStorage.setItem("theme", "dark");
  }

  // Update FAB icon
  updateFABIcon();
});

// Function to update FAB icon based on current theme
function updateFABIcon() {
  const fabIcon = document.querySelector(".theme-icon");
  if (fabIcon) {
    if (document.body.classList.contains("dark")) {
      fabIcon.textContent = "☀️";
    } else {
      fabIcon.textContent = "🌙";
    }
  }
}

// Initialize FAB icon on page load
document.addEventListener("DOMContentLoaded", function () {
  updateFABIcon();

  // Add FAB button event listener
  const fabButton = document.getElementById("theme-toggle");
  if (fabButton) {
    fabButton.addEventListener("click", function () {
      // Toggle theme
      document.body.classList.toggle("dark");
      document.body.classList.toggle("light");

      const currentTheme = document.body.classList.contains("dark")
        ? "dark"
        : "light";
      localStorage.setItem("theme", currentTheme);

      // Update checkbox state
      if (switchThemeEl) {
        switchThemeEl.checked = currentTheme === "dark";
      }

      // Update FAB icon
      updateFABIcon();
    });
  }
});

// Trap the tab when menu is opened

const lastFocusedEl = document.querySelector('a[data-focused="last-focused"]');

document.body.addEventListener("keydown", (e) => {
  if (e.key === "Tab" && document.activeElement === lastFocusedEl) {
    e.preventDefault();
    btnToggleNav.focus();
  }
});

// Rotating logos animation

const logosWrappers = document.querySelectorAll(".logo-group");

const sleep = (number) => new Promise((res) => setTimeout(res, number));

logosWrappers.forEach(async (logoWrapper, i) => {
  const logos = Array.from(logoWrapper.children);
  await sleep(1400 * i);
  setInterval(() => {
    let temp = logos[0];
    logos[0] = logos[1];
    logos[1] = logos[2];
    logos[2] = temp;
    logos[0].classList.add("hide", "to-top");
    logos[1].classList.remove("hide", "to-top", "to-bottom");
    logos[2].classList.add("hide", "to-bottom");
  }, 5600);
});

yearEl.textContent = new Date().getFullYear();

// --- Helper function to get first image from a blog post ---
async function getFirstImageFromPost(slug) {
  try {
    const response = await fetch(`/pages/${slug}`);
    if (!response.ok) return null;

    const html = await response.text();
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");

    // Find first img element in the blog article
    const firstImg = doc.querySelector(".blog-article img");
    if (firstImg && firstImg.src) {
      // Convert relative URL to absolute path for homepage
      return firstImg.src.replace(window.location.origin, "");
    }
  } catch (error) {
    console.warn("Failed to get first image from post:", slug, error);
  }
  return null;
}

// --- Homepage posts loader: fetch pages/data/posts.json and populate article-boxes ---
(async function loadHomepagePosts() {
  const container = document.querySelector(".article-boxes");
  if (!container) return; // not on homepage

  try {
    const res = await fetch("/pages/data/posts.json");
    if (!res.ok) throw new Error("Failed to load posts.json");
    let posts = await res.json();

    // For each post without image, try to get first image from the post
    for (let post of posts) {
      if (!post.image && post.slug && post.slug !== "#") {
        post.image = await getFirstImageFromPost(post.slug);
      }
    }

    container.innerHTML = posts
      .map(
        (p, index) => `
      <article class="article-box ${index === 0 ? 'featured-article' : ''}">
        <picture class="article-illustration">
          ${
            p.image
              ? `<img src="${p.image.replace("../", "/")}" alt="${
                  p.title
                }" loading="lazy" />`
              : ""
          }
        </picture>
        <div class="article-textbox">
          <div>
            <h3 class="h3">${p.title}</h3>
            <p class="article-text">${p.excerpt}</p>
          </div>
          <div class="article-info">
            <span class="reaction-count">
              <img src="./assets/images/heart-outline.svg" alt="heart" />
              ${p.likes || 0}
            </span>
            <a href="/pages/${
              p.slug
            }" class="link" target="_blank" rel="noopener">Continue reading</a>
          </div>
        </div>
      </article>
    `
      )
      .join("\n");
  } catch (err) {
    console.warn("Homepage posts loader:", err);
  }
})();

// Gallery functionality
document.querySelectorAll(".work-gallery").forEach((gallery) => {
  const images = gallery.querySelectorAll(".gallery-img");
  const prevBtn = gallery.querySelector(".gallery-prev");
  const nextBtn = gallery.querySelector(".gallery-next");
  let currentIndex = 0;

  function showImage(index) {
    images.forEach((img, i) => {
      img.classList.toggle("active", i === index);
    });
  }

  prevBtn.addEventListener("click", () => {
    currentIndex = (currentIndex - 1 + images.length) % images.length;
    showImage(currentIndex);
  });

  nextBtn.addEventListener("click", () => {
    currentIndex = (currentIndex + 1) % images.length;
    showImage(currentIndex);
  });

  // Show first image initially
  showImage(currentIndex);

  // Auto-play functionality
  let autoPlayInterval = setInterval(() => {
    currentIndex = (currentIndex + 1) % images.length;
    showImage(currentIndex);
  }, 3000); // Change image every 3 seconds

  // Pause auto-play on hover
  gallery.addEventListener("mouseenter", () => {
    clearInterval(autoPlayInterval);
  });

  // Resume auto-play when mouse leaves
  gallery.addEventListener("mouseleave", () => {
    autoPlayInterval = setInterval(() => {
      currentIndex = (currentIndex + 1) % images.length;
      showImage(currentIndex);
    }, 6000);
  });

  // Pause auto-play when buttons are clicked
  prevBtn.addEventListener("click", () => {
    clearInterval(autoPlayInterval);
    setTimeout(() => {
      autoPlayInterval = setInterval(() => {
        currentIndex = (currentIndex + 1) % images.length;
        showImage(currentIndex);
      }, 6000);
    }, 10000); // Resume after 10 seconds of inactivity
  });

  nextBtn.addEventListener("click", () => {
    clearInterval(autoPlayInterval);
    setTimeout(() => {
      autoPlayInterval = setInterval(() => {
        currentIndex = (currentIndex + 1) % images.length;
        showImage(currentIndex);
      }, 6000);
    }, 10000); // Resume after 10 seconds of inactivity
  });
});
