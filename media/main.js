// Main script for the webview
(function() {
    // Get a reference to the VS Code API
    const vscode = acquireVsCodeApi();
    
    // Initialize counter
    let count = 1;
    
    // Initialize posts array
    let posts = [];
    let currentPostIndex = 0;
    
    // Initialize form validation on page load
    document.addEventListener('DOMContentLoaded', () => {
        initFormHandling();
    });
    
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
    });      // API functionality
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
            
            // Display the first post in the detail view
            displayCurrentPost();
              // Show the grid container first
            const gridContainer = document.getElementById('grid-container');
            gridContainer.style.display = 'block';
            
            // Create and display the AG Grid
            setTimeout(() => {
                createAgGrid(posts);
                
                // Update UI
                document.getElementById('api-status').textContent = `Loaded ${posts.length} posts`;
                document.getElementById('fetch-data').disabled = false;
                document.getElementById('post-navigation').style.display = 'block';
                
                // Ensure proper scrolling
                window.scrollTo(0, 0);
            }, 100); // Small delay to ensure the container is visible
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
      // Create and initialize AG Grid
    function createAgGrid(data) {
        // Define the columns
        const columnDefs = [
            { field: 'id', headerName: 'ID', sortable: true, filter: true, width: 70 },
            { 
                field: 'title', 
                headerName: 'Title', 
                sortable: true, 
                filter: true, 
                flex: 2,
                tooltipField: 'title'
            },
            { 
                field: 'body', 
                headerName: 'Content', 
                sortable: true, 
                filter: true,
                flex: 3,
                tooltipField: 'body',
                cellRenderer: params => {
                    return params.value.substring(0, 100) + '...';
                }
            },
            {
                headerName: 'Actions',
                width: 100,
                cellRenderer: params => {
                    return '<button class="btn btn-sm btn-dark">View</button>';
                },
                onCellClicked: params => {
                    const id = params.data.id;
                    currentPostIndex = posts.findIndex(post => post.id === id);
                    displayCurrentPost();
                    // Scroll to the post details
                    document.getElementById('post-display').scrollIntoView({ behavior: 'smooth' });
                }
            }
        ];
          // Grid options
        const gridOptions = {
            columnDefs: columnDefs,
            rowData: data,
            pagination: true,
            paginationPageSize: 5,
            domLayout: 'normal',
            defaultColDef: {
                resizable: true,
                suppressSizeToFit: false
            },
            rowSelection: 'single',
            onRowClicked: params => {
                const id = params.data.id;
                currentPostIndex = posts.findIndex(post => post.id === id);
                displayCurrentPost();
            },
            onGridSizeChanged: (params) => {
                // Fit columns on resize
                params.api.sizeColumnsToFit();
            }
        };
        
        // Get the grid div element 
        const gridDiv = document.getElementById('ag-grid');
        
        // Clear any previous instance
        gridDiv.innerHTML = '';        // Try to create an AG Grid, with fallback to Bootstrap table
        try {
            // Try different ways to initialize AG Grid based on version
            if (typeof agGrid !== 'undefined') {
                if (typeof agGrid.Grid === 'function') {
                    new agGrid.Grid(gridDiv, gridOptions);
                } else if (typeof agGrid.AgGrid === 'function') {
                    new agGrid.AgGrid(gridDiv, gridOptions);
                } else if (typeof agGrid.createGrid === 'function') {
                    agGrid.createGrid(gridDiv, gridOptions);
                } else {
                    throw new Error("AG Grid API not found");
                }
            } else {
                throw new Error("AG Grid not loaded");
            }
        } catch (error) {
            console.error("AG Grid initialization failed:", error);
            // Fall back to bootstrap table
            createBootstrapTable(data);
        }    }
    
    // Create a Bootstrap table as fallback when AG Grid fails
    function createBootstrapTable(data) {
        // Show the bootstrap table and hide the ag-grid
        document.getElementById('ag-grid').style.display = 'none';
        const bootstrapTable = document.getElementById('bootstrap-table');
        bootstrapTable.style.display = 'block';
        
        const tableBody = document.getElementById('table-body');
        tableBody.innerHTML = '';
        
        // Add rows to the table
        data.forEach(post => {
            const row = document.createElement('tr');
            
            const idCell = document.createElement('td');
            idCell.textContent = post.id;
            
            const titleCell = document.createElement('td');
            titleCell.textContent = post.title.length > 30 ? post.title.substring(0, 30) + '...' : post.title;
            titleCell.title = post.title;
            
            const bodyCell = document.createElement('td');
            bodyCell.textContent = post.body.length > 50 ? post.body.substring(0, 50) + '...' : post.body;
            bodyCell.title = post.body;
            
            const actionCell = document.createElement('td');
            const viewButton = document.createElement('button');
            viewButton.className = 'btn btn-sm btn-dark';
            viewButton.textContent = 'View';
            viewButton.onclick = () => {
                currentPostIndex = posts.findIndex(p => p.id === post.id);
                displayCurrentPost();
                document.getElementById('post-display').scrollIntoView({ behavior: 'smooth' });
            };
            actionCell.appendChild(viewButton);
            
            row.appendChild(idCell);
            row.appendChild(titleCell);
            row.appendChild(bodyCell);
            row.appendChild(actionCell);
            
            tableBody.appendChild(row);
        });
        
    // Tell the user we're using the fallback
        document.getElementById('api-status').textContent = `Loaded ${data.length} posts (using fallback table)`;
    }
      // Initialize form validation and handling
    function initFormHandling() {
        const form = document.getElementById('demo-form');
        
        // Add event listener for form submission
        if (form) {
            form.addEventListener('submit', handleFormSubmit);
            
            // Add listeners for input validation feedback
            const inputs = form.querySelectorAll('input, select, textarea');
            inputs.forEach(input => {
                input.addEventListener('blur', () => {
                    if (input.checkValidity()) {
                        input.classList.remove('is-invalid');
                        input.classList.add('is-valid');
                    } else {
                        input.classList.remove('is-valid');
                        input.classList.add('is-invalid');
                    }
                });
            });
        }
    }
    
    // Handle form submission
    function handleFormSubmit(event) {
        event.preventDefault();
        
        // Get form element
        const form = event.target;
        
        // Check form validity using Bootstrap validation
        if (!form.checkValidity()) {
            event.stopPropagation();
            form.classList.add('was-validated');
            return;
        }
        
        // Collect form data
        const formData = {
            name: document.getElementById('name').value,
            email: document.getElementById('email').value,
            category: document.getElementById('category').value,
            experience: document.querySelector('input[name="experience"]:checked')?.value || '',
            subscribe: document.getElementById('subscribe').checked,
            comments: document.getElementById('comments').value
        };
        
        // Format the message for display
        let message = `Form submitted successfully!\n\n`;
        message += `Name: ${formData.name}\n`;
        message += `Email: ${formData.email}\n`;
        message += `Category: ${formData.category}\n`;
        message += `Experience: ${formData.experience}\n`;
        message += `Subscribe: ${formData.subscribe ? 'Yes' : 'No'}\n`;
        if (formData.comments) {
            message += `Comments: ${formData.comments}\n`;
        }
        
        // Send message to VS Code extension to display as a notification
        vscode.postMessage({
            command: 'alert',
            text: message
        });
        
        // Reset form
        form.classList.remove('was-validated');
        form.reset();
    }
})();
