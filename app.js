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
    const copyResultBtn = document.getElementById('copyResultBtn');

    // 添加复制结果功能
    copyResultBtn.addEventListener('click', () => {
        const textToCopy = analysisResult.textContent;
        navigator.clipboard.writeText(textToCopy)
            .then(() => {
                const originalText = copyResultBtn.innerHTML;
                copyResultBtn.innerHTML = '<i class="fas fa-check me-1"></i>已复制';
                copyResultBtn.classList.replace('btn-outline-secondary', 'btn-success');
                
                setTimeout(() => {
                    copyResultBtn.innerHTML = originalText;
                    copyResultBtn.classList.replace('btn-success', 'btn-outline-secondary');
                }, 2000);
            })
            .catch(err => {
                console.error('复制失败: ', err);
                copyResultBtn.innerHTML = '<i class="fas fa-times me-1"></i>复制失败';
                copyResultBtn.classList.replace('btn-outline-secondary', 'btn-danger');
                
                setTimeout(() => {
                    copyResultBtn.innerHTML = '<i class="fas fa-copy me-1"></i>复制结果';
                    copyResultBtn.classList.replace('btn-danger', 'btn-outline-secondary');
                }, 2000);
            });
    });
    
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
            
            // 显示加载中动画
            showProcessingAnimation();
            
            // 处理所有文件
            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                const path = file.webkitRelativePath.split('/');
                addFileToStructure(rootDir, path, file);
            }
            
            displayDirectoryStructure(rootDir);
        }
    }
    
    function showProcessingAnimation() {
        folderStructure.innerHTML = '<div class="text-center py-4"><div class="spinner-border text-primary" role="status"></div><p class="mt-3">正在处理文件夹结构...</p></div>';
        resultsSection.style.display = 'block';
    }

    // 添加颜色高亮和图标到格式化目录结构
    function formatDirectoryStructure(structure, level = 0) {
        if (!structure) return '';
        
        const indent = '  '.repeat(level);
        let result = '';
        
        if (structure.type === 'file') {
            // 根据文件扩展名添加适当的图标和颜色
            const fileExt = structure.name.split('.').pop().toLowerCase();
            const fileIcon = getFileIcon(fileExt);
            const fileColor = getFileColor(fileExt);
            result = `${indent}<span style="color:${fileColor}">${fileIcon} ${structure.name}</span> (${formatFileSize(structure.size)})\n`;
        } else if (structure.type === 'directory') {
            result = `${indent}<span style="color:#4361ee">📁 ${structure.name}/</span>\n`;
            
            if (structure.children && structure.children.length > 0) {
                for (const child of structure.children) {
                    result += formatDirectoryStructure(child, level + 1);
                }
            }
        }
        
        return result;
    }
    
    function getFileIcon(ext) {
        const iconMap = {
            'js': '📜',
            'ts': '📜',
            'html': '🌐',
            'css': '🎨',
            'scss': '🎨',
            'less': '🎨',
            'json': '📋',
            'md': '📝',
            'txt': '📄',
            'pdf': '📕',
            'png': '🖼️',
            'jpg': '🖼️',
            'jpeg': '🖼️',
            'gif': '🖼️',
            'svg': '🖌️',
            'mp3': '🎵',
            'mp4': '🎬',
            'zip': '📦',
            'rar': '📦',
            'exe': '⚙️',
            'dll': '⚙️',
            'py': '🐍',
            'rb': '💎',
            'php': '🐘',
            'java': '☕',
            'c': '🔧',
            'cpp': '🔧',
            'go': '🔹',
            'rs': '🦀',
        };
        
        return iconMap[ext] || '📄';
    }
    
    function getFileColor(ext) {
        const colorMap = {
            'js': '#f0db4f',
            'ts': '#007acc',
            'html': '#e34c26',
            'css': '#264de4',
            'scss': '#c6538c',
            'less': '#1d365d',
            'json': '#5b5b5b',
            'md': '#083fa1',
            'py': '#306998',
            'rb': '#cc342d',
            'php': '#787cb4',
            'java': '#b07219',
            'c': '#555555',
            'cpp': '#f34b7d',
            'go': '#00add8',
            'rs': '#dea584',
        };
        
        return colorMap[ext] || '#666666';
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

            // 加载marked.js库
            if (!window.marked) {
                await loadScript('https://cdn.jsdelivr.net/npm/marked/marked.min.js');
            }

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
            // 使用marked将Markdown转换为HTML
            analysisResult.innerHTML = marked.parse(data.choices[0].message.content);
            
            // 显示复制按钮
            copyResultBtn.style.display = 'inline-block';
            
            // 添加滚动到结果区域的动画效果
            resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        } catch (error) {
            analysisResult.textContent = '分析过程中发生错误: ' + error.message;
        } finally {
            loadingIndicator.style.display = 'none';
        }
    }

    // 加载外部脚本的辅助函数
    function loadScript(url) {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = url;
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }
    
    // 保留其他所有原始函数
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
        
        showProcessingAnimation();
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
        // 使用增强的格式化函数
        const formattedHTML = formatDirectoryStructure(structure);
        
        // 由于formatDirectoryStructure已经返回HTML，我们使用innerHTML
        folderStructure.innerHTML = formattedHTML;
        resultsSection.style.display = 'block';
        
        // 自动开始AI分析
        analyzeDirectory(structure);
    }

    function formatFileSize(bytes) {
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
        if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
        return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
    }
}); 