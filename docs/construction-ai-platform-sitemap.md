# AI Construction Management Platform - Sitemap File Tree

```
/
├── auth/
│   ├── login
│   ├── forgot-password
│   ├── reset-password
│   ├── two-factor-auth
│   └── logout
│
├── dashboard/
│   ├── index (main dashboard)
│   ├── executive-summary
│   ├── notifications
│   └── quick-actions
│
├── projects/
│   ├── index (projects overview)
│   ├── active
│   ├── completed
│   ├── upcoming
│   ├── archived
│   ├── create-new
│   ├── templates
│   └── [project-id]/
│       ├── overview
│       ├── ai-insights
│       ├── meetings/
│       │   ├── index
│       │   ├── [meeting-id]
│       │   ├── schedule-new
│       │   └── transcripts
│       ├── updates/
│       │   ├── index
│       │   ├── submit-update
│       │   ├── [update-id]
│       │   └── photo-gallery
│       ├── financials/
│       │   ├── budget
│       │   ├── change-orders
│       │   ├── invoicing
│       │   ├── cost-tracking
│       │   └── forecasting
│       ├── documents/
│       │   ├── drawings
│       │   ├── contracts
│       │   ├── permits
│       │   ├── specifications
│       │   └── correspondence
│       ├── team/
│       │   ├── assignments
│       │   ├── roles
│       │   ├── communication
│       │   └── performance
│       ├── schedule/
│       │   ├── timeline
│       │   ├── milestones
│       │   ├── critical-path
│       │   └── resource-allocation
│       ├── quality/
│       │   ├── inspections
│       │   ├── testing
│       │   ├── compliance
│       │   └── punch-list
│       └── safety/
│           ├── incidents
│           ├── training
│           ├── compliance
│           └── meetings
│
├── ai-assistant/
│   ├── index (main chat interface)
│   ├── conversations/
│   │   ├── recent
│   │   ├── [conversation-id]
│   │   └── archived
│   ├── insights/
│   │   ├── dashboard
│   │   ├── risks
│   │   ├── opportunities
│   │   ├── recommendations
│   │   └── trends
│   ├── search/
│   │   ├── documents
│   │   ├── meetings
│   │   ├── projects
│   │   └── advanced-search
│   ├── training-data/
│   │   ├── meeting-transcripts
│   │   ├── documents
│   │   ├── project-data
│   │   └── performance-metrics
│   └── settings/
│       ├── preferences
│       ├── permissions
│       └── feedback
│
├── knowledge-base/
│   ├── index (main library)
│   ├── ai-chat
│   ├── documents/
│   │   ├── policies
│   │   ├── procedures
│   │   ├── technical-specs
│   │   ├── safety-manuals
│   │   ├── training-materials
│   │   └── templates
│   ├── training/
│   │   ├── courses
│   │   ├── modules
│   │   ├── assessments
│   │   ├── certifications
│   │   └── progress-tracking
│   ├── upload/
│   │   ├── single-file
│   │   ├── bulk-upload
│   │   └── onedrive-sync
│   ├── search/
│   │   ├── intelligent-search
│   │   ├── filters
│   │   └── suggestions
│   └── categories/
│       ├── construction
│       ├── safety
│       ├── quality
│       ├── hr-policies
│       └── compliance
│
├── hr-people/
│   ├── index (people dashboard)
│   ├── directory/
│   │   ├── all-employees
│   │   ├── departments
│   │   ├── roles
│   │   └── org-chart
│   ├── employees/
│   │   └── [employee-id]/
│   │       ├── profile
│   │       ├── basic-info
│   │       ├── contact-details
│   │       ├── emergency-contacts
│   │       ├── training/
│   │       │   ├── completed
│   │       │   ├── in-progress
│   │       │   ├── required
│   │       │   └── certifications
│   │       ├── performance/
│   │       │   ├── reviews
│   │       │   ├── goals
│   │       │   ├── feedback
│   │       │   └── development-plan
│   │       ├── disciplinary/
│   │       │   ├── warnings
│   │       │   ├── write-ups
│   │       │   ├── corrective-actions
│   │       │   └── history
│   │       ├── payroll/
│   │       │   ├── salary-info
│   │       │   ├── benefits
│   │       │   ├── time-tracking
│   │       │   └── tax-documents
│   │       └── documents/
│   │           ├── contracts
│   │           ├── handbook-acknowledgments
│   │           ├── safety-training
│   │           └── personal-documents
│   ├── recruiting/
│   │   ├── open-positions
│   │   ├── candidates
│   │   ├── interviews
│   │   └── onboarding
│   ├── performance/
│   │   ├── review-cycles
│   │   ├── templates
│   │   ├── calibration
│   │   └── analytics
│   └── reports/
│       ├── headcount
│       ├── turnover
│       ├── training-compliance
│       └── performance-metrics
│
├── issues-quality/
│   ├── index (issues dashboard)
│   ├── issues/
│   │   ├── open
│   │   ├── in-progress
│   │   ├── resolved
│   │   ├── create-new
│   │   └── [issue-id]/
│   │       ├── details
│   │       ├── timeline
│   │       ├── photos
│   │       ├── resolution
│   │       ├── cost-impact
│   │       └── prevention
│   ├── categories/
│   │   ├── safety
│   │   ├── quality
│   │   ├── schedule
│   │   ├── budget
│   │   └── communication
│   ├── analytics/
│   │   ├── trends
│   │   ├── cost-analysis
│   │   ├── frequency
│   │   ├── resolution-time
│   │   └── prevention-metrics
│   ├── tagging/
│   │   ├── employee-tags
│   │   ├── project-tags
│   │   ├── severity-tags
│   │   └── financial-impact
│   └── prevention/
│       ├── recommendations
│       ├── best-practices
│       ├── training-needs
│       └── system-improvements
│
├── estimating-bids/
│   ├── index (estimating dashboard)
│   ├── estimates/
│   │   ├── active
│   │   ├── submitted
│   │   ├── won
│   │   ├── lost
│   │   ├── create-new
│   │   └── [estimate-id]/
│   │       ├── overview
│   │       ├── line-items
│   │       ├── labor-costs
│   │       ├── material-costs
│   │       ├── equipment-costs
│   │       ├── subcontractor-bids
│   │       ├── markup-profit
│   │       └── final-proposal
│   ├── subcontractors/
│   │   ├── database
│   │   ├── prequalification
│   │   ├── performance-ratings
│   │   ├── insurance-tracking
│   │   └── [subcontractor-id]/
│   │       ├── profile
│   │       ├── capabilities
│   │       ├── past-performance
│   │       ├── insurance-docs
│   │       └── bid-history
│   ├── bid-management/
│   │   ├── opportunities
│   │   ├── invitations
│   │   ├── submissions
│   │   ├── follow-up
│   │   └── results
│   ├── cost-database/
│   │   ├── labor-rates
│   │   ├── material-pricing
│   │   ├── equipment-costs
│   │   ├── historical-data
│   │   └── market-indices
│   ├── templates/
│   │   ├── estimate-templates
│   │   ├── proposal-formats
│   │   ├── qualification-forms
│   │   └── contract-templates
│   └── analytics/
│       ├── win-loss-ratio
│       ├── profit-margins
│       ├── bidding-trends
│       └── competitor-analysis
│
├── leads-marketing/
│   ├── index (marketing dashboard)
│   ├── leads/
│   │   ├── pipeline
│   │   ├── prospects
│   │   ├── qualified
│   │   ├── proposals
│   │   ├── won
│   │   ├── lost
│   │   └── [lead-id]/
│   │       ├── contact-info
│   │       ├── project-details
│   │       ├── requirements
│   │       ├── timeline
│   │       ├── budget
│   │       ├── competitors
│   │       ├── interactions
│   │       └── proposal-status
│   ├── clients/
│   │   ├── active-clients
│   │   ├── past-clients
│   │   ├── prospects
│   │   └── [client-id]/
│   │       ├── profile
│   │       ├── project-history
│   │       ├── contacts
│   │       ├── preferences
│   │       ├── communications
│   │       └── relationship-notes
│   ├── marketing/
│   │   ├── campaigns/
│   │   │   ├── email-campaigns
│   │   │   ├── social-media
│   │   │   ├── content-calendar
│   │   │   └── advertising
│   │   ├── content/
│   │   │   ├── case-studies
│   │   │   ├── project-showcases
│   │   │   ├── blog-posts
│   │   │   └── white-papers
│   │   ├── ai-copywriting/
│   │   │   ├── proposal-generator
│   │   │   ├── email-templates
│   │   │   ├── social-media-posts
│   │   │   └── marketing-copy
│   │   └── website/
│   │       ├── portfolio
│   │       ├── services
│   │       ├── team-bios
│   │       └── testimonials
│   ├── networking/
│   │   ├── industry-events
│   │   ├── trade-shows
│   │   ├── conferences
│   │   └── associations
│   └── analytics/
│       ├── lead-sources
│       ├── conversion-rates
│       ├── pipeline-value
│       ├── roi-analysis
│       └── market-trends
│
├── reporting/
│   ├── index (reports dashboard)
│   ├── financial/
│   │   ├── profit-loss
│   │   ├── cash-flow
│   │   ├── project-profitability
│   │   └── budget-variance
│   ├── operational/
│   │   ├── project-status
│   │   ├── resource-utilization
│   │   ├── productivity-metrics
│   │   └── schedule-performance
│   ├── safety/
│   │   ├── incident-reports
│   │   ├── safety-metrics
│   │   ├── compliance-status
│   │   └── training-records
│   ├── quality/
│   │   ├── defect-tracking
│   │   ├── inspection-results
│   │   ├── client-satisfaction
│   │   └── rework-analysis
│   ├── hr/
│   │   ├── workforce-analytics
│   │   ├── training-compliance
│   │   ├── performance-summary
│   │   └── turnover-analysis
│   └── custom/
│       ├── report-builder
│       ├── saved-reports
│       └── scheduled-reports
│
├── settings/
│   ├── account/
│   │   ├── profile
│   │   ├── security
│   │   ├── preferences
│   │   └── notifications
│   ├── company/
│   │   ├── information
│   │   ├── branding
│   │   ├── locations
│   │   └── legal-documents
│   ├── users/
│   │   ├── user-management
│   │   ├── roles-permissions
│   │   ├── access-control
│   │   └── audit-logs
│   ├── system/
│   │   ├── integrations
│   │   ├── api-settings
│   │   ├── backup-restore
│   │   └── data-export
│   ├── ai/
│   │   ├── training-data
│   │   ├── model-settings
│   │   ├── confidence-thresholds
│   │   └── feedback-loops
│   └── billing/
│       ├── subscription
│       ├── usage-metrics
│       ├── invoices
│       └── payment-methods
│
├── help/
│   ├── index (help center)
│   ├── getting-started
│   ├── user-guides
│   ├── video-tutorials
│   ├── faq
│   ├── api-documentation
│   ├── contact-support
│   └── feedback
│
└── admin/
    ├── system-health
    ├── user-activity
    ├── data-management
    ├── security-monitoring
    ├── integration-status
    ├── ai-model-management
    ├── backup-status
    └── system-logs
```

## Page Count Summary

**Total Pages: ~400+ unique pages/views**

### By Section:
- **Authentication**: 5 pages
- **Dashboard**: 4 pages
- **Projects**: ~80 pages (including dynamic project pages)
- **AI Assistant**: ~15 pages
- **Knowledge Base**: ~20 pages
- **HR & People**: ~60 pages (including dynamic employee pages)
- **Issues & Quality**: ~25 pages
- **Estimating & Bids**: ~45 pages
- **Leads & Marketing**: ~50 pages
- **Reporting**: ~20 pages
- **Settings**: ~25 pages
- **Help**: ~8 pages
- **Admin**: ~8 pages

### Dynamic Content Pages:
- **[project-id]**: Dynamic project pages (1 structure × number of projects)
- **[employee-id]**: Dynamic employee pages (1 structure × number of employees)  
- **[issue-id]**: Dynamic issue pages (1 structure × number of issues)
- **[estimate-id]**: Dynamic estimate pages (1 structure × number of estimates)
- **[lead-id]**: Dynamic lead pages (1 structure × number of leads)
- **[client-id]**: Dynamic client pages (1 structure × number of clients)
- **[subcontractor-id]**: Dynamic subcontractor pages (1 structure × number of subcontractors)

## Implementation Notes

1. **Progressive Web App (PWA)** structure for mobile field operations
2. **Modular Architecture** allowing phased development and rollout
3. **API-First Design** supporting mobile apps and third-party integrations
4. **Role-Based Access Control** built into the page structure
5. **Search & Navigation** optimized for finding information quickly
6. **Responsive Design** for desktop, tablet, and mobile devices
7. **Offline Capability** for critical field operations pages
8. **Real-time Updates** for collaborative project management
