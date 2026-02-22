# Implementation Plan: Personal Portfolio Website

**Branch**: `001-personal-portfolio` | **Date**: 2026-02-05 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-personal-portfolio/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Build a personal portfolio website serving as a technical capability and project showcase platform. The site features a blog system with MDX-based content management, code syntax highlighting, categorization, and search; a responsive portfolio project gallery with technology stack filtering; a personal profile page with skills visualization and timeline; PWA support for offline access; and RSS feed generation. The implementation uses Next.js 14 App Router with TypeScript, Tailwind CSS, Framer Motion for animations, and Lucide React for icons, deployed to Vercel with strict performance and accessibility targets.

## Technical Context

**Language/Version**: TypeScript 5.x (strict mode), Node.js 18+  
**Primary Dependencies**: Next.js 14 (App Router), React 18+, Tailwind CSS, Framer Motion, Lucide React, next-mdx-remote (or @next/mdx), rehype-highlight (or prism-react-renderer), next-themes, react-markdown  
**Storage**: File-based (MDX files in `content/blog/`, JSON/YAML for portfolio projects in `content/projects/`, static data files)  
**Testing**: Jest/Vitest for unit tests, Playwright for E2E tests (if applicable)  
**Target Platform**: Web browsers (modern browsers with ES2020+ support), PWA-capable devices  
**Project Type**: Web application (single Next.js app)  
**Performance Goals**: Lighthouse Performance ≥ 95, FCP < 1.5s, LCP < 2.5s, bundle size optimized with code splitting  
**Constraints**: Must support offline access (PWA), must work without JavaScript for core content (progressive enhancement), must be fully accessible (WCAG 2.1 AA), must support dark/light theme switching, must generate RSS feed dynamically  
**Scale/Scope**: Personal portfolio site, ~50-100 blog articles, ~10-20 portfolio projects, single user/admin, public read-only access

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

**Compliance Verification**:
- [x] Component-First: All UI elements planned as reusable components?
- [x] Responsive & Accessible: Mobile-first design approach, WCAG 2.1 AA compliance planned?
- [x] Performance: Performance targets defined (Lighthouse ≥ 90, FCP < 1.5s, LCP < 2.5s)?
- [x] Modern Practices: TypeScript usage, linting/formatting, conventional commits planned?
- [x] Content-Driven: Content structure allows easy updates without code changes?
- [x] Technology Standards: Stack choices align with constitution (React/Next.js, TypeScript, Tailwind)?
- [x] Quality Gates: Accessibility audit, responsive testing, error-free builds planned?

**Complexity Justification** (if any principles violated):
No violations. All principles are satisfied:
- Component-first: All UI elements will be React components in `components/` directory
- Responsive & Accessible: Mobile-first Tailwind CSS, semantic HTML, ARIA labels, keyboard navigation
- Performance: Next.js Image optimization, code splitting, static generation where possible
- Modern Practices: TypeScript strict mode, ESLint, Prettier, conventional commits
- Content-Driven: MDX files and JSON/YAML data files separate from code
- Technology Standards: Next.js 14, TypeScript, Tailwind CSS align with constitution
- Quality Gates: Lighthouse CI, accessibility testing, responsive design verification planned

## Project Structure

### Documentation (this feature)

```text
specs/001-personal-portfolio/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md         # Phase 1 output (/speckit.plan command)
├── contracts/            # Phase 1 output (/speckit.plan command)
└── tasks.md              # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
app/                      # Next.js 14 App Router
├── (routes)/             # Route groups
│   ├── blog/
│   │   ├── page.tsx      # Blog list page
│   │   ├── [slug]/
│   │   │   └── page.tsx  # Individual blog post
│   │   └── rss.xml/
│   │       └── route.ts  # RSS feed generation
│   ├── portfolio/
│   │   ├── page.tsx      # Portfolio grid page
│   │   └── [slug]/
│   │       └── page.tsx  # Project detail page
│   ├── about/
│   │   └── page.tsx      # Personal profile page
│   └── page.tsx          # Homepage
├── layout.tsx            # Root layout with theme provider
├── globals.css           # Global styles and Tailwind imports
└── not-found.tsx         # 404 page

components/               # Reusable UI components
├── ui/                   # Base UI components
│   ├── Button.tsx
│   ├── Card.tsx
│   ├── Badge.tsx
│   └── ...
├── blog/                 # Blog-specific components
│   ├── ArticleCard.tsx
│   ├── ArticleList.tsx
│   ├── TableOfContents.tsx
│   ├── SearchBar.tsx
│   └── CodeBlock.tsx
├── portfolio/            # Portfolio-specific components
│   ├── ProjectCard.tsx
│   ├── ProjectGrid.tsx
│   ├── TechFilter.tsx
│   └── ProjectDetail.tsx
├── about/                # About page components
│   ├── SkillsRadar.tsx
│   ├── Timeline.tsx
│   ├── ContactCard.tsx
│   └── TechStack.tsx
├── layout/               # Layout components
│   ├── Header.tsx
│   ├── Footer.tsx
│   ├── Navigation.tsx
│   └── ThemeToggle.tsx
└── shared/               # Shared utilities
    ├── ReadingTime.tsx
    └── Image.tsx

lib/                      # Utility functions and helpers
├── content/              # Content loading utilities
│   ├── blog.ts          # Blog article loading
│   ├── projects.ts      # Portfolio project loading
│   └── about.ts         # Profile data loading
├── utils/                # General utilities
│   ├── search.ts        # Full-text search
│   ├── reading-time.ts  # Reading time calculation
│   └── rss.ts           # RSS feed generation
└── constants/            # Constants and config
    ├── categories.ts
    └── tech-stack.ts

content/                  # Content files (MDX, JSON, YAML)
├── blog/                 # Blog articles (MDX files)
│   ├── post-1.mdx
│   └── ...
├── projects/             # Portfolio projects (JSON/YAML)
│   ├── project-1.json
│   └── ...
└── about/                 # Profile data
    ├── skills.json
    ├── timeline.json
    └── contact.json

public/                   # Static assets
├── images/               # Optimized images
├── icons/                # PWA icons
└── manifest.json         # PWA manifest

styles/                   # Additional styles (if needed)
└── components.css        # Component-specific styles

tests/                    # Test files
├── unit/                 # Unit tests
├── integration/          # Integration tests
└── e2e/                  # End-to-end tests (if using Playwright)
```

**Structure Decision**: Using Next.js 14 App Router structure with route groups for organization. Components are organized by feature domain (blog, portfolio, about) with shared UI components in `components/ui/`. Content is stored in `content/` directory as MDX files for blog posts and JSON/YAML for structured data (projects, profile). This structure supports component-first architecture, content-driven updates, and clear separation of concerns.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

No violations to justify.
