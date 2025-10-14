// Blog page specific JavaScript
const nav = document.querySelector(".nav");
const navMenu = document.querySelector(".nav-items");
const btnToggleNav = document.querySelector(".menu-btn");

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

// Theme switching
const theme = localStorage.getItem("theme") || "dark";
document.body.classList.add(theme);

const themeSwitch = document.getElementById("theme-switch");
if (themeSwitch) {
  themeSwitch.checked = theme === "light";

  themeSwitch.addEventListener("change", function () {
    const newTheme = this.checked ? "light" : "dark";
    document.body.classList.remove("dark", "light");
    document.body.classList.add(newTheme);
    localStorage.setItem("theme", newTheme);
  });
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

  // Like/Unlike functionality
  const likeBtn = document.getElementById("like-btn");
  const likeCount = document.getElementById("like-count");

  if (likeBtn && likeCount) {
    let likes = parseInt(localStorage.getItem("blog-likes") || "0");
    let isLiked = localStorage.getItem("blog-liked") === "true";

    likeCount.textContent = likes;
    if (isLiked) {
      likeBtn.classList.add("liked");
    }

    likeBtn.addEventListener("click", function () {
      isLiked = !isLiked;
      likes = isLiked ? likes + 1 : likes - 1;

      likeCount.textContent = likes;
      localStorage.setItem("blog-likes", likes.toString());
      localStorage.setItem("blog-liked", isLiked.toString());

      likeBtn.classList.toggle("liked");
    });
  }

  // Share functionality
  const shareBtn = document.getElementById("share-btn");
  if (shareBtn) {
    shareBtn.addEventListener("click", async function () {
      const url = window.location.href;
      const title = document.title;

      if (navigator.share) {
        try {
          await navigator.share({
            title: title,
            url: url,
          });
        } catch (err) {
          console.log("Error sharing:", err);
        }
      } else {
        // Fallback: copy to clipboard
        navigator.clipboard.writeText(url).then(() => {
          showNotification("Link copied to clipboard!");
        });
      }
    });
  }

  // Comment functionality (simple in-memory comments)
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
    document.body.appendChild(notification);

    setTimeout(() => {
      notification.remove();
    }, 3000);
  }
});
