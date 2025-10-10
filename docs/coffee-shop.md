# PRD: **TradesBoard Columbus – Local Job Board for Independent Tradespeople**

---

## tl;dr

A hyperlocal job board connecting employers in Columbus, Ohio with independent tradespeople (e.g., electricians, welders, plumbers). Employers pay to post jobs. Tradespeople create public profiles showcasing skills, experience, and licenses. Goal is to simplify local hiring with trust and ease.

---

## Goals

### Business Goals

- Generate revenue via paid job postings by employers
- Establish trust in the Columbus skilled trades market
- Achieve critical mass in a single city before expanding regionally

### User Goals

- **Tradespeople** want to find quality local gigs and promote their skills
- **Employers** want to quickly find reliable, licensed trades for jobs
- Both want a fast, trustworthy platform that doesn’t feel corporate

### Non-Goals

- No national scale at launch
- No complex application tracking or messaging
- No mobile apps initially (mobile web only)

---

## User Stories

**As a Tradesperson (Seeker):**

- I want to create a profile with my skills, trade(s), and license info
- I want to be discoverable by employers looking for tradespeople
- I want to see jobs posted in my area that match my trade

**As an Employer:**

- I want to create a company account and post a job easily
- I want to see candidate profiles and license verification
- I want to pay per job post with no long-term commitment

---

## User Experience

### For Tradespeople:

1. Sign up with email or phone
2. Fill out profile:

   - Trade type (e.g., electrician)
   - Years of experience
   - Certifications/licenses (upload or verify)
   - Service radius
   - Availability (days/times)

3. Appear in search listings when employers browse
4. Apply to jobs via a “Send Profile” button — triggers email or internal message to employer

### For Employers:

1. Sign up with company email
2. Create a company profile (basic info + logo)
3. Post a job (title, location, trade type, pay, urgency)
4. Pay per listing ($XX per post) via Stripe
5. View applicants or browse profiles
6. Contact tradespeople via email/phone shown on profile

---

## Narrative

Columbus has a vibrant community of independent tradespeople who rely on word-of-mouth, Facebook groups, and referrals to find work. These systems are slow, scattered, and not always reliable.

**TradesBoard Columbus** fills the gap — a clean, trustworthy space where independent electricians, welders, and plumbers can get discovered, and employers can post work knowing they'll find qualified, licensed talent. It's like Craigslist — but designed _only_ for skilled trades, with verified licenses and a local-first focus.

Imagine a contractor who just landed a big renovation gig and needs two more licensed electricians tomorrow. With TradesBoard, they post the job, pay a small fee, and immediately see a shortlist of pros nearby. Meanwhile, Joe the Electrician finally gets off the Facebook hamster wheel and into a steady flow of legit jobs.

This builds community, trust, and income — for both sides.

---

## Success Metrics

- 100+ tradesperson signups in first 6 weeks
- 50+ job postings by employers in first 2 months
- 30% repeat employer usage
- 80% profile completion rate among signups
- Time to hire reduced vs. Facebook groups (anecdotally measured)

---

## Technical Considerations

- Built as a web app (responsive for mobile)
- Stack: React front-end, Firebase or Supabase backend
- Stripe integration for employer payments
- Admin dashboard to review/verify licenses (manual at first)
- License verification stored securely but viewable on profile
- No internal chat/messaging (use email/phone for now)
