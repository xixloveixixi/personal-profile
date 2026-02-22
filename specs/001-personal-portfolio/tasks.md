# Tasks: Personal Portfolio Website

**Input**: Design documents from `/specs/001-personal-portfolio/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: Tests are OPTIONAL - only include them if explicitly requested in the feature specification. No test tasks included as tests were not explicitly requested.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Web app**: Next.js App Router structure with `app/`, `components/`, `lib/`, `content/` at repository root
- Paths follow Next.js 14 App Router conventions

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [x] T001 Create Next.js 14 project with TypeScript and App Router in repository root
- [x] T002 [P] Install and configure Tailwind CSS in `tailwind.config.js`
- [x] T003 [P] Install and configure ESLint and Prettier with TypeScript support
- [x] T004 [P] Setup TypeScript strict mode configuration in `tsconfig.json`
- [x] T005 Create project directory structure (app/, components/, lib/, content/, public/)
- [x] T006 [P] Install core dependencies: next-mdx-remote, rehype-highlight, next-themes, framer-motion, lucide-react
- [x] T007 [P] Install additional dependencies: fuse.js, feed, gray-matter
- [x] T008 Configure Next.js Image optimization in `next.config.js`
- [x] T009 Create root layout with theme provider in `app/layout.tsx`
- [x] T010 Create global styles with Tailwind imports in `app/globals.css`
- [x] T011 [P] Create content directory structure (content/blog/, content/projects/, content/about/)
- [x] T012 [P] Create public directory structure (public/images/, public/icons/)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T013 Create category constants in `lib/constants/categories.ts` (technical, essays, tutorials)
- [x] T014 Create technology stack constants in `lib/constants/tech-stack.ts`
- [x] T015 [P] Create base UI components: Button in `components/ui/Button.tsx`
- [x] T016 [P] Create base UI components: Card in `components/ui/Card.tsx`
- [x] T017 [P] Create base UI components: Badge in `components/ui/Badge.tsx`
- [x] T018 Create layout components: Header in `components/layout/Header.tsx`
- [x] T019 Create layout components: Navigation in `components/layout/Navigation.tsx`
- [x] T020 Create layout components: Footer in `components/layout/Footer.tsx`
- [x] T021 Create layout components: ThemeToggle in `components/layout/ThemeToggle.tsx`
- [x] T022 Create content loading utility: blog.ts in `lib/content/blog.ts` (getAllArticles, getArticleBySlug)
- [x] T023 Create content loading utility: projects.ts in `lib/content/projects.ts` (getAllProjects, getProjectBySlug)
- [x] T024 Create content loading utility: about.ts in `lib/content/about.ts` (getProfileData)
- [x] T025 Create utility: reading-time.ts in `lib/utils/reading-time.ts` (calculate reading time from content)
- [x] T026 Create utility: search.ts in `lib/utils/search.ts` (full-text search with Fuse.js)
- [x] T027 Create homepage in `app/page.tsx` with navigation to blog, portfolio, and about sections
- [x] T028 Create 404 page in `app/not-found.tsx`
- [x] T029 Configure next-themes provider in root layout with system preference detection
- [x] T030 Setup Tailwind dark mode configuration in `tailwind.config.js`

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Browse and Read Blog Articles (Priority: P1) 🎯 MVP

**Goal**: Visitors can browse blog articles organized by categories and tags, read full articles with code syntax highlighting, navigate using automatically generated table of contents, and search for articles by title, content, or tags. The interface adapts to their system theme preference (dark or light mode) and provides reading time estimates.

**Independent Test**: Can be fully tested by navigating to blog section, viewing article list, reading a single article, and performing a search query. Delivers value as a standalone content consumption experience.

### Implementation for User Story 1

- [x] T031 [P] [US1] Create blog list page in `app/blog/page.tsx` with article listing
- [x] T032 [P] [US1] Create blog article detail page in `app/blog/[slug]/page.tsx` with MDX rendering
- [x] T033 [P] [US1] Create ArticleCard component in `components/blog/ArticleCard.tsx` with title, description, category, tags, reading time
- [x] T034 [P] [US1] Create ArticleList component in `components/blog/ArticleList.tsx` for displaying article grid/list
- [x] T035 [P] [US1] Create SearchBar component in `components/blog/SearchBar.tsx` with full-text search functionality
- [x] T036 [US1] Integrate search functionality in blog list page using search utility (depends on T026, T035)
- [x] T037 [P] [US1] Create TableOfContents component in `components/blog/TableOfContents.tsx` with scroll-based highlighting
- [x] T038 [US1] Integrate TableOfContents in article detail page (depends on T032, T037)
- [x] T039 [P] [US1] Create CodeBlock component in `components/blog/CodeBlock.tsx` with syntax highlighting using rehype-highlight
- [x] T040 [US1] Configure MDX components for code blocks, images, and custom elements (depends on T032, T039)
- [x] T041 [US1] Add category filtering in blog list page (depends on T031)
- [x] T042 [US1] Add tag filtering in blog list page (depends on T031)
- [x] T043 [US1] Implement reading time calculation and display in ArticleCard (depends on T025, T033)
- [x] T044 [US1] Add theme-aware styling to all blog components (dark/light mode support)
- [x] T045 [US1] Create sample blog article MDX file in `content/blog/example.mdx` for testing
- [x] T046 [US1] Add responsive design for blog list and article pages (mobile, tablet, desktop breakpoints)
- [x] T047 [US1] Add semantic HTML and ARIA labels for accessibility in blog components
- [x] T048 [US1] Implement keyboard navigation support for search and filters

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently. Visitors can browse articles, search, read with syntax highlighting, and navigate with table of contents.

---

## Phase 4: User Story 2 - Explore Portfolio Projects (Priority: P1) 🎯 MVP

**Goal**: Visitors can browse a responsive grid of portfolio projects, filter projects by technology stack tags, view project cards with key information, and access detailed project pages with comprehensive descriptions including problem context, technical solutions, challenges, and results.

**Independent Test**: Can be fully tested by navigating to portfolio section, viewing project grid, filtering by technology, clicking a project card, and viewing project details. Delivers value as a standalone project showcase experience.

### Implementation for User Story 2

- [x] T049 [P] [US2] Create portfolio grid page in `app/portfolio/page.tsx` with responsive grid layout
- [x] T050 [P] [US2] Create project detail page in `app/portfolio/[slug]/page.tsx` with project information sections
- [x] T051 [P] [US2] Create ProjectCard component in `components/portfolio/ProjectCard.tsx` with title, description, tech tags, links
- [x] T052 [P] [US2] Create ProjectGrid component in `components/portfolio/ProjectGrid.tsx` with responsive columns (3/2/1)
- [x] T053 [P] [US2] Create TechFilter component in `components/portfolio/TechFilter.tsx` for filtering by technology stack
- [x] T054 [US2] Integrate TechFilter in portfolio grid page (depends on T049, T053)
- [x] T055 [US2] Implement technology stack filtering logic in portfolio page (depends on T049, T054)
- [x] T056 [P] [US2] Create ProjectDetail component in `components/portfolio/ProjectDetail.tsx` with problem, solution, challenges, results sections
- [x] T057 [US2] Integrate ProjectDetail component in project detail page (depends on T050, T056)
- [x] T058 [US2] Add hover animation to ProjectCard using Framer Motion (depends on T051)
- [x] T059 [US2] Add smooth transitions and loading states for portfolio pages
- [x] T060 [US2] Create sample portfolio project JSON file in `content/projects/example.json` for testing
- [x] T061 [US2] Add responsive design for portfolio grid and detail pages (mobile, tablet, desktop breakpoints)
- [x] T062 [US2] Add semantic HTML and ARIA labels for accessibility in portfolio components
- [x] T063 [US2] Implement keyboard navigation support for filters and project cards
- [x] T064 [US2] Add GitHub and demo link handling with proper external link attributes

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently. Visitors can browse and read blog articles, and explore portfolio projects with filtering.

---

## Phase 5: User Story 3 - View Personal Profile and Contact Information (Priority: P2)

**Goal**: Visitors can view a comprehensive personal profile page including a skills radar chart showing proficiency across different skill categories, a timeline of education and work experience, contact information cards with links to professional profiles, and a list of daily-use technology stack.

**Independent Test**: Can be fully tested by navigating to "About" section, viewing skills visualization, scrolling through timeline, and accessing contact links. Delivers value as a standalone profile and contact experience.

### Implementation for User Story 3

- [x] T065 [P] [US3] Create about page in `app/about/page.tsx` with profile sections
- [x] T066 [P] [US3] Create SkillsRadar component in `components/about/SkillsRadar.tsx` with radar chart visualization
- [x] T067 [P] [US3] Create Timeline component in `components/about/Timeline.tsx` with chronological education/work entries
- [x] T068 [P] [US3] Create ContactCard component in `components/about/ContactCard.tsx` with platform links and icons
- [x] T069 [P] [US3] Create TechStack component in `components/about/TechStack.tsx` for daily-use tools list
- [x] T070 [US3] Integrate SkillsRadar component in about page (depends on T065, T066)
- [x] T071 [US3] Integrate Timeline component in about page (depends on T065, T067)
- [x] T072 [US3] Integrate ContactCard components in about page (depends on T065, T068)
- [x] T073 [US3] Integrate TechStack component in about page (depends on T065, T069)
- [x] T074 [US3] Create sample profile data files: skills.json, timeline.json, contact.json in `content/about/`
- [x] T075 [US3] Add responsive design for about page sections (mobile, tablet, desktop breakpoints)
- [x] T076 [US3] Add semantic HTML and ARIA labels for accessibility in about components
- [x] T077 [US3] Implement keyboard navigation support for contact links and timeline entries
- [x] T078 [US3] Add smooth scroll animations for timeline entries using Framer Motion

**Checkpoint**: At this point, User Stories 1, 2, AND 3 should all work independently. Visitors can browse blog, explore portfolio, and view personal profile.

---

## Phase 6: User Story 4 - Access Site via Progressive Web App (Priority: P3)

**Goal**: Visitors can install the site as a Progressive Web App on their device, access content offline, and receive updates when new content is published.

**Independent Test**: Can be fully tested by installing the PWA, disconnecting from network, accessing previously viewed content, and verifying offline functionality. Delivers value as a standalone offline content access experience.

### Implementation for User Story 4

- [x] T079 [P] [US4] Install and configure next-pwa in `next.config.js`
- [x] T080 [P] [US4] Create PWA manifest file in `public/manifest.json` with app metadata
- [x] T081 [P] [US4] Generate PWA icons in multiple sizes in `public/icons/` directory
- [x] T082 [US4] Configure service worker caching strategy for blog articles and portfolio projects (depends on T079)
- [x] T083 [US4] Configure service worker caching strategy for static assets (images, CSS, JS) (depends on T079)
- [x] T084 [US4] Add PWA install prompt component in `components/shared/PWAInstall.tsx` (depends on T079)
- [x] T085 [US4] Integrate PWA install prompt in root layout or homepage (depends on T084)
- [ ] T086 [US4] Test offline functionality for cached blog articles
- [ ] T087 [US4] Test offline functionality for cached portfolio projects
- [ ] T088 [US4] Add update notification when new content is available (depends on T079)

**Checkpoint**: At this point, User Story 4 should be fully functional. Visitors can install the PWA and access cached content offline.

---

## Phase 7: User Story 5 - Subscribe to Blog via RSS Feed (Priority: P3)

**Goal**: Visitors can subscribe to blog content via RSS feed to receive updates when new articles are published.

**Independent Test**: Can be fully tested by accessing RSS feed URL, verifying feed structure, and subscribing in a feed reader. Delivers value as a standalone content subscription mechanism.

### Implementation for User Story 5

- [x] T089 [P] [US5] Create RSS feed generation utility in `lib/utils/rss.ts` using feed library
- [x] T090 [US5] Create RSS feed route handler in `app/blog/rss.xml/route.ts` (depends on T089)
- [x] T091 [US5] Implement RSS feed generation from blog articles metadata (depends on T090, T022)
- [x] T092 [US5] Add proper RSS feed metadata (title, description, link, language) (depends on T090)
- [x] T093 [US5] Format article entries with title, description, publication date, link, categories, tags (depends on T090)
- [x] T094 [US5] Set appropriate cache headers for RSS feed route (depends on T090)
- [x] T095 [US5] Add RSS feed link in blog page header/footer for discoverability
- [x] T096 [US5] Test RSS feed validity with feed reader or validator

**Checkpoint**: At this point, User Story 5 should be fully functional. Visitors can subscribe to blog updates via RSS feed.

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [x] T097 [P] Add metadata (title, description, Open Graph) to all pages using Next.js Metadata API
- [x] T098 [P] Add structured data (JSON-LD) for blog articles and portfolio projects
- [x] T099 [P] Generate sitemap.xml for all pages
- [x] T100 Optimize all images using Next.js Image component across all pages
- [x] T101 [P] Add loading states and error boundaries for all data-fetching operations
- [x] T102 [P] Implement smooth page transitions using Framer Motion
- [x] T103 [P] Add focus management and skip links for accessibility
- [ ] T104 [P] Verify WCAG 2.1 AA compliance with Lighthouse accessibility audit
- [ ] T105 [P] Test responsive design on mobile (320px-767px), tablet (768px-1024px), desktop (1920px+)
- [ ] T106 [P] Run Lighthouse performance audit and optimize to achieve ≥95 score
- [x] T107 [P] Run Lighthouse SEO audit and optimize to achieve 100 score
- [x] T108 [P] Verify all external links have proper rel attributes (noopener, noreferrer)
- [x] T109 [P] Add proper alt text to all images
- [ ] T110 [P] Test keyboard navigation across all pages
- [ ] T111 [P] Test with screen readers (NVDA, VoiceOver)
- [x] T112 [P] Verify dark/light theme works correctly on all pages
- [x] T113 [P] Add error pages (404, 500) with proper styling and messaging
- [ ] T114 [P] Code cleanup and refactoring for consistency
- [x] T115 [P] Update README.md with setup instructions and project overview
- [ ] T116 Run quickstart.md validation to ensure all setup steps work correctly

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3+)**: All depend on Foundational phase completion
  - User stories can then proceed in parallel (if staffed)
  - Or sequentially in priority order (P1 → P2 → P3)
- **Polish (Final Phase)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 3 (P2)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 4 (P3)**: Can start after Foundational (Phase 2) - Depends on content from US1 and US2 for caching
- **User Story 5 (P3)**: Can start after Foundational (Phase 2) - Depends on US1 blog articles for feed generation

### Within Each User Story

- Models/utilities before components
- Components before pages
- Core implementation before integration
- Story complete before moving to next priority

### Parallel Opportunities

- All Setup tasks marked [P] can run in parallel
- All Foundational tasks marked [P] can run in parallel (within Phase 2)
- Once Foundational phase completes, User Stories 1, 2, and 3 can start in parallel
- All components within a story marked [P] can run in parallel
- Different user stories can be worked on in parallel by different team members
- All Polish tasks marked [P] can run in parallel

---

## Parallel Example: User Story 1

```bash
# Launch all components for User Story 1 together:
Task: "Create ArticleCard component in components/blog/ArticleCard.tsx"
Task: "Create ArticleList component in components/blog/ArticleList.tsx"
Task: "Create SearchBar component in components/blog/SearchBar.tsx"
Task: "Create TableOfContents component in components/blog/TableOfContents.tsx"
Task: "Create CodeBlock component in components/blog/CodeBlock.tsx"

# Launch all pages for User Story 1 together:
Task: "Create blog list page in app/blog/page.tsx"
Task: "Create blog article detail page in app/blog/[slug]/page.tsx"
```

---

## Parallel Example: User Story 2

```bash
# Launch all components for User Story 2 together:
Task: "Create ProjectCard component in components/portfolio/ProjectCard.tsx"
Task: "Create ProjectGrid component in components/portfolio/ProjectGrid.tsx"
Task: "Create TechFilter component in components/portfolio/TechFilter.tsx"
Task: "Create ProjectDetail component in components/portfolio/ProjectDetail.tsx"

# Launch all pages for User Story 2 together:
Task: "Create portfolio grid page in app/portfolio/page.tsx"
Task: "Create project detail page in app/portfolio/[slug]/page.tsx"
```

---

## Implementation Strategy

### MVP First (User Stories 1 & 2 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: User Story 1 (Blog)
4. Complete Phase 4: User Story 2 (Portfolio)
5. **STOP and VALIDATE**: Test both stories independently
6. Deploy/demo if ready

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 (Blog) → Test independently → Deploy/Demo (MVP!)
3. Add User Story 2 (Portfolio) → Test independently → Deploy/Demo
4. Add User Story 3 (About) → Test independently → Deploy/Demo
5. Add User Story 4 (PWA) → Test independently → Deploy/Demo
6. Add User Story 5 (RSS) → Test independently → Deploy/Demo
7. Complete Polish phase → Final deployment
8. Each story adds value without breaking previous stories

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - Developer A: User Story 1 (Blog)
   - Developer B: User Story 2 (Portfolio)
   - Developer C: User Story 3 (About)
3. After P1 stories complete:
   - Developer A: User Story 4 (PWA)
   - Developer B: User Story 5 (RSS)
   - Developer C: Polish phase tasks
4. Stories complete and integrate independently

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Avoid: vague tasks, same file conflicts, cross-story dependencies that break independence
- All components must follow component-first architecture (reusable, self-contained)
- All pages must be responsive (mobile-first) and accessible (WCAG 2.1 AA)
- Performance targets: Lighthouse Performance ≥ 95, FCP < 1.5s, LCP < 2.5s

