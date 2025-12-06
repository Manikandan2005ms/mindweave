const ideaInput = document.getElementById("ideaInput");
const analyzeBtn = document.getElementById("analyzeBtn");
const statusMessage = document.getElementById("statusMessage");

const resultSection = document.getElementById("resultSection");
const mainIdeaEl = document.getElementById("mainIdea");
const clarityScoreEl = document.getElementById("clarityScore");
const clarityBarFill = document.getElementById("clarityBarFill");
const emotionEl = document.getElementById("emotion");

const subIdeasContainer = document.getElementById("subIdeas");
const logicGapsList = document.getElementById("logicGaps");
const improvementsList = document.getElementById("improvements");

async function analyzeIdea() {
  const text = ideaInput.value.trim();

  if (!text) {
    statusMessage.textContent = "Please enter some text to analyze.";
    return;
  }

  analyzeBtn.disabled = true;
  statusMessage.textContent = "Analyzing your thinking with Gemini 3 Pro...";
  resultSection.classList.add("hidden");

  try {
    const response = await fetch("/api/analyze", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ text }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error || "Server error");
    }

    const data = await response.json();
    renderResult(data);
    statusMessage.textContent = "Analysis complete ✅";
  } catch (error) {
    console.error(error);
    statusMessage.textContent = "Error: " + error.message;
  } finally {
    analyzeBtn.disabled = false;
  }
}

function renderResult(data) {
  const {
    main_idea,
    clarity_score,
    emotion,
    sub_ideas,
    logic_gaps,
    improvements,
  } = data;

  // Main Idea
  mainIdeaEl.textContent = main_idea || "No main idea detected.";

  // Clarity & Emotion
  const clarity = typeof clarity_score === "number" ? clarity_score : 0;
  clarityScoreEl.textContent = clarity;
  clarityBarFill.style.width = Math.max(0, Math.min(clarity, 100)) + "%";

  emotionEl.textContent = emotion || "unknown";

  // Sub Ideas
  subIdeasContainer.innerHTML = "";
  if (Array.isArray(sub_ideas) && sub_ideas.length > 0) {
    sub_ideas.forEach((item) => {
      const div = document.createElement("div");
      div.className = "sub-idea";

      const title = document.createElement("div");
      title.className = "sub-idea-title";
      title.textContent = item.title || "Untitled sub-idea";

      const summary = document.createElement("div");
      summary.className = "sub-idea-summary";
      summary.textContent = item.summary || "";

      div.appendChild(title);
      div.appendChild(summary);
      subIdeasContainer.appendChild(div);
    });
  } else {
    subIdeasContainer.textContent = "No sub-ideas detected.";
  }

  // Logic Gaps
  logicGapsList.innerHTML = "";
  if (Array.isArray(logic_gaps) && logic_gaps.length > 0) {
    logic_gaps.forEach((gap) => {
      const li = document.createElement("li");
      li.textContent = gap;
      logicGapsList.appendChild(li);
    });
  } else {
    const li = document.createElement("li");
    li.textContent = "No major logic gaps detected. 🎉";
    logicGapsList.appendChild(li);
  }

  // Improvements
  improvementsList.innerHTML = "";
  if (Array.isArray(improvements) && improvements.length > 0) {
    improvements.forEach((imp) => {
      const li = document.createElement("li");
      li.textContent = imp;
      improvementsList.appendChild(li);
    });
  } else {
    const li = document.createElement("li");
    li.textContent = "No suggestions – your thinking is already very clear.";
    improvementsList.appendChild(li);
  }

  resultSection.classList.remove("hidden");
}

analyzeBtn.addEventListener("click", analyzeIdea);

// Press Ctrl+Enter to analyze
ideaInput.addEventListener("keydown", (e) => {
  if (e.ctrlKey && e.key === "Enter") {
    analyzeIdea();
  }
});
