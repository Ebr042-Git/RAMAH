<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Project Implementation Dashboard</title>
    <style>
        :root { --primary: #2980b9; --success: #27ae60; --bg: #f4f7f9; --text: #2c3e50; }
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: var(--bg); color: var(--text); padding: 20px; margin: 0; }
        .header { text-align: center; padding: 20px; background: white; margin-bottom: 30px; border-bottom: 3px solid var(--primary); box-shadow: 0 2px 5px rgba(0,0,0,0.05); }
        .container { max-width: 1200px; margin: 0 auto; }
        
        .card { background: white; border-radius: 12px; padding: 25px; margin-bottom: 40px; box-shadow: 0 4px 15px rgba(0,0,0,0.1); border-top: 6px solid var(--primary); }
        .card h2 { margin-top: 0; color: var(--primary); font-size: 1.2rem; border-bottom: 1px solid #eee; padding-bottom: 15px; }
        
        table { width: 100%; border-collapse: collapse; margin-top: 10px; }
        th { text-align: left; background: #f8f9fa; padding: 12px; font-size: 0.85rem; color: #7f8c8d; text-transform: uppercase; }
        td { padding: 12px; border-bottom: 1px solid #eee; font-size: 0.95rem; vertical-align: middle; }
        
        .remarks-input { width: 95%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; font-size: 0.9rem; transition: border 0.3s; }
        .remarks-input:focus { border-color: var(--primary); outline: none; background: #fffdf0; }
        
        .btn-done { background-color: var(--success); color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer; font-weight: bold; transition: opacity 0.2s; }
        .btn-done:hover { opacity: 0.9; }
        .btn-done:disabled { background-color: #bdc3c7; cursor: not-allowed; }
        
        .status-badge { font-weight: bold; padding: 4px 8px; border-radius: 4px; font-size: 0.8rem; }
        .done { color: var(--success); background: #eafaf1; }
        .pending { color: #e67e22; background: #fef5e7; }

        #loading-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(255,255,255,0.8); display: none; flex-direction: column; justify-content: center; align-items: center; z-index: 9999; }
        .spinner { border: 4px solid #f3f3f3; border-top: 4px solid var(--primary); border-radius: 50%; width: 40px; height: 40px; animation: spin 1s linear infinite; margin-bottom: 10px; }
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
    </style>
</head>
<body>

    <div id="loading-overlay">
        <div class="spinner"></div>
        <div>Updating Spreadsheet...</div>
    </div>

    <div class="header">
        <h1>📊 RAMAH Project Tracker</h1>
        <p>Live Module Configuration & Master Data Dashboard</p>
    </div>

    <div class="container" id="dashboard">
        <p style="text-align: center;">Connecting to Google Sheets...</p>
    </div>

    <script>
        const API_URL = "https://script.google.com/macros/s/AKfycbyO_7Zs1lpvLPN2n1yafRQ9qpz1lyy0ruzhvLxeifOtRg_cUKBdbnt8MZUlt22tK24r/exec";

        // Function to show/hide loading
        function toggleLoading(show) {
            document.getElementById('loading-overlay').style.display = show ? 'flex' : 'none';
        }

        // Generic Save Function (handles both Status and Remarks)
        async function postData(payload) {
            toggleLoading(true);
            try {
                // Using 'no-cors' mode to ensure the POST reaches Google Apps Script 
                // despite browser security headers
                await fetch(API_URL, {
                    method: 'POST',
                    mode: 'no-cors',
                    cache: 'no-cache',
                    body: JSON.stringify(payload)
                });
                
                // Wait 1.5s for Google to commit the change, then refresh the UI
                setTimeout(() => {
                    location.reload();
                }, 1500);
            } catch (error) {
                console.error("Save failed:", error);
                alert("Error connecting to script. Please check deployment.");
                toggleLoading(false);
            }
        }

        // Event: Mark a task as Done
        function handleMarkDone(row) {
            if (confirm("Are you sure you want to mark this task as DONE in the spreadsheet?")) {
                postData({ action: "updateStatus", row: row });
            }
        }

        // Event: Update Remarks when user clicks away from input
        function handleUpdateRemarks(row, oldVal, newVal) {
            if (newVal !== oldVal) {
                postData({ action: "updateRemarks", row: row, text: newVal });
            }
        }

        // Load and Group the data on startup
        async function fetchAndRender() {
            try {
                const response = await fetch(API_URL);
                const data = await response.json();
                
                if (!data || data.length === 0) {
                    document.getElementById('dashboard').innerHTML = "No tasks found in the Inventory Reports sheet.";
                    return;
                }

                // Get unique Modules (Headings)
                const modules = [...new Set(data.map(item => item.Module))];
                let html = '';

                modules.forEach(modName => {
                    const moduleTasks = data.filter(t => t.Module === modName);
                    
                    html += `
                        <div class="card">
                            <h2>${modName}</h2>
                            <table>
                                <thead>
                                    <tr>
                                        <th style="width: 45%;">Task Description</th>
                                        <th style="width: 30%;">Remarks</th>
                                        <th style="width: 10%;">Status</th>
                                        <th style="width: 15%;">Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${moduleTasks.map(task => {
                                        const isDone = task.Status.toLowerCase().trim() === 'done';
                                        return `
                                            <tr>
                                                <td>${task.Task}</td>
                                                <td>
                                                    <input type="text" class="remarks-input" 
                                                        value="${task.Remarks || ''}" 
                                                        onblur="handleUpdateRemarks(${task.RowIndex}, '${task.Remarks || ''}', this.value)"
                                                        placeholder="Click to add remarks...">
                                                </td>
                                                <td>
                                                    <span class="status-badge ${isDone ? 'done' : 'pending'}">
                                                        ${isDone ? 'DONE' : 'PENDING'}
                                                    </span>
                                                </td>
                                                <td>
                                                    <button class="btn-done" 
                                                        onclick="handleMarkDone(${task.RowIndex})"
                                                        ${isDone ? 'disabled' : ''}>
                                                        ${isDone ? 'Completed' : 'Mark Done'}
                                                    </button>
                                                </td>
                                            </tr>
                                        `;
                                    }).join('')}
                                </tbody>
                            </table>
                        </div>
                    `;
                });

                document.getElementById('dashboard').innerHTML = html;

            } catch (err) {
                console.error("Dashboard Load Error:", err);
                document.getElementById('dashboard').innerHTML = `
                    <div style="color:red; text-align:center;">
                        <strong>Failed to load data.</strong><br>
                        Verify the Web App is deployed as 'Anyone'.
                    </div>`;
            }
        }

        fetchAndRender();
    </script>
</body>
</html>
