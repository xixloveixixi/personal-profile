# Quickstart Guide: Personal Portfolio Website

**Date**: 2026-02-05  
**Feature**: Personal Portfolio Website

## Prerequisites

- Node.js 18+ installed
- npm or yarn package manager
- Git for version control
- Code editor (VS Code recommended)

## Initial Setup

### 1. Clone and Install Dependencies

```bash
# Navigate to project directory
cd personal-portfolio

# Install dependencies
npm install
# or
yarn install
```

### 2. Environment Setup

Create a `.env.local` file in the root directory (if needed for environment-specific config):

```env
# Optional: Add any environment variables here
NEXT_PUBLIC_SITE_URL=https://yourdomain.com
```

### 3. Content Structure

Create the content directories:

```bash
mkdir -p content/blog
mkdir -p content/projects
mkdir -p content/about
```

### 4. Add Sample Content

**Blog Article** (`content/blog/example.mdx`):
```mdx
---
slug: example-article
title: Example Article
description: This is an example blog article
publishedAt: 2026-02-05
category: technical
tags: [React, Next.js]
---

# Example Article

This is the content of the article.
```

**Portfolio Project** (`content/projects/example.json`):
```json
{
  "slug": "example-project",
  "title": "Example Project",
  "shortDescription": "A sample project description",
  "longDescription": "Full project description here",
  "problem": "Problem statement",
  "solution": "Solution approach",
  "technologies": ["Next.js", "TypeScript"],
  "featuredImage": "/images/projects/example.jpg",
  "publishedAt": "2026-02-05"
}
```

**Profile Data** (`content/about/skills.json`):
```json
[
  {
    "name": "React",
    "category": "framework",
    "proficiency": 90
  }
]
```

**Timeline** (`content/about/timeline.json`):
```json
[
  {
    "id": "example-1",
    "type": "work",
    "title": "Example Position",
    "organization": "Example Company",
    "startDate": "2023-01-01",
    "endDate": null
  }
]
```

**Contact** (`content/about/contact.json`):
```json
[
  {
    "platform": "GitHub",
    "url": "https://github.com/username",
    "icon": "github"
  }
]
```

## Development

### Start Development Server

```bash
npm run dev
# or
yarn dev
```

Visit `http://localhost:3000` to see the site.

### Build for Production

```bash
npm run build
# or
yarn build
```

### Start Production Server

```bash
npm start
# or
yarn start
```

## Project Structure Overview

```
app/                    # Next.js App Router pages
components/             # React components
lib/                    # Utility functions
content/                # Content files (MDX, JSON)
public/                 # Static assets
```

## Key Commands

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run type-check` - Run TypeScript type checking
- `npm run format` - Format code with Prettier

## Adding New Content

### Add Blog Article

1. Create new MDX file in `content/blog/`
2. Add frontmatter with required fields
3. Write content in MDX format
4. Build/restart dev server to see changes

### Add Portfolio Project

1. Create new JSON file in `content/projects/`
2. Fill in all required fields
3. Add project images to `public/images/projects/`
4. Build/restart dev server to see changes

### Update Profile

1. Edit JSON files in `content/about/`
2. Update skills, timeline, or contact information
3. Restart dev server to see changes

## Testing

### Run Tests

```bash
npm test
# or
yarn test
```

### Run E2E Tests (if configured)

```bash
npm run test:e2e
# or
yarn test:e2e
```

## Deployment

### Deploy to Vercel

1. Push code to GitHub repository
2. Import project in Vercel dashboard
3. Configure build settings (auto-detected for Next.js)
4. Deploy

### Environment Variables

Set any required environment variables in Vercel dashboard:
- Project Settings → Environment Variables

## Troubleshooting

### MDX Files Not Loading

- Check frontmatter syntax (must be valid YAML)
- Verify file is in `content/blog/` directory
- Check slug is unique and URL-friendly

### Images Not Displaying

- Verify image path starts with `/` (absolute from public directory)
- Check image exists in `public/images/` directory
- Use Next.js Image component for optimization

### Build Errors

- Run `npm run type-check` to find TypeScript errors
- Run `npm run lint` to find linting issues
- Check all required content files exist

### Theme Not Switching

- Verify `next-themes` is configured in root layout
- Check Tailwind dark mode is enabled in `tailwind.config.js`
- Ensure components use dark mode classes

## Next Steps

1. Customize site metadata in `app/layout.tsx`
2. Add your content (blog posts, projects, profile)
3. Customize styling in `tailwind.config.js`
4. Configure PWA manifest in `public/manifest.json`
5. Set up custom domain in Vercel
6. Test accessibility with Lighthouse
7. Optimize images and performance

## Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Framer Motion Documentation](https://www.framer.com/motion/)
- [MDX Documentation](https://mdxjs.com/)
- [Vercel Deployment Guide](https://vercel.com/docs)

