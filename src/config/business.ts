/**
 * Central business configuration.
 * Everything not yet supplied by BRAIN STACK CAFE is left null so it can be
 * filled in later without touching components.
 */
export const business = {
  name: "BRAIN STACK CAFE",
  shortName: "Brain Stack",
  tagline: "Fast. Reliable. Convenient.",
  promise: "Everything You Need. One Trusted Digital Centre.",
  phone: "07038944249",
  phoneE164: "+2347038944249",
  whatsapp: "2347038944249",
  email: "brainstackcafe@gmail.com",
  // Not yet supplied — configure before launch.
  address: null as string | null,
  openingHours: null as string | null,
  socials: [] as { label: string; url: string }[],
  referencePrefix: "BSC",
} as const;

export const waLink = (message?: string) =>
  `https://api.whatsapp.com/send?phone=${business.whatsapp}${
    message ? `&text=${encodeURIComponent(message)}` : ""
  }`;

export const telLink = `tel:${business.phoneE164}`;
export const mailLink = `mailto:${business.email}`;

export const disclaimers = {
  thirdParty:
    "BRAIN STACK CAFE provides assistance and access to selected services. Where a service depends on a government agency, examination body or other third-party platform, final approval, processing and issuance remain subject to that organization's requirements and systems.",
  academic:
    "Academic support is provided for legitimate learning, research guidance, data analysis, editing, formatting, consultation, printing and binding. We do not support impersonation or dishonest academic submission.",
};