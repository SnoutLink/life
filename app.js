document.addEventListener('DOMContentLoaded', () => {
    const dropArea = document.getElementById('dropArea');
    const folderInput = document.getElementById('folderInput');
    const folderStructure = document.getElementById('folderStructure');
    const analysisResult = document.getElementById('analysisResult');
    const resultsSection = document.getElementById('resultsSection');
    const loadingIndicator = document.getElementById('loadingIndicator');
    const modelSelect = document.getElementById('modelSelect');
    const depthInput = document.getElementById('depthInput');
    const ignorePatterns = document.getElementById('ignorePatterns');

    // 处理拖放事件
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropArea.addEventListener(eventName, preventDefaults, false);
    });

    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    ['dragenter', 'dragover'].forEach(eventName => {
        dropArea.addEventListener(eventName, highlight, false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
        dropArea.addEventListener(eventName, unhighlight, false);
    });

    function highlight() {
        dropArea.classList.add('highlight');
    }

    function unhighlight() {
        dropArea.classList.remove('highlight');
    }

    // 处理文件拖放
    dropArea.addEventListener('drop', handleDrop, false);
    folderInput.addEventListener('change', handleFileSelect, false);

    function handleDrop(e) {
        const dt = e.dataTransfer;
        const items = dt.items;
        
        if (items) {
            // 使用DataTransferItemList接口
            for (let i = 0; i < items.length; i++) {
                if (items[i].kind === 'file') {
                    const entry = items[i].webkitGetAsEntry();
                    if (entry && entry.isDirectory) {
                        processDirectory(entry);
                    }
                }
            }
        }
    }

    function handleFileSelect(e) {
        const files = e.target.files;
        if (files.length > 0) {
            const entry = files[0].webkitRelativePath.split('/')[0];
            const rootDir = {
                name: entry,
                type: 'directory',
                children: []
            };
            
            // 处理所有文件
            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                const path = file.webkitRelativePath.split('/');
                addFileToStructure(rootDir, path, file);
            }
            
            displayDirectoryStructure(rootDir);
        }
    }

    function addFileToStructure(root, path, file) {
        let current = root;
        for (let i = 1; i < path.length - 1; i++) {
            let found = current.children.find(child => child.name === path[i]);
            if (!found) {
                found = {
                    name: path[i],
                    type: 'directory',
                    children: []
                };
                current.children.push(found);
            }
            current = found;
        }
        
        current.children.push({
            name: path[path.length - 1],
            type: 'file',
            size: file.size
        });
    }

    function processDirectory(entry) {
        const rootDir = {
            name: entry.name,
            type: 'directory',
            children: []
        };
        
        readDirectory(entry, rootDir);
    }

    function readDirectory(entry, parent) {
        const reader = entry.createReader();
        
        reader.readEntries(entries => {
            entries.forEach(entry => {
                const item = {
                    name: entry.name,
                    type: entry.isDirectory ? 'directory' : 'file',
                    children: entry.isDirectory ? [] : undefined,
                    size: entry.isFile ? entry.size : undefined
                };
                
                parent.children.push(item);
                
                if (entry.isDirectory) {
                    readDirectory(entry, item);
                }
            });
            
            // 当所有子项都处理完后，显示目录结构
            if (parent.name === rootDir.name) {
                displayDirectoryStructure(rootDir);
            }
        });
    }

    function displayDirectoryStructure(structure) {
        const formattedStructure = formatDirectoryStructure(structure);
        folderStructure.textContent = formattedStructure;
        resultsSection.style.display = 'block';
        
        // 自动开始AI分析
        analyzeDirectory(structure);
    }

    function formatDirectoryStructure(structure, level = 0) {
        if (!structure) return '';
        
        const indent = '  '.repeat(level);
        let result = '';
        
        if (structure.type === 'file') {
            result = `${indent}- ${structure.name} (${formatFileSize(structure.size)})\n`;
        } else if (structure.type === 'directory') {
            result = `${indent}📁 ${structure.name}/\n`;
            
            if (structure.children && structure.children.length > 0) {
                for (const child of structure.children) {
                    result += formatDirectoryStructure(child, level + 1);
                }
            }
        }
        
        return result;
    }

    function formatFileSize(bytes) {
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
        if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
        return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
    }

    async function analyzeDirectory(structure) {
        const formattedStructure = formatDirectoryStructure(structure);
        const promptText = `以下是一个目录结构的文本表示。请分析这个目录结构并猜测它可能是什么类型的项目或用途。
包括可能的开发语言、框架、项目类型和其他相关信息。

目录结构:
${formattedStructure}

分析结果:`;

        try {
            loadingIndicator.style.display = 'flex';
            analysisResult.textContent = '';

            const response = await fetch('https://zheng.2020classes4.dpdns.org', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    model: modelSelect.value,
                    messages: [
                        {
                            role: "user",
                            content: [{ type: "text", text: promptText }]
                        }
                    ],
                    stream: false
                })
            });

            const data = await response.json();
            analysisResult.textContent = data.choices[0].message.content;
        } catch (error) {
            analysisResult.textContent = '分析过程中发生错误: ' + error.message;
        } finally {
            loadingIndicator.style.display = 'none';
        }
    }
}); 