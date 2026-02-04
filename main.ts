<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Project Management Dashboard</title>
    <style>
        body { font-family: 'Segoe UI', sans-serif; background: #f0f2f5; padding: 20px; }
        .card { background: white; border-radius: 12px; padding: 25px; margin-bottom: 30px; box-shadow: 0 4px 15px rgba(0,0,0,0.1); border-top: 6px solid #2980b9; }
        h2 { color: #2c3e50; font-size: 18px; margin-top: 0; border-bottom: 2px solid #eee; padding-bottom: 10px; }
        table { width: 100%; border-collapse: collapse; margin-top: 15px; }
        th { text-align: left; background: #f8f9fa; padding: 12px; font-size: 13px; color: #7f8c8d; }
        td { padding: 12px; border-bottom: 1px solid #eee; font-size: 14px; }
        .remarks-input { width: 95%; padding: 6px; border: 1px solid #ddd; border-radius: 4px; }
        .btn-done { background: #27ae60; color: white; border: none; padding: 8px 12px; border-radius: 4px; cursor: pointer; font-weight: bold; }
        .btn-done:disabled { background: #bdc3c7; cursor: not-allowed; }
        .status-done { color: #27ae60; font-weight: bold; }
    </style>
</head>
<body>

    <h1>📊 Project Implementation Tracker</h1>
    <div id="dashboard">Loading data...</div>

    <script>
        const API_URL = "https://script.google.com/macros/s/AKfycbypfFruIPEsgSJMqajv28LmRidZjoFNZsm7xenU1DkRXjemjUWtmSFl3-25YteCryMF/exec";

        async function saveData(payload) {
    // We use 'no-cors' to bypass the browser security block
    // Note: You won't be able to read the response body, but the data WILL reach the sheet.
    await fetch(API_URL, {
        method: 'POST',
        mode: 'no-cors', 
        headers: {
            'Content-Type': 'text/plain' // Using text/plain avoids the CORS preflight trigger
        },
        body: JSON.stringify(payload)
    });
}

        async function markDone(row) {
            if(!confirm("Mark this task as Done?")) return;
            await saveData({ action: "updateStatus", row: row });
            location.reload(); 
        }

        async function saveRemarks(row, text) {
            await saveData({ action: "updateRemarks", row: row, text: text });
        }

        async function loadDashboard() {
            try {
                const response = await fetch(API_URL);
                const data = await response.json();
                const modules = [...new Set(data.map(d => d.Module))];
                let html = '';

                modules.forEach(mod => {
                    const tasks = data.filter(d => d.Module === mod);
                    html += `
                        <div class="card">
                            <h2>${mod}</h2>
                            <table>
                                <thead>
                                    <tr>
                                        <th style="width: 40%">Task Description</th>
                                        <th style="width: 30%">Remarks</th>
                                        <th>Status</th>
                                        <th>Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${tasks.map(t => `
                                        <tr>
                                            <td>${t.Task}</td>
                                            <td><input type="text" class="remarks-input" value="${t.Remarks || ''}" onblur="saveRemarks(${t.RowIndex}, this.value)"></td>
                                            <td class="${t.Status.toLowerCase() === 'done' ? 'status-done' : ''}">${t.Status || 'Pending'}</td>
                                            <td><button class="btn-done" onclick="markDone(${t.RowIndex})" ${t.Status.toLowerCase() === 'done' ? 'disabled' : ''}>Mark Done</button></td>
                                        </tr>
                                    `).join('')}
                                </tbody>
                            </table>
                        </div>`;
                });
                document.getElementById('dashboard').innerHTML = html;
            } catch (e) {
                document.getElementById('dashboard').innerHTML = "Error loading dashboard. Ensure script is deployed as 'Anyone'.";
            }
        }

        loadDashboard();
    </script>
</body>
</html>
