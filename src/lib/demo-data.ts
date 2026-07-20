import type { ItemReport, MatchCandidate } from "@/types/domain";

export const categories = [
  "Student ID card",
  "Wallet",
  "Mobile phone",
  "Laptop",
  "Tablet",
  "Backpack",
  "Keys",
  "Earphones",
  "Watch",
  "Water bottle",
  "Clothing",
  "Documents",
  "Other"
];

export const locations = [
  "Main Library",
  "Student Centre",
  "Engineering Block",
  "Science Laboratory",
  "Cafeteria",
  "Sports Complex",
  "Convocation Hall",
  "Administration Building",
  "Hostel A",
  "Hostel B",
  "Prayer Room",
  "Bus Stop",
  "Innovation Lab",
  "Lecture Hall 1",
  "Campus Clinic"
];

export const recentReports: ItemReport[] = [
  {
    id: "01J10000000000000000000001",
    reportType: "lost",
    title: "Black Lenovo backpack",
    category: "Backpack",
    brand: "Lenovo",
    primaryColour: "Black",
    description: "Medium black laptop backpack with a blue keyring attached to the front zipper.",
    incidentDate: "2026-07-11",
    location: "Main Library",
    specificArea: "Second-floor quiet zone",
    status: "possible_match_found",
    createdAt: "2026-07-11T09:10:00Z"
  },
  {
    id: "01J10000000000000000000002",
    reportType: "found",
    title: "Silver wireless earbuds case",
    category: "Earphones",
    brand: "Soundcore",
    primaryColour: "Silver",
    description: "Small silver charging case found under a table near the cafeteria entrance.",
    incidentDate: "2026-07-12",
    location: "Cafeteria",
    specificArea: "Entrance seating area",
    status: "active",
    createdAt: "2026-07-12T12:30:00Z"
  },
  {
    id: "01J10000000000000000000003",
    reportType: "lost",
    title: "Blue student ID holder",
    category: "Student ID card",
    primaryColour: "Blue",
    description: "Dark-blue plastic card holder with a university lanyard and one access card.",
    incidentDate: "2026-07-13",
    location: "Engineering Block",
    specificArea: "Ground-floor corridor",
    status: "active",
    createdAt: "2026-07-13T08:05:00Z"
  }
];

export const matchCandidates: MatchCandidate[] = [
  {
    id: "3ddfb1c2-6cc4-43ee-882a-f7900ab1d18a",
    lostReportId: recentReports[0].id,
    foundReportId: "01J10000000000000000000004",
    lostTitle: "Black Lenovo backpack",
    foundTitle: "Black laptop bag with blue tag",
    overallScore: 88,
    imageScore: 91,
    textScore: 87,
    categoryScore: 100,
    colourScore: 95,
    brandScore: 100,
    locationScore: 72,
    dateScore: 90,
    explanation: "88% recommendation because both reports describe a black Lenovo-style laptop backpack with a blue tag, similar images, nearby locations, and dates one day apart. Human verification is required.",
    status: "recommended"
  },
  {
    id: "55474502-4f89-4705-af21-14e687e2d354",
    lostReportId: recentReports[2].id,
    foundReportId: "01J10000000000000000000005",
    lostTitle: "Blue student ID holder",
    foundTitle: "Dark-blue card holder",
    overallScore: 76,
    imageScore: 70,
    textScore: 82,
    categoryScore: 100,
    colourScore: 92,
    brandScore: 40,
    locationScore: 78,
    dateScore: 84,
    explanation: "76% recommendation based on the same category, closely matching colour and description, and nearby locations. Human verification is required.",
    status: "recommended"
  }
];

export const dashboardStats = [
  { label: "Total items reported", value: "1,284", detail: "+12% this semester" },
  { label: "Successfully returned", value: "816", detail: "63.6% recovery rate" },
  { label: "Active reports", value: "238", detail: "102 lost · 136 found" },
  { label: "Average matching time", value: "4.8h", detail: "AI recommendation time" }
];

export const monthlyTrend = [
  { month: "Feb", lost: 48, found: 40, returned: 31 },
  { month: "Mar", lost: 55, found: 47, returned: 38 },
  { month: "Apr", lost: 62, found: 54, returned: 42 },
  { month: "May", lost: 51, found: 49, returned: 40 },
  { month: "Jun", lost: 69, found: 65, returned: 50 },
  { month: "Jul", lost: 41, found: 44, returned: 35 }
];

export const categoryAnalytics = [
  { name: "ID cards", value: 28 },
  { name: "Electronics", value: 24 },
  { name: "Bags", value: 17 },
  { name: "Keys", value: 14 },
  { name: "Documents", value: 10 },
  { name: "Other", value: 7 }
];
