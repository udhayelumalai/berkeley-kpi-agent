/**
 * Berkeley KPI Agent - Master Configuration
 * Roles, Branding Palette, Base Site Templates (Zero Dummy Records)
 */

// Official Brand Palette from uploaded Brand Guidelines
const BERKELEY_BRAND = {
  blue: "#2E3092",   // RGB: 46, 44, 146
  green: "#006738",  // RGB: 0, 104, 56
  orange: "#FBAF3F", // RGB: 251, 176, 64
  red: "#BE1E2D",    // RGB: 190, 30, 45
  dark: "#0F172A",
  logoPath: "assets/berkeley-logo.png"
};

// User Roles Defined: Super Admin, Admin, Facility Engineer, Client
const USER_ROLES = {
  SUPER_ADMIN: "Super Admin",
  ADMIN: "Admin",
  FACILITY_ENGINEER: "Facility Engineer",
  CLIENT: "Client"
};

// Exact KPI Workflow Statuses
const KPI_STATUS = {
  DRAFT: "Draft",
  UNDER_BERKELEY: "Under Review - Berkeley",
  UNDER_CLIENT: "Under Review - Client",
  FREEZED: "Approved & Freezed"
};

// Initial Users Directory with Site Assignment and Active State
const INITIAL_USERS = [
  {
    id: "usr-superadmin",
    name: "Super Admin (Berkeley)",
    email: "superadmin@berkeley-services.ae",
    role: USER_ROLES.SUPER_ADMIN,
    organization: "Berkeley Services UAE",
    assignedSiteIds: ["all"],
    isActive: true,
    avatar: "SA"
  },
  {
    id: "usr-admin",
    name: "Operations Admin",
    email: "admin@berkeley-services.ae",
    role: USER_ROLES.ADMIN,
    organization: "Berkeley Services UAE",
    assignedSiteIds: ["all"],
    isActive: true,
    avatar: "AD"
  },
  {
    id: "usr-engineer",
    name: "Eng. Ahmed Mansoor",
    email: "ahmed.m@berkeley-services.ae",
    role: USER_ROLES.FACILITY_ENGINEER,
    organization: "Berkeley Services UAE",
    assignedSiteIds: ["site-yam", "site-miral-hq"],
    isActive: true,
    avatar: "FE"
  },
  {
    id: "usr-client-miral",
    name: "Tariq Al-Mansoor",
    email: "tariq.mansoor@miral.ae",
    role: USER_ROLES.CLIENT,
    organization: "Miral Asset Management",
    assignedSiteIds: ["site-yam"],
    isActive: true,
    avatar: "CL"
  }
];

// Base KPI Matrix Template for Miral / Yas Mall (Full Contract Specification)
const MIRAL_YAM_CATEGORIES = [
  {
    id: "CAT-01",
    code: "SS.01",
    name: "Service Delivery & Management",
    icon: "fa-briefcase",
    maxScore: 23,
    kpis: [
      {
        id: "KPI-01",
        title: "Provide Monthly Reports",
        description: "Provide monthly Reports in accordance with agreed frequency and format within 5 working days of month end.",
        classification: "Critical",
        maxScore: 3,
        measurement: "Monthly reports provided within 5 working days of month end. 1 point reduced per day of delay.",
        options: [
          { label: "0 Breaches - On-time & accurate (Score: 3)", value: 3 },
          { label: "1 Breach - 1 Day delay (Score: 2)", value: 2 },
          { label: "2 Breaches - 2 Days delay (Score: 1)", value: 1 },
          { label: "3+ Breaches - >2 Days delay (Score: 0)", value: 0 }
        ]
      },
      {
        id: "KPI-02",
        title: "Management of 3rd Party Service Providers",
        description: "Activities of all 3rd party sub-contractors to be reported monthly and recorded on CAFM within 12 hours.",
        classification: "Standard",
        maxScore: 3,
        measurement: "All 3rd party subcontractor tasks uploaded to CAFM. No more than 1 breach in any month.",
        options: [
          { label: "0 Breaches (Score: 3)", value: 3 },
          { label: "1 Breach (Score: 2)", value: 2 },
          { label: "2 Breaches (Score: 1)", value: 1 },
          { label: "3+ Breaches (Score: 0)", value: 0 }
        ]
      },
      {
        id: "KPI-03",
        title: "Grooming Standard & Attire",
        description: "All personnel must wear agreed clean, ironed uniform with correct safety footwear at all times.",
        classification: "Standard",
        maxScore: 3,
        measurement: "The number of complaints received shall not exceed 4 in any given month.",
        options: [
          { label: "0 Breaches (Score: 3)", value: 3 },
          { label: "1 Breach (Score: 2)", value: 2 },
          { label: "2 Breaches (Score: 1)", value: 1 },
          { label: "3+ Breaches (Score: 0)", value: 0 }
        ]
      },
      {
        id: "KPI-04",
        title: "Staff Training & BICSc Certification",
        description: "Training and certification of staff. Cleaning staff BICSc trained, and Supervisors certified.",
        classification: "Standard",
        maxScore: 3,
        measurement: "BICSc training records submitted every month with certificates.",
        options: [
          { label: "0 Breaches - 100% Certified (Score: 3)", value: 3 },
          { label: "1 Breach (Score: 2)", value: 2 },
          { label: "2 Breaches (Score: 1)", value: 1 },
          { label: "3+ Breaches (Score: 0)", value: 0 }
        ]
      },
      {
        id: "KPI-05",
        title: "Operational Structure & Attendance Plan",
        description: "Staff available on site at all times as per agreed deployment schedule with approved replacements.",
        classification: "Critical",
        maxScore: 3,
        measurement: "Staff shortages as per deployment schedule shall not exceed 3 in any monthly period.",
        options: [
          { label: "0 Breaches - Full Attendance (Score: 3)", value: 3 },
          { label: "1 Breach (Score: 2)", value: 2 },
          { label: "2 Breaches (Score: 1)", value: 1 },
          { label: "3+ Breaches (Score: 0)", value: 0 }
        ]
      },
      {
        id: "KPI-06",
        title: "Equipment & Consumables Inventory",
        description: "Maintain Spare Parts and Consumables list within upper/lower limits in CAFM system.",
        classification: "Critical",
        maxScore: 4,
        measurement: "The inventory list must be up to date with monthly CAFM consumables report.",
        options: [
          { label: "0 Breaches (Score: 4)", value: 4 },
          { label: "1 Breach (Score: 3)", value: 3 },
          { label: "2 Breaches (Score: 2)", value: 2 },
          { label: "3 Breaches (Score: 1)", value: 1 },
          { label: "3+ Breaches (Score: 0)", value: 0 }
        ]
      },
      {
        id: "KPI-07",
        title: "Site Checklists & Technical Reports",
        description: "Complete daily checklists (toilets, FOH, BOH) and submit technical reports within 24 hours.",
        classification: "Critical",
        maxScore: 4,
        measurement: "Daily, weekly, monthly reports submitted on time and signed by SS Supervisor.",
        options: [
          { label: "0 Breaches (Score: 4)", value: 4 },
          { label: "1 Breach (Score: 3)", value: 3 },
          { label: "2 Breaches (Score: 2)", value: 2 },
          { label: "3 Breaches (Score: 1)", value: 1 },
          { label: "3+ Breaches (Score: 0)", value: 0 }
        ]
      }
    ]
  },
  {
    id: "CAT-02",
    code: "SS.02",
    name: "Cleaning & Service Delivery",
    icon: "fa-broom",
    maxScore: 15,
    kpis: [
      {
        id: "KPI-08",
        title: "Reactive Cleaning Work Order SLA",
        description: "All Reactive Work Orders completed within required KPIs configured on CAFM.",
        classification: "Critical",
        maxScore: 3,
        measurement: "98% of work orders completed on time and correctly recorded on CAFM system.",
        options: [
          { label: "0 Breaches - >=98% SLA (Score: 3)", value: 3 },
          { label: "1 Breach (Score: 2)", value: 2 },
          { label: "2 Breaches (Score: 1)", value: 1 },
          { label: "3+ Breaches (Score: 0)", value: 0 }
        ]
      },
      {
        id: "KPI-09",
        title: "Planned and Routine Cleaning Completion",
        description: "All Routine Work Orders completed within required KPIs as configured on CAFM.",
        classification: "Standard",
        maxScore: 3,
        measurement: "95% of routine work orders completed on time in CAFM.",
        options: [
          { label: "0 Breaches - >=95% Routine (Score: 3)", value: 3 },
          { label: "1 Breach (Score: 2)", value: 2 },
          { label: "2 Breaches (Score: 1)", value: 1 },
          { label: "3+ Breaches (Score: 0)", value: 0 }
        ]
      },
      {
        id: "KPI-10",
        title: "PPM and Reactive Backlog Clearance",
        description: "All backlogs cleared within reporting month with exception of mutually agreed open WOs.",
        classification: "Standard",
        maxScore: 3,
        measurement: "100% of all backlogs cleared within the following reporting month.",
        options: [
          { label: "0 Breaches - 100% Cleared (Score: 3)", value: 3 },
          { label: "1 Breach (Score: 2)", value: 2 },
          { label: "2 Breaches (Score: 1)", value: 1 },
          { label: "3+ Breaches (Score: 0)", value: 0 }
        ]
      },
      {
        id: "KPI-11",
        title: "Ad-Hoc Works & Quotation Submissions",
        description: "Additional works inspected within 2 days and 3 quotations submitted within 7 days.",
        classification: "Standard",
        maxScore: 3,
        measurement: "Number of non-conformances identified noted through monthly reporting.",
        options: [
          { label: "0 Breaches (Score: 3)", value: 3 },
          { label: "1 Breach (Score: 2)", value: 2 },
          { label: "2 Breaches (Score: 1)", value: 1 },
          { label: "3+ Breaches (Score: 0)", value: 0 }
        ]
      },
      {
        id: "KPI-12",
        title: "Event Support (F1, Arena & Marketing Events)",
        description: "Support all events organized by YAM including cleaning, waste collection, and disposal.",
        classification: "Standard",
        maxScore: 3,
        measurement: "All cleaning tasks recorded in CAFM with event report submitted within 2-4 days.",
        options: [
          { label: "0 Breaches (Score: 3)", value: 3 },
          { label: "1 Breach (Score: 2)", value: 2 },
          { label: "2 Breaches (Score: 1)", value: 1 },
          { label: "3+ Breaches (Score: 0)", value: 0 }
        ]
      }
    ]
  },
  {
    id: "CAT-03",
    code: "SS.03",
    name: "Health & Safety (HSE)",
    icon: "fa-shield-halved",
    maxScore: 18,
    kpis: [
      {
        id: "KPI-13",
        title: "Statutory Compliance (UAE Laws & Civil Defense)",
        description: "Service provision is strictly compliant with UAE Civil Defense and Federal Law #2.",
        classification: "Critical",
        maxScore: 4,
        measurement: "Zero instances of non-adherence to statutory compliance in legal/risk registers.",
        options: [
          { label: "Yes - 100% Compliant (Score: 4)", value: 4 },
          { label: "No - Non-compliant (Score: 0)", value: 0 }
        ]
      },
      {
        id: "KPI-14",
        title: "Safe Working Practices & Daily Toolbox Talks",
        description: "Daily H&S toolbox talks at start of each shift with Risk assessments and PTWs in CAFM.",
        classification: "Standard",
        maxScore: 3,
        measurement: "No instances of carrying out activities unsafely without PTW/SOP.",
        options: [
          { label: "0 Breaches (Score: 3)", value: 3 },
          { label: "1 Breach (Score: 2)", value: 2 },
          { label: "2 Breaches (Score: 2)", value: 2 },
          { label: "3+ Breaches (Score: 0)", value: 0 }
        ]
      },
      {
        id: "KPI-15",
        title: "Incident Management Response",
        description: "First responder actions effective and in strict compliance with Fire & Safety plans.",
        classification: "Standard",
        maxScore: 3,
        measurement: "No instances of failing to respond within required response/rectification times.",
        options: [
          { label: "0 Breaches (Score: 3)", value: 3 },
          { label: "1 Breach (Score: 2)", value: 2 },
          { label: "2 Breaches (Score: 2)", value: 2 },
          { label: "3+ Breaches (Score: 0)", value: 0 }
        ]
      },
      {
        id: "KPI-16",
        title: "Operational Equipment Safety & Testing",
        description: "Operational equipment maintained and utilized safely per manufacturer recommendations.",
        classification: "Standard",
        maxScore: 4,
        measurement: "Zero instances of using faulty equipment; verified during random inspections.",
        options: [
          { label: "0 Breaches (Score: 4)", value: 4 },
          { label: "1 Breach (Score: 3)", value: 3 },
          { label: "2 Breaches (Score: 2)", value: 2 },
          { label: "3 Breaches (Score: 1)", value: 1 },
          { label: "4+ Breaches (Score: 0)", value: 0 }
        ]
      },
      {
        id: "KPI-17",
        title: "Monthly HSE Audits & Risk Highlighting",
        description: "All buildings audited monthly with reports submitted highlighting site risks.",
        classification: "Standard",
        maxScore: 4,
        measurement: "Monthly audit report submitted on time and accurately in CAFM.",
        options: [
          { label: "0 Breaches (Score: 4)", value: 4 },
          { label: "1 Breach (Score: 3)", value: 3 },
          { label: "2 Breaches (Score: 2)", value: 2 },
          { label: "3 Breaches (Score: 1)", value: 1 },
          { label: "4+ Breaches (Score: 0)", value: 0 }
        ]
      }
    ]
  },
  {
    id: "CAT-04",
    code: "SS.04",
    name: "CAFM & Helpdesk Operations",
    icon: "fa-desktop",
    maxScore: 19,
    kpis: [
      {
        id: "KPI-18",
        title: "24/7 Helpdesk Availability",
        description: "Helpdesk services available 24/7 with CAFM read-only access provided to client.",
        classification: "Critical",
        maxScore: 3,
        measurement: "Zero instances of helpdesk not being available.",
        options: [
          { label: "0 Breaches (Score: 3)", value: 3 },
          { label: "1 Breach (Score: 2)", value: 2 },
          { label: "2 Breaches (Score: 2)", value: 2 },
          { label: "3+ Breaches (Score: 0)", value: 0 }
        ]
      },
      {
        id: "KPI-19",
        title: "CAFM System Reliability & Dashboard",
        description: "CAFM system fully operational at all times with real-time dashboard for client.",
        classification: "Critical",
        maxScore: 3,
        measurement: "Zero instances of CAFM system unavailability.",
        options: [
          { label: "0 Breaches (Score: 3)", value: 3 },
          { label: "1 Breach (Score: 2)", value: 2 },
          { label: "2 Breaches (Score: 2)", value: 2 },
          { label: "3+ Breaches (Score: 0)", value: 0 }
        ]
      },
      {
        id: "KPI-20",
        title: "CAFM Input & Live Ticket Updates",
        description: "All calls, planned and reactive work orders inputted into CAFM to agreed timescales.",
        classification: "Standard",
        maxScore: 3,
        measurement: "Zero instances of delayed uploads to CAFM.",
        options: [
          { label: "0 Breaches (Score: 3)", value: 3 },
          { label: "1 Breach (Score: 2)", value: 2 },
          { label: "2 Breaches (Score: 2)", value: 2 },
          { label: "3+ Breaches (Score: 0)", value: 0 }
        ]
      },
      {
        id: "KPI-21",
        title: "Customer Satisfaction & Occupant Surveys",
        description: "Service request rating >=85% Good or above, and biannual surveys with >=85% satisfaction.",
        classification: "Standard",
        maxScore: 4,
        measurement: "SR feedback tracker and annual survey audit report submitted.",
        options: [
          { label: "0 Breaches - >=85% Satisfied (Score: 4)", value: 4 },
          { label: "1 Breach (Score: 3)", value: 3 },
          { label: "2 Breaches (Score: 2)", value: 2 },
          { label: "3 Breaches (Score: 1)", value: 1 },
          { label: "4+ Breaches (Score: 0)", value: 0 }
        ]
      },
      {
        id: "KPI-22",
        title: "Internal Quality Audits & Remedial Closures",
        description: "Internal audits conducted monthly; audit WOs closed within 1 month.",
        classification: "Standard",
        maxScore: 3,
        measurement: "Audit report submitted to client on monthly basis with closed remedial WOs.",
        options: [
          { label: "0 Breaches (Score: 3)", value: 3 },
          { label: "1 Breach (Score: 2)", value: 2 },
          { label: "2 Breaches (Score: 2)", value: 2 },
          { label: "3+ Breaches (Score: 0)", value: 0 }
        ]
      },
      {
        id: "KPI-23",
        title: "Asset Register, DLP & Warranty Management",
        description: "Auditable asset register loaded and maintained in CAFM. Technical library up-to-date.",
        classification: "Standard",
        maxScore: 3,
        measurement: "Assets verified within 3 months / 1st PPM cycle with job plans mapped in CAFM.",
        options: [
          { label: "0 Breaches (Score: 3)", value: 3 },
          { label: "1 Breach (Score: 2)", value: 2 },
          { label: "2 Breaches (Score: 2)", value: 2 },
          { label: "3+ Breaches (Score: 0)", value: 0 }
        ]
      }
    ]
  },
  {
    id: "CAT-05",
    code: "SS.05",
    name: "Landscaping, Pest Control & Porterage",
    icon: "fa-bug",
    maxScore: 12,
    kpis: [
      {
        id: "KPI-24",
        title: "Pest Control Management",
        description: "All planned and reactive pest control undertaken in accordance with agreed plan.",
        classification: "Standard",
        maxScore: 4,
        measurement: "No presence of any pests internally or externally; IPM report submitted.",
        options: [
          { label: "0 Breaches - No pests (Score: 4)", value: 4 },
          { label: "1+ Breach (Score: 0)", value: 0 }
        ]
      },
      {
        id: "KPI-25",
        title: "Waste Management & Transfer Notes",
        description: "No accumulation of waste on site; waste transfer notes recorded and maintained.",
        classification: "Standard",
        maxScore: 4,
        measurement: "95% of waste work orders completed on time in CAFM with transfer notes.",
        options: [
          { label: "100% Compliant (Score: 4)", value: 4 },
          { label: "99% Compliant (Score: 3)", value: 3 },
          { label: "98% Compliant (Score: 2)", value: 2 },
          { label: "97% Compliant (Score: 1)", value: 1 },
          { label: "< 96% Compliant (Score: 0)", value: 0 }
        ]
      },
      {
        id: "KPI-26",
        title: "Recycling Initiatives & Segregation",
        description: "Regularly integrate recycling initiatives showing quarterly increases in recyclates.",
        classification: "Standard",
        maxScore: 4,
        measurement: "Quarterly increase in recyclates documented with monthly rebate breakdown.",
        options: [
          { label: "Yes - Initiatives & Rebate Documented (Score: 4)", value: 4 },
          { label: "No - Non-compliant (Score: 0)", value: 0 }
        ]
      }
    ]
  },
  {
    id: "CAT-06",
    code: "SS.06",
    name: "Sustainability & Customer Care",
    icon: "fa-leaf",
    maxScore: 13,
    kpis: [
      {
        id: "KPI-27",
        title: "Services Innovation Management",
        description: "Create an Innovation Register and present monthly with zero/low investment ideas.",
        classification: "Standard",
        maxScore: 2,
        measurement: "Number of innovation suggestions issued to client and adopted (>= 1/month).",
        options: [
          { label: "1+ Suggestions Adopted (Score: 2)", value: 2 },
          { label: "0 Suggestions (Score: 0)", value: 0 }
        ]
      },
      {
        id: "KPI-28",
        title: "Sustainability Measure & Eco-friendly Supplies",
        description: "Propose initiatives for eco-friendly supplies and consumables without reducing quality.",
        classification: "Standard",
        maxScore: 2,
        measurement: "Number of sustainability suggestions issued and adopted (>= 1/month).",
        options: [
          { label: "1+ Suggestions Adopted (Score: 2)", value: 2 },
          { label: "0 Suggestions (Score: 0)", value: 0 }
        ]
      },
      {
        id: "KPI-29",
        title: "Customer Complaints Investigation",
        description: "All service delivery complaints logged through Helpdesk, investigated and closed.",
        classification: "Critical",
        maxScore: 3,
        measurement: "Number of complaints received / breaches in any one month.",
        options: [
          { label: "0 Breaches (Score: 3)", value: 3 },
          { label: "1 Breach (Score: 2)", value: 2 },
          { label: "2 Breaches (Score: 2)", value: 2 },
          { label: "3+ Breaches (Score: 0)", value: 0 }
        ]
      },
      {
        id: "KPI-30",
        title: "Quality Management Plan & Reviews",
        description: "Quality Management Plan is complete, approved, and reviewed every 6 months.",
        classification: "Standard",
        maxScore: 3,
        measurement: "Zero instances of non-compliance identified in monthly or audit reports.",
        options: [
          { label: "0 Breaches (Score: 3)", value: 3 },
          { label: "1 Breach (Score: 2)", value: 2 },
          { label: "2 Breaches (Score: 2)", value: 2 },
          { label: "3+ Breaches (Score: 0)", value: 0 }
        ]
      },
      {
        id: "KPI-31",
        title: "Staff Incentivization & Recognition",
        description: "Run staff incentivization initiatives to raise staff morale and report monthly.",
        classification: "Standard",
        maxScore: 3,
        measurement: "No instances of non-compliance; documented reward initiatives held.",
        options: [
          { label: "Yes - Initiated & Documented (Score: 3)", value: 3 },
          { label: "No - Non-compliant (Score: 0)", value: 0 }
        ]
      }
    ]
  }
];

// Initial Sites Directory (Clean site templates with NO dummy evaluations)
const INITIAL_SITES = {
  "site-yam": {
    siteId: "site-yam",
    siteName: "Yas Mall (YAM)",
    clientName: "Miral Asset Management",
    location: "Yas Island, Abu Dhabi, UAE",
    clientLogo: "",
    maxTotalScore: 100,
    categories: MIRAL_YAM_CATEGORIES
  },
  "site-miral-hq": {
    siteId: "site-miral-hq",
    siteName: "Miral Head Office",
    clientName: "Miral Asset Management",
    location: "Abu Dhabi, UAE",
    clientLogo: "",
    maxTotalScore: 100,
    categories: JSON.parse(JSON.stringify(MIRAL_YAM_CATEGORIES))
  }
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { BERKELEY_BRAND, USER_ROLES, KPI_STATUS, INITIAL_USERS, INITIAL_SITES, MIRAL_YAM_CATEGORIES };
}
