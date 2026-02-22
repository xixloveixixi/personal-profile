<!--
Sync Impact Report:
Version: 0.0.0 → 1.0.0 (Initial creation)
Modified principles: N/A (new constitution)
Added sections: Core Principles, Technology Standards, Development Workflow, Governance
Removed sections: N/A
Templates requiring updates:
  - ✅ plan-template.md (Constitution Check section ready)
  - ✅ spec-template.md (no constitution-specific references)
  - ✅ tasks-template.md (no constitution-specific references)
  - ✅ checklist-template.md (no constitution-specific references)
Follow-up TODOs: None
-->

# Personal Portfolio Constitution

## Core Principles

### I. Component-First Architecture
Every UI element MUST be built as a reusable component. Components must be self-contained, independently testable, and documented with clear props interfaces. Shared components live in a dedicated components directory. No inline component definitions in pages or layouts—all UI elements must be extracted to named components with clear responsibilities.

### II. Responsive & Accessible Design (NON-NEGOTIABLE)
All interfaces MUST be mobile-first and responsive across breakpoints (mobile, tablet, desktop). WCAG 2.1 AA compliance is mandatory for all user-facing content. Semantic HTML, proper ARIA labels, keyboard navigation support, and sufficient color contrast ratios are required. Design tokens (spacing, colors, typography) must be centralized and used consistently.

### III. Performance Optimization
Page load times MUST be optimized: Lighthouse Performance score ≥ 90, First Contentful Paint < 1.5s, Largest Contentful Paint < 2.5s. Images must be optimized (WebP/AVIF with fallbacks), lazy-loaded where appropriate. Code splitting and dynamic imports required for route-based chunks. No unnecessary dependencies—bundle size must be justified and monitored.

### IV. Modern Development Practices
TypeScript is mandatory for all new code. ESLint and Prettier must be configured and enforced. Git commits follow conventional commits format. All features must be developed in feature branches with descriptive names. Code reviews (self-review minimum) required before merging to main. Environment variables for configuration, never hardcode secrets or API keys.

### V. Content-Driven Structure
Content should be easily maintainable and updatable. Prefer markdown or structured data formats for portfolio content (projects, blog posts, etc.). Content and presentation must be separated—content changes should not require code changes. Consider headless CMS or static data files for easy content management.

## Technology Standards

**Primary Stack**: React/Next.js (or equivalent modern framework), TypeScript, Tailwind CSS  
**Build Tool**: Vite, Next.js, or equivalent modern bundler  
**Testing**: Vitest/Jest for unit tests, Playwright/Cypress for E2E (if applicable)  
**Deployment**: Static site generation preferred, serverless functions for dynamic features  
**Hosting**: Vercel, Netlify, or equivalent modern platform  

**Constraints**: 
- No jQuery or legacy libraries unless absolutely necessary
- Prefer CSS-in-JS or utility-first CSS (Tailwind) over global CSS
- API calls must include proper error handling and loading states
- All external dependencies must be justified and kept up-to-date

## Development Workflow

**Branch Strategy**: Feature branches from `main`, descriptive branch names (`feature/`, `fix/`, `docs/` prefixes)  
**Code Review**: Self-review minimum before merge, verify accessibility and responsive design  
**Testing**: Unit tests for utilities and complex logic, visual regression testing for UI components  
**Deployment**: Automated deployments from `main` branch, preview deployments for feature branches  
**Documentation**: README must include setup instructions, component documentation in code comments or Storybook  

**Quality Gates**:
- All pages must pass Lighthouse accessibility audit (≥ 90)
- No console errors or warnings in production builds
- Responsive design verified on mobile, tablet, and desktop viewports
- All external links must be valid and functional

## Governance

This constitution supersedes all other development practices and style guides. Amendments require:
1. Documentation of the change rationale
2. Update to this constitution file with version bump
3. Propagation of changes to affected templates and documentation
4. Verification that existing features remain compliant

All feature implementations must verify compliance with these principles before merging. Complexity beyond these principles must be justified in the implementation plan with explicit rationale for why simpler alternatives were rejected.

**Version**: 1.0.0 | **Ratified**: 2026-02-05 | **Last Amended**: 2026-02-05
