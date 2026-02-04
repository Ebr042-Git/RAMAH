interface Task {
    Module: string;
    Task: string;
    Status: string;
    AssignedTo: string;
    Date: string;
}

// Replace with your Google Apps Script Web App URL
const API_URL = "https://script.google.com/macros/s/AKfycby1BiRAYAX0kkKWkZ38iHWxb-nEH6wVnldHCUSI8H7c2qtQ9aBOYUsRO9ddeQbv6ZAm/exec";

async function fetchTasks(): Promise<Task[]> {
    const response = await fetch(API_URL);
    if (!response.ok) throw new Error("Failed to fetch data");
    return response.json();
}

function populateModules(tasks: Task[]) {
    const select = document.getElementById("moduleSelect") as HTMLSelectElement;
    const modules = Array.from(new Set(tasks.map(t => t.Module)));

    select.innerHTML = modules.map(m => `<option value="${m}">${m}</option>`).join("");
    select.addEventListener("change", () => renderDashboard(tasks));
}

function renderDashboard(tasks: Task[]) {
    const select = document.getElementById("moduleSelect") as HTMLSelectElement;
    const moduleName = select.value;
    const moduleTasks = tasks.filter(t => t.Module === moduleName);

    // Progress
    const completed = moduleTasks.filter(t => t.Status.toLowerCase() === "done").length;
    const percent = moduleTasks.length === 0 ? 0 : Math.round((completed / moduleTasks.length) * 100);
    const progressDiv = document.getElementById("progressContainer")!;
    progressDiv.innerHTML = `<div class="progress-bar"><div class="progress-fill" style="width:${percent}%">${percent}%</div></div>`;

    // Table
    const tableContainer = document.getElementById("tableContainer")!;
    let html = `<table>
        <tr><th>Task</th><th>Status</th><th>Assignee</th><th>Date</th></tr>`;
    moduleTasks.forEach(t => {
        html += `<tr>
            <td>${t.Task}</td>
            <td>${t.Status}</td>
            <td>${t.AssignedTo}</td>
            <td>${t.Date}</td>
        </tr>`;
    });
    html += `</table>`;
    tableContainer.innerHTML = html;
}

async function init() {
    try {
        const tasks = await fetchTasks();
        if (tasks.length === 0) throw new Error("No tasks found");
        populateModules(tasks);
        renderDashboard(tasks);
    } catch (err) {
        console.error(err);
        const tableContainer = document.getElementById("tableContainer")!;
        tableContainer.innerText = "Failed to load dashboard data.";
    }
}

init();

