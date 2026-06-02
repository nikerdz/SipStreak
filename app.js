// =========================
// SCREEN NAVIGATION
// =========================

let currentScreen = "landingScreen";

function goToScreen(nextId) {
    const current = document.getElementById(currentScreen);
    const next = document.getElementById(nextId);

    if (!current || !next) return;

    current.classList.remove("active");
    current.classList.add("exit-up");

    setTimeout(() => {
        current.classList.remove("exit-up");

        next.classList.add("active", "enter-up");

        setTimeout(() => next.classList.remove("enter-up"), 400);

        currentScreen = nextId;
    }, 250);
}

// =========================
// ELEMENTS
// =========================

const startBtn = document.getElementById("startBtn");

const userNameInput = document.getElementById("userName");
const nameNextBtn = document.getElementById("nameNextBtn");
const backToLanding = document.getElementById("backToLanding");

const sexInput = document.getElementById("sex");
const weightInput = document.getElementById("weight");

const bodyNextBtn = document.getElementById("bodyNextBtn");
const bodyBackBtn = document.getElementById("bodyBackBtn");

const wakeTimeInput = document.getElementById("wakeTime");
const sleepTimeInput = document.getElementById("sleepTime");

const scheduleNextBtn = document.getElementById("scheduleNextBtn");
const scheduleBackBtn = document.getElementById("scheduleBackBtn");

const bottleSizeInput = document.getElementById("bottleSize");

const createPlanBtn = document.getElementById("createPlanBtn");
const bottleBackBtn = document.getElementById("bottleBackBtn");

const summaryGreeting = document.getElementById("summaryGreeting");
const summaryGoal = document.getElementById("summaryGoal");
const summaryBottleCount = document.getElementById("summaryBottleCount");
const summarySchedule = document.getElementById("summarySchedule");

const continueBtn = document.getElementById("continueBtn");

const progressPercent = document.getElementById("progressPercent");
const scheduleList = document.getElementById("scheduleList");
const progressCircle = document.querySelector(".progress-circle");

const dailyGoalText = document.getElementById("dailyGoal");
const bottleCountText = document.getElementById("bottleCount");

const editInfoBtn = document.getElementById("editInfoBtn");
const resetBtn = document.getElementById("resetBtn");

// =========================
// STATE
// =========================

let userData = {};
let currentPlan = null;

// =========================
// NAVIGATION
// =========================

startBtn.onclick = () => goToScreen("nameScreen");
backToLanding.onclick = () => goToScreen("landingScreen");

nameNextBtn.onclick = () => {
    userData.name = userNameInput.value || "Friend";
    goToScreen("bodyScreen");
};

bodyBackBtn.onclick = () => goToScreen("nameScreen");

bodyNextBtn.onclick = () => {
    userData.sex = sexInput.value;
    userData.weight = Number(weightInput.value);
    goToScreen("scheduleScreen");
};

scheduleBackBtn.onclick = () => goToScreen("bodyScreen");

scheduleNextBtn.onclick = () => {
    userData.wake = wakeTimeInput.value;
    userData.sleep = sleepTimeInput.value;
    goToScreen("bottleScreen");
};

bottleBackBtn.onclick = () => goToScreen("scheduleScreen");

// =========================
// HYDRATION (LB → OZ ONLY)
// =========================

function calculateDailyGoal(weightLbs, sex) {
    let multiplier = 0.575;

    if (sex === "male") multiplier = 0.6;
    else if (sex === "female") multiplier = 0.55;

    return Math.round(weightLbs * multiplier);
}

// =========================
// TIME HELPERS
// =========================

function timeToMinutes(t) {
    const [h, m] = t.split(":").map(Number);
    return h * 60 + m;
}

function minutesToTime(m) {
    const h = Math.floor(m / 60);
    const mins = m % 60;

    const d = new Date();
    d.setHours(h, mins);

    return d.toLocaleTimeString([], {
        hour: "numeric",
        minute: "2-digit"
    });
}

// =========================
// SCHEDULE
// =========================

function generateSchedule(count, wake, sleep) {
    const start = timeToMinutes(wake);
    const end = timeToMinutes(sleep);

    const duration = Math.max(end - start, 1);
    const interval = duration / count;

    const schedule = [];

    for (let i = 0; i < count; i++) {
        schedule.push({
            bottle: i + 1,
            time: minutesToTime(Math.round(start + interval * i)),
            completed: false
        });
    }

    return schedule;
}

// =========================
// UI SAFETY
// =========================

function capSchedule(schedule) {
    const MAX = 20;

    if (schedule.length <= MAX) return schedule;

    const step = Math.ceil(schedule.length / MAX);

    return schedule.filter((_, i) => i % step === 0);
}

// =========================
// RENDER
// =========================

function render(plan) {
    const done = plan.schedule.filter(s => s.completed).length;
    const total = plan.schedule.length;
    const percent = total > 0 ? Math.round((done / total) * 100) : 0;

    progressPercent.textContent = `${percent}%`;

    progressCircle.style.background =
        `conic-gradient(#38b6ff ${percent}%, #e5e7eb ${percent}%)`;

    dailyGoalText.textContent = `Daily Goal: ${plan.dailyGoal} oz`;
    bottleCountText.textContent = `${done} / ${total} Bottles Complete`;

    // Set dashboard greeting
    const greetingEl = document.getElementById("dashboardGreeting");
    if (greetingEl) greetingEl.textContent = `Hi, ${plan.name}!`;

    // Clear and rebuild schedule list
    scheduleList.innerHTML = "";

    plan.schedule.forEach((item, i) => {
        const bottleNum = item.bottle != null ? item.bottle : (i + 1);
        const bottleTime = item.time || "—";
        const checked = item.completed ? "checked" : "";

        const li = document.createElement("li");
        li.style.cssText = "display:flex; align-items:center; gap:0.75rem; padding:0.875rem 1rem; border-radius:14px; border:1px solid #e5e7eb; background:white; width:100%; box-sizing:border-box; list-style:none;";
        li.innerHTML = '<input type="checkbox" ' + checked + ' style="transform:scale(1.3);cursor:pointer;flex-shrink:0;accent-color:#5e17eb;"> <span style="flex:1;min-width:0;font-size:0.95rem;color:#1f2937;">Bottle ' + bottleNum + ' • ' + bottleTime + '</span>';

        li.querySelector("input").onchange = (e) => {
            plan.schedule[i].completed = e.target.checked;
            save(plan);
            render(plan);
        };

        scheduleList.appendChild(li);
    });
}

// =========================
// STORAGE
// =========================

function save(plan) {
    localStorage.setItem("sipstreak-plan", JSON.stringify(plan));
}

function load() {
    try {
        return JSON.parse(localStorage.getItem("sipstreak-plan"));
    } catch (e) {
        return null;
    }
}

// =========================
// CREATE PLAN
// =========================

createPlanBtn.onclick = () => {
    const bottleSizeOz = Number(bottleSizeInput.value);

    if (!bottleSizeOz || !userData.weight || !userData.wake || !userData.sleep) {
        alert("Please fill all fields");
        return;
    }

    goToScreen("calculatingScreen");

    setTimeout(() => {

        const dailyGoalOz = calculateDailyGoal(
            userData.weight,
            userData.sex
        );

        let bottleCount = Math.ceil(dailyGoalOz / bottleSizeOz);

        let schedule = generateSchedule(
            bottleCount,
            userData.wake,
            userData.sleep
        );

        schedule = capSchedule(schedule);

        bottleCount = schedule.length;

        currentPlan = {
            name: userData.name,
            dailyGoal: dailyGoalOz,
            bottleSize: bottleSizeOz,
            bottleCount,
            schedule
        };

        save(currentPlan);

        summaryGreeting.textContent = `Hi ${currentPlan.name}, here is your SipStreak Hydration Plan!`;
        summaryGoal.textContent = `Recommended water intake goal: ${currentPlan.dailyGoal} oz per day`;
        summaryBottleCount.textContent =
            `Recommended bottle refills: ~${currentPlan.bottleCount} per day`;

        summarySchedule.innerHTML = "";
        currentPlan.schedule.forEach(s => {
            const li = document.createElement("li");
            li.textContent = `Bottle ${s.bottle} at ${s.time}`;
            summarySchedule.appendChild(li);
        });

        goToScreen("summaryScreen");

    }, 2500);
};

// =========================
// SUMMARY → DASHBOARD
// =========================

continueBtn.onclick = () => {
    const plan = currentPlan || load();
    if (!plan) return;

    currentPlan = plan;
    goToScreen("dashboardScreen");
    render(plan);
};

// =========================
// DASHBOARD
// =========================

editInfoBtn.onclick = () => goToScreen("landingScreen");

resetBtn.onclick = () => {
    localStorage.removeItem("sipstreak-plan");
    location.reload();
};

// =========================
// LOAD EXISTING
// =========================

const saved = load();
if (saved) currentPlan = saved;