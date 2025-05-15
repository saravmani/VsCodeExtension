import * as vscode from 'vscode';

/**
 * Track the current panel so we only create one instance
 */
let currentPanel: vscode.WebviewPanel | undefined = undefined;

export function activate(context: vscode.ExtensionContext) {
    console.log('Extension "simple-webview-extension" is now active!');

    // Register our command
    let disposable = vscode.commands.registerCommand('simple-webview-extension.showWebView', () => {
        // Create and show panel
        const columnToShowIn = vscode.window.activeTextEditor
            ? vscode.window.activeTextEditor.viewColumn
            : undefined;
        
        if (currentPanel) {
            // If we already have a panel, show it in the target column
            currentPanel.reveal(columnToShowIn);
        } else {
            // Create a new panel
            currentPanel = vscode.window.createWebviewPanel(
                'simpleWebView',
                'Simple Web UI',
                columnToShowIn || vscode.ViewColumn.One,
                {
                    // Enable scripts in the webview
                    enableScripts: true,
                    // Restrict the webview to only loading content from our extension's directory
                    localResourceRoots: [vscode.Uri.joinPath(context.extensionUri, 'media')]
                }
            );

            // Set HTML content
            currentPanel.webview.html = getWebviewContent();

            // Handle messages from the webview
            currentPanel.webview.onDidReceiveMessage(
                message => {
                    switch (message.command) {
                        case 'alert':
                            vscode.window.showInformationMessage(message.text);
                            return;
                    }
                },
                undefined,
                context.subscriptions
            );

            // Reset when the current panel is closed
            currentPanel.onDidDispose(
                () => {
                    currentPanel = undefined;
                },
                null,
                context.subscriptions
            );
        }
    });

    context.subscriptions.push(disposable);
}

function getWebviewContent() {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Simple Web UI</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 20px;
            color: var(--vscode-foreground);
            background-color: var(--vscode-editor-background);
        }
        .container {
            display: flex;
            flex-direction: column;
            align-items: center;
        }
        h1 {
            color: var(--vscode-editor-foreground);
            margin-bottom: 20px;
        }
        button {
            padding: 10px 20px;
            font-size: 16px;
            background-color: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
            border: none;
            border-radius: 4px;
            cursor: pointer;
            margin: 10px 0;
            transition: background-color 0.2s;
        }
        button:hover {
            background-color: var(--vscode-button-hoverBackground);
        }
        .counter {
            font-size: 24px;
            margin: 20px 0;
        }
        .input-group {
            margin: 10px 0;
            width: 100%;
            max-width: 300px;
        }
        input {
            padding: 8px;
            width: 100%;
            border: 1px solid var(--vscode-input-border);
            background-color: var(--vscode-input-background);
            color: var(--vscode-input-foreground);
            border-radius: 4px;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>Simple VS Code Extension Web UI</h1>
        <div class="counter">Count: <span id="counter">0</span></div>
        <div>
            <button id="increment">Increment</button>
            <button id="decrement">Decrement</button>
        </div>
        <div class="input-group">
            <input type="text" id="message-input" placeholder="Enter a message">
            <button id="send-message">Send Message to VS Code</button>
        </div>
    </div>

    <script>
        (function() {
            const vscode = acquireVsCodeApi();
            let count = 0;
            
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
        }())
    </script>
</body>
</html>`;
}

export function deactivate() {}
