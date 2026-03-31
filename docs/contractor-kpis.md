# Contractor Mobile App KPIs Documentation

## Overview

This document defines Key Performance Indicators (KPIs) for the Contractor Mobile App. These KPIs measure contractor engagement, job completion rates, platform reliability, payment processing efficiency, and overall success of the field service management platform.

---

## 1. Daily Active Contractors (DAC)

**Definition:** Number of unique contractors who log in and complete at least one meaningful action (view jobs, submit work, update status) within a 24-hour period.

**Calculation:**
```
DAC = COUNT(DISTINCT contractor_id) WHERE login_date = current_date AND action_count > 0
```

**Target:** 150+ DAC by end of Q1; 500+ DAC by end of Q2.

**Data Sources:**
- `contractors` table (contractor_id, name, status)
- `sessions` table (contractor_id, login_timestamp, activity_timestamp)
- `job_activities` table (contractor_id, job_id, timestamp, action_type)

---

## 2. Weekly Active Contractors (WAC) / Monthly Active Contractors (MAC)

**Definition:** Number of unique contractors who engage with the app at least once within a 7-day (WAC) or 30-day (MAC) period.

**Target:** WAC: 600+; MAC: 1,500+ by end of Q2.

---

## 3. Job Acceptance Rate

**Definition:** Percentage of jobs offered to contractors that are accepted within 2 hours.

**Calculation:**
```
Acceptance Rate = (Accepted jobs / Total jobs offered) * 100
```

**Target:** 65%+ acceptance rate; 75%+ for top-tier contractors.

---

## 4. Job Completion Rate & On-Time Completion

**Definition:** Percentage of accepted jobs that are completed; percentage completed on or before scheduled completion time.

**Target:** 92%+ completion rate; 85%+ on-time completion.

---

## 5. Average Job Rating & Quality Score

**Definition:** Average customer rating given to contractors upon job completion; composite quality score based on customer feedback and work inspection.

**Target:** 4.6+/5.0 average rating; 92%+ quality score.

---

## 6. Contractor Retention Rate (Monthly Cohort Analysis)

**Definition:** Percentage of contractors who remain active after their initial onboarding, measured by cohort (signup month).

**Target:** 70% Month 1 retention; 55% Month 3 retention; 45% Month 6 retention.

---

## 7. Average Payment Processing Time

**Definition:** Average time between job completion and payment being processed to contractor account.

**Target:** <24 hours average processing time; 95%+ payments processed within 48 hours.

---

## 8. Contractor Earnings & Revenue per Active Contractor

**Definition:** Average total earnings per contractor; revenue generated per actively engaged contractor.

**Target:** $2,500+ monthly earnings per active contractor; $5,000+ monthly revenue per contractor.

---

## 9. App Performance & System Reliability

**Definition:** Measures of system health including crash rates, app load times, and uptime.

**Target:** <0.5% crash rate; <2 second avg load time; 99.5%+ uptime.

---

## 10. Push Notification Engagement & Open Rate

**Definition:** Percentage of push notifications delivered that are opened by contractors; click-through rate to actions.

**Target:** 40%+ open rate; 25%+ click-through rate.

---

## 11. Time to First Meaningful Action (TFMA)

**Definition:** Average time elapsed from contractor login to first meaningful action (viewing a job, accepting a job, or submitting work).

**Calculation:**
```
TFMA = AVG(first_action_timestamp - login_timestamp)
  WHERE action_type IN ('view_job', 'accept_job', 'submit_work')
```

**Target:** <30 seconds average TFMA for active contractors; <60 seconds for all sessions.

**Data Sources:**
- `contractor_login_logs` table (login_timestamp)
- `job_activities` table (first action timestamp per session)

**Why it matters:** This metric uncovers UX friction that pure login counts miss. A contractor might log in daily (good engagement) but spend 2+ minutes finding a job (bad experience). Long TFMA could signal:
- Poor job matching algorithms
- Cluttered dashboard design
- Too many irrelevant job notifications
- Slow API response times

---

## KPI Dashboard Templates

### Executive Summary Dashboard
- DAC/MAC trend with comparison to previous period
- Top 5 KPIs with current values vs targets
- Key alerts and anomalies highlighted
- Contractor retention rate by cohort
- TFMA trend (new)

### Job Management Dashboard
- Job acceptance rate trend
- Completion rate and on-time completion %
- Average rating by contractor tier
- Jobs in progress vs completed

### Financial Dashboard
- Average contractor earnings trend
- Payment processing time distribution
- Revenue per active contractor
- Top earning contractors this month

### System Health Dashboard
- App crash rate and uptime status
- API response time trends
- Notifications delivered vs opened
- Performance metrics by device type

---

## Monitoring and Alerting Strategy

### Alert Tiers

| Tier | Trigger |
|------|---------|
| **Critical** | App crash rate >3%, system downtime, payment processing failures |
| **High** | DAC drop >25%, completion rate <75%, average rating <4.0 |
| **Medium** | Retention drop >15%, acceptance rate <50%, payment delays >48 hrs, TFMA >90 sec |
| **Low** | Any KPI deviating from target by 15% |

### Review Cadence

| Frequency | Activity |
|-----------|----------|
| Daily | Automated dashboard review; critical alerts |
| Weekly | KPI review meeting with operations team |
| Monthly | KPI target reassessment and contractor tier adjustments |

---

## KPI Framework Alignment with Business Goals

| Business Goal | Supporting KPIs |
|---------------|-----------------|
| Grow contractor network | DAC, WAC, MAC, Retention Rate |
| Increase job completion | Job Completion Rate, On-Time Completion, Job Acceptance Rate |
| Maintain service quality | Average Rating, Quality Score, Job Completion Rate |
| Improve contractor satisfaction | Avg Rating, Payment Processing Time, Earnings per Contractor |
| Ensure platform reliability | App Crash Rate, Uptime, Load Time |
| Maximize platform revenue | Revenue per Contractor, Job Volume, Avg Job Value |
| Reduce UX friction | TFMA, App Load Time, Crash Rate |

---

## Database Schema: Contractor Login Logs

```sql
CREATE TABLE contractor_login_logs (
    id INT PRIMARY KEY AUTO_INCREMENT,
    contractor_id INT NOT NULL,
    login_timestamp DATETIME NOT NULL,
    logout_timestamp DATETIME,
    session_duration_minutes INT,
    device_type VARCHAR(50),  -- mobile, web, etc.
    ip_address VARCHAR(45),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (contractor_id) REFERENCES contractors(id),
    INDEX idx_contractor_id (contractor_id),
    INDEX idx_login_timestamp (login_timestamp)
);
```

### Log Table Metrics to Track:
- **Amount of logins:** COUNT of login records per contractor per time period
- **Login timestamps:** Exact date/time of each login
- **Session duration:** How long contractor stays logged in
- **Login frequency:** Daily/weekly/monthly active login counts
- **TFMA:** Time from login to first meaningful action

---

## Implementation Notes

### Backend Requirements:
- Create API endpoint to record login/logout events
- Store login events to `contractor_login_logs` table
- Calculate session duration on logout
- Create query views for KPI calculations

### Frontend Requirements:
- Track login event when contractor authenticates
- Send logout event when session ends
- Store device type and IP info for analytics

### Testing with Dummy Data:
- Generate sample contractor login records for Q1 2026 data
- Create diverse login patterns (daily logins, sporadic, inactive)
- Include various session durations (short 5 min, long 2+ hour sessions)
- Test KPI calculations against dummy data
- Validate that backend/frontend can properly sync login tracking

---

## Next Steps

- [x] Document KPI definitions and targets
- [ ] Create `contractor_login_logs` table in database schema
- [ ] Add login tracking API endpoints (POST /api/contractor/login, POST /api/contractor/logout)
- [ ] Implement frontend login event tracking
- [ ] Generate dummy login data for testing
- [ ] Build queries to calculate contractor engagement KPIs
- [ ] Create dashboard visualizations for login metrics
- [ ] Add TFMA tracking to job_activities timestamps
- [ ] Integrate TFMA into Executive Summary Dashboard
- [ ] Set up alert threshold monitoring

---

## Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | Mar 27, 2026 | James Bustamante | Initial KPI documentation |
| 1.1 | Mar 31, 2026 | James Bustamante | Added TFMA KPI per Austin Carlson feedback |
