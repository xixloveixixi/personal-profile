# Personal Portfolio Website

A modern personal portfolio website built with Next.js 14, TypeScript, and Tailwind CSS. Features a blog system with MDX content management, portfolio project showcase, personal profile page, PWA support, and RSS feed generation.

## Features

- **Blog System**: MDX-based content management with code syntax highlighting, search, categorization, and tags
- **Portfolio Showcase**: Responsive project grid with technology stack filtering and detailed project pages
- **Personal Profile**: Skills visualization, timeline, and contact information
- **PWA Support**: Progressive Web App with offline access capabilities
- **RSS Feed**: Automatic RSS feed generation for blog articles
- **Dark Mode**: System preference detection with manual theme switching
- **Performance**: Optimized for Lighthouse scores (Performance ≥95, Accessibility 100, SEO 100)

## Getting Started

### Prerequisites

- Node.js 18+ installed
- npm or yarn package manager

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd personal-portfolio
```

2. Install dependencies:
```bash
npm install
```

3. Create content files:
   - Add blog articles as MDX files in `content/blog/`
   - Add portfolio projects as JSON files in `content/projects/`
   - Add profile data in `content/about/` (skills.json, timeline.json, contact.json)

### Development

Start the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the site.

### Build for Production

```bash
npm run build
npm start
```

### Other Commands

- `npm run lint` - Run ESLint
- `npm run type-check` - Run TypeScript type checking
- `npm run format` - Format code with Prettier

## Project Structure

```
app/                      # Next.js App Router
├── blog/                 # Blog pages
├── portfolio/            # Portfolio pages
├── about/                # About page
├── layout.tsx            # Root layout
└── page.tsx              # Homepage

components/               # React components
├── ui/                   # Base UI components
├── blog/                 # Blog-specific components
├── portfolio/            # Portfolio-specific components
├── about/                # About page components
├── layout/               # Layout components
└── shared/               # Shared utilities

lib/                      # Utility functions
├── content/             # Content loading utilities
├── utils/                # General utilities
└── constants/            # Constants and config

content/                  # Content files
├── blog/                 # MDX blog articles
├── projects/             # JSON project files
└── about/                 # Profile data

public/                   # Static assets
├── images/               # Images
├── icons/                # PWA icons
└── manifest.json         # PWA manifest
```

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript (strict mode)
- **Styling**: Tailwind CSS
- **Animations**: Framer Motion
- **Icons**: Lucide React
- **Content**: MDX (next-mdx-remote)
- **Deployment**: Vercel

## Content Management

### Adding Blog Articles

Create a new MDX file in `content/blog/` with frontmatter:

```mdx
---
slug: my-article
title: My Article Title
description: Article description
publishedAt: 2026-02-05
category: technical
tags: [React, Next.js]
---

# Article Content

Your MDX content here...
```

### Adding Portfolio Projects

Create a JSON file in `content/projects/`:

```json
{
  "slug": "my-project",
  "title": "My Project",
  "shortDescription": "Brief description",
  "longDescription": "Full description",
  "problem": "Problem statement",
  "solution": "Solution approach",
  "technologies": ["Next.js", "TypeScript"],
  "featuredImage": "/images/projects/my-project.jpg",
  "publishedAt": "2026-02-05"
}
```

## Performance Targets

- Lighthouse Performance: ≥ 95
- Lighthouse Accessibility: 100
- Lighthouse Best Practices: 100
- Lighthouse SEO: 100
- First Contentful Paint: < 1.5s
- Largest Contentful Paint: < 2.5s

## Deployment

### Deploy to Vercel

1. Push code to GitHub
2. Import project in Vercel dashboard
3. Configure environment variables (if needed)
4. Deploy

The site will automatically deploy on every push to the main branch.

## License

MIT

