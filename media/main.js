// Main script for the webview
(function() {
    // Get a reference to the VS Code API
    const vscode = acquireVsCodeApi();
    
    // Initialize counter
    let count = 200;
    
    // Initialize posts array
    let posts = [];
    let currentPostIndex = 0;
    
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
    
    // API functionality
    document.getElementById('fetch-data').addEventListener('click', async () => {
        try {
            document.getElementById('api-status').textContent = 'Loading...';
            document.getElementById('fetch-data').disabled = true;
            
            const response = await fetch('https://jsonplaceholder.typicode.com/posts');
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            
            posts = await response.json();
            currentPostIndex = 0;
            
            displayCurrentPost();
            document.getElementById('api-status').textContent = `Loaded ${posts.length} posts`;
            document.getElementById('fetch-data').disabled = false;
            document.getElementById('post-navigation').style.display = 'block';
        } catch (error) {
            document.getElementById('api-status').textContent = `Error: ${error.message}`;
            document.getElementById('fetch-data').disabled = false;
            vscode.postMessage({
                command: 'alert',
                text: `API Error: ${error.message}`
            });
        }
    });
    
    // Navigation functionality
    document.getElementById('prev-post').addEventListener('click', () => {
        if (currentPostIndex > 0) {
            currentPostIndex--;
            displayCurrentPost();
        }
    });
    
    document.getElementById('next-post').addEventListener('click', () => {
        if (currentPostIndex < posts.length - 1) {
            currentPostIndex++;
            displayCurrentPost();
        }
    });
    
    // Display current post
    function displayCurrentPost() {
        if (posts.length === 0) {
            return;
        }
        
        const post = posts[currentPostIndex];
        document.getElementById('post-title').textContent = post.title;
        document.getElementById('post-body').textContent = post.body;
        document.getElementById('post-index').textContent = `${currentPostIndex + 1} of ${posts.length}`;
        
        // Update button states
        document.getElementById('prev-post').disabled = currentPostIndex === 0;
        document.getElementById('next-post').disabled = currentPostIndex === posts.length - 1;
    }
})();
