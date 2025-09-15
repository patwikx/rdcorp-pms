# Property Management System

A comprehensive enterprise-grade property management system built with modern web technologies for managing real estate portfolios, document custody, approvals, and compliance across multiple business units.

## 🏢 System Overview

This system provides complete property lifecycle management with sophisticated workflow capabilities, designed for organizations managing large property portfolios across multiple subsidiaries, branches, and external partnerships.

## 🛠️ Tech Stack

- **Frontend**: Next.js 15.5.3 with TypeScript
- **State Management**: Zustand
- **Validation**: Zod
- **UI Components**: shadcn/ui
- **Styling**: Tailwind CSS
- **Animations**: Framer Motion
- **Database**: PostgreSQL with Prisma ORM
- **File Storage**: MinIO
- **Authentication**: NextAuth.js

## ✨ Core Features

### 🔐 Authentication & Authorization
- **Multi-level Role System**: Staff → Manager → Director → VP → Managing Director
- **Granular Permissions**: Module-based CRUD and approval permissions
- **Business Unit Access Control**: Users assigned to specific business units with defined roles
- **Session Management**: Secure session handling with NextAuth.js

### 🏗️ Property Management
- **Comprehensive Property Registry**: Title numbers, lot details, ownership, encumbrances
- **Property Classification**: Residential, Commercial, Industrial, Agricultural, Mixed-use
- **Dynamic Status Tracking**: Active, Released, Bank Custody, Under Review, etc.
- **Multi-location Support**: Main office, subsidiaries, banks, external holders
- **Real-time Custody Tracking**: Always know where your property documents are

### 📋 Advanced Workflow Management

#### Property Release System
- **Multi-destination Releases**: To subsidiaries, banks, or external entities
- **Purpose Tracking**: Loan applications, development projects, legal proceedings
- **Expected Return Dates**: Automated tracking and reminders
- **Transmittal Management**: Reference numbers and receipt confirmations

#### Property Turnover System
- **Internal Transfers**: Between departments and business units
- **Custody Changes**: Seamless custodian reassignment
- **Cross-subsidiary Turnovers**: Multi-entity property management

#### Property Return System
- **Document Condition Tracking**: Record document state upon return
- **Flexible Return Types**: From subsidiaries, banks, or external parties
- **Reason Documentation**: Comprehensive return reason tracking

### 🔄 Multi-Step Approval Workflows
- **Configurable Approval Chains**: Customize approval steps per transaction type
- **Role-based Routing**: Automatic routing to appropriate approvers
- **Override Capabilities**: Senior roles can override with audit trail
- **Real-time Status Tracking**: See exactly where each approval stands
- **Notification System**: Alert relevant parties of pending approvals

### 📊 Real Property Tax (RPT) Management
- **Comprehensive Tax Tracking**: Assessed values, tax rates, calculations
- **Multiple Payment Schedules**: Quarterly, Semi-annual, Annual options
- **Penalty & Discount Calculations**: Automated fee computations
- **Payment History**: Complete payment tracking with receipts
- **Automated Reminders**: Due date notifications and overdue alerts
- **Tax Document Management**: Bills, receipts, clearances, assessments

### 🏦 Bank Integration
- **Bank Registry**: Comprehensive bank and branch information
- **Document Custody Tracking**: Monitor documents held in bank custody
- **Release Coordination**: Streamlined bank document releases
- **Contact Management**: Bank representative information and communication

### 📁 Document Management System
- **Polymorphic Attachments**: Link documents to properties, transactions, or tax records
- **File Type Support**: Title deeds, surveys, photos, legal documents, receipts
- **MinIO Integration**: Scalable and secure file storage
- **Version Control**: Track document updates and changes
- **Access Control**: Role-based document access permissions

### 📈 Movement Tracking & Analytics
- **Complete Movement History**: Every document location change tracked
- **Custody Chain**: Full audit trail of document custodians
- **Movement Analytics**: Insights into document flow patterns
- **Expected vs Actual Returns**: Performance tracking and compliance monitoring

### 🔍 Audit & Compliance
- **Complete Audit Trail**: Before/after values for all changes
- **User Action Tracking**: Who did what and when
- **Compliance Reporting**: Generate reports for regulatory requirements
- **Change History**: Detailed logs for investigation and compliance

### 🎨 Modern User Experience
- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile
- **Intuitive Interface**: Clean, modern UI built with shadcn/ui components
- **Smooth Animations**: Enhanced user experience with Framer Motion
- **Real-time Updates**: Live status updates using Zustand state management
- **Form Validation**: Robust client and server-side validation with Zod

## 🏢 Business Unit Management

### Multi-Entity Support
- **Main Office**: Central headquarters with full system access
- **Subsidiaries**: Subsidiary companies with controlled access
- **Branches**: Regional branches with specific permissions
- **External Organizations**: Third-party entities in the workflow

### Organizational Flexibility
- **Hierarchical Structure**: Clear organizational hierarchy
- **Cross-unit Collaboration**: Seamless inter-unit property transactions
- **Scalable Architecture**: Add new business units without system changes

## 🔄 Workflow Capabilities

### Automated Process Management
- **Smart Routing**: Automatic approval routing based on business rules
- **Status Synchronization**: Real-time status updates across all related entities
- **Deadline Management**: Automated reminders and escalations
- **Process Optimization**: Streamlined workflows reduce processing time

### Integration Ready
- **API Architecture**: RESTful APIs for third-party integrations
- **Webhook Support**: Real-time notifications to external systems
- **Data Export**: Comprehensive reporting and data export capabilities
- **Scalable Design**: Built to handle growing transaction volumes

## 📊 Reporting & Analytics

### Comprehensive Reporting
- **Property Portfolio Overview**: Complete portfolio insights
- **Transaction Reports**: Detailed transaction history and analytics
- **Tax Compliance Reports**: RPT payment status and compliance tracking
- **Performance Metrics**: System usage and efficiency analytics
- **Audit Reports**: Comprehensive audit trails for compliance

### Real-time Dashboards
- **Executive Dashboards**: High-level KPIs and metrics
- **Operational Dashboards**: Day-to-day operational insights
- **Compliance Monitoring**: Real-time compliance status tracking
- **Alert Management**: Proactive issue identification and resolution

## 🚀 Performance & Scalability

### Technical Excellence
- **Database Optimization**: Efficient PostgreSQL schema with proper indexing
- **State Management**: Optimized Zustand stores for fast UI updates
- **Caching Strategy**: Smart caching for improved performance
- **File Management**: Efficient MinIO integration for document storage

### Security Features
- **Data Encryption**: Encrypted data storage and transmission
- **Access Control**: Comprehensive role-based access control
- **Audit Logging**: Complete audit trails for security monitoring
- **Session Security**: Secure session management and timeout handling

## 💡 Use Cases

### Primary Use Cases
- **Corporate Real Estate Management**: Large corporations managing property portfolios
- **Property Development**: Development companies tracking properties through project lifecycles
- **Financial Institutions**: Banks managing collateral properties and documentation
- **Government Agencies**: Public sector property and tax management
- **Legal Firms**: Law firms managing client property documentation

### Compliance & Governance
- **Regulatory Compliance**: Meet regulatory requirements for property management
- **Internal Controls**: Strong internal controls and approval processes
- **Risk Management**: Minimize risks through proper documentation and tracking
- **Transparency**: Complete visibility into property status and transactions

This Property Management System represents a modern, scalable solution for complex property portfolio management needs, combining robust functionality with an exceptional user experience.