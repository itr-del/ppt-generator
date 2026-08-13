import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/* ─── Frontend-Slides Style Presets (12 themes) ─── */
const THEMES = {
  'bold-signal': {
    name: 'Bold Signal · 自信信号',
    scheme: 'dark',
    displayFont: 'Archivo Black',
    bodyFont: 'Space Grotesk',
    fontUrl: 'https://fonts.googleapis.com/css2?family=Archivo+Black&family=Space+Grotesk:wght@400;500&display=swap',
    cssVars: {
      '--bg-primary': '#1a1a1a',
      '--bg-gradient': 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 50%, #1a1a1a 100%)',
      '--card-bg': '#FF5722',
      '--text-primary': '#ffffff',
      '--text-on-card': '#1a1a1a',
      '--text-secondary': '#9ca3af',
      '--accent': '#FF5722',
      '--accent-light': 'rgba(255,87,34,0.15)',
      '--border': 'rgba(255,255,255,0.1)',
      '--title-size': '80px',
      '--subtitle-size': '32px',
      '--body-size': '26px',
      '--slide-padding': '72px',
      '--cover-bg': 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 50%, #1a1a1a 100%)',
      '--cover-text': '#ffffff',
      '--section-bg': 'linear-gradient(135deg, #2d2d2d 0%, #1a1a1a 100%)',
      '--section-text': '#FF5722',
      '--ending-bg': '#1a1a1a',
      '--ending-text': '#ffffff',
      '--content-bg': '#1a1a1a',
      '--card-bg-2': '#2d2d2d',
    },
  },
  'electric-studio': {
    name: 'Electric Studio · 电力工作室',
    scheme: 'dark',
    displayFont: 'Manrope',
    bodyFont: 'Manrope',
    fontUrl: 'https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;800&display=swap',
    cssVars: {
      '--bg-primary': '#0a0a0a',
      '--bg-white': '#ffffff',
      '--accent-blue': '#4361ee',
      '--text-primary': '#0a0a0a',
      '--text-light': '#ffffff',
      '--text-secondary': '#94a3b8',
      '--border': 'rgba(255,255,255,0.1)',
      '--title-size': '76px',
      '--subtitle-size': '30px',
      '--body-size': '24px',
      '--slide-padding': '72px',
      '--cover-bg': 'linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 100%)',
      '--cover-text': '#ffffff',
      '--section-bg': '#0a0a0a',
      '--section-text': '#4361ee',
      '--ending-bg': '#0a0a0a',
      '--ending-text': '#ffffff',
      '--content-bg': '#ffffff',
      '--card-bg-2': '#f8f9fa',
    },
  },
  'creative-voltage': {
    name: 'Creative Voltage · 创意电压',
    scheme: 'dark',
    displayFont: 'Syne',
    bodyFont: 'Space Mono',
    fontUrl: 'https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=Space+Mono:wght@400;700&display=swap',
    cssVars: {
      '--bg-primary': '#0066ff',
      '--bg-dark': '#1a1a2e',
      '--accent-neon': '#d4ff00',
      '--text-light': '#ffffff',
      '--text-secondary': 'rgba(255,255,255,0.7)',
      '--border': 'rgba(255,255,255,0.15)',
      '--title-size': '80px',
      '--subtitle-size': '28px',
      '--body-size': '22px',
      '--slide-padding': '72px',
      '--cover-bg': '#0066ff',
      '--cover-text': '#ffffff',
      '--section-bg': '#1a1a2e',
      '--section-text': '#d4ff00',
      '--ending-bg': '#1a1a2e',
      '--ending-text': '#ffffff',
      '--content-bg': '#1a1a2e',
      '--card-bg-2': 'rgba(255,255,255,0.05)',
    },
  },
  'dark-botanical': {
    name: 'Dark Botanical · 暗黑植物',
    scheme: 'dark',
    displayFont: 'Cormorant',
    bodyFont: 'IBM Plex Sans',
    fontUrl: 'https://fonts.googleapis.com/css2?family=Cormorant:ital,wght@0,400;0,600;1,400&family=IBM+Plex+Sans:wght@300;400&display=swap',
    cssVars: {
      '--bg-primary': '#0f0f0f',
      '--text-primary': '#e8e4df',
      '--text-secondary': '#9a9590',
      '--accent': '#d4a574',
      '--accent-pink': '#e8b4b8',
      '--accent-gold': '#c9b896',
      '--border': 'rgba(232,228,223,0.1)',
      '--title-size': '80px',
      '--subtitle-size': '30px',
      '--body-size': '24px',
      '--slide-padding': '72px',
      '--cover-bg': '#0f0f0f',
      '--cover-text': '#e8e4df',
      '--section-bg': '#0f0f0f',
      '--section-text': '#d4a574',
      '--ending-bg': '#0f0f0f',
      '--ending-text': '#e8e4df',
      '--content-bg': '#0f0f0f',
      '--card-bg-2': '#1a1a1a',
    },
  },
  'notebook-tabs': {
    name: 'Notebook Tabs · 笔记本标签',
    scheme: 'light',
    displayFont: 'Bodoni Moda',
    bodyFont: 'DM Sans',
    fontUrl: 'https://fonts.googleapis.com/css2?family=Bodoni+Moda:opsz,wght@6..96,400;6..96,700&family=DM+Sans:wght@400;500&display=swap',
    cssVars: {
      '--bg-outer': '#2d2d2d',
      '--bg-page': '#f8f6f1',
      '--text-primary': '#1a1a1a',
      '--text-secondary': '#6b7280',
      '--tab-1': '#98d4bb',
      '--tab-2': '#c7b8ea',
      '--tab-3': '#f4b8c5',
      '--tab-4': '#a8d8ea',
      '--tab-5': '#ffe6a7',
      '--border': '#e5e0d8',
      '--title-size': '72px',
      '--subtitle-size': '28px',
      '--body-size': '24px',
      '--slide-padding': '72px',
      '--cover-bg': '#f8f6f1',
      '--cover-text': '#1a1a1a',
      '--section-bg': '#f8f6f1',
      '--section-text': '#1a1a1a',
      '--ending-bg': '#f8f6f1',
      '--ending-text': '#1a1a1a',
      '--content-bg': '#f8f6f1',
      '--card-bg-2': '#ffffff',
    },
  },
  'pastel-geometry': {
    name: 'Pastel Geometry · 粉彩几何',
    scheme: 'light',
    displayFont: 'Plus Jakarta Sans',
    bodyFont: 'Plus Jakarta Sans',
    fontUrl: 'https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;700;800&display=swap',
    cssVars: {
      '--bg-pastel': '#c8d9e6',
      '--card-bg': '#faf9f7',
      '--pill-pink': '#f0b4d4',
      '--pill-mint': '#a8d4c4',
      '--pill-sage': '#5a7c6a',
      '--pill-lavender': '#9b8dc4',
      '--pill-violet': '#7c6aad',
      '--text-primary': '#1a1a1a',
      '--text-secondary': '#6b7280',
      '--border': '#e5e7eb',
      '--title-size': '72px',
      '--subtitle-size': '28px',
      '--body-size': '24px',
      '--slide-padding': '72px',
      '--cover-bg': '#c8d9e6',
      '--cover-text': '#1a1a1a',
      '--section-bg': '#c8d9e6',
      '--section-text': '#1a1a1a',
      '--ending-bg': '#c8d9e6',
      '--ending-text': '#1a1a1a',
      '--content-bg': '#faf9f7',
      '--card-bg-2': '#ffffff',
    },
  },
  'split-pastel': {
    name: 'Split Pastel · 分屏粉彩',
    scheme: 'light',
    displayFont: 'Outfit',
    bodyFont: 'Outfit',
    fontUrl: 'https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;700;800&display=swap',
    cssVars: {
      '--bg-peach': '#f5e6dc',
      '--bg-lavender': '#e4dff0',
      '--text-primary': '#1a1a1a',
      '--text-secondary': '#6b7280',
      '--badge-mint': '#c8f0d8',
      '--badge-yellow': '#f0f0c8',
      '--badge-pink': '#f0d4e0',
      '--border': '#e5e7eb',
      '--title-size': '72px',
      '--subtitle-size': '28px',
      '--body-size': '24px',
      '--slide-padding': '72px',
      '--cover-bg': 'linear-gradient(135deg, #f5e6dc 0%, #e4dff0 100%)',
      '--cover-text': '#1a1a1a',
      '--section-bg': 'linear-gradient(135deg, #f5e6dc 0%, #e4dff0 100%)',
      '--section-text': '#1a1a1a',
      '--ending-bg': 'linear-gradient(135deg, #f5e6dc 0%, #e4dff0 100%)',
      '--ending-text': '#1a1a1a',
      '--content-bg': '#ffffff',
      '--card-bg-2': '#f8f9fa',
    },
  },
  'vintage-editorial': {
    name: 'Vintage Editorial · 复古编辑',
    scheme: 'light',
    displayFont: 'Fraunces',
    bodyFont: 'Work Sans',
    fontUrl: 'https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,700;9..144,900&family=Work+Sans:wght@400;500&display=swap',
    cssVars: {
      '--bg-cream': '#f5f3ee',
      '--text-primary': '#1a1a1a',
      '--text-secondary': '#555555',
      '--accent-warm': '#e8d4c0',
      '--accent': '#c41e3a',
      '--border': '#d4cfc8',
      '--title-size': '80px',
      '--subtitle-size': '30px',
      '--body-size': '24px',
      '--slide-padding': '72px',
      '--cover-bg': '#f5f3ee',
      '--cover-text': '#1a1a1a',
      '--section-bg': '#f5f3ee',
      '--section-text': '#c41e3a',
      '--ending-bg': '#f5f3ee',
      '--ending-text': '#1a1a1a',
      '--content-bg': '#f5f3ee',
      '--card-bg-2': '#ffffff',
    },
  },
  'neon-cyber': {
    name: 'Neon Cyber · 霓虹赛博',
    scheme: 'dark',
    displayFont: 'Clash Display',
    bodyFont: 'Satoshi',
    fontUrl: 'https://api.fontshare.com/v2/css?f[]=clash-display@700,400&f[]=satoshi@400,500&display=swap',
    cssVars: {
      '--bg-primary': '#0a0f1c',
      '--bg-secondary': '#111827',
      '--text-primary': '#ffffff',
      '--text-secondary': '#9ca3af',
      '--accent': '#00ffcc',
      '--accent-magenta': '#ff00aa',
      '--accent-glow': 'rgba(0,255,204,0.3)',
      '--border': 'rgba(255,255,255,0.1)',
      '--title-size': '80px',
      '--subtitle-size': '32px',
      '--body-size': '24px',
      '--slide-padding': '72px',
      '--cover-bg': 'linear-gradient(135deg, #0a0f1c 0%, #111827 100%)',
      '--cover-text': '#00ffcc',
      '--section-bg': 'linear-gradient(135deg, #0a0f1c 0%, #111827 100%)',
      '--section-text': '#00ffcc',
      '--ending-bg': '#0a0f1c',
      '--ending-text': '#00ffcc',
      '--content-bg': '#0a0f1c',
      '--card-bg-2': 'rgba(255,255,255,0.05)',
    },
  },
  'terminal-green': {
    name: 'Terminal Green · 终端绿色',
    scheme: 'dark',
    displayFont: 'JetBrains Mono',
    bodyFont: 'JetBrains Mono',
    fontUrl: 'https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;700&display=swap',
    cssVars: {
      '--bg-primary': '#0d1117',
      '--text-primary': '#39d353',
      '--text-secondary': '#8b949e',
      '--accent': '#39d353',
      '--accent-dim': '#1a4a1a',
      '--border': 'rgba(57,211,83,0.2)',
      '--title-size': '64px',
      '--subtitle-size': '28px',
      '--body-size': '22px',
      '--slide-padding': '72px',
      '--cover-bg': '#0d1117',
      '--cover-text': '#39d353',
      '--section-bg': '#0d1117',
      '--section-text': '#39d353',
      '--ending-bg': '#0d1117',
      '--ending-text': '#39d353',
      '--content-bg': '#0d1117',
      '--card-bg-2': '#161b22',
    },
  },
  'swiss-modern': {
    name: 'Swiss Modern · 瑞士现代',
    scheme: 'light',
    displayFont: 'Archivo',
    bodyFont: 'Nunito',
    fontUrl: 'https://fonts.googleapis.com/css2?family=Archivo:wght@400;800&family=Nunito:wght@400;600&display=swap',
    cssVars: {
      '--bg-primary': '#ffffff',
      '--text-primary': '#000000',
      '--text-secondary': '#404040',
      '--accent': '#ff3300',
      '--border': '#cccccc',
      '--title-size': '80px',
      '--subtitle-size': '32px',
      '--body-size': '24px',
      '--slide-padding': '72px',
      '--cover-bg': '#ffffff',
      '--cover-text': '#000000',
      '--section-bg': '#f5f5f5',
      '--section-text': '#ff3300',
      '--ending-bg': '#000000',
      '--ending-text': '#ffffff',
      '--content-bg': '#ffffff',
      '--card-bg-2': '#f5f5f5',
    },
  },
  'paper-ink': {
    name: 'Paper & Ink · 纸墨书香',
    scheme: 'light',
    displayFont: 'Cormorant Garamond',
    bodyFont: 'Source Serif 4',
    fontUrl: 'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;1,400&family=Source+Serif+4:opsz,wght@8..60,400;8..60,600&display=swap',
    cssVars: {
      '--bg-primary': '#faf9f7',
      '--text-primary': '#1a1a1a',
      '--text-secondary': '#4a4a4a',
      '--accent': '#c41e3a',
      '--border': '#e0ddd8',
      '--title-size': '80px',
      '--subtitle-size': '30px',
      '--body-size': '26px',
      '--slide-padding': '80px',
      '--cover-bg': '#faf9f7',
      '--cover-text': '#1a1a1a',
      '--section-bg': '#faf9f7',
      '--section-text': '#c41e3a',
      '--ending-bg': '#faf9f7',
      '--ending-text': '#1a1a1a',
      '--content-bg': '#faf9f7',
      '--card-bg-2': '#ffffff',
    },
  },
  // Preserve old themes as backward-compatible options
  'blue-professional': {
    name: '简约商务 · 经典蓝',
    scheme: 'light',
    displayFont: 'Noto Sans SC',
    bodyFont: 'Noto Sans SC',
    fontUrl: 'https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@300;400;500;700&display=swap',
    cssVars: {
      '--bg-primary': '#f8fafc',
      '--text-primary': '#1e293b',
      '--accent': '#2563eb',
      '--accent-light': '#dbeafe',
      '--accent-dark': '#1e3a5f',
      '--text-secondary': '#64748b',
      '--border': '#e2e8f0',
      '--title-size': '76px',
      '--subtitle-size': '32px',
      '--body-size': '24px',
      '--slide-padding': '72px',
      '--cover-bg': 'linear-gradient(135deg, #1e3a5f 0%, #2563eb 50%, #1d4ed8 100%)',
      '--cover-text': '#ffffff',
      '--section-bg': 'linear-gradient(135deg, #dbeafe 0%, #eff6ff 100%)',
      '--section-text': '#1e3a5f',
      '--ending-bg': '#1e3a5f',
      '--ending-text': '#ffffff',
      '--content-bg': '#ffffff',
      '--card-bg-2': '#f8fafc',
    },
  },
  // Legacy themes (backward compatibility)
  'dark-tech': {
    name: '科技感 · 深色',
    scheme: 'dark',
    displayFont: 'Noto Sans SC',
    bodyFont: 'Noto Sans SC',
    fontUrl: 'https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@300;400;500;700&display=swap',
    cssVars: {
      '--bg-primary': '#0f172a',
      '--text-primary': '#e2e8f0',
      '--accent': '#06b6d4',
      '--accent-light': '#0891b2',
      '--text-secondary': '#94a3b8',
      '--border': '#334155',
      '--title-size': '76px',
      '--subtitle-size': '32px',
      '--body-size': '24px',
      '--slide-padding': '72px',
      '--cover-bg': 'linear-gradient(135deg, #020617 0%, #0f172a 30%, #1e293b 60%, #0f172a 100%)',
      '--cover-text': '#e2e8f0',
      '--section-bg': 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
      '--section-text': '#06b6d4',
      '--ending-bg': '#020617',
      '--ending-text': '#e2e8f0',
      '--content-bg': '#1e293b',
      '--card-bg-2': '#0f172a',
    },
  },
  'soft-pastel': {
    name: '小清新 · 粉彩',
    scheme: 'light',
    displayFont: 'Noto Sans SC',
    bodyFont: 'Noto Sans SC',
    fontUrl: 'https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@300;400;500;700&display=swap',
    cssVars: {
      '--bg-primary': '#fefce8',
      '--text-primary': '#1e293b',
      '--accent': '#f59e0b',
      '--accent-light': '#fef3c7',
      '--text-secondary': '#78716c',
      '--border': '#fde68a',
      '--title-size': '72px',
      '--subtitle-size': '30px',
      '--body-size': '24px',
      '--slide-padding': '72px',
      '--cover-bg': 'linear-gradient(135deg, #fefce8 0%, #fef3c7 50%, #fde68a 100%)',
      '--cover-text': '#1e293b',
      '--section-bg': 'linear-gradient(135deg, #fef3c7 0%, #fffbeb 100%)',
      '--section-text': '#92400e',
      '--ending-bg': '#fefce8',
      '--ending-text': '#1e293b',
      '--content-bg': '#ffffff',
      '--card-bg-2': '#fefce8',
    },
  },
  'luxury-gold': {
    name: '高端大气 · 深蓝金',
    scheme: 'dark',
    displayFont: 'Noto Sans SC',
    bodyFont: 'Noto Sans SC',
    fontUrl: 'https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@300;400;500;700&display=swap',
    cssVars: {
      '--bg-primary': '#fafaf9',
      '--text-primary': '#1c1917',
      '--accent': '#c8a76e',
      '--accent-light': '#f5f0e6',
      '--text-secondary': '#78716c',
      '--border': '#e7e5e4',
      '--title-size': '76px',
      '--subtitle-size': '32px',
      '--body-size': '24px',
      '--slide-padding': '72px',
      '--cover-bg': 'linear-gradient(135deg, #1e293b 0%, #334155 50%, #1e293b 100%)',
      '--cover-text': '#f5f0e6',
      '--section-bg': 'linear-gradient(135deg, #f5f0e6 0%, #fafaf9 100%)',
      '--section-text': '#1e293b',
      '--ending-bg': '#1e293b',
      '--ending-text': '#f5f0e6',
      '--content-bg': '#ffffff',
      '--card-bg-2': '#fafaf9',
    },
  },
  'academic-strict': {
    name: '学术严谨 · 白底',
    scheme: 'light',
    displayFont: 'Noto Sans SC',
    bodyFont: 'Noto Sans SC',
    fontUrl: 'https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@300;400;500;700&display=swap',
    cssVars: {
      '--bg-primary': '#ffffff',
      '--text-primary': '#1e293b',
      '--accent': '#1d4ed8',
      '--accent-light': '#dbeafe',
      '--text-secondary': '#64748b',
      '--border': '#e2e8f0',
      '--title-size': '72px',
      '--subtitle-size': '28px',
      '--body-size': '22px',
      '--slide-padding': '72px',
      '--cover-bg': 'linear-gradient(135deg, #f8fafc 0%, #ffffff 100%)',
      '--cover-text': '#1e293b',
      '--section-bg': 'linear-gradient(135deg, #f1f5f9 0%, #f8fafc 100%)',
      '--section-text': '#1e293b',
      '--ending-bg': '#f8fafc',
      '--ending-text': '#1e293b',
      '--content-bg': '#ffffff',
      '--card-bg-2': '#f8fafc',
    },
  },
  'handdrawn-creative': {
    name: '创意手绘 · 暖白',
    scheme: 'light',
    displayFont: 'Noto Sans SC',
    bodyFont: 'Noto Sans SC',
    fontUrl: 'https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@300;400;500;700&display=swap',
    cssVars: {
      '--bg-primary': '#fffcf5',
      '--text-primary': '#292524',
      '--accent': '#ef4444',
      '--accent-light': '#fef2f2',
      '--text-secondary': '#78716c',
      '--border': '#e7e5e4',
      '--title-size': '76px',
      '--subtitle-size': '30px',
      '--body-size': '24px',
      '--slide-padding': '72px',
      '--cover-bg': '#fffcf5',
      '--cover-text': '#292524',
      '--section-bg': 'linear-gradient(135deg, #fef2f2 0%, #fffcf5 100%)',
      '--section-text': '#292524',
      '--ending-bg': '#fffcf5',
      '--ending-text': '#292524',
      '--content-bg': '#ffffff',
      '--card-bg-2': '#fffcf5',
    },
  },
};

const DEFAULT_THEME = THEMES['blue-professional'];

/* ─── Generate HTML Presentation (frontend-slides powered) ─── */
export async function generatePptx(project) {
  let slideData;
  try {
    slideData = typeof project.raw_content === 'string'
      ? JSON.parse(project.raw_content)
      : project.raw_content;
  } catch (_) {
    slideData = { title: project.title || '未命名 PPT', subtitle: 'AI PPT 生成器', style_key: 'blue-professional', slides: [] };
  }

  const themeKey = slideData.style_key || 'blue-professional';
  const theme = THEMES[themeKey] || DEFAULT_THEME;
  const slides = Array.isArray(slideData.slides) ? slideData.slides : [];
  const title = slideData.title || project.title || 'PPT';
  const subtitle = slideData.subtitle || '';

  if (slides.length === 0) {
    const pageCount = Number(project.pages || 10);
    for (let i = 0; i < pageCount; i++) {
      if (i === 0) slides.push({ layout: 'cover', title, subtitle, points: [] });
      else if (i === pageCount - 1) slides.push({ layout: 'ending', title: '谢谢观看', points: [] });
      else slides.push({ layout: 'content', title: `第 ${i} 页`, points: ['内容待补充'] });
    }
  }

  const slidesHtml = slides.map((slide, index) => renderSlide(slide, index, slides.length, theme)).join('\n');

  const themeVars = Object.entries(theme.cssVars).map(([k, v]) => `    ${k}: ${v};`).join('\n');

  const html = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${escapeHtml(title)}</title>
<link rel="stylesheet" href="${theme.fontUrl}">
<style>
  /* ===========================================
     FIXED 16:9 STAGE: viewport-base.css
     =========================================== */
  html, body {
    width: 100%; height: 100%;
    margin: 0; overflow: hidden;
    background: #000;
  }
  .deck-viewport {
    position: fixed; inset: 0;
    overflow: hidden;
    background: #000;
  }
  .deck-stage {
    position: absolute;
    left: 0; top: 0;
    width: 1920px; height: 1080px;
    overflow: hidden;
    transform-origin: 0 0;
    background: var(--content-bg, #fff);
  }
  .slide {
    position: absolute; inset: 0;
    width: 1920px; height: 1080px;
    overflow: hidden;
    display: block;
    visibility: hidden; opacity: 0;
    pointer-events: none;
    background: var(--content-bg, #fff);
  }
  .slide.active, .slide.visible {
    visibility: visible; opacity: 1;
    pointer-events: auto; z-index: 1;
  }
  img, video, canvas, svg { max-width: 100%; max-height: 100%; }
  .deck-controls {
    position: fixed;
    left: 50%; bottom: 22px;
    transform: translateX(-50%);
    z-index: 1000;
  }
  @media print {
    html, body { width: 1920px; height: auto; overflow: visible; background: #fff; }
    .deck-viewport { position: static; overflow: visible; background: #fff; }
    .deck-stage { position: static; width: auto; height: auto; transform: none !important; background: none; }
    .slide { position: relative; display: block !important; visibility: visible !important; opacity: 1 !important; pointer-events: auto !important; width: 1920px; height: 1080px; break-after: page; page-break-after: always; }
    .slide:last-child { break-after: auto; page-break-after: auto; }
    .deck-controls { display: none !important; }
  }
  @media (prefers-reduced-motion: reduce) {
    *, *::before, *::after { animation-duration: 0.01ms !important; transition-duration: 0.2s !important; }
  }

  /* ===========================================
     THEME (CSS Custom Properties)
     =========================================== */
  :root {
${themeVars}
    --font-display: '${theme.displayFont}', sans-serif;
    --font-body: '${theme.bodyFont}', sans-serif;
    --ease-out-expo: cubic-bezier(0.16, 1, 0.3, 1);
    --duration-normal: 0.6s;
    --duration-slow: 1s;
  }

  * { margin: 0; padding: 0; box-sizing: border-box; }

  /* ===========================================
     ANIMATIONS — Reveal on visible slide
     =========================================== */
  .reveal {
    opacity: 0;
    transform: translateY(30px);
    transition: opacity var(--duration-normal) var(--ease-out-expo),
                transform var(--duration-normal) var(--ease-out-expo);
  }
  .slide.visible .reveal {
    opacity: 1;
    transform: translateY(0);
  }
  .reveal-left {
    opacity: 0;
    transform: translateX(-50px);
    transition: opacity var(--duration-normal) var(--ease-out-expo),
                transform var(--duration-normal) var(--ease-out-expo);
  }
  .slide.visible .reveal-left {
    opacity: 1;
    transform: translateX(0);
  }
  .reveal-right {
    opacity: 0;
    transform: translateX(50px);
    transition: opacity var(--duration-normal) var(--ease-out-expo),
                transform var(--duration-normal) var(--ease-out-expo);
  }
  .slide.visible .reveal-right {
    opacity: 1;
    transform: translateX(0);
  }
  .reveal-scale {
    opacity: 0;
    transform: scale(0.9);
    transition: opacity var(--duration-normal) var(--ease-out-expo),
                transform var(--duration-normal) var(--ease-out-expo);
  }
  .slide.visible .reveal-scale {
    opacity: 1;
    transform: scale(1);
  }
  .reveal-blur {
    opacity: 0;
    filter: blur(10px);
    transition: opacity var(--duration-slow) var(--ease-out-expo),
                filter var(--duration-slow) var(--ease-out-expo);
  }
  .slide.visible .reveal-blur {
    opacity: 1;
    filter: blur(0);
  }

  /* Stagger delays */
  .reveal:nth-child(1), .reveal-left:nth-child(1), .reveal-right:nth-child(1) { transition-delay: 0.1s; }
  .reveal:nth-child(2), .reveal-left:nth-child(2), .reveal-right:nth-child(2) { transition-delay: 0.2s; }
  .reveal:nth-child(3), .reveal-left:nth-child(3), .reveal-right:nth-child(3) { transition-delay: 0.3s; }
  .reveal:nth-child(4), .reveal-left:nth-child(4), .reveal-right:nth-child(4) { transition-delay: 0.4s; }
  .reveal:nth-child(5), .reveal-left:nth-child(5), .reveal-right:nth-child(5) { transition-delay: 0.5s; }
  .reveal:nth-child(6), .reveal-left:nth-child(6), .reveal-right:nth-child(6) { transition-delay: 0.6s; }

  /* ===========================================
     BACKGROUND EFFECTS
     =========================================== */
  .bg-gradient-mesh {
    background:
      radial-gradient(ellipse at 20% 80%, rgba(67,97,238,0.15) 0%, transparent 50%),
      radial-gradient(ellipse at 80% 20%, rgba(0,255,204,0.1) 0%, transparent 50%),
      var(--bg-primary);
  }
  .bg-grid {
    background-image:
      linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
      linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px);
    background-size: 50px 50px;
  }

  /* ===========================================
     COVER SLIDE
     =========================================== */
  .slide-cover {
    background: var(--cover-bg);
    color: var(--cover-text);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    padding: var(--slide-padding);
    position: relative;
    overflow: hidden;
  }
  .slide-cover .cover-decoration {
    position: absolute;
    top: -160px; right: -160px;
    width: 600px; height: 600px;
    border-radius: 50%;
    background: rgba(255,255,255,0.04);
    pointer-events: none;
  }
  .slide-cover .cover-decoration2 {
    position: absolute;
    bottom: -120px; left: -120px;
    width: 400px; height: 400px;
    border-radius: 50%;
    background: rgba(255,255,255,0.03);
    pointer-events: none;
  }
  .slide-cover .cover-number {
    position: absolute;
    top: 48px; left: 64px;
    font-family: var(--font-display);
    font-size: 112px;
    font-weight: 900;
    opacity: 0.06;
    line-height: 1;
    pointer-events: none;
  }
  .slide-cover .cover-title {
    font-family: var(--font-display);
    font-size: var(--title-size);
    font-weight: 700;
    line-height: 1.2;
    margin-bottom: 16px;
    max-width: 90%;
  }
  .slide-cover .cover-subtitle {
    font-family: var(--font-body);
    font-size: var(--subtitle-size);
    opacity: 0.85;
    font-weight: 300;
    letter-spacing: 1px;
  }
  .slide-cover .cover-line {
    width: 80px; height: 3px;
    border-radius: 2px;
    background: var(--cover-text);
    opacity: 0.3;
    margin: 24px auto;
  }

  /* ===========================================
     CONTENT SLIDE
     =========================================== */
  .slide-content {
    background: var(--content-bg);
    color: var(--text-primary);
    padding: 0;
    display: flex;
    flex-direction: column;
  }
  .content-header {
    background: var(--accent);
    padding: 24px var(--slide-padding);
    flex-shrink: 0;
  }
  .content-header h2 {
    font-family: var(--font-display);
    font-size: var(--subtitle-size);
    font-weight: 600;
    color: var(--text-light, #fff);
    letter-spacing: 0.5px;
  }
  .content-body {
    flex: 1;
    padding: 48px var(--slide-padding) 60px;
    display: flex;
    flex-direction: column;
    justify-content: center;
  }
  .content-body ul {
    list-style: none;
    width: 100%;
  }
  .content-body li {
    font-family: var(--font-body);
    font-size: var(--body-size);
    padding: 12px 0;
    line-height: 1.6;
    display: flex;
    align-items: flex-start;
    gap: 14px;
    border-bottom: 1px solid var(--border);
    color: var(--text-primary);
  }
  .content-body li:last-child { border-bottom: none; }
  .content-body li .dot {
    width: 10px; height: 10px;
    border-radius: 50%;
    background: var(--accent);
    flex-shrink: 0;
    margin-top: 8px;
  }

  /* ===========================================
     TWO-COLUMN SLIDE
     =========================================== */
  .two-col-body {
    flex: 1;
    padding: 40px var(--slide-padding) 50px;
    display: flex;
    gap: 40px;
  }
  .two-col-body .col {
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: center;
  }
  .two-col-body .col ul { list-style: none; }
  .two-col-body .col li {
    font-family: var(--font-body);
    font-size: var(--body-size);
    padding: 10px 0;
    line-height: 1.5;
    display: flex;
    gap: 12px;
    align-items: flex-start;
    color: var(--text-primary);
    border-bottom: 1px solid var(--border);
  }
  .two-col-body .col li:last-child { border-bottom: none; }
  .two-col-body .col li .dot {
    width: 8px; height: 8px;
    border-radius: 50%;
    background: var(--accent);
    flex-shrink: 0;
    margin-top: 7px;
  }
  .two-col-divider {
    width: 1px;
    background: var(--border);
    flex-shrink: 0;
  }
  .col-label {
    font-family: var(--font-display);
    font-size: 14px;
    text-transform: uppercase;
    letter-spacing: 2px;
    color: var(--accent);
    margin-bottom: 4px;
  }

  /* ===========================================
     SECTION SLIDE (divider)
     =========================================== */
  .slide-section {
    background: var(--section-bg);
    color: var(--section-text);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    padding: var(--slide-padding);
  }
  .slide-section .section-number {
    font-family: var(--font-display);
    font-size: 48px;
    font-weight: 700;
    opacity: 0.15;
    margin-bottom: 8px;
  }
  .slide-section h2 {
    font-family: var(--font-display);
    font-size: 56px;
    font-weight: 600;
    line-height: 1.3;
  }
  .slide-section .section-line {
    margin: 20px auto;
    width: 60px; height: 2px;
    background: var(--accent);
  }
  .slide-section .section-sub {
    font-family: var(--font-body);
    font-size: 24px;
    opacity: 0.6;
    margin-top: 8px;
  }

  /* ===========================================
     ENDING SLIDE
     =========================================== */
  .slide-ending {
    background: var(--ending-bg);
    color: var(--ending-text);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    padding: var(--slide-padding);
  }
  .slide-ending h2 {
    font-family: var(--font-display);
    font-size: var(--title-size);
    font-weight: 600;
    margin-bottom: 16px;
  }
  .slide-ending p {
    font-family: var(--font-body);
    font-size: 28px;
    opacity: 0.6;
  }
  .slide-ending .ending-line {
    width: 60px; height: 2px;
    background: var(--accent);
    margin: 20px auto;
  }

  /* ===========================================
     QUOTE SLIDE
     =========================================== */
  .slide-quote {
    background: var(--content-bg);
    color: var(--text-primary);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    padding: 100px var(--slide-padding);
  }
  .slide-quote .quote-mark {
    font-size: 120px;
    font-family: var(--font-display);
    line-height: 1;
    color: var(--accent);
    opacity: 0.3;
    margin-bottom: -20px;
  }
  .slide-quote .quote-text {
    font-family: var(--font-display);
    font-size: 44px;
    font-weight: 400;
    font-style: italic;
    line-height: 1.4;
    max-width: 80%;
    color: var(--text-primary);
  }
  .slide-quote .quote-author {
    font-family: var(--font-body);
    font-size: 22px;
    color: var(--text-secondary);
    margin-top: 24px;
  }

  /* ===========================================
     COMPARISON SLIDE
     =========================================== */
  .slide-comparison {
    background: var(--content-bg);
    color: var(--text-primary);
    padding: 0;
    display: flex;
    flex-direction: column;
  }
  .comparison-body {
    flex: 1;
    padding: 40px var(--slide-padding) 50px;
    display: flex;
    gap: 40px;
  }
  .comparison-body .side {
    flex: 1;
    background: var(--card-bg-2);
    border-radius: 12px;
    padding: 32px;
    border: 1px solid var(--border);
  }
  .comparison-body .side h3 {
    font-family: var(--font-display);
    font-size: 32px;
    margin-bottom: 16px;
    color: var(--accent);
  }
  .comparison-body .side ul { list-style: none; }
  .comparison-body .side li {
    font-family: var(--font-body);
    font-size: 22px;
    padding: 8px 0;
    line-height: 1.5;
    border-bottom: 1px solid var(--border);
    color: var(--text-primary);
    display: flex;
    align-items: flex-start;
    gap: 10px;
  }
  .comparison-body .side li:last-child { border-bottom: none; }
  .comparison-body .side li .dot {
    width: 8px; height: 8px;
    border-radius: 50%;
    background: var(--accent);
    flex-shrink: 0;
    margin-top: 7px;
  }
  .comparison-body .side .vs-badge {
    display: inline-block;
    background: var(--accent);
    color: var(--text-light, #fff);
    font-size: 12px;
    padding: 2px 10px;
    border-radius: 999px;
    margin-bottom: 12px;
    font-weight: 600;
    letter-spacing: 1px;
  }

  /* ===========================================
     STATS / DATA SLIDE
     =========================================== */
  .slide-stats {
    background: var(--content-bg);
    color: var(--text-primary);
    padding: 0;
    display: flex;
    flex-direction: column;
  }
  .stats-body {
    flex: 1;
    padding: 48px var(--slide-padding) 60px;
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 48px;
    flex-wrap: wrap;
  }
  .stat-item {
    text-align: center;
    min-width: 240px;
  }
  .stat-number {
    font-family: var(--font-display);
    font-size: 72px;
    font-weight: 800;
    color: var(--accent);
    line-height: 1;
  }
  .stat-label {
    font-family: var(--font-body);
    font-size: 20px;
    color: var(--text-secondary);
    margin-top: 8px;
  }

  /* ===========================================
     NAVIGATION CONTROLS
     =========================================== */
  .deck-controls {
    display: flex;
    align-items: center;
    gap: 16px;
    background: rgba(0,0,0,0.6);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    padding: 10px 20px;
    border-radius: 999px;
    border: 1px solid rgba(255,255,255,0.1);
  }
  .nav-btn {
    width: 36px; height: 36px;
    border-radius: 50%;
    border: none;
    background: rgba(255,255,255,0.1);
    color: #fff;
    font-size: 14px;
    cursor: pointer;
    transition: all 0.2s;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .nav-btn:hover {
    background: var(--accent);
    color: #fff;
  }
  .nav-btn:disabled {
    opacity: 0.2;
    cursor: default;
  }
  .nav-btn:disabled:hover {
    background: rgba(255,255,255,0.1);
    color: #fff;
  }
  .page-indicator {
    font-family: var(--font-body);
    font-size: 13px;
    color: rgba(255,255,255,0.7);
    min-width: 60px;
    text-align: center;
    font-variant-numeric: tabular-nums;
  }
  .slide-number-pos {
    position: fixed;
    bottom: 32px; right: 36px;
    font-family: var(--font-body);
    font-size: 12px;
    color: var(--text-secondary);
    opacity: 0.5;
    z-index: 100;
    font-variant-numeric: tabular-nums;
    letter-spacing: 1px;
  }
</style>
</head>
<body>
<div class="deck-viewport">
  <main class="deck-stage" id="deckStage">
${slidesHtml}
  </main>
</div>
<div class="deck-controls">
  <button class="nav-btn" id="prevBtn" onclick="changeSlide(-1)">◀</button>
  <span class="page-indicator" id="pageIndicator">1 / ${slides.length}</span>
  <button class="nav-btn" id="nextBtn" onclick="changeSlide(1)">▶</button>
</div>
<div class="slide-number-pos" id="slideNumber">01 / ${String(slides.length).padStart(2, '0')}</div>
<script>
(function() {
  /* ── Stage scaling (fixed 1920×1080) ── */
  var stage = document.getElementById('deckStage');
  function scaleStage() {
    var factor = Math.min(window.innerWidth / 1920, window.innerHeight / 1080);
    var x = (window.innerWidth - 1920 * factor) / 2;
    var y = (window.innerHeight - 1080 * factor) / 2;
    stage.style.transform = 'translate(' + x + 'px, ' + y + 'px) scale(' + factor + ')';
  }
  scaleStage();
  window.addEventListener('resize', scaleStage);

  /* ── Slide navigation ── */
  var slides = document.querySelectorAll('.slide');
  var current = 0;
  var touchStartX = 0, touchStartY = 0;

  function show(n) {
    slides.forEach(function(s, i) {
      s.classList.toggle('active', i === n);
      s.classList.toggle('visible', i === n);
    });
    document.getElementById('pageIndicator').textContent = (n + 1) + ' / ' + slides.length;
    document.getElementById('slideNumber').textContent = String(n + 1).padStart(2, '0') + ' / ' + String(slides.length).padStart(2, '0');
    document.getElementById('prevBtn').disabled = n === 0;
    document.getElementById('nextBtn').disabled = n === slides.length - 1;
  }

  window.changeSlide = function(d) {
    var next = current + d;
    if (next >= 0 && next < slides.length) {
      current = next;
      show(current);
    }
  };

  /* ── Keyboard ── */
  document.addEventListener('keydown', function(e) {
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown' || e.key === ' ' || e.key === 'PageDown') {
      e.preventDefault();
      window.changeSlide(1);
    }
    if (e.key === 'ArrowLeft' || e.key === 'ArrowUp' || e.key === 'PageUp') {
      e.preventDefault();
      window.changeSlide(-1);
    }
    if (e.key === 'Home') { e.preventDefault(); current = 0; show(0); }
    if (e.key === 'End') { e.preventDefault(); current = slides.length - 1; show(current); }
  });

  /* ── Touch swipe ── */
  document.addEventListener('touchstart', function(e) {
    touchStartX = e.changedTouches[0].screenX;
    touchStartY = e.changedTouches[0].screenY;
  }, { passive: true });
  document.addEventListener('touchend', function(e) {
    var dx = e.changedTouches[0].screenX - touchStartX;
    var dy = e.changedTouches[0].screenY - touchStartY;
    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 50) {
      window.changeSlide(dx < 0 ? 1 : -1);
    }
  }, { passive: true });

  /* ── Mouse wheel ── */
  document.addEventListener('wheel', function(e) {
    if (e.deltaY > 0) window.changeSlide(1);
    else if (e.deltaY < 0) window.changeSlide(-1);
  }, { passive: true });

  show(0);
})();
</script>
</body>
</html>`;

  const outputDir = path.join(__dirname, '../../data');
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

  const filename = `ppt-${project.id}-${Date.now()}.html`;
  const filePath = path.join(outputDir, filename);
  fs.writeFileSync(filePath, html, 'utf-8');

  return { filePath, filename };
}

/* ─── Render a single slide ─── */
function renderSlide(slide, index, total, theme) {
  const points = Array.isArray(slide.points) ? slide.points : [];

  switch (slide.layout) {
    case 'cover':
      return `    <section class="slide slide-cover${index === 0 ? ' active' : ''}">
        <div class="cover-decoration"></div>
        <div class="cover-decoration2"></div>
        <div class="cover-number reveal">${String(index + 1).padStart(2, '0')}</div>
        <div class="cover-title reveal">${escapeHtml(slide.title)}</div>
        ${slide.subtitle ? `<div class="cover-subtitle reveal">${escapeHtml(slide.subtitle)}</div>` : ''}
        <div class="cover-line reveal"></div>
      </section>`;

    case 'section':
      return `    <section class="slide slide-section${index === 0 ? ' active' : ''}">
        <div class="section-number reveal">${String(index + 1).padStart(2, '0')}</div>
        <h2 class="reveal">${escapeHtml(slide.title)}</h2>
        <div class="section-line reveal"></div>
        ${slide.subtitle ? `<div class="section-sub reveal">${escapeHtml(slide.subtitle)}</div>` : ''}
      </section>`;

    case 'ending':
      return `    <section class="slide slide-ending${index === 0 ? ' active' : ''}">
        <div class="ending-line reveal"></div>
        <h2 class="reveal">${escapeHtml(slide.title || '谢谢观看')}</h2>
        ${slide.subtitle ? `<p class="reveal">${escapeHtml(slide.subtitle)}</p>` : ''}
      </section>`;

    case 'two_column':
      const half = Math.ceil(points.length / 2);
      const leftPoints = points.slice(0, half);
      const rightPoints = points.slice(half);
      return `    <section class="slide slide-content${index === 0 ? ' active' : ''}">
        <div class="content-header"><h2 class="reveal">${escapeHtml(slide.title)}</h2></div>
        <div class="two-col-body">
          <div class="col">
            ${slide.col_left_label ? `<div class="col-label reveal-left">${escapeHtml(slide.col_left_label)}</div>` : ''}
            <ul>${leftPoints.map((p, i) => `<li class="reveal-left" style="transition-delay:${(i * 0.1 + 0.2).toFixed(1)}s"><span class="dot"></span>${escapeHtml(p)}</li>`).join('')}</ul>
          </div>
          <div class="two-col-divider"></div>
          <div class="col">
            ${slide.col_right_label ? `<div class="col-label reveal-right">${escapeHtml(slide.col_right_label)}</div>` : ''}
            <ul>${rightPoints.map((p, i) => `<li class="reveal-right" style="transition-delay:${(i * 0.1 + 0.2).toFixed(1)}s"><span class="dot"></span>${escapeHtml(p)}</li>`).join('')}</ul>
          </div>
        </div>
      </section>`;

    case 'quote':
      return `    <section class="slide slide-quote${index === 0 ? ' active' : ''}">
        <div class="quote-mark reveal">"</div>
        <div class="quote-text reveal">${escapeHtml(slide.title)}</div>
        ${slide.subtitle ? `<div class="quote-author reveal">— ${escapeHtml(slide.subtitle)}</div>` : ''}
      </section>`;

    case 'comparison':
      const leftSide = slide.left_side || { label: '传统方案', points: [] };
      const rightSide = slide.right_side || { label: '本方案', points: [] };
      return `    <section class="slide slide-comparison${index === 0 ? ' active' : ''}">
        <div class="content-header"><h2 class="reveal">${escapeHtml(slide.title)}</h2></div>
        <div class="comparison-body">
          <div class="side reveal-left">
            <div class="vs-badge">Before</div>
            <h3>${escapeHtml(leftSide.label)}</h3>
            <ul>${(leftSide.points || []).map(p => `<li><span class="dot"></span>${escapeHtml(p)}</li>`).join('')}</ul>
          </div>
          <div class="side reveal-right">
            <div class="vs-badge">After</div>
            <h3>${escapeHtml(rightSide.label)}</h3>
            <ul>${(rightSide.points || []).map(p => `<li><span class="dot"></span>${escapeHtml(p)}</li>`).join('')}</ul>
          </div>
        </div>
      </section>`;

    case 'stats':
      const stats = Array.isArray(slide.stats) ? slide.stats : points.map(p => ({ label: p, value: '--' }));
      return `    <section class="slide slide-stats${index === 0 ? ' active' : ''}">
        <div class="content-header"><h2 class="reveal">${escapeHtml(slide.title)}</h2></div>
        <div class="stats-body">
          ${stats.map((s, i) => `<div class="stat-item reveal-scale" style="transition-delay:${(i * 0.15).toFixed(1)}s">
            <div class="stat-number">${escapeHtml(s.value || '--')}</div>
            <div class="stat-label">${escapeHtml(s.label)}</div>
          </div>`).join('')}
        </div>
      </section>`;

    default: // content
      return `    <section class="slide slide-content${index === 0 ? ' active' : ''}">
        <div class="content-header"><h2 class="reveal">${escapeHtml(slide.title)}</h2></div>
        <div class="content-body">
          <ul>${points.map((p, i) => `<li class="reveal" style="transition-delay:${(i * 0.1 + 0.15).toFixed(1)}s"><span class="dot"></span>${escapeHtml(p)}</li>`).join('')}</ul>
        </div>
      </section>`;
  }
}

function escapeHtml(str) {
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

export default { generatePptx };
