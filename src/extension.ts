import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

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
            currentPanel.webview.html = getWebviewContent(context.extensionUri, currentPanel.webview);

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

/**
 * Get the HTML content for the webview
 */
function getWebviewContent(extensionUri: vscode.Uri, webview: vscode.Webview): string {
    // Get path to resource on disk
    const scriptPathOnDisk = vscode.Uri.joinPath(extensionUri, 'media', 'main.js');
    const stylePathOnDisk = vscode.Uri.joinPath(extensionUri, 'media', 'styles.css');
    const htmlPathOnDisk = vscode.Uri.joinPath(extensionUri, 'media', 'webview.html');
    
    // And get the special URI to use with the webview
    const scriptUri = webview.asWebviewUri(scriptPathOnDisk);
    const styleUri = webview.asWebviewUri(stylePathOnDisk);
    
    // Read the HTML file
    const htmlContent = fs.readFileSync(htmlPathOnDisk.fsPath, 'utf8');
    
    // Replace the placeholders with actual URIs
    return htmlContent
        .replace('${scriptUri}', scriptUri.toString())
        .replace('${styleUri}', styleUri.toString());
}

export function deactivate() {}
