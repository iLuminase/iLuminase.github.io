// Blog page specific JavaScript

// Function to load and insert HTML components
async function loadComponent(componentPath, targetElement) {
  try {
    const response = await fetch(componentPath);
    if (!response.ok) throw new Error(`Failed to load ${componentPath}`);
    const html = await response.text();
    targetElement.innerHTML = html;
  } catch (error) {
    console.error("Error loading component:", error);
  }
}

// Load blog header and footer components
document.addEventListener("DOMContentLoaded", function () {
  // Load header component
  const headerPlaceholder = document.querySelector(".blog-header-placeholder");
  if (headerPlaceholder) {
    loadComponent("components/blog-header.html", headerPlaceholder);
  }

  // Initialize comment functionality immediately
  initializeComments();

  // Initialize navigation after components are loaded
  setTimeout(() => {
    const nav = document.querySelector(".nav");
    const navMenu = document.querySelector(".nav-items");
    const btnToggleNav = document.querySelector(".menu-btn");

    if (btnToggleNav && nav && navMenu) {
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

      // Close nav when clicking on links
      navMenu.addEventListener("click", (e) => {
        if (e.target.localName === "a") {
          toggleNav();
        }
      });

      // Close nav with Escape key
      document.body.addEventListener("keydown", (e) => {
        if (e.key === "Escape" && !nav.classList.contains("hidden")) {
          toggleNav();
        }
      });
    }

    // Initialize theme switching for blog pages
    const themeSwitch = document.getElementById("theme-switch");
    if (themeSwitch) {
      const currentTheme = localStorage.getItem("theme") || "light";
      themeSwitch.checked = currentTheme === "dark";

      themeSwitch.addEventListener("change", function () {
        const newTheme = this.checked ? "dark" : "light";
        document.body.classList.remove("dark", "light");
        document.body.classList.add(newTheme);
        localStorage.setItem("theme", newTheme);
      });
    }

    // Initialize like and share buttons after components are loaded
    initializeInteractionButtons();
  }, 100); // Small delay to ensure components are loaded
});

// Function to initialize comment functionality
function initializeComments() {
  const commentForm = document.getElementById("comment-form");
  const commentsList = document.getElementById("comments-list");

  if (commentForm && commentsList) {
    // Load existing comments
    const comments = JSON.parse(localStorage.getItem("blog-comments") || "[]");
    comments.forEach((comment) => addCommentToDOM(comment));

    commentForm.addEventListener("submit", function (e) {
      e.preventDefault();

      const nameInput = document.getElementById("comment-name");
      const textInput = document.getElementById("comment-text");

      if (nameInput.value.trim() && textInput.value.trim()) {
        const comment = {
          id: Date.now(),
          name: nameInput.value.trim(),
          text: textInput.value.trim(),
          date: new Date().toLocaleDateString(),
        };

        // Save to localStorage
        comments.push(comment);
        localStorage.setItem("blog-comments", JSON.stringify(comments));

        // Add to DOM
        addCommentToDOM(comment);

        // Clear form
        nameInput.value = "";
        textInput.value = "";
      }
    });
  }
}

// Function to add comment to DOM
function addCommentToDOM(comment) {
  const commentEl = document.createElement("div");
  commentEl.className = "comment";
  commentEl.innerHTML = `
    <div class="comment-header">
      <strong>${comment.name}</strong>
      <span class="comment-date">${comment.date}</span>
    </div>
    <p class="comment-text">${comment.text}</p>
  `;
  commentsList.appendChild(commentEl);
}
function initializeInteractionButtons() {
  // Get current page identifier (use pathname as unique key)
  const currentPage = window.location.pathname;
  const pageKey = `blog-interactions-${currentPage}`;

  // Debounce variables (declared at function scope)
  let isProcessing = false;
  let isSharing = false;

  // Like/Unlike functionality with per-post storage
  const likeBtn = document.getElementById("like-btn");
  const likeCount = document.getElementById("like-count");

  if (likeBtn && likeCount) {
    // Load or initialize post interactions data
    let postData = loadPostInteractions(pageKey);

    // Update UI with current data
    likeCount.textContent = postData.likes;
    if (postData.isLiked) {
      likeBtn.classList.add("liked");
    }

    likeBtn.addEventListener("click", async function () {
      if (isProcessing) return; // Prevent multiple rapid clicks

      isProcessing = true;
      likeBtn.style.pointerEvents = 'none'; // Disable button temporarily

      try {
        // Add visual feedback
        likeBtn.style.transform = 'scale(0.95)';
        setTimeout(() => {
          likeBtn.style.transform = '';
        }, 150);

        // Toggle like status
        const wasLiked = postData.isLiked;
        postData.isLiked = !postData.isLiked;

        // Update like count based on action
        if (postData.isLiked && !wasLiked) {
          postData.likes += 1;
          likeBtn.classList.add("liked");
        } else if (!postData.isLiked && wasLiked) {
          postData.likes = Math.max(0, postData.likes - 1); // Prevent negative likes
          likeBtn.classList.remove("liked");
        }

        // Update timestamp
        postData.lastInteraction = new Date().toISOString();

        // Save updated data
        savePostInteractions(pageKey, postData);

        // Update UI
        likeCount.textContent = postData.likes;

        // Show feedback notification
        const action = postData.isLiked ? "Liked!" : "Unliked!";
        showNotification(action);

      } catch (error) {
        console.error("Error updating like:", error);
        showNotification("Error updating like. Please try again.");
      } finally {
        // Re-enable button after short delay
        setTimeout(() => {
          isProcessing = false;
          likeBtn.style.pointerEvents = '';
        }, 300);
      }
    });
  }

    // Share functionality with analytics
  const shareBtn = document.getElementById("share-btn");
  if (shareBtn) {

    shareBtn.addEventListener("click", async function () {
      if (isSharing) return; // Prevent multiple share attempts

      isSharing = true;
      shareBtn.style.pointerEvents = 'none';

      try {
        // Visual feedback
        shareBtn.style.transform = 'scale(0.95)';
        setTimeout(() => {
          shareBtn.style.transform = '';
        }, 150);

        const url = window.location.href;
        const title = document.title;

        // Track share attempt
        trackShareInteraction(currentPage, 'attempt');

        if (navigator.share) {
          try {
            await navigator.share({
              title: title,
              url: url,
            });
            // Track successful share
            trackShareInteraction(currentPage, 'success');
            showNotification("Shared successfully!");
          } catch (err) {
            if (err.name !== 'AbortError') {
              console.log("Error sharing:", err);
              // Fallback to clipboard
              await fallbackShare(url);
            }
          }
        } else {
          // Direct fallback to clipboard
          await fallbackShare(url);
        }
      } catch (error) {
        console.error("Share error:", error);
        showNotification("Unable to share. Please try again.");
      } finally {
        // Re-enable button
        setTimeout(() => {
          isSharing = false;
          shareBtn.style.pointerEvents = '';
        }, 500);
      }
    });
  }
}

// Helper function to load post interactions data
function loadPostInteractions(pageKey) {
  try {
    const stored = localStorage.getItem(pageKey);
    if (stored) {
      return JSON.parse(stored);
    }

    // Check for legacy data (old format)
    const legacyLikes = localStorage.getItem("blog-likes");
    const legacyLiked = localStorage.getItem("blog-liked");

    if (legacyLikes || legacyLiked) {
      // Migrate legacy data
      const migratedData = {
        likes: parseInt(legacyLikes || "0"),
        isLiked: legacyLiked === "true",
        shares: 0,
        lastInteraction: new Date().toISOString(),
        created: new Date().toISOString(),
        migrated: true
      };

      // Save migrated data
      savePostInteractions(pageKey, migratedData);

      // Clean up legacy data
      localStorage.removeItem("blog-likes");
      localStorage.removeItem("blog-liked");

      return migratedData;
    }
  } catch (error) {
    console.warn("Error loading post interactions:", error);
  }

  // Return default structure
  return {
    likes: 0,
    isLiked: false,
    shares: 0,
    lastInteraction: null,
    created: new Date().toISOString()
  };
}

// Helper function to save post interactions data
function savePostInteractions(pageKey, data) {
  try {
    localStorage.setItem(pageKey, JSON.stringify(data));
  } catch (error) {
    console.warn("Error saving post interactions:", error);
  }
}

// Helper function to track share interactions
function trackShareInteraction(pageKey, action) {
  const shareKey = `share-${pageKey}`;
  let shareData = {
    attempts: 0,
    successes: 0,
    lastAttempt: null
  };

  try {
    const stored = localStorage.getItem(shareKey);
    if (stored) {
      shareData = JSON.parse(stored);
    }
  } catch (error) {
    console.warn("Error loading share data:", error);
  }

  if (action === 'attempt') {
    shareData.attempts += 1;
    shareData.lastAttempt = new Date().toISOString();
  } else if (action === 'success') {
    shareData.successes += 1;
  }

  try {
    localStorage.setItem(shareKey, JSON.stringify(shareData));
  } catch (error) {
    console.warn("Error saving share data:", error);
  }
}

// Helper function for clipboard fallback
async function fallbackShare(url) {
  try {
    await navigator.clipboard.writeText(url);
    showNotification("Link copied to clipboard!");
    // Track successful clipboard copy
    trackShareInteraction(window.location.pathname, 'clipboard');
  } catch (error) {
    console.error("Failed to copy to clipboard:", error);
    showNotification("Unable to share. Please copy the URL manually.");
  }
}

// --- Helper function to get first image from a blog post ---
async function getFirstImageFromPost(slug) {
  try {
    const response = await fetch(slug);
    if (!response.ok) return null;

    const html = await response.text();
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");

    // Find first img element in the blog article
    const firstImg = doc.querySelector(".blog-article img");
    if (firstImg && firstImg.src) {
      // Convert relative URL to absolute path
      return firstImg.src.replace(window.location.origin, "");
    }
  } catch (error) {
    console.warn("Failed to get first image from post:", slug, error);
  }
  return null;
}

document.addEventListener("DOMContentLoaded", function () {
  // --- Dynamic posts loader: loads posts.json and populates index/blog-list ---
  (async function loadPosts() {
    const postsUrl = "/pages/data/posts.json";

    try {
      const r = await fetch(postsUrl);
      if (!r.ok) throw new Error("Failed to fetch posts.json");
      let posts = await r.json();

      // For each post without image, try to get first image from the post
      for (let post of posts) {
        if (!post.image && post.slug && post.slug !== "#") {
          post.image = await getFirstImageFromPost(post.slug);
        }
      }

      // Populate homepage article section if present
      const articlesContainer = document.querySelector(".article-boxes");
      if (articlesContainer) {
        articlesContainer.innerHTML = posts
          .map(
            (p) => `
          <article class="article-box">
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
            <picture class="article-illustration">
              ${
                p.image
                  ? `<img src="${p.image.replace("../", "/")}" alt="${
                      p.title
                    }" loading="lazy" />`
                  : ""
              }
            </picture>
          </article>
        `
          )
          .join("\n");
      }

      // Populate blog-list page if present
      const blogListContainer = document.querySelector(".blog-posts");
      if (blogListContainer) {
        blogListContainer.innerHTML = posts
          .map(
            (p) => `
          <article class="blog-post-card">
            <div class="post-content">
              <h2><a href="${p.slug}">${p.title}</a></h2>
              <p class="post-excerpt">${p.excerpt}</p>
              <div class="post-meta">
                <time datetime="${p.date}">${new Date(
              p.date
            ).toLocaleDateString()}</time>
                <span class="post-category">${p.category}</span>
              </div>
            </div>
            <div class="post-image">
              ${
                p.image
                  ? `<img src="${p.image.replace("../", "/")}" alt="${
                      p.title
                    }" />`
                  : ""
              }
            </div>
          </article>
        `
          )
          .join("\n");
      }
    } catch (err) {
      console.warn("Posts loader:", err);
    }
  })();

  // Comments are now handled by initializeComments() function above
  const commentForm = document.getElementById("comment-form");
  const commentsList = document.getElementById("comments-list");

  if (commentForm && commentsList) {
    // Load existing comments
    const comments = JSON.parse(localStorage.getItem("blog-comments") || "[]");
    comments.forEach((comment) => addCommentToDOM(comment));

    commentForm.addEventListener("submit", function (e) {
      e.preventDefault();

      const nameInput = document.getElementById("comment-name");
      const textInput = document.getElementById("comment-text");

      if (nameInput.value.trim() && textInput.value.trim()) {
        const comment = {
          id: Date.now(),
          name: nameInput.value.trim(),
          text: textInput.value.trim(),
          date: new Date().toLocaleDateString(),
        };

        // Save to localStorage
        comments.push(comment);
        localStorage.setItem("blog-comments", JSON.stringify(comments));

        // Add to DOM
        addCommentToDOM(comment);

        // Clear form
        nameInput.value = "";
        textInput.value = "";
      }
    });
  }

  function addCommentToDOM(comment) {
    const commentEl = document.createElement("div");
    commentEl.className = "comment";
    commentEl.innerHTML = `
      <div class="comment-header">
        <strong>${comment.name}</strong>
        <span class="comment-date">${comment.date}</span>
      </div>
      <p class="comment-text">${comment.text}</p>
    `;
    commentsList.appendChild(commentEl);
  }

  function showNotification(message) {
    const notification = document.createElement("div");
    notification.className = "notification";
    notification.textContent = message;
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: var(--bg-color-secondary);
      color: var(--important);
      padding: 1rem 1.5rem;
      border-radius: 8px;
      box-shadow: var(--shadow);
      border: 1px solid var(--border);
      z-index: 10000;
      font-weight: 500;
      animation: slideIn 0.3s ease-out;
    `;

    document.body.appendChild(notification);

    setTimeout(() => {
      notification.style.animation = 'slideOut 0.3s ease-in forwards';
      setTimeout(() => {
        notification.remove();
      }, 300);
    }, 3000);
  }
});

// Notification helper function
function showNotification(message) {
  const notification = document.createElement("div");
  notification.className = "notification";
  notification.textContent = message;
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: var(--bg-color-secondary);
    color: var(--important);
    padding: 1rem 1.5rem;
    border-radius: 8px;
    box-shadow: var(--shadow);
    border: 1px solid var(--border);
    z-index: 10000;
    font-weight: 500;
    animation: slideIn 0.3s ease-out;
  `;

  document.body.appendChild(notification);

  setTimeout(() => {
    notification.style.animation = 'slideOut 0.3s ease-in forwards';
    setTimeout(() => {
      notification.remove();
    }, 300);
  }, 3000);
}

// Add notification animations to CSS if not already present
if (!document.querySelector('#notification-styles')) {
  const style = document.createElement('style');
  style.id = 'notification-styles';
  style.textContent = `
    @keyframes slideIn {
      from { transform: translateX(100%); opacity: 0; }
      to { transform: translateX(0); opacity: 1; }
    }
    @keyframes slideOut {
      from { transform: translateX(0); opacity: 1; }
      to { transform: translateX(100%); opacity: 0; }
    }
  `;
  document.head.appendChild(style);
}

// Theme Toggle Functionality
function updateFABIcon() {
  const fabIcon = document.querySelector("#theme-toggle .theme-icon");
  if (fabIcon) {
    if (document.body.classList.contains("dark")) {
      fabIcon.textContent = "☀️";
    } else {
      fabIcon.textContent = "🌙";
    }
  }
}

// Initialize theme toggle on page load
document.addEventListener("DOMContentLoaded", function () {
  // Set initial theme based on localStorage or system preference
  const savedTheme = localStorage.getItem("theme");
  if (savedTheme) {
    document.body.classList.add(savedTheme);
    document.body.classList.remove(savedTheme === "dark" ? "light" : "dark");
  } else {
    // Check system preference
    const prefersDark = window.matchMedia(
      "(prefers-color-scheme: dark)"
    ).matches;
    const initialTheme = prefersDark ? "dark" : "light";
    document.body.classList.add(initialTheme);
  }

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

      // Update FAB icon
      updateFABIcon();
    });
  }
});
