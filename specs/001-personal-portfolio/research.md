# Research: Personal Portfolio Website

**Date**: 2026-02-05  
**Feature**: Personal Portfolio Website  
**Phase**: 0 - Outline & Research

## Technology Decisions

### MDX Content Management

**Decision**: Use `next-mdx-remote` or `@next/mdx` for MDX processing with Next.js 14 App Router.

**Rationale**: 
- `next-mdx-remote` provides server-side MDX rendering with better performance for static sites
- Supports custom components for code blocks, images, and interactive elements
- Works seamlessly with Next.js App Router and static generation
- Allows dynamic imports of MDX content without build-time processing

**Alternatives considered**:
- `@next/mdx`: Requires build-time processing, less flexible for dynamic content
- `mdx-bundler`: More complex setup, overkill for static content
- Plain markdown with `react-markdown`: Less powerful, no component support

**Implementation notes**:
- Store MDX files in `content/blog/` directory
- Use frontmatter for metadata (title, date, category, tags)
- Create custom MDX components for code blocks, images, and interactive elements

### Code Syntax Highlighting

**Decision**: Use `rehype-highlight` or `prism-react-renderer` with MDX.

**Rationale**:
- `rehype-highlight` integrates well with MDX processing pipeline
- Supports multiple languages (TypeScript, JavaScript, JSX, CSS, etc.)
- Provides accessible color schemes for dark/light themes
- Lightweight and performant

**Alternatives considered**:
- `react-syntax-highlighter`: Heavier bundle, but more customization options
- `shiki`: Better syntax accuracy but larger bundle size
- `highlight.js`: Older library, less maintained

**Implementation notes**:
- Configure theme colors to match site theme (dark/light)
- Ensure proper ARIA labels for accessibility
- Lazy load syntax highlighting for code blocks

### Theme Management

**Decision**: Use `next-themes` for dark/light theme switching.

**Rationale**:
- Built specifically for Next.js App Router
- Handles system preference detection automatically
- Prevents flash of wrong theme (FOUC)
- Simple API with React hooks
- Supports persistence via localStorage

**Alternatives considered**:
- Custom theme provider: More control but requires handling FOUC and system preference
- CSS variables only: Simpler but no JavaScript-based switching
- `use-dark-mode`: Less Next.js-specific, more setup required

**Implementation notes**:
- Configure in root layout with `ThemeProvider`
- Use Tailwind dark mode classes with `next-themes`
- Ensure all components support both themes

### Search Functionality

**Decision**: Implement client-side full-text search using Fuse.js or similar lightweight library.

**Rationale**:
- No backend required for static site
- Fast enough for personal portfolio scale (~50-100 articles)
- Supports fuzzy matching and relevance scoring
- Can search across title, content, and tags
- Works offline (PWA compatible)

**Alternatives considered**:
- Server-side search API: Overkill for static site, requires backend
- Algolia/Meilisearch: Powerful but adds external dependency and cost
- Simple string matching: Too basic, poor user experience

**Implementation notes**:
- Index articles at build time or on first load
- Debounce search input for performance
- Show loading state during search
- Display "no results" message clearly

### RSS Feed Generation

**Decision**: Generate RSS feed dynamically using Next.js API route with `feed` library.

**Rationale**:
- `feed` library provides clean RSS/Atom feed generation
- Can generate feed on-demand or at build time
- Supports all required RSS fields (title, description, date, link)
- Works with static site generation

**Alternatives considered**:
- Static XML file: Requires rebuild on every new article
- Third-party service: Adds dependency and cost
- Manual XML generation: Error-prone, harder to maintain

**Implementation notes**:
- Create route handler at `app/blog/rss.xml/route.ts`
- Generate feed from blog article metadata
- Include proper content encoding and XML structure
- Set appropriate cache headers

### PWA Implementation

**Decision**: Use Next.js PWA plugin (`next-pwa`) or manual service worker setup.

**Rationale**:
- `next-pwa` simplifies service worker generation and caching strategies
- Automatically handles offline fallbacks
- Supports app manifest generation
- Works with Next.js App Router

**Alternatives considered**:
- Manual service worker: More control but complex setup
- Workbox directly: More configuration, less Next.js integration
- No PWA: Simpler but loses offline capability

**Implementation notes**:
- Configure caching strategies (stale-while-revalidate for content)
- Generate app icons for multiple sizes
- Create manifest.json with proper metadata
- Test offline functionality thoroughly

### Image Optimization

**Decision**: Use Next.js `Image` component with automatic WebP/AVIF conversion.

**Rationale**:
- Built-in Next.js optimization handles format conversion automatically
- Supports responsive images and lazy loading
- Reduces bundle size and improves performance
- Works seamlessly with Vercel deployment

**Alternatives considered**:
- Manual image optimization: Time-consuming, error-prone
- Third-party CDN: Adds cost and complexity
- No optimization: Poor performance, larger bundle

**Implementation notes**:
- Store original images in `public/images/`
- Use Next.js Image component for all images
- Configure image domains if using external sources
- Set appropriate sizes for responsive images

### Animation Library

**Decision**: Use Framer Motion for animations and transitions.

**Rationale**:
- Declarative API aligns with React patterns
- Excellent performance with hardware acceleration
- Supports complex animations (stagger, spring, etc.)
- Good TypeScript support
- Widely used and well-documented

**Alternatives considered**:
- CSS animations only: Less flexible, harder to coordinate
- React Spring: More complex API, steeper learning curve
- GSAP: Powerful but heavier, overkill for portfolio site

**Implementation notes**:
- Use for page transitions, hover effects, scroll animations
- Keep animations subtle and performant
- Respect `prefers-reduced-motion` for accessibility
- Test on lower-end devices

### Icon Library

**Decision**: Use Lucide React for icons.

**Rationale**:
- Modern, clean icon set
- Tree-shakeable (only import used icons)
- Good TypeScript support
- Consistent design language
- Lightweight bundle

**Alternatives considered**:
- React Icons: Larger bundle, multiple icon sets
- Heroicons: Good but less variety
- Custom SVGs: More control but maintenance overhead

**Implementation notes**:
- Import icons individually to enable tree-shaking
- Use consistent icon sizes throughout site
- Ensure icons are accessible (proper ARIA labels)

## Best Practices

### Performance Optimization

1. **Static Generation**: Use `generateStaticParams` for blog posts and portfolio projects to pre-render all pages at build time
2. **Code Splitting**: Leverage Next.js automatic code splitting, use dynamic imports for heavy components
3. **Image Optimization**: Always use Next.js Image component, provide proper sizes and alt text
4. **Font Optimization**: Use system fonts or next/font for optimized font loading
5. **Bundle Analysis**: Regularly check bundle size, remove unused dependencies

### Accessibility

1. **Semantic HTML**: Use proper heading hierarchy, semantic elements (nav, article, section)
2. **ARIA Labels**: Add ARIA labels for interactive elements, icons, and form controls
3. **Keyboard Navigation**: Ensure all interactive elements are keyboard accessible
4. **Color Contrast**: Verify WCAG AA contrast ratios for all text/background combinations
5. **Focus Management**: Visible focus indicators, logical tab order
6. **Screen Reader Testing**: Test with screen readers (NVDA, VoiceOver)

### SEO

1. **Metadata**: Use Next.js Metadata API for title, description, Open Graph tags
2. **Structured Data**: Add JSON-LD for articles and projects
3. **Sitemap**: Generate sitemap.xml for all pages
4. **RSS Feed**: Proper RSS feed with correct metadata
5. **URL Structure**: Clean, descriptive URLs for blog posts and projects

### Content Management

1. **Frontmatter**: Consistent frontmatter structure for all MDX files
2. **Validation**: Validate frontmatter schema at build time
3. **Content Organization**: Clear directory structure for content files
4. **Version Control**: Track content changes in git
5. **Backup**: Regular backups of content directory

## Dependencies Summary

**Core**:
- `next@14.x` - React framework
- `react@18.x` - UI library
- `typescript@5.x` - Type safety

**Styling**:
- `tailwindcss@3.x` - Utility-first CSS
- `next-themes` - Theme management

**Content**:
- `next-mdx-remote` or `@next/mdx` - MDX processing
- `rehype-highlight` - Code syntax highlighting
- `gray-matter` - Frontmatter parsing

**Features**:
- `framer-motion` - Animations
- `lucide-react` - Icons
- `fuse.js` - Client-side search
- `feed` - RSS feed generation
- `next-pwa` - PWA support

**Development**:
- `eslint` - Linting
- `prettier` - Code formatting
- `@types/node` - Node.js types

## Open Questions Resolved

1. **MDX Processing**: Server-side with `next-mdx-remote` for flexibility
2. **Code Highlighting**: `rehype-highlight` for MDX integration
3. **Theme Switching**: `next-themes` for system preference detection
4. **Search**: Client-side with Fuse.js for simplicity
5. **RSS**: Dynamic generation with `feed` library
6. **PWA**: `next-pwa` for service worker management
7. **Animations**: Framer Motion for declarative animations
8. **Icons**: Lucide React for modern, tree-shakeable icons

## Next Steps

Proceed to Phase 1: Design & Contracts
- Define data models for blog articles, projects, and profile data
- Create API contracts (if needed) for dynamic routes
- Design component interfaces and props
- Create quickstart guide for development setup
