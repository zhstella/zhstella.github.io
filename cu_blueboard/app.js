const seededPosts = [
  {
    id: "28",
    title: "This professor is terrible and should be fired",
    body: "Prof X in the CS department is the worst. They don't answer emails, grade unfairly, and clearly don't care about students. Avoid at all costs!!!",
    status: "open",
    topic: "General",
    author: "Lion #MPN8",
    age: "about 1 hour ago",
    school: "Columbia",
    course: "",
    tags: ["Academics"],
    answers: []
  },
  {
    id: "26",
    title: "Looking for exam answers - will pay!!",
    body: "[Content removed by CU moderators for policy violations]",
    status: "open",
    topic: "General",
    author: "Lion #FHD0",
    age: "about 1 hour ago",
    school: "Columbia",
    course: "",
    tags: ["Academics"],
    answers: []
  },
  {
    id: "21",
    title: "Part-time job recommendations on campus?",
    body: "Looking for a part-time job that won't kill my GPA. What campus jobs have good pay and reasonable hours? Bonus if I can do homework during slow periods lol",
    status: "open",
    topic: "Career",
    author: "Lion #5NFW",
    age: "1 day ago",
    school: "Barnard",
    course: "",
    tags: ["Career", "Resources"],
    answers: [
      { body: "library jobs are the move. lots of downtime for studying", accepted: false },
      { body: "tutoring through the writing center pays well if ur good at writing", accepted: false },
      { body: "residential life desk attendant is pretty chill. night shifts are quiet", accepted: false }
    ]
  },
  {
    id: "5",
    title: "Good spots for quiet studying near campus?",
    body: "Butler is always packed and I can't focus in my dorm. Where do people go to study when the libraries are full? Bonus points if they have good coffee nearby.",
    status: "solved",
    topic: "Campus Life",
    author: "Lion #FVS7",
    age: "1 day ago",
    school: "Columbia",
    course: "",
    tags: ["Resources", "Student Life"],
    answers: [
      { body: "Try the law library - it's less crowded than Butler and super quiet. game changer fr", accepted: false },
      { body: "Joe Coffee in the journalism building has great atmosphere and usually has seats.", accepted: true },
      { body: "Milstein at Barnard is nice too! Open to Columbia students.", accepted: false }
    ]
  },
  {
    id: "1",
    title: "Best CS electives for junior year?",
    body: "I'm a CS major trying to plan my schedule for next semester. Already took OS and algorithms. What electives would you recommend? Thinking about ML, NLP, or computer graphics. Which ones have reasonable workloads?",
    status: "open",
    topic: "Academics",
    author: "Lion #WPUM",
    age: "2 days ago",
    school: "Columbia",
    course: "COMS W4995",
    tags: ["Academics", "Courses / COMS"],
    answers: [
      { body: "Graphics is super fun but time-consuming. Be ready to spend a lot of time on the ray tracer project. totally worth it tho if ur into that stuff", accepted: false },
      { body: "NLP with Prof McKeown was one of my favorite classes. Final project lets you work on something you're actually interested in.", accepted: false },
      { body: "tbh security is lowkey slept on. really practical stuff and not as much math as ML", accepted: false }
    ]
  },
  {
    id: "17",
    title: "How to deal with a difficult roommate situation?",
    body: "My roommate has been having people over super late every night and it's affecting my sleep and grades. We've talked about it but nothing changes. What are my options? Is it too late to switch rooms?",
    status: "open",
    topic: "Housing",
    author: "Lion #QKHE",
    age: "3 days ago",
    school: "Barnard",
    course: "",
    tags: ["Housing", "Student Life"],
    answers: [
      { body: "document everything and talk to your RA. they can help mediate the situation", accepted: false },
      { body: "had the same issue freshman year. ended up switching rooms through housing and it was the best decision ever", accepted: false },
      { body: "try the roommate agreement form - it sounds silly but having things in writing actually helps", accepted: false }
    ]
  },
  {
    id: "24",
    title: "How competitive is the pre-med track here?",
    body: "Thinking about going pre-med but I've heard horror stories about the competitiveness and curve. Is it really that bad? Or are people exaggerating? I don't want to burn out before I even apply to med school",
    status: "open",
    topic: "Academics",
    author: "Lion #VC7M",
    age: "6 days ago",
    school: "Columbia",
    course: "",
    tags: ["Academics", "Career"],
    answers: [
      { body: "the curve is real in some classes but not all. orgo is rough, bio is more fair", accepted: false },
      { body: "its competitive but not cutthroat if u find the right people. study groups help a lot", accepted: false },
      { body: "honestly the hardest part is juggling clinical experience + research + classes + social life. time management is key", accepted: false }
    ]
  },
  {
    id: "19",
    title: "gym way too crowded - alternatives?",
    body: "dodge is literally packed 24/7 and i hate waiting for equipment. does anyone know any affordable gyms near campus? or maybe less crowded times to go? trying to stay consistent with working out but this is making it so hard",
    status: "open",
    topic: "Wellness",
    author: "Lion #GEVZ",
    age: "6 days ago",
    school: "Columbia",
    course: "",
    tags: ["Resources", "Student Life"],
    answers: [
      { body: "planet fitness on 125th is like $10/month and 24 hours. worth it for the convenience", accepted: false },
      { body: "also check out the smaller barnard gym if u have access. less crowded", accepted: false },
      { body: "try going before 7am or after 9pm. way less crowded at those times", accepted: false }
    ]
  },
  {
    id: "2",
    title: "Wien vs Schapiro for sophomores?",
    body: "Got my housing assignment and have to choose between Wien and Schapiro. Any thoughts on which is better? Heard Wien has bigger rooms but Schapiro is newer. Also wondering about the social scene in each.",
    status: "open",
    topic: "Housing",
    author: "Lion #W5R3",
    age: "6 days ago",
    school: "Columbia",
    course: "",
    tags: ["Housing", "Student Life"],
    answers: [
      { body: "pro tip: if u can get a corner room in wien its actually pretty nice. more natural light", accepted: false },
      { body: "Schapiro has way better lounges and study spaces. Wien's common areas are kind of meh.", accepted: false },
      { body: "Wien for sure. Bigger rooms make a huge difference. The laundry situation is similar in both.", accepted: false }
    ]
  },
  {
    id: "12",
    title: "Professor recs for Intro Psych?",
    body: "Need to fulfill a science requirement and thinking about Intro Psych. Who's good? I've heard mixed things about different professors. Looking for someone engaging who doesn't have impossible exams.",
    status: "open",
    topic: "Academics",
    author: "Lion #H4UZ",
    age: "8 days ago",
    school: "Barnard",
    course: "PSYC UN1001",
    tags: ["Academics", "Advising"],
    answers: [
      { body: "Avoid the Thursday section - it conflicts with a lot of other popular classes.", accepted: false },
      { body: "the TAs for this class are super helpful during office hours btw", accepted: false },
      { body: "Take it with Prof Metcalfe if you can. She's tough but fair and her lectures are actually interesting.", accepted: false }
    ]
  },
  {
    id: "23",
    title: "Safe late-night food delivery options?",
    body: "Sometimes I'm studying super late and get hungry around 2am. What delivery options are actually safe and reliable at that hour? Had some sketchy experiences with random apps",
    status: "open",
    topic: "Campus Life",
    author: "Lion #PSRN",
    age: "9 days ago",
    school: "Columbia",
    course: "",
    tags: ["Student Life"],
    answers: [
      { body: "JJ's is open late and takes meal swipes. the quesadillas are solid", accepted: false },
      { body: "uber eats usually has halal carts delivering late. might be sketchy quality tho lol", accepted: false },
      { body: "insomnia cookies delivers until 3am and accepts dining dollars", accepted: false }
    ]
  },
  {
    id: "18",
    title: "Research opportunities for freshmen?",
    body: "I'm a first-year interested in getting involved in research, specifically in neuroscience. Is it realistic to start this early? How do I even approach professors about this? Any tips would be appreciated!",
    status: "open",
    topic: "Academics",
    author: "Lion #PZL5",
    age: "9 days ago",
    school: "Columbia",
    course: "",
    tags: ["Academics", "Career"],
    answers: [
      { body: "some profs prefer students who have taken relevant courses but others are happy to train you from scratch", accepted: false },
      { body: "definitely possible as a freshman! email professors whose research interests you with a specific reason why", accepted: false },
      { body: "SURF program in the summer is great for getting started. applications usually open in spring", accepted: false }
    ]
  },
  {
    id: "11",
    title: "Club recommendations for shy freshmen?",
    body: "Just started here and finding it hard to meet people. What clubs are welcoming to people who are a bit introverted? Looking for something low-key but social.",
    status: "open",
    topic: "Campus Life",
    author: "Lion #ULER",
    age: "10 days ago",
    school: "Barnard",
    course: "",
    tags: ["Resources", "Student Life"],
    answers: [
      { body: "Photography club is great for introverts - you can just walk around and take photos together.", accepted: false },
      { body: "quiz bowl is surprisingly chill despite sounding intense lol. good people", accepted: false },
      { body: "Check out the board game club! Super chill vibes, no pressure to talk if you don't want to.", accepted: false }
    ]
  }
];

const policies = {
  honor: `
    <h1 class="policy-title">Honor Code</h1>
    <p class="policy-updated">Last Updated: December 01, 2025</p>
    <section class="policy-section">
      <h2>Academic Integrity</h2>
      <p>CU BlueBoard is committed to upholding the academic integrity standards of Columbia University and Barnard College. By using this platform, you agree to:</p>
      <ul>
        <li>Not post or request answers to exams, quizzes, or graded assignments</li>
        <li>Not share copyrighted course materials without permission</li>
        <li>Not engage in any form of academic dishonesty</li>
        <li>Report any content that violates academic integrity policies</li>
      </ul>
    </section>
    <section class="policy-section">
      <h2>Community Standards</h2>
      <p>As a member of the CU BlueBoard community, you agree to:</p>
      <ul>
        <li>Treat all community members with respect and dignity</li>
        <li>Not post hateful, discriminatory, or harassing content</li>
        <li>Not impersonate other students, faculty, or staff</li>
        <li>Use the platform for its intended purpose of constructive Q&amp;A</li>
      </ul>
    </section>
    <section class="policy-section">
      <h2>Identity Escrow</h2>
      <p>While posts on CU BlueBoard are anonymous to other users, your identity is verified through Columbia/Barnard SSO and may be disclosed to university administrators in cases of:</p>
      <ul>
        <li>Serious violations of the Honor Code</li>
        <li>Threats to campus safety</li>
        <li>Legal requirements</li>
      </ul>
    </section>
    <section class="policy-section">
      <h2>Consequences</h2>
      <p>Violations of this Honor Code may result in:</p>
      <ul>
        <li>Content removal or redaction</li>
        <li>Temporary or permanent account suspension</li>
        <li>Referral to university disciplinary processes</li>
      </ul>
    </section>`,
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
  bookmarks: "cu-blueboard-static-bookmarks",
  posts: "cu-blueboard-static-posts"
};

const safeJSON = (key, fallback) => {
  try {
    const value = JSON.parse(localStorage.getItem(key));
    return value ?? fallback;
  } catch {
    return fallback;
  }
};

let localPosts = safeJSON(storageKeys.posts, []);
let bookmarks = new Set(safeJSON(storageKeys.bookmarks, []));
let currentView = "all";
let currentRole = null;

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
  moderationView: document.querySelector("#moderation-view"),
  backToBoard: document.querySelector("#back-to-board"),
  listHeading: document.querySelector("#list-heading"),
  viewSubtitle: document.querySelector("#view-subtitle"),
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
  tagFilters: document.querySelector("#tag-filters"),
  apply: document.querySelector("#apply-filters"),
  reset: document.querySelector("#reset-filters"),
  resultCount: document.querySelector("#result-count"),
  viewTitle: document.querySelector("#view-title"),
  postDialog: document.querySelector("#post-dialog"),
  postDetail: document.querySelector("#post-detail"),
  createButton: document.querySelector("#create-post"),
  createDialog: document.querySelector("#create-dialog"),
  createForm: document.querySelector("#create-form"),
  toast: document.querySelector("#toast")
};

const allPosts = () => [...localPosts, ...seededPosts];

const escapeHTML = (value) => String(value)
  .replaceAll("&", "&amp;")
  .replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;")
  .replaceAll('"', "&quot;")
  .replaceAll("'", "&#039;");

const selectedTags = () => [...elements.tagFilters.querySelectorAll("input:checked")].map(input => input.value);

const activeFilterCount = () => [
  elements.topic.value,
  elements.status.value,
  elements.school.value,
  elements.course.value.trim(),
  ...selectedTags()
].filter(Boolean).length;

const updateFilterBadge = () => {
  const count = activeFilterCount();
  elements.filterCount.textContent = String(count);
  elements.filterCount.hidden = count === 0;
};

const persist = () => {
  localStorage.setItem(storageKeys.posts, JSON.stringify(localPosts));
  localStorage.setItem(storageKeys.bookmarks, JSON.stringify([...bookmarks]));
};

const filtersMatch = (post) => {
  const query = elements.search.value.trim().toLowerCase();
  const searchText = [post.title, post.body, post.topic, post.school, post.course, ...post.tags].join(" ").toLowerCase();
  const tags = selectedTags();

  return (!query || searchText.includes(query))
    && (!elements.topic.value || post.topic === elements.topic.value)
    && (!elements.status.value || post.status === elements.status.value)
    && (!elements.school.value || post.school === elements.school.value)
    && (!elements.course.value.trim() || post.course.toLowerCase().includes(elements.course.value.trim().toLowerCase()))
    && (tags.length === 0 || tags.every(tag => post.tags.includes(tag)));
};

const visiblePosts = () => allPosts().filter(post => {
  if (currentView === "bookmarks" && !bookmarks.has(String(post.id))) return false;
  if (currentView === "mine" && !post.mine) return false;
  return filtersMatch(post);
});

const tagMarkup = tags => tags.map(tag => `<span class="tag-chip">${escapeHTML(tag)}</span>`).join("");

const postMarkup = post => {
  const bookmarked = bookmarks.has(String(post.id));
  return `
    <article class="post-card-wrapper">
      <button class="post-card" type="button" data-post-id="${escapeHTML(post.id)}">
        <span class="post-card-header">
          <h2>${escapeHTML(post.title)}</h2>
          <span class="status-pill ${post.status === "solved" ? "solved" : ""}">${post.status === "solved" ? "Solved" : "Open"}</span>
        </span>
        <span class="post-meta">
          <span class="topic">${escapeHTML(post.topic)}</span>
          <span>By: ${escapeHTML(post.author)}</span>
          <span>${escapeHTML(post.age)}</span>
        </span>
        <span class="post-context">
          <span class="meta-chip">School: ${escapeHTML(post.school)}</span>
          ${post.course ? `<span class="meta-chip">Course: ${escapeHTML(post.course)}</span>` : ""}
        </span>
        <span class="post-tags">${tagMarkup(post.tags)}</span>
      </button>
      <button class="bookmark-button ${bookmarked ? "bookmarked" : ""}" type="button" data-bookmark-id="${escapeHTML(post.id)}" aria-label="${bookmarked ? "Remove bookmark" : "Bookmark post"}">${bookmarked ? "★" : "☆"}</button>
    </article>`;
};

const renderPosts = () => {
  const posts = visiblePosts();
  elements.posts.innerHTML = posts.map(postMarkup).join("");
  elements.empty.hidden = posts.length !== 0;
  elements.resultCount.textContent = `${posts.length} ${posts.length === 1 ? "thread" : "threads"}`;
  updateFilterBadge();
};

const setView = view => {
  currentView = view;
  const headings = {
    bookmarks: ["Bookmarked Posts", "Posts you have bookmarked are shown here."],
    mine: ["My Threads", "Only threads you created are shown here."]
  };
  elements.boardView.hidden = false;
  elements.moderationView.hidden = true;
  elements.listHeading.hidden = view === "all";
  if (headings[view]) {
    elements.viewTitle.textContent = headings[view][0];
    elements.viewSubtitle.textContent = headings[view][1];
  }
  document.querySelectorAll("[data-view]").forEach(button => button.classList.toggle("active", button.dataset.view === view));
  elements.moderationNav.classList.remove("active");
  renderPosts();
};

const showToast = message => {
  elements.toast.textContent = message;
  elements.toast.classList.add("show");
  window.clearTimeout(showToast.timer);
  showToast.timer = window.setTimeout(() => elements.toast.classList.remove("show"), 2200);
};

const showLogin = () => {
  currentRole = null;
  elements.loginView.hidden = false;
  elements.policyView.hidden = true;
  elements.appView.hidden = true;
  elements.headerFlash.hidden = true;
  document.body.classList.add("login-mode");
  document.querySelectorAll("dialog[open]").forEach(dialog => dialog.close());
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
  elements.headerFlash.textContent = role === "moderator"
    ? "Signed in as Test Moderator (Moderator)"
    : "Signed in as Test User (Student)";
  elements.headerFlash.hidden = false;
  window.clearTimeout(login.flashTimer);
  login.flashTimer = window.setTimeout(() => { elements.headerFlash.hidden = true; }, 3000);
  window.scrollTo({ top: 0, behavior: "instant" });
};

const showModeration = () => {
  if (currentRole !== "moderator") return;
  elements.boardView.hidden = true;
  elements.moderationView.hidden = false;
  elements.moderationNav.classList.add("active");
  document.querySelectorAll("[data-view]").forEach(button => button.classList.remove("active"));
};

const openPost = id => {
  const post = allPosts().find(item => String(item.id) === String(id));
  if (!post) return;
  const answers = post.answers.length
    ? post.answers.map(answer => `
        <article class="answer-card ${answer.accepted ? "accepted" : ""}">
          ${answer.accepted ? '<span class="answer-label">✓ Accepted answer</span>' : ""}
          ${escapeHTML(answer.body)}
        </article>`).join("")
    : '<div class="no-answers">No answers yet — this thread is still open.</div>';

  elements.postDetail.innerHTML = `
    <p class="detail-topic">${escapeHTML(post.topic)}</p>
    <h2>${escapeHTML(post.title)}</h2>
    <div class="detail-meta">
      <span>By: ${escapeHTML(post.author)}</span><span>${escapeHTML(post.age)}</span>
      <span>${escapeHTML(post.school)}</span>${post.course ? `<span>${escapeHTML(post.course)}</span>` : ""}
    </div>
    <p class="detail-body">${escapeHTML(post.body)}</p>
    <div class="post-tags">${tagMarkup(post.tags)}</div>
    <section class="answers"><h3>${post.answers.length} ${post.answers.length === 1 ? "Answer" : "Answers"}</h3>${answers}</section>`;
  elements.postDialog.showModal();
};

document.querySelectorAll("[data-policy]").forEach(button => {
  button.addEventListener("click", () => showPolicy(button.dataset.policy));
});

elements.policyLogo.addEventListener("click", showLogin);
elements.backToLogin.addEventListener("click", showLogin);
elements.testUserLogin.addEventListener("click", () => login("user"));
elements.testModeratorLogin.addEventListener("click", () => login("moderator"));
elements.ssoLogin.addEventListener("click", () => {
  login("user");
  showToast("University SSO is simulated on this static site");
});
elements.logout.addEventListener("click", showLogin);
elements.appHome.addEventListener("click", () => setView("all"));
elements.moderationNav.addEventListener("click", showModeration);
elements.backToBoard.addEventListener("click", () => setView("all"));

document.querySelectorAll("[data-review-action]").forEach(button => {
  button.addEventListener("click", () => {
    const action = button.dataset.reviewAction;
    button.closest("article")?.remove();
    showToast(action);
  });
});

elements.searchForm.addEventListener("submit", event => {
  event.preventDefault();
  renderPosts();
});

elements.search.addEventListener("input", renderPosts);

elements.filterToggle.addEventListener("click", () => {
  const isOpen = !elements.filterPanel.hidden;
  elements.filterPanel.hidden = isOpen;
  elements.filterToggle.classList.toggle("open", !isOpen);
  elements.filterToggle.setAttribute("aria-expanded", String(!isOpen));
});

elements.apply.addEventListener("click", renderPosts);

elements.reset.addEventListener("click", () => {
  elements.topic.value = "";
  elements.status.value = "";
  elements.school.value = "";
  elements.course.value = "";
  elements.search.value = "";
  elements.tagFilters.querySelectorAll("input").forEach(input => { input.checked = false; });
  renderPosts();
});

elements.posts.addEventListener("click", event => {
  const bookmark = event.target.closest("[data-bookmark-id]");
  if (bookmark) {
    const id = String(bookmark.dataset.bookmarkId);
    if (bookmarks.has(id)) {
      bookmarks.delete(id);
      showToast("Bookmark removed");
    } else {
      bookmarks.add(id);
      showToast("Post bookmarked");
    }
    persist();
    renderPosts();
    return;
  }

  const card = event.target.closest("[data-post-id]");
  if (card) openPost(card.dataset.postId);
});

document.querySelectorAll("[data-view]").forEach(button => {
  button.addEventListener("click", () => setView(button.dataset.view));
});

elements.createButton.addEventListener("click", () => elements.createDialog.showModal());

elements.createForm.addEventListener("submit", event => {
  event.preventDefault();
  const post = {
    id: `local-${Date.now()}`,
    title: document.querySelector("#new-title").value.trim(),
    body: document.querySelector("#new-body").value.trim(),
    status: "open",
    topic: document.querySelector("#new-topic").value,
    author: "Lion #LOCAL",
    age: "just now",
    school: document.querySelector("#new-school").value,
    course: "",
    tags: [document.querySelector("#new-topic").value],
    answers: [],
    mine: true
  };
  localPosts.unshift(post);
  persist();
  elements.createForm.reset();
  elements.createDialog.close();
  setView("mine");
  showToast("Post saved in this browser");
});

document.querySelectorAll("[data-close-dialog]").forEach(button => {
  button.addEventListener("click", () => button.closest("dialog").close());
});

document.querySelectorAll("dialog").forEach(dialog => {
  dialog.addEventListener("click", event => {
    if (event.target === dialog) dialog.close();
  });
});

renderPosts();
showLogin();
