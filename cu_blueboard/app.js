const policies = {
  honor: `
    <h1 class="policy-title">Honor Code</h1>
    <p class="policy-updated">Last Updated: December 01, 2025</p>
    <section class="policy-section"><h2>Academic Integrity</h2><p>CU BlueBoard is committed to upholding the academic integrity standards of Columbia University and Barnard College. By using this platform, you agree to:</p><ul><li>Not post or request answers to exams, quizzes, or graded assignments</li><li>Not share copyrighted course materials without permission</li><li>Not engage in any form of academic dishonesty</li><li>Report any content that violates academic integrity policies</li></ul></section>
    <section class="policy-section"><h2>Community Standards</h2><p>As a member of the CU BlueBoard community, you agree to:</p><ul><li>Treat all community members with respect and dignity</li><li>Not post hateful, discriminatory, or harassing content</li><li>Not impersonate other students, faculty, or staff</li><li>Use the platform for its intended purpose of constructive Q&amp;A</li></ul></section>
    <section class="policy-section"><h2>Identity Escrow</h2><p>While posts on CU BlueBoard are anonymous to other users, your identity is verified through Columbia/Barnard SSO and may be disclosed to university administrators in cases of:</p><ul><li>Serious violations of the Honor Code</li><li>Threats to campus safety</li><li>Legal requirements</li></ul></section>
    <section class="policy-section"><h2>Consequences</h2><p>Violations of this Honor Code may result in:</p><ul><li>Content removal or redaction</li><li>Temporary or permanent account suspension</li><li>Referral to university disciplinary processes</li></ul></section>`,
  terms: `
    <h1 class="policy-title">Terms of Service</h1>
    <p class="policy-updated">Last Updated: December 01, 2025</p>
    <section class="policy-section"><h2>1. Acceptance of Terms</h2><p>By accessing and using CU BlueBoard, you accept and agree to be bound by these Terms of Service and our Honor Code. If you do not agree to these terms, please do not use this platform.</p></section>
    <section class="policy-section"><h2>2. Eligibility</h2><p>CU BlueBoard is exclusively available to verified Columbia University and Barnard College students, faculty, and staff. Access requires authentication through university SSO credentials.</p></section>
    <section class="policy-section"><h2>3. User Content</h2><p>You retain ownership of content you post. By posting, you grant CU BlueBoard a non-exclusive license to display and distribute your content within the platform. You are solely responsible for content you post and must ensure it complies with our Honor Code.</p></section>
    <section class="policy-section"><h2>4. Privacy</h2><p>Your identity is verified via SSO but displayed anonymously to other users. We collect minimal data necessary to operate the service. Your information may be disclosed to university administrators for policy violations or legal requirements.</p></section>
    <section class="policy-section"><h2>5. Moderation</h2><p>Content is subject to AI pre-screening and human moderation by university staff. We reserve the right to remove, redact, or flag content that violates our policies without prior notice.</p></section>
    <section class="policy-section"><h2>6. Disclaimer</h2><p>CU BlueBoard is provided "as is" without warranties of any kind. We do not guarantee the accuracy, completeness, or reliability of user-generated content. Academic advice should be verified with official university resources.</p></section>
    <section class="policy-section"><h2>7. Contact</h2><p>For questions about these terms or to report violations, please contact the CU BlueBoard moderation team through the platform.</p></section>`
};

const storageKeys = {
  posts: "cu-blueboard-replica-posts",
  overrides: "cu-blueboard-replica-overrides",
  bookmarks: "cu-blueboard-static-bookmarks",
  votes: "cu-blueboard-replica-votes",
  reports: "cu-blueboard-replica-reports"
};

const safeJSON = (key, fallback) => {
  try {
    const value = JSON.parse(localStorage.getItem(key));
    return value ?? fallback;
  } catch {
    return fallback;
  }
};

const escapeHTML = value => String(value ?? "")
  .replaceAll("&", "&amp;")
  .replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;")
  .replaceAll('"', "&quot;")
  .replaceAll("'", "&#039;");

const titleize = value => String(value || "").replaceAll("_", " ").replace(/\b\w/g, letter => letter.toUpperCase());

let exportedData = { posts: [], topics: [], tags: [], stats: {} };
let seededPosts = [];
let localPosts = safeJSON(storageKeys.posts, []);
let overrides = safeJSON(storageKeys.overrides, {});
let bookmarks = new Set(safeJSON(storageKeys.bookmarks, []));
let votes = safeJSON(storageKeys.votes, { posts: {}, answers: {}, comments: {} });
let reports = new Set(safeJSON(storageKeys.reports, []));
let currentRole = null;
let currentView = "all";
let currentPostId = null;

const elements = {
  loginView: document.querySelector("#login-view"),
  policyView: document.querySelector("#policy-view"),
  appView: document.querySelector("#app-view"),
  policyContent: document.querySelector("#policy-content"),
  policyLogo: document.querySelector("#policy-logo"),
  backToLogin: document.querySelector("#back-to-login"),
  ssoLogin: document.querySelector("#sso-login"),
  testUserLogin: document.querySelector("#test-user-login"),
  testModeratorLogin: document.querySelector("#test-moderator-login"),
  appHome: document.querySelector("#app-home"),
  headerFlash: document.querySelector("#header-flash"),
  moderationNav: document.querySelector("#moderation-nav"),
  logout: document.querySelector("#logout-button"),
  boardView: document.querySelector("#board-view"),
  postView: document.querySelector("#post-view"),
  formView: document.querySelector("#form-view"),
  moderationView: document.querySelector("#moderation-view"),
  statsView: document.querySelector("#stats-view"),
  posts: document.querySelector("#posts"),
  empty: document.querySelector("#empty-state"),
  searchForm: document.querySelector("#search-form"),
  search: document.querySelector("#search-field"),
  filterToggle: document.querySelector("#filter-toggle"),
  filterPanel: document.querySelector("#filter-panel"),
  filterCount: document.querySelector("#filter-count"),
  topic: document.querySelector("#topic-filter"),
  status: document.querySelector("#status-filter"),
  school: document.querySelector("#school-filter"),
  course: document.querySelector("#course-filter"),
  timeframe: document.querySelector("#timeframe-filter"),
  tagFilters: document.querySelector("#tag-filters"),
  apply: document.querySelector("#apply-filters"),
  reset: document.querySelector("#reset-filters"),
  resultCount: document.querySelector("#result-count"),
  viewTitle: document.querySelector("#view-title"),
  viewSubtitle: document.querySelector("#view-subtitle"),
  listHeading: document.querySelector("#list-heading"),
  createButton: document.querySelector("#create-post"),
  toast: document.querySelector("#toast")
};

const currentUserId = () => currentRole === "moderator" ? 15 : 14;
const currentUserEmail = () => currentRole === "moderator" ? "testmoderator@columbia.edu" : "testuser@columbia.edu";
const allPosts = () => [...localPosts, ...seededPosts];
const findPost = id => allPosts().find(post => String(post.id) === String(id));

const persist = () => {
  localStorage.setItem(storageKeys.posts, JSON.stringify(localPosts));
  localStorage.setItem(storageKeys.overrides, JSON.stringify(overrides));
  localStorage.setItem(storageKeys.bookmarks, JSON.stringify([...bookmarks]));
  localStorage.setItem(storageKeys.votes, JSON.stringify(votes));
  localStorage.setItem(storageKeys.reports, JSON.stringify([...reports]));
};

const persistPost = post => {
  if (String(post.id).startsWith("local-")) {
    const index = localPosts.findIndex(item => String(item.id) === String(post.id));
    if (index >= 0) localPosts[index] = post;
  } else {
    overrides[String(post.id)] = post;
  }
  persist();
};

const timeAgo = iso => {
  if (!iso) return "just now";
  const seconds = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 1000));
  if (seconds < 60) return "less than a minute ago";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} ${minutes === 1 ? "minute" : "minutes"} ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return hours === 1 ? "about 1 hour ago" : `about ${hours} hours ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} ${days === 1 ? "day" : "days"} ago`;
  const months = Math.floor(days / 30);
  return `${months} ${months === 1 ? "month" : "months"} ago`;
};

const displayAuthor = (entity, post) => {
  if (entity.author_id === currentUserId() || entity.mine) return entity.show_real_identity ? currentUserEmail() : "You";
  if (entity.show_real_identity) return entity.author_email || entity.author;
  return entity.author || post.author || "Anonymous Student";
};

const selectedTags = () => [...elements.tagFilters.querySelectorAll("input:checked")].map(input => input.value);
const tagMatchMode = () => document.querySelector('input[name="tag-match"]:checked')?.value || "all";

const activeFilterCount = () => [
  elements.topic.value,
  elements.status.value,
  elements.school.value,
  elements.course.value.trim(),
  elements.timeframe.value,
  ...selectedTags()
].filter(Boolean).length;

const updateFilterBadge = () => {
  const count = activeFilterCount();
  elements.filterCount.textContent = String(count);
  elements.filterCount.hidden = count === 0;
};

const filtersMatch = post => {
  const query = elements.search.value.trim().toLowerCase();
  const searchText = [post.title, post.body, post.topic, post.school, post.course, ...(post.tags || [])].join(" ").toLowerCase();
  const tags = selectedTags();
  const tagMatch = tagMatchMode() === "any" ? tags.some(tag => post.tags.includes(tag)) : tags.every(tag => post.tags.includes(tag));
  let timeframeMatch = true;
  if (elements.timeframe.value && post.created_at) {
    const age = Date.now() - new Date(post.created_at).getTime();
    const limits = { "24h": 86400000, "7d": 604800000, "30d": 2592000000 };
    timeframeMatch = age <= limits[elements.timeframe.value];
  }
  return (!query || searchText.includes(query))
    && (!elements.topic.value || post.topic === elements.topic.value)
    && (!elements.status.value || post.status === elements.status.value)
    && (!elements.school.value || post.school === elements.school.value)
    && (!elements.course.value.trim() || String(post.course || "").toLowerCase().includes(elements.course.value.trim().toLowerCase()))
    && (tags.length === 0 || tagMatch)
    && timeframeMatch;
};

const visiblePosts = () => allPosts().filter(post => {
  if (currentRole !== "moderator" && post.ai_flagged) return false;
  if (post.expires_at && new Date(post.expires_at) < new Date()) return false;
  if (currentView === "bookmarks" && !bookmarks.has(String(post.id))) return false;
  if (currentView === "mine" && !(post.mine || post.author_id === currentUserId())) return false;
  return filtersMatch(post);
});

const tagMarkup = tags => (tags || []).map(tag => `<span class="tag-chip readonly">${escapeHTML(tag)}</span>`).join("");

const postMarkup = post => {
  const bookmarked = bookmarks.has(String(post.id));
  return `<div class="post-card-wrapper">
    <button class="post-card" type="button" data-post-id="${escapeHTML(post.id)}">
      <span class="post-card-content">
        <span class="post-card-header"><h3 class="post-card-title">${escapeHTML(post.title)}</h3><span class="status-pill">${escapeHTML(titleize(post.status))}</span></span>
        <span class="post-meta"><span class="topic">${escapeHTML(post.topic)}</span><span>By: ${escapeHTML(displayAuthor(post, post))}</span><span>${escapeHTML(timeAgo(post.created_at))}</span></span>
        ${(post.school || post.course) ? `<span class="post-context">${post.school ? `<span class="meta-chip">School: ${escapeHTML(post.school)}</span>` : ""}${post.course ? `<span class="meta-chip">Course: ${escapeHTML(post.course)}</span>` : ""}</span>` : ""}
        <span class="post-tags">${tagMarkup(post.tags)}</span>
      </span>
    </button>
    <button class="bookmark-button ${bookmarked ? "bookmarked" : ""}" type="button" data-bookmark-id="${escapeHTML(post.id)}" aria-label="${bookmarked ? "Remove bookmark" : "Bookmark post"}">${bookmarked ? "★" : "☆"}</button>
  </div>`;
};

const renderPosts = () => {
  const posts = visiblePosts();
  elements.posts.innerHTML = posts.map(postMarkup).join("");
  elements.empty.hidden = posts.length !== 0;
  const messages = {
    all: "No posts match your filters. Try adjusting your search.",
    bookmarks: "You have not bookmarked any posts yet. Browse posts and click the star to bookmark them!",
    mine: "You have not created any threads yet. Create a post to get started!"
  };
  elements.empty.innerHTML = `<p>${messages[currentView]}</p>`;
  elements.resultCount.textContent = `${posts.length} ${posts.length === 1 ? "thread" : "threads"}`;
  updateFilterBadge();
};

const hideContentViews = () => {
  [elements.boardView, elements.postView, elements.formView, elements.moderationView, elements.statsView].forEach(view => { view.hidden = true; });
};

const setView = view => {
  currentView = view;
  currentPostId = null;
  hideContentViews();
  elements.boardView.hidden = false;
  const headings = {
    bookmarks: ["Bookmarked Posts", "Posts you have bookmarked are shown here."],
    mine: ["My Threads", "Only threads you created are shown here."]
  };
  elements.listHeading.hidden = view === "all";
  if (headings[view]) {
    elements.viewTitle.textContent = headings[view][0];
    elements.viewSubtitle.textContent = headings[view][1];
  }
  document.querySelectorAll("[data-view]").forEach(button => button.classList.toggle("active", button.dataset.view === view));
  elements.moderationNav.classList.remove("active");
  renderPosts();
  window.scrollTo({ top: 0, behavior: "instant" });
};

const showToast = message => {
  elements.toast.textContent = message;
  elements.toast.classList.add("show");
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => elements.toast.classList.remove("show"), 2400);
};

const showLogin = () => {
  currentRole = null;
  elements.loginView.hidden = false;
  elements.policyView.hidden = true;
  elements.appView.hidden = true;
  elements.headerFlash.hidden = true;
  document.body.classList.add("login-mode");
  window.scrollTo({ top: 0, behavior: "instant" });
};

const showPolicy = name => {
  if (!policies[name]) return;
  elements.policyContent.innerHTML = policies[name];
  elements.loginView.hidden = true;
  elements.policyView.hidden = false;
  elements.appView.hidden = true;
  document.body.classList.add("login-mode");
  window.scrollTo({ top: 0, behavior: "instant" });
};

const login = role => {
  currentRole = role;
  elements.loginView.hidden = true;
  elements.policyView.hidden = true;
  elements.appView.hidden = false;
  elements.moderationNav.hidden = role !== "moderator";
  document.body.classList.remove("login-mode");
  setView("all");
  elements.headerFlash.textContent = role === "moderator" ? "Signed in as Test Moderator" : "Signed in as Test User (Student)";
  elements.headerFlash.hidden = false;
  clearTimeout(login.flashTimer);
  login.flashTimer = setTimeout(() => { elements.headerFlash.hidden = true; }, 3000);
};

const scoreFor = (kind, entity) => Number(entity.score || 0) + Number(votes[kind][String(entity.id)] || 0);

const chipMarkup = post => {
  const statusClass = post.status === "solved" ? "chip-solved" : post.status === "locked" ? "chip-locked" : "chip-open";
  return `<div class="post-chips-line">
    <span class="chip chip-topic">${escapeHTML(post.topic)}</span>
    <span class="chip ${statusClass}">${escapeHTML(titleize(post.status))}<span class="status-help-icon" title="Solved: Author accepted answer. Locked: Moderator closed thread.">ⓘ</span></span>
    ${post.school ? `<span class="chip chip-school">${escapeHTML(post.school)}</span>` : ""}
    ${post.course ? `<span class="chip chip-course">${escapeHTML(post.course)}</span>` : ""}
    ${(post.tags || []).map(tag => `<span class="chip chip-tag">${escapeHTML(tag)}</span>`).join("")}
  </div>`;
};

const bodyMarkup = post => {
  if (post.redaction_state === "redacted" || post.redaction_state === "partial") {
    if (currentRole === "moderator") {
      return `<div class="moderator-panel alert-info"><h4>Moderator View</h4><p><strong>Redaction State:</strong> ${escapeHTML(titleize(post.redaction_state))}</p><p><strong>Reason:</strong> ${escapeHTML(titleize(post.redacted_reason || "policy violation"))}</p><p><strong>Redacted by:</strong> ${escapeHTML(post.redacted_by || "moderator@columbia.edu")}</p><button class="form-submit-button compact" type="button" data-mod-post-action="restore">Restore Post</button></div><div class="post-body">${escapeHTML(post.redacted_body || post.body)}</div>`;
    }
    return `<div class="alert alert-danger redacted-content-notice"><h4>Content Moderated</h4><p>This content has been moderated and is not visible.</p></div>`;
  }
  if (post.ai_flagged && currentRole === "moderator") {
    return `<div class="ai-flagged-content-wrapper"><div class="blurred-content blurred" data-flagged-content><div class="post-body">${escapeHTML(post.body)}</div></div><div class="view-content-overlay" data-flagged-overlay><p>AI-Flagged Content (Moderator View)</p><button type="button" class="btn-view-content" data-reveal-flagged>View the Post</button></div></div>`;
  }
  return `<div class="post-body">${escapeHTML(post.body)}</div>`;
};

const aiWarningMarkup = post => {
  if (!post.ai_flagged || currentRole !== "moderator") return "";
  const categories = Object.entries(post.ai_categories || {}).filter(([, value]) => value).map(([key]) => titleize(key));
  return `<div class="ai-flagged-container"><div><h4>Flagged for: ${escapeHTML(categories.join(", ") || "Review")}</h4><p>This post was automatically flagged by our content screening system.</p></div><div class="actions-inline-box"><h5>MODERATOR ACTIONS</h5><button type="button" class="btn-approve-inline" data-mod-post-action="approve">Clear AI Flag</button><button type="button" class="btn-redact-inline" data-mod-post-action="redact">Redact Post</button></div></div>`;
};

const commentMarkup = (comment, post, answer) => `<div class="answer-comment" data-comment-id="${escapeHTML(comment.id)}"><div class="answer-comment-header"><span class="comment-author">${escapeHTML(displayAuthor(comment, post))}</span><span class="comment-time">${escapeHTML(timeAgo(comment.created_at))}</span><div class="vote-controls-micro"><button type="button" data-comment-vote="1" data-answer-id="${escapeHTML(answer.id)}" data-comment-id="${escapeHTML(comment.id)}">▲</button><span>${scoreFor("comments", comment)}</span><button type="button" data-comment-vote="-1" data-answer-id="${escapeHTML(answer.id)}" data-comment-id="${escapeHTML(comment.id)}">▼</button></div></div><p>${escapeHTML(comment.body)}</p></div>`;

const answerMarkup = (answer, post) => {
  const accepted = Boolean(answer.accepted || String(post.accepted_answer_id) === String(answer.id));
  let answerBody = `<div class="comment-body">${escapeHTML(answer.body)}</div>`;
  if ((answer.redaction_state === "redacted" || answer.redaction_state === "partial") && currentRole !== "moderator" && answer.author_id !== currentUserId()) {
    answerBody = `<div class="comment-body alert alert-info"><p>This answer is currently under review for content policy violations.</p></div>`;
  }
  return `<div class="comment-card ${accepted ? "accepted-answer" : ""}" data-answer-id="${escapeHTML(answer.id)}">
    <div class="answer-card-with-vote"><div class="answer-vote-section"><button class="btn-vote-compact" type="button" data-answer-vote="1" data-answer-id="${escapeHTML(answer.id)}">▲</button><div class="vote-score-compact">${scoreFor("answers", answer)}</div><button class="btn-vote-compact" type="button" data-answer-vote="-1" data-answer-id="${escapeHTML(answer.id)}">▼</button></div>
    <div class="answer-content-section"><div class="comment-meta"><strong>${escapeHTML(displayAuthor(answer, post))}</strong><span>${escapeHTML(timeAgo(answer.created_at))}</span>${accepted ? '<span class="identity-badge">Accepted answer</span>' : ""}</div>${answerBody}<div class="comment-actions">${post.mine && !post.locked ? `<button type="button" data-accept-answer="${escapeHTML(answer.id)}">Accept Answer</button>` : ""}${currentRole === "moderator" && answer.redaction_state === "visible" ? `<button type="button" class="btn-redact-elegant" data-redact-answer="${escapeHTML(answer.id)}">Redact Answer</button>` : ""}</div></div></div>
    ${(answer.comments || []).length ? `<div class="answer-comments">${answer.comments.map(comment => commentMarkup(comment, post, answer)).join("")}</div>` : ""}
    <div class="answer-comment-toggle"><button type="button" class="btn-comment-toggle" data-reply-toggle="${escapeHTML(answer.id)}">Reply</button></div>
    <form class="answer-comment-form comment-form" data-comment-form="${escapeHTML(answer.id)}" hidden><label>Add a comment<textarea class="form-textarea" name="body" rows="2" placeholder="Add a clarifying comment..." required></textarea></label><div class="form-actions"><button class="form-secondary-button" type="submit">Comment</button></div></form>
  </div>`;
};

const renderPostDetail = post => {
  currentPostId = String(post.id);
  const bookmarked = bookmarks.has(String(post.id));
  const isMine = Boolean(post.mine || post.author_id === currentUserId());
  post.mine = isMine;
  const author = displayAuthor(post, post);
  elements.postView.innerHTML = `<div class="replica-page post-detail-page">
    <h2 class="page-title">${escapeHTML(post.title)}</h2>
    <div class="post-meta-line"><div class="post-meta-info"><span class="post-author"><strong>${escapeHTML(author)}</strong>${isMine && !post.show_real_identity ? '<span class="anonymous-badge">(anonymous)</span>' : ""}</span><span class="meta-separator">·</span><span>${escapeHTML(timeAgo(post.created_at))}</span></div>${isMine ? `<button type="button" class="btn-identity-toggle" data-toggle-identity>${post.show_real_identity ? "Hide Identity" : "Reveal Identity"}</button>` : ""}</div>
    ${chipMarkup(post)}
    ${post.locked ? `<p class="identity-badge lock-note">Thread locked after accepting an answer.</p>${isMine ? '<button class="form-submit-button compact" type="button" data-reopen-thread>Reopen Thread</button>' : ""}` : ""}
    ${aiWarningMarkup(post)}
    ${bodyMarkup(post)}
    <div class="post-actions-two-row"><div class="post-actions-row-top"><div class="vote-controls-inline"><button type="button" class="btn-vote-inline" data-post-vote="1">▲</button><span class="vote-score-inline">${scoreFor("posts", post)}</span><button type="button" class="btn-vote-inline" data-post-vote="-1">▼</button></div><button type="button" class="btn-bookmark-inline ${bookmarked ? "bookmarked" : ""}" data-detail-bookmark>${bookmarked ? "★ Bookmarked" : "☆ Bookmark"}</button></div>
    <div class="post-actions-row-bottom">${isMine ? '<button class="btn-action-sm btn-edit" type="button" data-edit-post>Edit</button><button class="btn-action-sm btn-delete" type="button" data-delete-post>Delete</button>' : reports.has(String(post.id)) ? '<button class="btn-action-sm btn-flag active" type="button" data-remove-report>Remove My Report</button>' : '<div class="report-dropdown"><button class="btn-action-sm btn-flag" type="button" data-report-toggle>⚑ Report</button><div class="report-menu" hidden><p>Why are you reporting?</p><button type="button" data-report-reason="inappropriate">⚠ Inappropriate</button><button type="button" data-report-reason="harassment">☹ Harassment</button><button type="button" data-report-reason="spam">⌫ Spam</button><button type="button" data-report-reason="misinformation">ⓘ Misinformation</button><button type="button" data-report-reason="other">••• Other</button></div></div>'}${currentRole === "moderator" && post.redaction_state === "visible" && !post.ai_flagged ? '<button class="btn-redact-elegant" type="button" data-mod-post-action="redact">Redact Post</button>' : ""}</div></div>
    <hr class="section-divider">
    ${post.locked ? '<p class="identity-badge lock-note">This thread is locked. No new answers can be added.</p>' : `<h3 class="comments-title">Share Your Answer</h3><form id="answer-form"><label class="form-label">Answer Content<textarea class="form-textarea" name="body" rows="4" placeholder="Share your guidance..." required></textarea></label><div class="form-actions"><button class="form-submit-button" type="submit">Submit Answer</button></div></form>`}
    <hr class="section-divider"><h3 class="comments-title">Answers (${(post.answers || []).length})</h3><div class="comments-list-container">${(post.answers || []).map(answer => answerMarkup(answer, post)).join("") || '<div class="empty-state"><p>No answers yet.</p></div>'}</div>
  </div>`;
};

const showPost = id => {
  const post = findPost(id);
  if (!post) return;
  if (currentRole !== "moderator" && post.ai_flagged) {
    showToast("This post is not available.");
    setView("all");
    return;
  }
  hideContentViews();
  elements.postView.hidden = false;
  document.querySelectorAll("[data-view]").forEach(button => button.classList.remove("active"));
  elements.moderationNav.classList.remove("active");
  renderPostDetail(post);
  window.scrollTo({ top: 0, behavior: "instant" });
};

const formTagMarkup = selected => exportedData.tags.map(tag => `<label class="form-tag-chip"><input type="checkbox" name="tags" value="${escapeHTML(tag)}" ${selected.includes(tag) ? "checked" : ""}><span>${escapeHTML(tag)}</span></label>`).join("");

const showPostForm = post => {
  hideContentViews();
  elements.formView.hidden = false;
  const editing = Boolean(post);
  const value = post || { title: "", body: "", topic: "", tags: [], school: "", course: "", expires_at: "", status: "open" };
  elements.formView.innerHTML = `<div class="replica-page new-post-page"><h2 class="page-title">${editing ? "Edit Post" : "New Post"}</h2><form id="replica-post-form" data-edit-id="${editing ? escapeHTML(post.id) : ""}">
    <label class="form-field"><span class="form-label">Title <b>*</b></span><input class="form-input" name="title" value="${escapeHTML(value.title)}" placeholder="Enter your question title..." required></label>
    <label class="form-field"><span class="form-label">Content <b>*</b></span><textarea class="form-textarea" name="body" placeholder="Add your details here..." required>${escapeHTML(value.body)}</textarea></label>
    <label class="form-field"><span class="form-label">Topic <b>*</b></span><select class="form-input" name="topic" required><option value="">Select a topic</option>${exportedData.topics.map(topic => `<option ${value.topic === topic ? "selected" : ""}>${escapeHTML(topic)}</option>`).join("")}</select></label>
    <div class="form-field"><span class="form-label">Tags <b>*</b></span><div class="form-tag-picker">${formTagMarkup(value.tags || [])}</div><small>Choose between 1 and 5 tags.</small></div>
    <label class="form-field"><span class="form-label">School <b>*</b></span><select class="form-input" name="school" required><option value="">Select a school</option>${["Columbia", "Barnard", "General"].map(school => `<option ${value.school === school ? "selected" : ""}>${school}</option>`).join("")}</select></label>
    <label class="form-field"><span class="form-label">Course</span><input class="form-input" name="course" value="${escapeHTML(value.course || "")}" placeholder="e.g., COMS W4152"></label>
    <label class="form-field"><span class="form-label">Make this post disappear after:</span><select class="form-input" name="expiry"><option value="">No expiry (default)</option><option value="7">7 days</option><option value="14">14 days</option><option value="30">30 days</option></select><small>Optional: choose an expiration window between 7 and 30 days.</small></label>
    <div class="form-field read-only-field"><span class="form-label">Thread status</span><span class="status-pill">${escapeHTML(titleize(value.status || "open"))}</span></div>
    <div class="form-actions"><button class="form-submit-button" type="submit">${editing ? "Save Changes" : "Submit Post"}</button><button class="form-cancel-button" type="button" data-cancel-form>Cancel</button></div>
  </form></div>`;
  window.scrollTo({ top: 0, behavior: "instant" });
};

const moderationMeta = post => `<span>Author: ${escapeHTML(post.author)} (${escapeHTML(post.author_email)})</span><span>Topic: ${escapeHTML(post.topic)}</span>`;

const renderModeration = () => {
  const posts = allPosts();
  const flagged = posts.filter(post => post.ai_flagged && post.redaction_state === "visible");
  const reportedPosts = posts.filter(post => Number(post.reports_count || 0) > 0 || reports.has(String(post.id)));
  const redacted = posts.filter(post => post.redaction_state !== "visible");
  const flaggedCards = flagged.map(post => {
    const categories = Object.entries(post.ai_scores || {}).filter(([, value]) => Number(value) > 0.1).map(([key, value]) => `<span class="category-badge">${escapeHTML(titleize(key))} (${Math.round(Number(value) * 100)}%)</span>`).join("");
    return `<article class="mod-queue-card ai"><div class="mod-card-heading"><h3>${escapeHTML(post.title)}</h3><div><span class="mod-badge ai">AI FLAGGED</span>${post.appeal_requested ? '<span class="mod-badge appeal">APPEAL REQUESTED</span>' : ""}</div></div><div class="mod-meta">${moderationMeta(post)}<span>Flagged: ${escapeHTML(timeAgo(post.updated_at))}</span></div><div>${categories}</div><div class="mod-actions"><button data-mod-review="${escapeHTML(post.id)}">Review Post</button><button class="danger" data-mod-redact="${escapeHTML(post.id)}">Redact</button><button class="success" data-mod-approve="${escapeHTML(post.id)}">Approve</button></div></article>`;
  }).join("");
  const reportedCards = reportedPosts.map(post => `<article class="mod-queue-card reported"><div class="mod-card-heading"><h3>${escapeHTML(post.title)}</h3><span class="mod-badge reported">${Math.max(Number(post.reports_count || 0), reports.has(String(post.id)) ? 1 : 0)} REPORT(S)</span></div><div class="mod-meta">${moderationMeta(post)}</div><div class="mod-actions"><button data-mod-review="${escapeHTML(post.id)}">Review Post</button><button class="success" data-mod-dismiss="${escapeHTML(post.id)}">Dismiss Reports</button></div></article>`).join("");
  const redactedCards = redacted.map(post => `<article class="mod-queue-card redacted"><div class="mod-card-heading"><h3>${escapeHTML(post.title)}</h3><span class="mod-badge redacted">REDACTED</span></div><div class="mod-meta">${moderationMeta(post)}<span>Redacted by: ${escapeHTML(post.redacted_by || "moderator@columbia.edu")}</span><span>Reason: ${escapeHTML(titleize(post.redacted_reason || "policy violation"))}</span></div><div class="mod-actions"><button data-mod-review="${escapeHTML(post.id)}">View Post</button><button class="secondary" data-mod-details="${escapeHTML(post.id)}">Details</button><button class="success" data-mod-restore="${escapeHTML(post.id)}">Restore</button></div></article>`).join("");
  elements.moderationView.innerHTML = `<div class="replica-page moderation-page"><h2 class="page-title">Moderation Dashboard</h2><p class="post-list-subtitle">Manage redacted and flagged content</p><button class="stats-dashboard-button" type="button" data-show-stats>⌁ View Statistics Dashboard</button><hr class="section-divider">
    <section class="moderation-section"><h3>AI-Flagged Posts (${flagged.length})</h3><p>Posts automatically flagged by OpenAI Moderation API awaiting human review</p>${flaggedCards || '<div class="empty-state"><p>No AI-flagged posts pending.</p></div>'}</section><hr class="section-divider">
    <section class="moderation-section"><h3>User-Reported Posts (${reportedPosts.length})</h3><p>Posts flagged by users for review. <strong>${reportedPosts.filter(post => Number(post.reports_count || 0) >= 3).length}</strong> need urgent review (3+ reports).</p>${reportedCards || '<div class="empty-state"><p>No user reports pending.</p></div>'}</section><hr class="section-divider">
    <section class="moderation-section"><h3>Redacted Posts (${redacted.length})</h3>${redactedCards || '<div class="empty-state"><p>No redacted posts.</p></div>'}</section></div>`;
};

const showModeration = () => {
  if (currentRole !== "moderator") return;
  hideContentViews();
  elements.moderationView.hidden = false;
  elements.moderationNav.classList.add("active");
  document.querySelectorAll("[data-view]").forEach(button => button.classList.remove("active"));
  renderModeration();
  window.scrollTo({ top: 0, behavior: "instant" });
};

const showModerationDetails = post => {
  hideContentViews();
  elements.moderationView.hidden = false;
  const date = post.created_at ? new Date(post.created_at).toLocaleString("en-US", { dateStyle: "long", timeStyle: "short" }) : "Unknown";
  elements.moderationView.innerHTML = `<div class="replica-page moderation-details"><h2 class="page-title">Moderation Details: ${escapeHTML(post.title)}</h2><button class="form-secondary-button" type="button" data-mod-back>← Back to Dashboard</button><hr class="section-divider"><div class="moderator-panel"><h3>Post Information</h3><p><strong>Author:</strong> ${escapeHTML(post.author_email)}</p><p><strong>Created:</strong> ${escapeHTML(date)}</p><p><strong>Status:</strong> ${escapeHTML(titleize(post.status))}</p><p><strong>Redaction State:</strong> ${escapeHTML(titleize(post.redaction_state))}</p>${post.redacted_by ? `<p><strong>Redacted By:</strong> ${escapeHTML(post.redacted_by)}</p><p><strong>Redaction Reason:</strong> ${escapeHTML(titleize(post.redacted_reason))}</p>` : ""}<div class="moderator-actions-horizontal"><button class="mod-btn mod-btn-review" data-mod-review="${escapeHTML(post.id)}">View Public Page</button><button class="mod-btn ${post.redaction_state === "visible" ? "mod-btn-redact" : "mod-btn-approve"}" ${post.redaction_state === "visible" ? `data-mod-redact="${escapeHTML(post.id)}"` : `data-mod-restore="${escapeHTML(post.id)}"`}>${post.redaction_state === "visible" ? "Redact Post" : "Restore Post"}</button></div></div><hr class="section-divider"><h3>Content</h3><div class="moderation-content">${escapeHTML(post.redacted_body || post.body)}</div><hr class="section-divider"><h3>Audit Trail</h3><div class="empty-state"><p>No audit logs for this post in the static preview.</p></div></div>`;
};

const showStats = () => {
  hideContentViews();
  elements.statsView.hidden = false;
  const posts = allPosts();
  const totalAnswers = posts.reduce((sum, post) => sum + (post.answers || []).length, 0);
  const responseRate = posts.length ? ((posts.filter(post => (post.answers || []).length).length / posts.length) * 100).toFixed(1) : "0.0";
  const resolutionRate = posts.length ? ((posts.filter(post => post.status === "solved").length / posts.length) * 100).toFixed(1) : "0.0";
  const stats = [
    [posts.length, "Total Posts", ""], [totalAnswers, "Total Answers", ""], [exportedData.stats.total_users || 15, "Total Users", ""], [responseRate + "%", "Response Rate", ""], [resolutionRate + "%", "Resolution Rate", ""],
    [posts.filter(post => post.redaction_state !== "visible").length, "Redacted Posts", "warning"], [posts.filter(post => post.ai_flagged).length, "AI Flagged", "danger"], [posts.filter(post => post.reported || reports.has(String(post.id))).length, "User Reported", "info"]
  ];
  const topicCounts = exportedData.topics.map(topic => posts.filter(post => post.topic === topic).length);
  elements.statsView.innerHTML = `<div class="replica-page stats-page"><h2 class="page-title">Statistics Dashboard</h2><p class="post-list-subtitle">Platform activity and moderation metrics</p><hr class="section-divider"><div class="stats-grid">${stats.map(([value, label, type]) => `<article class="stat-card ${type ? `stat-card-${type}` : ""}"><strong>${value}</strong><span>${label}</span></article>`).join("")}</div><hr class="section-divider"><div class="charts-grid"><section class="chart-container"><h3>Daily Post Activity (Last 30 Days)</h3><svg class="line-chart" viewBox="0 0 600 300" role="img" aria-label="Daily posts line chart"><g class="chart-grid-lines"><path d="M45 20V260H580 M45 200H580 M45 140H580 M45 80H580 M45 20H580"/></g><path class="chart-area" d="M45 240 C110 238 155 245 190 238 S220 150 255 235 S330 205 365 205 S400 245 435 175 S475 242 520 205 S555 155 580 145 L580 260 L45 260Z"/><path class="chart-line" d="M45 240 C110 238 155 245 190 238 S220 150 255 235 S330 205 365 205 S400 245 435 175 S475 242 520 205 S555 155 580 145"/></svg></section><section class="chart-container"><h3>Posts by Topic</h3><div class="donut-chart" aria-label="Posts by topic"></div><div class="chart-legend">${exportedData.topics.map((topic, index) => `<span><i style="--legend:${["#3578e5", "#56a851", "#f2bd3d", "#ca4249", "#3d94a8", "#6743ad"][index]}"></i>${escapeHTML(topic)} (${topicCounts[index]})</span>`).join("")}</div></section></div><hr class="section-divider"><h3 class="comments-title">Quick Actions</h3><div class="quick-links-grid"><button class="quick-action-btn primary" type="button" data-stats-moderation>▣ <span>Moderation Queue</span> →</button><button class="quick-action-btn secondary" type="button" data-stats-posts>▤ <span>All Posts</span> →</button></div></div>`;
  window.scrollTo({ top: 0, behavior: "instant" });
};

const setVote = (kind, id, direction) => {
  const key = String(id);
  votes[kind][key] = votes[kind][key] === direction ? 0 : direction;
  persist();
};

document.querySelectorAll("[data-policy]").forEach(button => button.addEventListener("click", () => showPolicy(button.dataset.policy)));
elements.policyLogo.addEventListener("click", showLogin);
elements.backToLogin.addEventListener("click", showLogin);
elements.testUserLogin.addEventListener("click", () => login("user"));
elements.testModeratorLogin.addEventListener("click", () => login("moderator"));
elements.ssoLogin.addEventListener("click", () => { login("user"); showToast("University SSO is simulated on this static site"); });
elements.logout.addEventListener("click", showLogin);
elements.appHome.addEventListener("click", () => setView("all"));
elements.moderationNav.addEventListener("click", showModeration);
elements.createButton.addEventListener("click", () => showPostForm());

document.querySelectorAll("[data-view]").forEach(button => button.addEventListener("click", () => setView(button.dataset.view)));

elements.searchForm.addEventListener("submit", event => { event.preventDefault(); renderPosts(); });
elements.search.addEventListener("input", renderPosts);
elements.filterToggle.addEventListener("click", () => {
  const isOpen = !elements.filterPanel.hidden;
  elements.filterPanel.hidden = isOpen;
  elements.filterToggle.classList.toggle("open", !isOpen);
  elements.filterToggle.setAttribute("aria-expanded", String(!isOpen));
});
elements.apply.addEventListener("click", renderPosts);
elements.reset.addEventListener("click", () => {
  [elements.topic, elements.status, elements.school, elements.timeframe].forEach(select => { select.value = ""; });
  elements.course.value = "";
  elements.search.value = "";
  elements.tagFilters.querySelectorAll("input").forEach(input => { input.checked = false; });
  const allRadio = document.querySelector('input[name="tag-match"][value="all"]');
  if (allRadio) allRadio.checked = true;
  renderPosts();
});

elements.posts.addEventListener("click", event => {
  const bookmark = event.target.closest("[data-bookmark-id]");
  if (bookmark) {
    const id = String(bookmark.dataset.bookmarkId);
    bookmarks.has(id) ? bookmarks.delete(id) : bookmarks.add(id);
    persist();
    renderPosts();
    showToast(bookmarks.has(id) ? "Post bookmarked." : "Bookmark removed.");
    return;
  }
  const card = event.target.closest("[data-post-id]");
  if (card) showPost(card.dataset.postId);
});

elements.postView.addEventListener("click", event => {
  const post = findPost(currentPostId);
  if (!post) return;
  const postVote = event.target.closest("[data-post-vote]");
  if (postVote) { setVote("posts", post.id, Number(postVote.dataset.postVote)); renderPostDetail(post); return; }
  if (event.target.closest("[data-detail-bookmark]")) { const id = String(post.id); bookmarks.has(id) ? bookmarks.delete(id) : bookmarks.add(id); persist(); renderPostDetail(post); showToast(bookmarks.has(id) ? "Post bookmarked." : "Bookmark removed."); return; }
  const answerVote = event.target.closest("[data-answer-vote]");
  if (answerVote) { setVote("answers", answerVote.dataset.answerId, Number(answerVote.dataset.answerVote)); renderPostDetail(post); return; }
  const commentVote = event.target.closest("[data-comment-vote]");
  if (commentVote) { setVote("comments", commentVote.dataset.commentId, Number(commentVote.dataset.commentVote)); renderPostDetail(post); return; }
  const reply = event.target.closest("[data-reply-toggle]");
  if (reply) { const form = elements.postView.querySelector(`[data-comment-form="${CSS.escape(reply.dataset.replyToggle)}"]`); if (form) form.hidden = !form.hidden; return; }
  if (event.target.closest("[data-report-toggle]")) { const menu = elements.postView.querySelector(".report-menu"); if (menu) menu.hidden = !menu.hidden; return; }
  const reportReason = event.target.closest("[data-report-reason]");
  if (reportReason) { reports.add(String(post.id)); post.reported = true; post.reports_count = Math.max(1, Number(post.reports_count || 0)); persistPost(post); renderPostDetail(post); showToast("Content reported to moderators."); return; }
  if (event.target.closest("[data-remove-report]")) { reports.delete(String(post.id)); persist(); renderPostDetail(post); showToast("Your report has been removed."); return; }
  if (event.target.closest("[data-toggle-identity]")) { post.show_real_identity = !post.show_real_identity; persistPost(post); renderPostDetail(post); showToast(post.show_real_identity ? "Your identity is now visible on this thread." : "Your identity is now hidden on this thread."); return; }
  if (event.target.closest("[data-edit-post]")) { showPostForm(post); return; }
  if (event.target.closest("[data-delete-post]")) { if (window.confirm("Are you sure you want to delete this post?")) { localPosts = localPosts.filter(item => String(item.id) !== String(post.id)); persist(); setView("all"); showToast("Post deleted."); } return; }
  const accept = event.target.closest("[data-accept-answer]");
  if (accept) { post.accepted_answer_id = accept.dataset.acceptAnswer; post.status = "solved"; post.locked = true; post.answers.forEach(answer => { answer.accepted = String(answer.id) === String(accept.dataset.acceptAnswer); }); persistPost(post); renderPostDetail(post); showToast("Answer accepted. Thread locked."); return; }
  if (event.target.closest("[data-reopen-thread]")) { post.accepted_answer_id = null; post.status = "open"; post.locked = false; post.answers.forEach(answer => { answer.accepted = false; }); persistPost(post); renderPostDetail(post); showToast("Thread reopened."); return; }
  if (event.target.closest("[data-reveal-flagged]")) { const content = elements.postView.querySelector("[data-flagged-content]"); const overlay = elements.postView.querySelector("[data-flagged-overlay]"); if (content) content.classList.remove("blurred"); if (overlay) overlay.hidden = true; return; }
  const redactAnswer = event.target.closest("[data-redact-answer]");
  if (redactAnswer) { const answer = post.answers.find(item => String(item.id) === String(redactAnswer.dataset.redactAnswer)); if (answer) { answer.redaction_state = "redacted"; answer.redacted_body = answer.body; persistPost(post); renderPostDetail(post); showToast("Answer redacted."); } return; }
  const modAction = event.target.closest("[data-mod-post-action]");
  if (modAction) { if (modAction.dataset.modPostAction === "approve") post.ai_flagged = false; if (modAction.dataset.modPostAction === "redact") { post.ai_flagged = false; post.redaction_state = "redacted"; post.redacted_body = post.body; post.redacted_reason = "policy_violation"; post.redacted_by = currentUserEmail(); } if (modAction.dataset.modPostAction === "restore") post.redaction_state = "visible"; persistPost(post); renderPostDetail(post); showToast("Moderation action saved."); }
});

elements.postView.addEventListener("submit", event => {
  event.preventDefault();
  const post = findPost(currentPostId);
  if (!post) return;
  if (event.target.id === "answer-form") {
    const body = new FormData(event.target).get("body").trim();
    if (!body) return;
    post.answers ||= [];
    post.answers.push({ id: `local-answer-${Date.now()}`, body, author: "You", author_email: currentUserEmail(), author_id: currentUserId(), created_at: new Date().toISOString(), score: 0, accepted: false, show_real_identity: false, redaction_state: "visible", comments: [] });
    persistPost(post); renderPostDetail(post); showToast("Answer added."); return;
  }
  if (event.target.matches(".comment-form")) {
    const answer = post.answers.find(item => String(item.id) === String(event.target.dataset.commentForm));
    const body = new FormData(event.target).get("body").trim();
    if (!answer || !body) return;
    answer.comments ||= [];
    answer.comments.push({ id: `local-comment-${Date.now()}`, body, author: "You", author_email: currentUserEmail(), author_id: currentUserId(), created_at: new Date().toISOString(), score: 0 });
    persistPost(post); renderPostDetail(post); showToast("Comment added.");
  }
});

elements.formView.addEventListener("click", event => {
  if (event.target.closest("[data-cancel-form]")) setView(currentView);
});

elements.formView.addEventListener("submit", event => {
  event.preventDefault();
  const form = event.target;
  if (form.id !== "replica-post-form") return;
  const formData = new FormData(form);
  const tags = formData.getAll("tags");
  if (tags.length < 1 || tags.length > 5) { showToast("Choose between 1 and 5 tags."); return; }
  const editId = form.dataset.editId;
  const existing = editId ? findPost(editId) : null;
  const days = Number(formData.get("expiry") || 0);
  const post = existing || { id: `local-${Date.now()}`, author: "You", author_email: currentUserEmail(), author_id: currentUserId(), created_at: new Date().toISOString(), score: 0, answers: [], mine: true, redaction_state: "visible", ai_flagged: false, reports_count: 0, status: "open", locked: false };
  post.title = formData.get("title").trim();
  post.body = formData.get("body").trim();
  post.topic = formData.get("topic");
  post.tags = tags;
  post.school = formData.get("school");
  post.course = formData.get("course").trim();
  post.updated_at = new Date().toISOString();
  post.expires_at = days ? new Date(Date.now() + days * 86400000).toISOString() : null;
  if (!existing) localPosts.unshift(post);
  persistPost(post);
  setView("mine");
  showToast(existing ? "Post updated." : "Post was successfully created!");
});

elements.moderationView.addEventListener("click", event => {
  const review = event.target.closest("[data-mod-review]");
  if (review) { showPost(review.dataset.modReview); return; }
  const details = event.target.closest("[data-mod-details]");
  if (details) { const post = findPost(details.dataset.modDetails); if (post) showModerationDetails(post); return; }
  if (event.target.closest("[data-mod-back]")) { showModeration(); return; }
  if (event.target.closest("[data-show-stats]")) { showStats(); return; }
  const actions = ["redact", "approve", "restore", "dismiss"];
  for (const action of actions) {
    const button = event.target.closest(`[data-mod-${action}]`);
    if (!button) continue;
    const post = findPost(button.dataset[`mod${titleize(action).replaceAll(" ", "")}`] || button.getAttribute(`data-mod-${action}`));
    if (!post) return;
    if (action === "redact") { post.ai_flagged = false; post.redaction_state = "redacted"; post.redacted_body = post.body; post.redacted_reason = "policy_violation"; post.redacted_by = currentUserEmail(); }
    if (action === "approve") post.ai_flagged = false;
    if (action === "restore") post.redaction_state = "visible";
    if (action === "dismiss") { post.reports_count = 0; post.reported = false; reports.delete(String(post.id)); }
    persistPost(post); showModeration(); showToast("Moderation action saved."); return;
  }
});

elements.statsView.addEventListener("click", event => {
  if (event.target.closest("[data-stats-moderation]")) showModeration();
  if (event.target.closest("[data-stats-posts]")) setView("all");
});

const boot = async () => {
  try {
    const response = await fetch("./data.json", { cache: "no-store" });
    if (!response.ok) throw new Error(`Data request failed: ${response.status}`);
    exportedData = await response.json();
    seededPosts = exportedData.posts.map(post => overrides[String(post.id)] || post);
    renderPosts();
    showLogin();
  } catch (error) {
    elements.loginView.innerHTML = `<div class="boot-error"><h1>CU BlueBoard</h1><p>The local project data could not be loaded.</p><small>${escapeHTML(error.message)}</small></div>`;
  }
};

boot();
