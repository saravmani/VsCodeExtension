// Main script for the webview
(function() {
    // Get a reference to the VS Code API
    const vscode = acquireVsCodeApi();
    
    // Initialize counter
    let count = 200;
    
    // Counter functionality
    document.getElementById('increment').addEventListener('click', () => {
        count++;
        document.getElementById('counter').textContent = count;
    });
    
    document.getElementById('decrement').addEventListener('click', () => {
        count--;
        document.getElementById('counter').textContent = count;
    });
    
    // Message sending functionality
    document.getElementById('send-message').addEventListener('click', () => {
        const message = document.getElementById('message-input').value;
        if (message) {
            vscode.postMessage({
                command: 'alert',
                text: message
            });
            document.getElementById('message-input').value = '';
        }
    });
})();
