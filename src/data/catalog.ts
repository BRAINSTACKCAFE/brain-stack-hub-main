import type { LucideIcon } from "lucide-react";
import {
  BadgeCheck,
  Binary,
  BookOpen,
  Briefcase,
  FileSignature,
  GraduationCap,
  IdCard,
  Laptop,
  Printer,
  Smartphone,
  Tv,
  Zap,
  FlaskConical,
  ShoppingCart,
} from "lucide-react";

export type Audience = "student" | "business" | "general";
export type Delivery = "online" | "physical" | "hybrid";

export type FieldType =
  | "text"
  | "email"
  | "tel"
  | "number"
  | "date"
  | "textarea"
  | "select"
  | "file";

export type ServiceField = {
  name: string;
  label: string;
  type: FieldType;
  required?: boolean;
  options?: string[];
  help?: string;
};

export type ServiceStep = {
  title: string;
  fields: ServiceField[];
};

export type Service = {
  slug: string;
  name: string;
  category: string;
  summary: string;
  description?: string;
  price?: number | null;
  priceNote?: string;
  /** Prominent notice shown on the service page and form. */
  notice?: string;
  /** Force all text entries to CAPITAL LETTERS (e.g. NGO registration). */
  uppercase?: boolean;
  /** Automatic price calculation rules (e.g. tiered per-page printing). */
  pricing?: {
    type: "perPage";
    field: string;
    tiers: { upTo: number | null; rate: number }[];
  };
  requirements: string[];
  delivery: Delivery;
  audience: Audience[];
  popular?: boolean;
  cta?: string;
  steps?: ServiceStep[];
  keywords?: string[];
};

export type Category = {
  slug: string;
  name: string;
  blurb: string;
  icon: LucideIcon;
  accent?: boolean;
};

export const categories: Category[] = [
  {
    slug: "nin-bvn",
    name: "NIN / BVN Services",
    blurb: "NIN slips, modifications, lost-NIN retrieval and BVN slip reprint.",
    icon: IdCard,
    accent: true,
  },
  {
    slug: "jamb-exams",
    name: "JAMB & Examinations",
    blurb: "JAMB results and slips plus WAEC, NECO and NABTEB result pins.",
    icon: GraduationCap,
    accent: true,
  },
  {
    slug: "nerd-nysc",
    name: "NERD & NYSC",
    blurb: "NERD enrolment, NYSC PCM bio data capture and related support.",
    icon: BadgeCheck,
  },
  {
    slug: "ict-training",
    name: "ICT Training",
    blurb: "Practical computer and digital skills — physically or online.",
    icon: Laptop,
  },
  {
    slug: "research",
    name: "Research & Projects",
    blurb: "Topic guidance, data analysis, editing, formatting and consultation.",
    icon: FlaskConical,
  },
  {
    slug: "printing",
    name: "Printing & Binding",
    blurb: "Printing, project binding, lamination, ID cards and delivery.",
    icon: Printer,
  },
  {
    slug: "cac",
    name: "CAC & NGO Registration",
    blurb: "Business name, company, incorporated trustees and NGO registration.",
    icon: Briefcase,
    accent: true,
  },
  {
    slug: "utilities",
    name: "Digital & Utilities",
    blurb: "Airtime, data, electricity tokens and TV subscription payments.",
    icon: Zap,
  },
  {
    slug: "shop",
    name: "Computers & Accessories",
    blurb: "Laptops, keyboards, mice and computer accessories — pickup or waybill nationwide.",
    icon: ShoppingCart,
    accent: true,
  },
];

export const categoryIcons: Record<string, LucideIcon> = Object.fromEntries(
  categories.map((c) => [c.slug, c.icon]),
);

const contact: ServiceField[] = [
  { name: "fullName", label: "Full name", type: "text", required: true },
  { name: "phone", label: "Phone number", type: "tel", required: true },
  { name: "email", label: "Email address", type: "email" },
];

const nameFields: ServiceField[] = [
  { name: "surname", label: "Surname", type: "text", required: true },
  { name: "firstName", label: "First name", type: "text", required: true },
  { name: "middleName", label: "Middle name", type: "text" },
];

const nigerianStates = [
  "Abia", "Adamawa", "Akwa Ibom", "Anambra", "Bauchi", "Bayelsa", "Benue", "Borno",
  "Cross River", "Delta", "Ebonyi", "Edo", "Ekiti", "Enugu", "FCT - Abuja", "Gombe",
  "Imo", "Jigawa", "Kaduna", "Kano", "Katsina", "Kebbi", "Kogi", "Kwara", "Lagos",
  "Nasarawa", "Niger", "Ogun", "Ondo", "Osun", "Oyo", "Plateau", "Rivers", "Sokoto",
  "Taraba", "Yobe", "Zamfara",
];

export const slipTypes = ["Normal Slip", "Premium Slip", "Verification Slip"];

const addressFields = (
  prefix: string,
  label: string,
  opts: { country?: boolean } = {},
): ServiceField[] => [
  ...(opts.country
    ? [{ name: `${prefix}Country`, label: `${label} — Country`, type: "text" as FieldType, required: true }]
    : []),
  { name: `${prefix}State`, label: `${label} — State`, type: "select", required: true, options: nigerianStates },
  { name: `${prefix}Lga`, label: `${label} — LGA`, type: "text", required: true },
  { name: `${prefix}City`, label: `${label} — City / Town / Village`, type: "text", required: true },
  { name: `${prefix}HouseNumber`, label: `${label} — House number / building`, type: "text", required: true },
  { name: `${prefix}Street`, label: `${label} — Street name`, type: "text", required: true },
];

const personFields = (prefix: string, label: string, extra: { dob?: boolean; gender?: boolean; nationality?: boolean } = {}): ServiceField[] => [
  { name: `${prefix}Surname`, label: `${label} — Surname`, type: "text", required: true },
  { name: `${prefix}FirstName`, label: `${label} — First name`, type: "text", required: true },
  { name: `${prefix}OtherName`, label: `${label} — Other name`, type: "text" },
  ...(extra.dob ? [{ name: `${prefix}Dob`, label: `${label} — Date of birth`, type: "date" as FieldType, required: true }] : []),
  ...(extra.gender
    ? [{ name: `${prefix}Gender`, label: `${label} — Gender`, type: "select" as FieldType, required: true, options: ["Female", "Male"] }]
    : []),
  ...(extra.nationality
    ? [{ name: `${prefix}Nationality`, label: `${label} — Nationality`, type: "text" as FieldType, required: true }]
    : []),
  { name: `${prefix}Phone`, label: `${label} — Phone number`, type: "tel", required: true },
  { name: `${prefix}Email`, label: `${label} — Email address`, type: "email" },
  { name: `${prefix}Occupation`, label: `${label} — Occupation`, type: "text" },
];

const idFields = (prefix: string, label: string): ServiceField[] => [
  {
    name: `${prefix}IdType`,
    label: `${label} — ID type`,
    type: "select",
    required: true,
    options: ["NIN Card", "International Passport", "Driver's Licence", "Voter's Card"],
  },
  { name: `${prefix}IdNumber`, label: `${label} — Identification number`, type: "text", required: true },
  { name: `${prefix}IdUpload`, label: `${label} — Upload ID (snap & submit)`, type: "file", required: true },
  { name: `${prefix}Signature`, label: `${label} — Signature (sign on paper, snap & upload)`, type: "file", required: true },
];

export const services: Service[] = [
  // ---------- NIN / BVN ----------
  {
    slug: "nin-slip-normal",
    name: "Normal NIN Slip",
    category: "nin-bvn",
    summary: "Download and print the standard NIN slip using your NIN number.",
    price: 200,
    requirements: ["Your 11-digit NIN number"],
    delivery: "online",
    audience: ["general"],
    popular: true,
    cta: "Download slip",
    keywords: ["nin", "slip", "normal", "print"],
    steps: [
      {
        title: "Slip details",
        fields: [
          { name: "nin", label: "NIN number", type: "text", required: true, help: "Your 11-digit National Identification Number." },
        ],
      },
    ],
  },
  {
    slug: "nin-slip-premium",
    name: "Premium NIN Slip",
    category: "nin-bvn",
    summary: "Premium plastic-style NIN slip generated from your NIN number.",
    price: 250,
    requirements: ["Your 11-digit NIN number"],
    delivery: "online",
    audience: ["general"],
    popular: true,
    cta: "Download slip",
    keywords: ["nin", "slip", "premium"],
    steps: [
      { title: "Slip details", fields: [{ name: "nin", label: "NIN number", type: "text", required: true }] },
    ],
  },
  {
    slug: "nin-verification-slip",
    name: "NIN Verification Slip",
    category: "nin-bvn",
    summary: "Verification slip format issued from your NIN record.",
    price: 250,
    requirements: ["Your 11-digit NIN number"],
    delivery: "online",
    audience: ["general"],
    cta: "Download slip",
    keywords: ["nin", "verification", "slip"],
    steps: [
      { title: "Slip details", fields: [{ name: "nin", label: "NIN number", type: "text", required: true }] },
    ],
  },
  {
    slug: "nin-verification",
    name: "NIN Verification",
    category: "nin-bvn",
    summary: "Verify your Nigerian National Identification Number (NIN) instantly.",
    price: null,
    priceNote: "Verification fee applies",
    requirements: ["Your 11-digit NIN number"],
    delivery: "online",
    audience: ["general"],
    popular: true,
    cta: "Verify NIN",
    keywords: ["nin", "verification", "identity"],
    steps: [
      {
        title: "NIN Details",
        fields: [
          { name: "nin", label: "NIN Number", type: "tel", required: true, minLength: 11, maxLength: 11, help: "Enter your 11-digit NIN number (e.g., 12345678901)" }
        ]
      }
    ]
  },
  {
    slug: "bvn-verification",
    name: "BVN Verification",
    category: "nin-bvn",
    summary: "Verify your Bank Verification Number (BVN) instantly.",
    price: null,
    priceNote: "Verification fee applies",
    requirements: ["Your 11-digit BVN number"],
    delivery: "online",
    audience: ["general"],
    popular: true,
    cta: "Verify BVN",
    keywords: ["bvn", "verification", "banking"],
    steps: [
      {
        title: "BVN Details",
        fields: [
          { name: "bvn", label: "BVN Number", type: "tel", required: true, minLength: 11, maxLength: 11, help: "Enter your 11-digit BVN number (e.g., 12345678901)" }
        ]
      }
    ]
  },
  {
    slug: "cac-verification",
    name: "CAC Verification",
    category: "nin-bvn",
    summary: "Verify your company's Corporate Affairs Commission (CAC) registration.",
    price: null,
    priceNote: "Verification fee applies",
    requirements: ["Company RC number"],
    delivery: "online",
    audience: ["business"],
    popular: true,
    cta: "Verify CAC Registration",
    keywords: ["cac", "verification", "company", "rc-number"],
    steps: [
      {
        title: "Company Details",
        fields: [
          { name: "rcNumber", label: "RC Number", type: "text", required: true, help: "Enter your company's RC number (e.g., RC1234567)" }
        ]
      }
    ]
  },
  {
    slug: "lost-nin-retrieval",
    name: "Lost NIN Retrieval",
    category: "nin-bvn",
    summary: "Recover a National Identification Number you no longer have.",
    price: 300,
    requirements: ["Surname and first name", "Date of birth", "Phone number"],
    delivery: "online",
    audience: ["general"],
    keywords: ["nin", "lost", "retrieve"],
    steps: [
      {
        title: "Your details",
        fields: [
          { name: "surname", label: "Surname", type: "text", required: true },
          { name: "firstName", label: "First name", type: "text", required: true },
          { name: "dob", label: "Date of birth", type: "date", required: true },
          { name: "phone", label: "Phone number", type: "tel", required: true },
        ],
      },
    ],
  },
  {
    slug: "nin-modification-dob",
    name: "NIN Date of Birth Modification",
    category: "nin-bvn",
    summary: "Correct the date of birth on your NIN record.",
    price: 57000,
    requirements: ["Current NIN slip", "Client photograph", "Parent information"],
    delivery: "online",
    audience: ["general"],
    popular: true,
    cta: "Start application",
    keywords: ["nin", "modification", "date of birth", "dob"],
    steps: [
      {
        title: "Applicant information",
        fields: [
          { name: "nin", label: "NIN number", type: "text", required: true },
          ...nameFields,
          { name: "gender", label: "Gender", type: "select", required: true, options: ["Female", "Male"] },
          { name: "oldDob", label: "Old date of birth (DD/MM/YYYY)", type: "text", required: true },
          { name: "newDob", label: "New date of birth (DD/MM/YYYY)", type: "text", required: true },
          { name: "maritalStatus", label: "Marital status", type: "select", required: true, options: ["Single", "Married", "Divorced", "Widowed"] },
          { name: "phone", label: "Phone number", type: "tel", required: true },
          { name: "altPhone", label: "Alternative phone number", type: "tel" },
        ],
      },
      {
        title: "Origin & residence",
        fields: [
          { name: "stateOfOrigin", label: "State of origin", type: "select", required: true, options: nigerianStates },
          { name: "lgaOfOrigin", label: "LGA of origin", type: "text", required: true },
          { name: "townOfOrigin", label: "Town", type: "text", required: true },
          { name: "stateOfBirth", label: "State of birth", type: "select", required: true, options: nigerianStates },
          { name: "lgaOfBirth", label: "LGA of birth", type: "text", required: true },
          { name: "stateOfResidence", label: "State of residence", type: "select", required: true, options: nigerianStates },
          { name: "lgaOfResidence", label: "LGA of residence", type: "text", required: true },
        ],
      },
      {
        title: "Parent information",
        fields: [
          { name: "parentSurname", label: "Parent surname", type: "text", required: true },
          { name: "parentFirstName", label: "Parent first name", type: "text", required: true },
          { name: "parentMiddleName", label: "Parent middle name", type: "text" },
          { name: "parentStateOfOrigin", label: "Parent state of origin", type: "select", required: true, options: nigerianStates },
          { name: "parentVillage", label: "Village", type: "text", required: true },
          { name: "parentTown", label: "Town", type: "text", required: true },
        ],
      },
      {
        title: "Documents",
        fields: [
          { name: "clientPhotograph", label: "Client photograph", type: "file", required: true },
          { name: "idDocument", label: "Valid means of identification", type: "file", required: true },
          { name: "notes", label: "Additional notes", type: "textarea" },
        ],
      },
    ],
  },
  {
    slug: "nin-modification-phone",
    name: "NIN Phone Number Modification",
    category: "nin-bvn",
    summary: "Update the phone number attached to your NIN record.",
    price: 8000,
    requirements: ["NIN number", "New phone number", "Client photograph"],
    delivery: "online",
    audience: ["general"],
    cta: "Start application",
    keywords: ["nin", "modification", "phone"],
    steps: [
      {
        title: "Applicant information",
        fields: [
          { name: "nin", label: "NIN number", type: "text", required: true },
          ...nameFields,
          { name: "dob", label: "Date of birth", type: "date", required: true },
          { name: "oldPhone", label: "Old phone number", type: "tel" },
          { name: "newPhone", label: "New phone number", type: "tel", required: true },
        ],
      },
      {
        title: "Documents",
        fields: [
          { name: "clientPhotograph", label: "Client photograph", type: "file", required: true },
          { name: "idDocument", label: "Valid means of identification", type: "file" },
        ],
      },
    ],
  },
  {
    slug: "nin-modification-address",
    name: "NIN Address Modification",
    category: "nin-bvn",
    summary: "Update the residential address on your NIN record.",
    price: 8000,
    requirements: ["NIN number", "New residential address", "Client photograph"],
    delivery: "online",
    audience: ["general"],
    cta: "Start application",
    keywords: ["nin", "modification", "address"],
    steps: [
      {
        title: "Applicant information",
        fields: [
          { name: "nin", label: "NIN number", type: "text", required: true },
          ...nameFields,
          { name: "phone", label: "Phone number", type: "tel", required: true },
        ],
      },
      {
        title: "New address",
        fields: addressFields("newAddress", "New address"),
      },
      {
        title: "Documents",
        fields: [
          { name: "clientPhotograph", label: "Client photograph", type: "file", required: true },
          { name: "proofOfAddress", label: "Proof of address (optional)", type: "file" },
        ],
      },
    ],
  },
  {
    slug: "nin-modification-name",
    name: "NIN Change of Name",
    category: "nin-bvn",
    summary: "Correct or change the name on your NIN record.",
    price: 8000,
    requirements: ["NIN number", "Old and new names", "Supporting document"],
    delivery: "online",
    audience: ["general"],
    cta: "Start application",
    keywords: ["nin", "modification", "name", "change of name"],
    steps: [
      {
        title: "Applicant information",
        fields: [
          { name: "nin", label: "NIN number", type: "text", required: true },
          { name: "oldSurname", label: "Old surname", type: "text", required: true },
          { name: "oldFirstName", label: "Old first name", type: "text", required: true },
          { name: "oldMiddleName", label: "Old middle name", type: "text" },
          { name: "newSurname", label: "New surname", type: "text", required: true },
          { name: "newFirstName", label: "New first name", type: "text", required: true },
          { name: "newMiddleName", label: "New middle name", type: "text" },
          { name: "phone", label: "Phone number", type: "tel", required: true },
        ],
      },
      {
        title: "Documents",
        fields: [
          { name: "clientPhotograph", label: "Client photograph", type: "file", required: true },
          { name: "supportingDocument", label: "Supporting document (affidavit / marriage certificate)", type: "file", required: true },
        ],
      },
    ],
  },
  {
    slug: "bvn-slip-reprint",
    name: "BVN Slip Reprint",
    category: "nin-bvn",
    summary: "Reprint your BVN slip — search by BVN number or by phone number.",
    price: 500,
    requirements: ["BVN number or registered phone number"],
    delivery: "online",
    audience: ["general"],
    popular: true,
    cta: "Reprint slip",
    keywords: ["bvn", "slip", "reprint", "bank"],
    steps: [
      {
        title: "Search details",
        fields: [
          { name: "searchMethod", label: "Search method", type: "select", required: true, options: ["Search by BVN", "Search by phone number"] },
          { name: "bvn", label: "BVN number", type: "text", help: "Required if searching by BVN." },
          { name: "phone", label: "Phone number", type: "tel", help: "Required if searching by phone number." },
        ],
      },
    ],
  },

  // ---------- JAMB & EXAMS ----------
  {
    slug: "jamb-original-result",
    name: "Original JAMB Result",
    category: "jamb-exams",
    summary: "Print your original JAMB result.",
    price: 3000,
    requirements: ["Full name", "JAMB registration number"],
    delivery: "online",
    audience: ["student"],
    popular: true,
    keywords: ["jamb", "result"],
    steps: [
      {
        title: "Result details",
        fields: [
          { name: "fullName", label: "Full name", type: "text", required: true },
          { name: "jambRegNumber", label: "JAMB registration number", type: "text", required: true },
        ],
      },
    ],
  },
  {
    slug: "jamb-admission-letter",
    name: "JAMB Admission Letter",
    category: "jamb-exams",
    summary: "Print your JAMB admission letter.",
    description: "Important: kindly accept your JAMB CAPS admission before using this service.",
    price: 2500,
    notice: "Important: kindly accept your JAMB CAPS admission before using this service.",
    requirements: ["JAMB registration number", "Accepted CAPS admission"],
    delivery: "online",
    audience: ["student"],
    keywords: ["jamb", "admission letter", "caps"],
    steps: [
      {
        title: "Admission letter details",
        fields: [
          { name: "fullName", label: "Full name", type: "text", required: true },
          { name: "jambRegNumber", label: "JAMB registration number", type: "text", required: true },
          { name: "email", label: "Email address", type: "email" },
          { name: "phone", label: "Phone number", type: "tel", required: true },
        ],
      },
    ],
  },
  {
    slug: "jamb-exam-slip",
    name: "JAMB Exam Slip Printing",
    category: "jamb-exams",
    summary: "Reprint your JAMB examination slip.",
    price: 500,
    requirements: ["JAMB registration number", "Email address", "Phone number"],
    delivery: "online",
    audience: ["student"],
    keywords: ["jamb", "slip", "exam", "reprint"],
    steps: [
      {
        title: "Slip details",
        fields: [
          { name: "jambRegNumber", label: "JAMB registration number", type: "text", required: true },
          { name: "email", label: "Email address", type: "email", required: true },
          { name: "phone", label: "Phone number", type: "tel", required: true },
        ],
      },
    ],
  },
  {
    slug: "waec-result-scratch-card",
    name: "WAEC Result Scratch Card",
    category: "jamb-exams",
    summary: "WAEC result checker card released after payment confirmation.",
    price: 6000,
    requirements: ["Name", "Phone number"],
    delivery: "online",
    audience: ["student"],
    popular: true,
    cta: "Buy card",
    keywords: ["waec", "result", "scratch card", "checker"],
    steps: [
      {
        title: "Your details",
        fields: [
          { name: "fullName", label: "Name", type: "text", required: true },
          { name: "phone", label: "Phone number", type: "tel", required: true },
        ],
      },
    ],
  },
  {
    slug: "neco-result-token",
    name: "NECO Result Token",
    category: "jamb-exams",
    summary: "NECO result token released after payment confirmation.",
    price: 3000,
    requirements: ["Name", "Phone number"],
    delivery: "online",
    audience: ["student"],
    popular: true,
    cta: "Buy token",
    keywords: ["neco", "token", "result"],
    steps: [
      {
        title: "Your details",
        fields: [
          { name: "fullName", label: "Name", type: "text", required: true },
          { name: "phone", label: "Phone number", type: "tel", required: true },
        ],
      },
    ],
  },
  {
    slug: "nabteb-result-scratch-card",
    name: "NABTEB Result Scratch Card",
    category: "jamb-exams",
    summary: "NABTEB result checker card released after payment confirmation.",
    price: 2000,
    requirements: ["Name", "Phone number"],
    delivery: "online",
    audience: ["student"],
    cta: "Buy card",
    keywords: ["nabteb", "result", "scratch card"],
    steps: [
      {
        title: "Your details",
        fields: [
          { name: "fullName", label: "Name", type: "text", required: true },
          { name: "phone", label: "Phone number", type: "tel", required: true },
        ],
      },
    ],
  },
  {
    slug: "waec-gce-pin",
    name: "WAEC GCE PIN",
    category: "jamb-exams",
    summary: "WAEC GCE registration PIN released after payment confirmation.",
    price: 39000,
    requirements: ["Name", "Phone number"],
    delivery: "online",
    audience: ["student"],
    cta: "Buy PIN",
    keywords: ["waec", "gce", "pin", "registration"],
    steps: [
      {
        title: "Your details",
        fields: [
          { name: "fullName", label: "Name", type: "text", required: true },
          { name: "phone", label: "Phone number", type: "tel", required: true },
        ],
      },
    ],
  },
  {
    slug: "neco-gce-pin",
    name: "NECO GCE PIN",
    category: "jamb-exams",
    summary: "NECO GCE registration PIN released after payment confirmation.",
    price: 33000,
    requirements: ["Name", "Phone number"],
    delivery: "online",
    audience: ["student"],
    cta: "Buy PIN",
    keywords: ["neco", "gce", "pin", "registration"],
    steps: [
      {
        title: "Your details",
        fields: [
          { name: "fullName", label: "Name", type: "text", required: true },
          { name: "phone", label: "Phone number", type: "tel", required: true },
        ],
      },
    ],
  },

  // ---------- NERD & NYSC ----------
{
    slug: "nerd-enrolment",
    name: "NERD Enrolment",
    category: "nerd-nysc",
    summary: "NERD project upload with academic data, supervisor/HOD details and payment.",
    price: 11000,
    requirements: [
      "Personal, contact and next of kin details",
      "NIN and academic data (institution, department, matric number)",
      "KYC documents: passport photo, means of ID, authorization letter",
      "Project topic and full project soft copy",
      "Supervisor and HOD contact details",
    ],
    delivery: "online",
    audience: ["student"],
    popular: true,
    cta: "Start enrolment",
    keywords: ["nerd", "project", "upload"],
    steps: [
      {
        title: "Personal information",
        fields: [
          {
            name: "title",
            label: "Title",
            type: "select",
            required: true,
            options: ["Mr", "Mrs", "Miss", "Dr", "Engr", "Prof", "Chief"],
          },
          { name: "firstName", label: "First name", type: "text", required: true },
          { name: "middleName", label: "Middle name", type: "text" },
          { name: "surname", label: "Surname", type: "text", required: true },
          {
            name: "sex",
            label: "Sex",
            type: "select",
            required: true,
            options: ["Male", "Female"],
          },
          { name: "dateOfBirth", label: "Date of birth", type: "date", required: true },
          {
            name: "maritalStatus",
            label: "Marital status",
            type: "select",
            required: true,
            options: ["Single", "Married", "Divorced", "Widowed"],
          },
          {
            name: "nin",
            label: "NIN (11 digits)",
            type: "text",
            required: true,
            help: "Enter your 11-digit National Identification Number",
          },
        ],
      },
      {
        title: "Contact information",
        fields: [
          { name: "nationality", label: "Nationality", type: "text", required: true },
          { name: "stateOfOrigin", label: "State of origin", type: "text", required: true },
          { name: "lga", label: "LGA", type: "text", required: true },
          { name: "townCity", label: "Town/City", type: "text", required: true },
          { name: "residentialAddress", label: "Residential address", type: "textarea", required: true },
          { name: "email", label: "Email address", type: "email", required: true },
          { name: "phone", label: "Phone number", type: "tel", required: true },
        ],
      },
      {
        title: "Next of kin",
        fields: [
          { name: "nokContactName", label: "Contact name", type: "text", required: true },
          { name: "nokPhone", label: "Phone number", type: "tel", required: true },
          { name: "nokEmail", label: "Email address", type: "email" },
        ],
      },
      {
        title: "Academic data",
        fields: [
          { name: "institution", label: "Institution attended", type: "text", required: true },
          { name: "faculty", label: "Faculty", type: "text", required: true },
          { name: "department", label: "Department", type: "text", required: true },
          {
            name: "programCategory",
            label: "Program category",
            type: "select",
            required: true,
            options: ["Undergraduate", "Post Graduate"],
          },
          {
            name: "programType",
            label: "Program type",
            type: "select",
            required: true,
            options: ["HND", "BSc", "MSc", "PGD", "PhD"],
          },
          { name: "matricNumber", label: "Matriculation number", type: "text", required: true },
          { name: "courseOfStudy", label: "Course of study", type: "text", required: true },
        ],
      },
      {
        title: "KYC document",
        fields: [
          {
            name: "passportPhoto",
            label: "Passport photograph",
            type: "file",
            required: true,
            help: "Recent passport photograph, PDF/JPG/PNG, max 600KB",
          },
          {
            name: "meansOfId",
            label: "Means of identification",
            type: "file",
            required: true,
            help: "NIN slip or Voter's Card, PDF/JPG/PNG, max 600KB",
          },
          {
            name: "authorizationLetter",
            label: "Authorization letter",
            type: "file",
            required: true,
            help: "Statement of Result, Certification Page, or Degree Certificate, PDF/JPG/PNG, max 600KB",
          },
        ],
      },
      {
        title: "Stage 2 - Project upload",
        fields: [
          { name: "projectTopic", label: "Project topic", type: "text", required: true },
          {
            name: "projectFile",
            label: "Full project soft copy",
            type: "file",
            required: true,
            help: "Complete project document, PDF/DOC/DOCX, max 600KB",
          },
        ],
      },
      {
        title: "Stage 3 - Signatures",
        fields: [
          { name: "supervisorName", label: "Supervisor full name", type: "text", required: true },
          { name: "supervisorEmail", label: "Supervisor email address", type: "email", required: true },
          { name: "supervisorPhone", label: "Supervisor phone number", type: "tel", required: true },
          { name: "hodName", label: "HOD full name", type: "text", required: true },
          { name: "hodEmail", label: "HOD email address", type: "email", required: true },
          { name: "hodPhone", label: "HOD phone number", type: "tel", required: true },
        ],
      },
    ],
  },
  {
    slug: "nysc-pcm-bio-data",
    name: "NYSC PCM Bio Data",
    category: "nerd-nysc",
    summary: "Structured PCM bio data capture organised into clear sections.",
    notice: "This service is only for PCM, around our Location, simply for easy collection of data, and registration, Kindly note this!Thanks",
    price: 8000,
    requirements: [
      "JAMB registration number",
      "Matriculation number",
      "Academic and graduation details",
      "Next of kin details",
    ],
    delivery: "online",
    audience: ["student"],
    popular: true,
    cta: "Start bio data",
    keywords: ["nysc", "pcm", "bio data", "mobilisation"],
    steps: [
      {
        title: "Personal information",
        fields: [
          ...nameFields,
          { name: "jambRegNumber", label: "JAMB registration number", type: "text", required: true },
          { name: "matricNumber", label: "Matriculation number", type: "text", required: true },
          { name: "dob", label: "Date of birth", type: "date", required: true },
          { name: "gender", label: "Gender", type: "select", required: true, options: ["Female", "Male"] },
          { name: "stateOfOrigin", label: "State of origin", type: "select", required: true, options: nigerianStates },
          { name: "lga", label: "Local government area", type: "text", required: true },
          { name: "maritalStatus", label: "Marital status", type: "select", options: ["Single", "Married", "Other"] },
        ],
      },
      {
        title: "Contact information",
        fields: [
          { name: "phone", label: "Phone number", type: "tel", required: true },
          { name: "email", label: "Email address", type: "email", required: true },
          { name: "address", label: "Residential address", type: "textarea", required: true },
        ],
      },
      {
        title: "Next of kin",
        fields: [
          { name: "kinName", label: "Name", type: "text", required: true },
          { name: "kinRelationship", label: "Relationship", type: "text", required: true },
          { name: "kinPhone", label: "Phone number", type: "tel", required: true },
          { name: "kinAddress", label: "Address", type: "textarea" },
        ],
      },
      {
        title: "Academic information",
        fields: [
          { name: "institution", label: "Institution", type: "text", required: true },
          { name: "course", label: "Course of study", type: "text", required: true },
          { name: "qualification", label: "Qualification", type: "text" },
          { name: "graduationYear", label: "Year of graduation", type: "number" },
        ],
      },
    ],
  },

  // ---------- RESEARCH ----------
  {
    slug: "research-support",
    name: "Research Writing Support",
    category: "research",
    summary: "Topic guidance, research structure, academic formatting and assistance.",
    price: null,
    priceNote: "Contact admin",
    requirements: ["Research topic or area", "Department and institution", "Deadline"],
    delivery: "hybrid",
    audience: ["student"],
    popular: true,
    cta: "Request support",
    keywords: ["research", "topic", "writing"],
    steps: [
      {
        title: "Your details",
        fields: [...contact, { name: "institution", label: "Institution", type: "text", required: true }, { name: "department", label: "Department", type: "text" }],
      },
      {
        title: "Research details",
        fields: [
          { name: "topic", label: "Research topic", type: "text", required: true },
          { name: "serviceNeeded", label: "Service required", type: "text", required: true },
          { name: "deadline", label: "Deadline", type: "date" },
          { name: "description", label: "Describe what you need", type: "textarea", required: true },
          { name: "file", label: "Upload existing work (optional)", type: "file" },
        ],
      },
    ],
  },
  {
    slug: "data-analysis",
    name: "Data Analysis (SPSS / STATA / Excel)",
    category: "research",
    summary: "Analysis support using SPSS, STATA, Excel and other supported tools.",
    price: null,
    priceNote: "Contact admin",
    requirements: ["Dataset or questionnaire", "Analysis objectives", "Preferred tool"],
    delivery: "hybrid",
    audience: ["student"],
    popular: true,
    keywords: ["spss", "stata", "excel", "analysis", "data"],
  },
  {
    slug: "project-guidance",
    name: "Project Guidance & Consultation",
    category: "research",
    summary: "One-on-one guidance for students and researchers, from topic to defence.",
    price: null,
    priceNote: "Contact admin",
    requirements: ["Project stage", "Area of difficulty"],
    delivery: "hybrid",
    audience: ["student"],
    keywords: ["project", "consultation", "guidance"],
  },
  {
    slug: "editing-formatting",
    name: "Editing, Formatting & Referencing",
    category: "research",
    summary: "Academic formatting, editing, referencing and professional presentation.",
    price: null,
    priceNote: "Contact admin",
    requirements: ["Document file", "Required referencing style"],
    delivery: "online",
    audience: ["student"],
    keywords: ["editing", "formatting", "referencing", "apa"],
  },

  // ---------- PRINTING ----------
  {
    slug: "document-printing",
    name: "Document Printing",
    category: "printing",
    summary: "₦100 per page for 1–10 pages, ₦70 per page above 10 pages.",
    price: null,
    priceNote: "₦100/page (1–10 pages) · ₦70/page (above 10 pages)",
    pricing: { type: "perPage", field: "pages", tiers: [{ upTo: 10, rate: 100 }, { upTo: null, rate: 70 }] },
    requirements: ["Document file", "Number of pages", "Print specification"],
    delivery: "physical",
    audience: ["general"],
    popular: true,
    cta: "Print document",
    keywords: ["print", "printing", "document"],
    steps: [
      {
        title: "Print specification",
        fields: [
          { name: "pages", label: "Number of pages", type: "number", required: true, help: "₦100 per page up to 10 pages, ₦70 per page above 10." },
          { name: "colour", label: "Colour", type: "select", required: true, options: ["Black & white", "Colour"] },
          { name: "sides", label: "Sides", type: "select", options: ["Single-sided", "Double-sided"] },
          { name: "paperSize", label: "Paper size", type: "select", options: ["A4", "A3", "Letter"] },
          { name: "file", label: "Upload document", type: "file", required: true },
        ],
      },
      {
        title: "Contact & collection",
        fields: [...contact, { name: "collection", label: "Collection or delivery", type: "select", options: ["Pick up", "Delivery"] }],
      },
    ],
  },
  {
    slug: "project-binding",
    name: "Project Binding",
    category: "printing",
    summary: "Spiral, soft and hard binding for projects, theses, seminars and reports.",
    price: null,
    priceNote: "Contact admin",
    requirements: ["Document file or printed copy", "Binding type", "Quantity"],
    delivery: "physical",
    audience: ["student"],
    popular: true,
    cta: "Discuss with admin",
    keywords: ["binding", "spiral", "hard cover", "thesis"],
    steps: [
      {
        title: "Binding details",
        fields: [
          { name: "bindingType", label: "Binding type", type: "select", required: true, options: ["Spiral binding", "Soft binding", "Hard binding", "Thesis / dissertation", "Seminar / report"] },
          { name: "quantity", label: "Quantity", type: "number", required: true },
          { name: "file", label: "Upload document", type: "file" },
        ],
      },
      { title: "Contact", fields: contact },
    ],
  },
  {
    slug: "lamination",
    name: "Lamination",
    category: "printing",
    summary: "Lamination for certificates, slips, ID cards and important documents.",
    price: 300,
    requirements: ["Document to laminate", "Size"],
    delivery: "physical",
    audience: ["general"],
    keywords: ["lamination", "laminate"],
    steps: [
      {
        title: "Lamination details",
        fields: [
          { name: "documentType", label: "Document type", type: "text", required: true },
          { name: "quantity", label: "Quantity", type: "number", required: true },
          ...contact,
        ],
      },
    ],
  },
  {
    slug: "id-cards",
    name: "ID Cards",
    category: "printing",
    summary: "Design and printing of identity cards for schools, groups and businesses.",
    price: 2500,
    requirements: ["Passport photograph", "Card details", "Quantity"],
    delivery: "physical",
    audience: ["business", "general"],
    keywords: ["id card", "identity"],
    steps: [
      {
        title: "Card details",
        fields: [
          { name: "cardHolderName", label: "Name on card", type: "text", required: true },
          { name: "organisation", label: "Organisation / school", type: "text" },
          { name: "quantity", label: "Quantity", type: "number", required: true },
          { name: "passport", label: "Passport photograph", type: "file", required: true },
          ...contact,
        ],
      },
    ],
  },
  {
    slug: "delivery-service",
    name: "Delivery Service",
    category: "printing",
    summary: "Optional nationwide delivery — cost depends on your location.",
    price: null,
    priceNote: "Contact admin",
    requirements: ["Delivery location", "Item description"],
    delivery: "physical",
    audience: ["general"],
    cta: "Discuss with admin",
    keywords: ["delivery", "dispatch", "waybill"],
    steps: [
      {
        title: "Delivery details",
        fields: [
          { name: "itemDescription", label: "What should we deliver?", type: "textarea", required: true },
          { name: "deliveryState", label: "State", type: "select", required: true, options: nigerianStates },
          { name: "deliveryAddress", label: "Delivery address / park", type: "textarea", required: true },
          ...contact,
        ],
      },
    ],
  },

  // ---------- CAC & REGISTRATION ----------
  {
    slug: "cac-business-name",
    name: "CAC Business Name Registration",
    category: "cac",
    summary: "Register a business name with the Corporate Affairs Commission.",
    description:
      "We prepare and submit the information required for business name registration. BRAIN STACK CAFE is not the Corporate Affairs Commission — approval and issuance remain with the Commission.",
    price: 30000,
    requirements: ["Applicant details and valid ID", "Two proposed business names", "Passport photograph", "Signature"],
    delivery: "online",
    audience: ["business"],
    popular: true,
    cta: "Start registration",
    keywords: ["cac", "business name", "registration"],
    steps: [
      {
        title: "Applicant information",
        fields: [
          { name: "surname", label: "Surname", type: "text", required: true },
          { name: "firstName", label: "First name", type: "text", required: true },
          { name: "otherName", label: "Other name", type: "text" },
          { name: "dob", label: "Date of birth", type: "date", required: true },
          { name: "gender", label: "Gender", type: "select", required: true, options: ["Female", "Male"] },
          { name: "phone", label: "Phone number", type: "tel", required: true },
        ],
      },
      { title: "Residential address", fields: addressFields("residential", "Residential") },
      { title: "Business address", fields: addressFields("business", "Business") },
      {
        title: "Business information",
        fields: [
          { name: "natureOfBusiness", label: "Nature of business", type: "textarea", required: true },
          { name: "businessName1", label: "Business name 1", type: "text", required: true },
          { name: "businessName2", label: "Business name 2", type: "text", required: true },
          { name: "email", label: "Functional email address", type: "email", required: true },
        ],
      },
      {
        title: "Supporting documents",
        fields: [
          { name: "ninCard", label: "NIN card (snap & submit)", type: "file", required: true },
          { name: "passport", label: "Passport photograph", type: "file", required: true },
          { name: "signature", label: "Signature (sign on paper, snap & upload)", type: "file", required: true },
        ],
      },
    ],
  },
  {
    slug: "cac-company-registration",
    name: "CAC Company Registration",
    category: "cac",
    summary: "Limited company registration with director, shareholder and witness details.",
    price: 48000,
    requirements: ["Two proposed company names", "Director, shareholder and witness details", "Signatures and IDs"],
    delivery: "online",
    audience: ["business"],
    popular: true,
    cta: "Start registration",
    keywords: ["cac", "company", "limited", "registration"],
    steps: [
      {
        title: "Proposed company names",
        fields: [
          { name: "companyName1", label: "Proposed company name 1", type: "text", required: true },
          { name: "companyName2", label: "Proposed company name 2", type: "text", required: true },
        ],
      },
      {
        title: "Nature of business",
        fields: [
          { name: "nature1", label: "Nature of business 1", type: "text", required: true },
          { name: "nature2", label: "Nature of business 2", type: "text" },
          { name: "nature3", label: "Nature of business 3", type: "text" },
        ],
      },
      { title: "Business address", fields: addressFields("business", "Business") },
      {
        title: "Contact information",
        fields: [
          { name: "email", label: "Functional email address", type: "email", required: true },
          { name: "phone", label: "Phone number", type: "tel", required: true },
        ],
      },
      {
        title: "Director information",
        fields: [
          ...personFields("director", "Director"),
          ...addressFields("directorResidential", "Director residential"),
          ...idFields("director", "Director"),
        ],
      },
      {
        title: "Shareholder information",
        fields: [
          ...personFields("shareholder", "Shareholder", { dob: true, gender: true, nationality: true }),
          ...addressFields("shareholderResidential", "Shareholder residential"),
          ...idFields("shareholder", "Shareholder"),
        ],
      },
      {
        title: "Witness information",
        fields: [
          ...personFields("witness", "Witness"),
          ...addressFields("witnessResidential", "Witness residential"),
          { name: "witnessSignature", label: "Witness signature (sign on paper, snap & upload)", type: "file", required: true },
          { name: "witnessId", label: "Witness means of identification", type: "file", required: true },
        ],
      },
    ],
  },
  {
    slug: "cac-incorporation",
    name: "CAC Incorporated Trustees",
    category: "cac",
    summary: "Incorporation for a mosque, church, foundation or organisation.",
    price: 120000,
    requirements: ["Organisation type", "Trustee details", "Proposed names and objectives"],
    delivery: "online",
    audience: ["business"],
    cta: "Start incorporation",
    keywords: ["cac", "incorporation", "trustees", "church", "mosque", "foundation"],
    steps: [
      {
        title: "Organisation type",
        fields: [
          { name: "organisationType", label: "Type of organisation", type: "select", required: true, options: ["Mosque", "Church", "Foundation", "Organization"] },
          { name: "proposedName1", label: "Proposed name 1", type: "text", required: true },
          { name: "proposedName2", label: "Proposed name 2", type: "text", required: true },
          { name: "proposedName3", label: "Proposed name 3", type: "text" },
        ],
      },
      {
        title: "Authorised representative",
        fields: [
          ...personFields("rep", "Representative", { dob: true, gender: true, nationality: true }),
          { name: "repNinCard", label: "Representative NIN card (snap & submit)", type: "file", required: true },
        ],
      },
      { title: "Registered office address", fields: addressFields("office", "Registered office", { country: true }) },
      {
        title: "Trustee information",
        fields: [
          ...personFields("trustee", "Trustee", { dob: true, gender: true, nationality: true }),
          { name: "trusteePortfolio", label: "Trustee portfolio / position", type: "select", required: true, options: ["Chairman", "Secretary", "Treasurer", "Member"] },
          ...addressFields("trusteeService", "Trustee service address", { country: true }),
          ...addressFields("trusteeResidential", "Trustee residential address", { country: true }),
          { name: "trusteeNinCard", label: "Trustee NIN card (snap & submit)", type: "file", required: true },
        ],
      },
      {
        title: "Aims & objectives",
        fields: [
          { name: "officialEmail", label: "Official email address", type: "email", required: true },
          { name: "objective1", label: "Aim / objective 1", type: "textarea", required: true },
          { name: "objective2", label: "Aim / objective 2", type: "textarea" },
          { name: "objective3", label: "Aim / objective 3", type: "textarea" },
          { name: "objective4", label: "Aim / objective 4", type: "textarea" },
          { name: "objective5", label: "Aim / objective 5", type: "textarea" },
        ],
      },
    ],
  },
  {
    slug: "ngo-registration",
    name: "NGO Registration",
    category: "cac",
    summary: "Full NGO registration workflow — representative, trustees, address and objectives.",
    description: "All entries on this application are recorded in CAPITAL LETTERS as required.",
    notice: "All text on this application is automatically converted to CAPITAL LETTERS.",
    uppercase: true,
    price: null,
    priceNote: "Contact admin",
    requirements: ["Authorised representative details", "Trustee details", "Three proposed names", "NIN ID cards"],
    delivery: "online",
    audience: ["business"],
    cta: "Start NGO registration",
    keywords: ["ngo", "registration", "trustees", "non-profit"],
    steps: [
      {
        title: "Authorised representative",
        fields: [
          ...personFields("rep", "Representative", { dob: true, gender: true, nationality: true }),
          { name: "repNinCard", label: "Representative NIN ID card (upload / snap)", type: "file", required: true },
        ],
      },
      { title: "NGO address", fields: addressFields("ngo", "NGO address", { country: true }) },
      {
        title: "Proposed organisation names",
        fields: [
          { name: "proposedName1", label: "Proposed name 1", type: "text", required: true },
          { name: "proposedName2", label: "Proposed name 2", type: "text", required: true },
          { name: "proposedName3", label: "Proposed name 3", type: "text" },
          { name: "mission", label: "Description / mission", type: "textarea", required: true },
        ],
      },
      {
        title: "Trustee information",
        fields: [
          ...personFields("trustee", "Trustee", { dob: true, gender: true, nationality: true }),
          { name: "trusteePortfolio", label: "Trustee portfolio / position", type: "select", required: true, options: ["Chairman", "Secretary", "Treasurer", "Member"] },
          ...addressFields("trusteeService", "Trustee service address", { country: true }),
          ...addressFields("trusteeResidential", "Trustee residential address", { country: true }),
          { name: "trusteeNinCard", label: "Trustee NIN ID card (upload / snap)", type: "file", required: true },
        ],
      },
      {
        title: "Official information & objectives",
        fields: [
          { name: "officialEmail", label: "Official email address", type: "email", required: true },
          ...addressFields("registeredOffice", "Registered office"),
          { name: "objective1", label: "Aim / objective 1", type: "textarea", required: true },
          { name: "objective2", label: "Aim / objective 2", type: "textarea" },
          { name: "objective3", label: "Aim / objective 3", type: "textarea" },
          { name: "objective4", label: "Aim / objective 4", type: "textarea" },
          { name: "objective5", label: "Aim / objective 5", type: "textarea" },
        ],
      },
    ],
  },

  // ---------- UTILITIES ----------
  {
    slug: "airtime",
    name: "Airtime Top-up",
    category: "utilities",
    summary: "Instant airtime for all supported networks.",
    price: null,
    priceNote: "You choose the amount (minimum ₦50)",
    requirements: ["Network", "Phone number", "Amount"],
    delivery: "online",
    audience: ["general"],
    popular: true,
    cta: "Buy airtime",
    keywords: ["airtime", "recharge", "topup"],
    steps: [
      {
        title: "Airtime Details",
        fields: [
          { name: "network", label: "Network", type: "select", required: true, options: ["MTN", "GLO", "Airtel", "9Mobile"] },
          { name: "phoneNumber", label: "Phone Number", type: "tel", required: true, help: "Enter the phone number to recharge (e.g., 08012345678)" },
          { name: "amount", label: "Amount (₦)", type: "number", required: true, min: 50, help: "Minimum ₦50" }
        ]
      }
    ]
  },
  {
    slug: "data-bundles",
    name: "Data Bundles",
    category: "utilities",
    summary: "Data plans for all supported networks.",
    price: null,
    priceNote: "You choose the data plan",
    requirements: ["Network", "Data plan", "Phone number"],
    delivery: "online",
    audience: ["general"],
    popular: true,
    cta: "Buy data",
    keywords: ["data", "bundle", "internet"],
    steps: [
      {
        title: "Select Network",
        fields: [
          { name: "network", label: "Network", type: "select", required: true, options: ["MTN", "GLO", "Airtel", "9Mobile", "Etisalat"] }
        ]
      },
      {
        title: "Select Data Plan",
        fields: [
          { name: "planSelection", label: "Data Plan", type: "select", required: true, options: [] } // Will be populated dynamically based on network
        ]
      },
      {
        title: "Recipient Details",
        fields: [
          { name: "phoneNumber", label: "Phone Number", type: "tel", required: true, help: "Enter the phone number for data activation (e.g., 08012345678)" }
        ]
      }
    ]
  },
  {
    slug: "electricity",
    name: "Electricity Bill Payment",
    category: "utilities",
    summary: "Prepaid tokens and postpaid payments for supported discos.",
    price: null,
    priceNote: "You choose the amount",
    requirements: ["Provider / disco", "Meter number", "Meter type", "Amount"],
    delivery: "online",
    audience: ["general"],
    cta: "Pay bill",
    keywords: ["electricity", "meter", "token", "disco"],
    steps: [
      {
        title: "Electricity Provider",
        fields: [
          { name: "provider", label: "Electricity Provider", type: "select", required: true, options: ["Ikeja Electric", "Eko Electric", "Abuja Electric", "Kano Electric", "Port Harcourt Electric", "Jos Electric", "Kaduna Electric"] }
        ]
      },
      {
        title: "Account Details",
        fields: [
          { name: "meterNumber", label: "Meter Number", type: "text", required: true, help: "Your electricity meter number" },
          { name: "meterType", label: "Meter Type", type: "select", required: true, options: ["Prepaid", "Postpaid"] }
        ]
      },
      {
        title: "Payment Amount",
        fields: [
          { name: "amount", label: "Amount (₦)", type: "number", required: true, min: 100, help: "Minimum ₦100" }
        ]
      }
    ]
  },
  {
    slug: "tv-subscription",
    name: "TV Subscription",
    category: "utilities",
    summary: "Renew supported cable TV packages using your smart-card or IUC number.",
    price: null,
    priceNote: "You choose the package",
    requirements: ["Provider", "Package", "Smart-card / IUC number"],
    delivery: "online",
    audience: ["general"],
    cta: "Renew subscription",
    keywords: ["tv", "cable", "subscription", "iuc"],
    steps: [
      {
        title: "TV Provider",
        fields: [
          { name: "provider", label: "TV Provider", type: "select", required: true, options: ["DStv", "GOtv", "Startimes"] }
        ]
      },
      {
        title: "Subscription Package",
        fields: [
          { name: "package", label: "Subscription Package", type: "select", required: true, options: [] } // Will be populated dynamically based on provider
        ]
      },
      {
        title: "Smart Card / IUC Number",
        fields: [
          { name: "smartCardNumber", label: "Smart Card / IUC Number", type: "text", required: true, help: "Enter your smart card or IUC number" }
        ]
      }
    ]
  },

  // ---------- SHOP ----------
  {
    slug: "computer-accessories",
    name: "Computers & Accessories",
    category: "shop",
    summary: "Buy laptops, keyboards, mice, storage and accessories — pickup or waybill.",
    description:
      "Browse what is in stock, place an order and choose pickup at the centre or waybill delivery to your location anywhere in Nigeria.",
    price: null,
    priceNote: "Prices vary by item",
    requirements: ["Item(s) you want", "Quantity", "Delivery choice — pickup or waybill"],
    delivery: "hybrid",
    audience: ["general", "student", "business"],
    popular: true,
    cta: "Browse the shop",
    keywords: ["laptop", "keyboard", "mouse", "accessories", "waybill", "shop", "computer"],
  },
];

export type Course = {
  slug: string;
  title: string;
  level: "Beginner" | "Intermediate" | "Advanced";
  mode: "Physical" | "Online" | "Physical or Online";
  duration: string;
  price?: number | null;
  outcomes: string[];
  startDate?: string | null;
};

export const courses: Course[] = [
  {
    slug: "basic-computer",
    title: "Basic Computer Skills",
    level: "Beginner",
    mode: "Physical or Online",
    duration: "4 weeks",
    price: null,
    startDate: null,
    outcomes: [
      "Computer fundamentals and hardware basics",
      "Working confidently with Windows",
      "File management and storage",
      "Internet usage and email",
    ],
  },
  {
    slug: "microsoft-word",
    title: "Microsoft Word",
    level: "Beginner",
    mode: "Physical or Online",
    duration: "3 weeks",
    price: null,
    startDate: null,
    outcomes: [
      "Professional document creation",
      "Formatting, styles and templates",
      "Tables, references and page setup",
      "Printing and exporting",
    ],
  },
  {
    slug: "microsoft-excel",
    title: "Microsoft Excel",
    level: "Intermediate",
    mode: "Physical or Online",
    duration: "4 weeks",
    price: null,
    startDate: null,
    outcomes: [
      "Spreadsheets, formulas and functions",
      "Data cleaning and sorting",
      "Charts and reporting",
      "Practical business and academic use cases",
    ],
  },
  {
    slug: "microsoft-powerpoint",
    title: "Microsoft PowerPoint",
    level: "Beginner",
    mode: "Physical or Online",
    duration: "2 weeks",
    price: null,
    startDate: null,
    outcomes: [
      "Slide design fundamentals",
      "Visual storytelling for defence and business",
      "Animation and transitions",
      "Presenting with confidence",
    ],
  },
  {
    slug: "digital-skills",
    title: "Internet & Digital Skills",
    level: "Beginner",
    mode: "Physical or Online",
    duration: "3 weeks",
    price: null,
    startDate: null,
    outcomes: [
      "Online applications and registrations",
      "Digital communication and etiquette",
      "Internet research techniques",
      "Everyday productivity tools",
    ],
  },
  {
    slug: "practical-ict",
    title: "Practical ICT for Work & Business",
    level: "Intermediate",
    mode: "Physical or Online",
    duration: "6 weeks",
    price: null,
    startDate: null,
    outcomes: [
      "Workplace-ready computer skills",
      "Document and record management",
      "Digital tools for small business",
      "Job-seeker essentials",
    ],
  },
];

export const otherIcons = { BookOpen, Smartphone, Tv, FileSignature, Binary };

// ---------- SHOP: computers & accessories ----------
export type ProductCategory =
  | "Laptops"
  | "Keyboards"
  | "Mice"
  | "Storage"
  | "Accessories"
  | "Printers & Consumables";

export type Product = {
  id: string;
  name: string;
  category: ProductCategory;
  price: number | null;
  condition: "New" | "UK Used" | "Refurbished";
  inStock: boolean;
  waybill: boolean;
  summary: string;
  specs?: string[];
};

export const productCategories: ProductCategory[] = [
  "Laptops",
  "Keyboards",
  "Mice",
  "Storage",
  "Accessories",
  "Printers & Consumables",
];

export const products: Product[] = [];

export const productsInCategory = (category: ProductCategory) =>
  products.filter((p) => p.category === category);
export const getProduct = (id: string) => products.find((p) => p.id === id);

export const getCategory = (slug: string) => categories.find((c) => c.slug === slug);
export const getService = (slug: string) => services.find((s) => s.slug === slug);
export const servicesInCategory = (slug: string) =>
  services.filter((s) => s.category === slug);
export const popularServices = services.filter((s) => s.popular);

export function searchServices(query: string) {
  const q = query.trim().toLowerCase();
  if (!q) return services;
  return services.filter((s) =>
    [s.name, s.summary, s.category, ...(s.keywords ?? [])]
      .join(" ")
      .toLowerCase()
      .includes(q),
  );
}