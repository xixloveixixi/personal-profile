# Data Model: Personal Portfolio Website

**Date**: 2026-02-05  
**Feature**: Personal Portfolio Website  
**Phase**: 1 - Design & Contracts

## Entity Definitions

### BlogArticle

Represents a single blog post with MDX content and metadata.

**Fields**:
- `slug` (string, required, unique): URL-friendly identifier (e.g., "getting-started-with-nextjs")
- `title` (string, required): Article title
- `description` (string, required): Short description for previews and SEO
- `content` (string, required): MDX content body
- `publishedAt` (date, required): Publication date (ISO 8601 format)
- `updatedAt` (date, optional): Last update date (ISO 8601 format)
- `category` (enum, required): One of "technical", "essays", "tutorials"
- `tags` (array of strings, optional): Array of tag names (e.g., ["React", "TypeScript", "Next.js"])
- `readingTime` (number, computed): Estimated reading time in minutes (calculated from word count)
- `featuredImage` (string, optional): Path to featured image
- `draft` (boolean, optional): Whether article is a draft (default: false)

**Relationships**:
- Belongs to one Category
- Has many Tags (many-to-many)
- Referenced by RSS feed entries

**Validation Rules**:
- `slug` must be unique across all articles
- `slug` must match pattern: `^[a-z0-9]+(?:-[a-z0-9]+)*$`
- `title` must be 1-200 characters
- `description` must be 1-300 characters
- `publishedAt` must be a valid ISO 8601 date
- `tags` array must contain unique strings, each 1-50 characters
- `category` must be one of the defined enum values

**Storage**: MDX files in `content/blog/` with frontmatter metadata

**Example**:
```yaml
---
slug: getting-started-with-nextjs
title: Getting Started with Next.js 14
description: A comprehensive guide to building modern web applications with Next.js 14 App Router
publishedAt: 2026-02-05
category: technical
tags: [Next.js, React, TypeScript, Web Development]
featuredImage: /images/nextjs-hero.jpg
---

# Getting Started with Next.js 14

Content here...
```

### Category

Represents article classification.

**Fields**:
- `id` (string, required, unique): Category identifier ("technical", "essays", "tutorials")
- `name` (string, required): Display name ("Technical", "Essays", "Tutorials")
- `description` (string, optional): Category description
- `color` (string, optional): Theme color for category badge

**Relationships**:
- Has many BlogArticles (one-to-many)

**Validation Rules**:
- `id` must be one of: "technical", "essays", "tutorials"
- `name` must be 1-50 characters

**Storage**: Constants in `lib/constants/categories.ts`

### Tag

Represents article or project labeling for filtering and search.

**Fields**:
- `name` (string, required, unique): Tag name (e.g., "React", "TypeScript")
- `slug` (string, required, unique): URL-friendly identifier
- `color` (string, optional): Theme color for tag badge
- `description` (string, optional): Tag description

**Relationships**:
- Has many BlogArticles (many-to-many)
- Has many PortfolioProjects (many-to-many)

**Validation Rules**:
- `name` must be 1-50 characters, alphanumeric with spaces/hyphens
- `slug` must match pattern: `^[a-z0-9]+(?:-[a-z0-9]+)*$`
- `slug` must be unique across all tags

**Storage**: Extracted from article/project frontmatter, stored in memory or JSON file

### PortfolioProject

Represents a showcased project with detailed information.

**Fields**:
- `slug` (string, required, unique): URL-friendly identifier
- `title` (string, required): Project title
- `shortDescription` (string, required): Brief description for cards (max 200 chars)
- `longDescription` (string, required): Full project description
- `problem` (string, required): Problem background section
- `solution` (string, required): Technical approach section
- `challenges` (string, optional): Challenges faced section
- `results` (string, optional): Results achieved section
- `technologies` (array of strings, required): Technology stack tags
- `githubUrl` (string, optional): GitHub repository URL
- `demoUrl` (string, optional): Live demo URL
- `featuredImage` (string, required): Path to project featured image
- `gallery` (array of strings, optional): Additional project images
- `publishedAt` (date, required): Publication date
- `featured` (boolean, optional): Whether to feature on homepage (default: false)
- `order` (number, optional): Display order (default: 0)

**Relationships**:
- Has many TechnologyStackTags (many-to-many)

**Validation Rules**:
- `slug` must be unique across all projects
- `slug` must match pattern: `^[a-z0-9]+(?:-[a-z0-9]+)*$`
- `title` must be 1-200 characters
- `shortDescription` must be 1-200 characters
- `technologies` array must contain at least one technology
- `githubUrl` and `demoUrl` must be valid URLs if provided
- `featuredImage` must be a valid image path

**Storage**: JSON files in `content/projects/` directory

**Example**:
```json
{
  "slug": "e-commerce-platform",
  "title": "E-Commerce Platform",
  "shortDescription": "A full-stack e-commerce platform built with Next.js and Stripe",
  "longDescription": "Complete e-commerce solution with product catalog, shopping cart, and payment processing.",
  "problem": "Business needed an online store to sell products...",
  "solution": "Built a Next.js application with Stripe integration...",
  "challenges": "Handling payment security and inventory management...",
  "results": "Increased online sales by 300%...",
  "technologies": ["Next.js", "TypeScript", "Stripe", "PostgreSQL"],
  "githubUrl": "https://github.com/user/ecommerce",
  "demoUrl": "https://ecommerce-demo.vercel.app",
  "featuredImage": "/images/projects/ecommerce.jpg",
  "publishedAt": "2026-01-15",
  "featured": true,
  "order": 1
}
```

### TechnologyStackTag

Represents a technology, framework, or tool used in projects.

**Fields**:
- `name` (string, required, unique): Technology name (e.g., "React", "Next.js")
- `slug` (string, required, unique): URL-friendly identifier
- `category` (enum, optional): One of "framework", "language", "tool", "library"
- `icon` (string, optional): Icon identifier or URL
- `color` (string, optional): Theme color for tag badge

**Relationships**:
- Has many PortfolioProjects (many-to-many)

**Validation Rules**:
- `name` must be 1-50 characters
- `slug` must match pattern: `^[a-z0-9]+(?:-[a-z0-9]+)*$`
- `slug` must be unique across all technology tags

**Storage**: Constants in `lib/constants/tech-stack.ts` or extracted from projects

### SkillCategory

Represents a skill domain with proficiency level for radar chart visualization.

**Fields**:
- `name` (string, required): Skill name (e.g., "React", "TypeScript", "Communication")
- `category` (enum, required): One of "framework", "language", "tool", "soft-skill"
- `proficiency` (number, required): Proficiency level 0-100
- `description` (string, optional): Skill description

**Relationships**:
- Part of SkillsRadar data structure

**Validation Rules**:
- `name` must be 1-100 characters
- `category` must be one of: "framework", "language", "tool", "soft-skill"
- `proficiency` must be between 0 and 100

**Storage**: JSON file in `content/about/skills.json`

**Example**:
```json
{
  "name": "React",
  "category": "framework",
  "proficiency": 90,
  "description": "Expert level in React development"
}
```

### TimelineEntry

Represents an education or work experience entry.

**Fields**:
- `id` (string, required, unique): Entry identifier
- `type` (enum, required): One of "education", "work"
- `title` (string, required): Position title or degree name
- `organization` (string, required): Company or institution name
- `location` (string, optional): Geographic location
- `startDate` (date, required): Start date (ISO 8601 format)
- `endDate` (date, optional): End date (null for current)
- `description` (string, optional): Description of role/responsibilities
- `achievements` (array of strings, optional): List of key achievements
- `technologies` (array of strings, optional): Technologies used
- `order` (number, optional): Display order (chronological)

**Relationships**:
- Part of Timeline data structure

**Validation Rules**:
- `id` must be unique
- `type` must be one of: "education", "work"
- `title` must be 1-200 characters
- `organization` must be 1-200 characters
- `startDate` must be a valid ISO 8601 date
- `endDate` must be after `startDate` if provided
- `order` used for chronological sorting

**Storage**: JSON file in `content/about/timeline.json`

**Example**:
```json
{
  "id": "work-2023-present",
  "type": "work",
  "title": "Senior Frontend Engineer",
  "organization": "Tech Company",
  "location": "San Francisco, CA",
  "startDate": "2023-01-01",
  "endDate": null,
  "description": "Lead frontend development for customer-facing applications",
  "achievements": [
    "Improved page load time by 40%",
    "Led migration to Next.js 14"
  ],
  "technologies": ["Next.js", "TypeScript", "React"],
  "order": 1
}
```

### ContactLink

Represents a contact method with platform information.

**Fields**:
- `platform` (string, required): Platform name (e.g., "GitHub", "LinkedIn", "Email", "Twitter")
- `url` (string, required): Contact URL or email address
- `icon` (string, required): Icon identifier from Lucide React
- `label` (string, optional): Display label (defaults to platform name)
- `order` (number, optional): Display order

**Relationships**:
- Part of Contact data structure

**Validation Rules**:
- `platform` must be one of: "GitHub", "LinkedIn", "Email", "Twitter", "Website"
- `url` must be a valid URL or email address
- `icon` must be a valid Lucide React icon name

**Storage**: JSON file in `content/about/contact.json`

**Example**:
```json
{
  "platform": "GitHub",
  "url": "https://github.com/username",
  "icon": "github",
  "label": "GitHub Profile",
  "order": 1
}
```

## Data Flow

### Blog Articles

1. **Content Creation**: Author creates MDX file in `content/blog/` with frontmatter
2. **Build Time**: Next.js reads MDX files, parses frontmatter, generates static pages
3. **Runtime**: Articles loaded via `getAllArticles()` and `getArticleBySlug()` utilities
4. **Search**: Articles indexed in memory for client-side search
5. **RSS**: Feed generated from article metadata

### Portfolio Projects

1. **Content Creation**: Author creates JSON file in `content/projects/` with project data
2. **Build Time**: Projects loaded and validated
3. **Runtime**: Projects loaded via `getAllProjects()` and `getProjectBySlug()` utilities
4. **Filtering**: Client-side filtering by technology tags

### Profile Data

1. **Content Creation**: Author updates JSON files in `content/about/`
2. **Build Time**: Data loaded and validated
3. **Runtime**: Data loaded via `getProfileData()` utility
4. **Visualization**: Skills data rendered in radar chart, timeline data in timeline component

## State Management

**Client State**:
- Theme preference (dark/light) - managed by `next-themes`, persisted in localStorage
- Search query and results - React state in search component
- Portfolio filter selection - React state in filter component
- Table of contents active section - React state with scroll detection

**Server State**:
- All content is static, loaded at build time
- No server-side state management required
- RSS feed generated on-demand via API route

## Data Validation

**Build Time Validation**:
- Validate frontmatter schema for MDX files
- Validate JSON schema for projects and profile data
- Ensure required fields are present
- Check for duplicate slugs
- Validate URLs and dates

**Runtime Validation**:
- Type checking via TypeScript
- Runtime validation for user inputs (search queries, etc.)
- Error boundaries for malformed content

## Performance Considerations

1. **Static Generation**: All pages pre-rendered at build time
2. **Incremental Static Regeneration**: Not needed for personal portfolio (content updated via git)
3. **Caching**: Static assets cached by CDN (Vercel)
4. **Search Index**: Built at build time or on first page load
5. **Image Optimization**: All images optimized via Next.js Image component

