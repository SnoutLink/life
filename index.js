#!/usr/bin/env node

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { program } = require('commander');
const axios = require('axios');

// 设置命令行选项
program
  .version('1.0.0')
  .description('读取目录结构并使用AI猜测其用途')
  .argument('<directory>', '要分析的目录路径')
  .option('-d, --depth <number>', '递归读取的深度', '2')
  .option('-i, --ignore <patterns>', '忽略的文件或目录模式，用逗号分隔', '')
  .option('-m, --model <model>', 'AI模型名称', 'qwen/qwen3-235b-a22b:free')
  .action(async (directoryPath, options) => {
    try {
      const depth = parseInt(options.depth);
      const ignorePatterns = options.ignore ? options.ignore.split(',') : [];
      const model = options.model;
      
      console.log(`分析目录: ${directoryPath}`);
      console.log(`递归深度: ${depth}`);
      console.log(`使用模型: ${model}`);
      
      if (ignorePatterns.length > 0) {
        console.log(`忽略的模式: ${ignorePatterns.join(', ')}`);
      }
      
      // 检查目录是否存在
      if (!fs.existsSync(directoryPath)) {
        console.error(`错误: 目录 "${directoryPath}" 不存在`);
        process.exit(1);
      }
      
      // 读取目录结构
      const dirStructure = scanDirectory(directoryPath, depth, ignorePatterns);
      
      // 分析目录结构
      const analysis = await analyzeDirectory(dirStructure, model);
      
      console.log('\n目录分析结果:');
      console.log('-'.repeat(50));
      console.log(analysis);
      console.log('-'.repeat(50));
      
    } catch (error) {
      console.error('发生错误:', error.message);
    }
  });

program.parse(process.argv);

/**
 * 递归扫描目录结构
 * @param {string} dirPath - 要扫描的目录路径
 * @param {number} maxDepth - 最大递归深度
 * @param {string[]} ignorePatterns - 要忽略的文件/目录模式
 * @param {number} currentDepth - 当前递归深度
 * @returns {Object} 目录结构对象
 */
function scanDirectory(dirPath, maxDepth = 2, ignorePatterns = [], currentDepth = 0) {
  const absolutePath = path.resolve(dirPath);
  const baseName = path.basename(absolutePath);
  
  // 检查是否应该忽略此路径
  if (ignorePatterns.some(pattern => new RegExp(pattern).test(baseName))) {
    return null;
  }
  
  try {
    const stats = fs.statSync(absolutePath);
    
    if (stats.isDirectory()) {
      const result = {
        name: baseName,
        type: 'directory',
        path: absolutePath,
        children: []
      };
      
      // 如果未达到最大深度，则递归扫描子目录
      if (currentDepth < maxDepth) {
        const items = fs.readdirSync(absolutePath);
        
        for (const item of items) {
          const itemPath = path.join(absolutePath, item);
          const childItem = scanDirectory(itemPath, maxDepth, ignorePatterns, currentDepth + 1);
          
          if (childItem) {
            result.children.push(childItem);
          }
        }
      }
      
      return result;
    } else if (stats.isFile()) {
      return {
        name: baseName,
        type: 'file',
        path: absolutePath,
        extension: path.extname(baseName).toLowerCase(),
        size: stats.size
      };
    }
  } catch (error) {
    console.error(`无法读取 ${absolutePath}: ${error.message}`);
    return null;
  }
  
  return null;
}

/**
 * 将目录结构对象转换为可读文本
 * @param {Object} dirStructure - 目录结构对象
 * @param {number} level - 当前嵌套级别
 * @returns {string} 格式化的目录结构文本
 */
function formatDirectoryStructure(dirStructure, level = 0) {
  if (!dirStructure) return '';
  
  const indent = '  '.repeat(level);
  
  if (dirStructure.type === 'file') {
    return `${indent}- ${dirStructure.name} (${formatFileSize(dirStructure.size)})\n`;
  } else if (dirStructure.type === 'directory') {
    let result = `${indent}📁 ${dirStructure.name}/\n`;
    
    if (dirStructure.children && dirStructure.children.length > 0) {
      for (const child of dirStructure.children) {
        result += formatDirectoryStructure(child, level + 1);
      }
    }
    
    return result;
  }
  
  return '';
}

/**
 * 格式化文件大小
 * @param {number} bytes - 文件大小（字节）
 * @returns {string} 格式化的文件大小
 */
function formatFileSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

/**
 * 使用OpenRouter API代理服务分析目录结构
 * @param {Object} dirStructure - 目录结构对象
 * @param {string} model - 要使用的AI模型名称
 * @returns {Promise<string>} AI生成的分析结果
 */
async function analyzeDirectory(dirStructure, model) {
  // 格式化目录结构为可读文本
  const formattedStructure = formatDirectoryStructure(dirStructure);
  
  // 构建提示文本
  const promptText = `以下是一个目录结构的文本表示。请分析这个目录结构并猜测它可能是什么类型的项目或用途。
包括可能的开发语言、框架、项目类型和其他相关信息。

目录结构:
${formattedStructure}

分析结果:`;

  try {
    console.log('正在请求AI分析...');
    
    // 使用代理服务API调用模型
    const response = await axios.post(
      'https://zheng.2020classes4.dpdns.org',
      {
        model: model,
        messages: [
          {
            role: "user",
            content: [{ type: "text", text: promptText }]
          }
        ],
        stream: false
      },
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
    
    // 从响应中提取助手的回复
    return response.data.choices[0].message.content;
  } catch (error) {
    console.error('调用API时出错:', error.response ? error.response.data : error.message);
    return '无法完成AI分析。请检查API连接。';
  }
} 