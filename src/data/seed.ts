import type { FamilyData } from "./types";

// A small three-generation sample family so the app feels alive on first run.
// Kerala household with Tamil Nadu roots. Names & details are illustrative.
export const seedFamily: FamilyData = {
  households: [
    { id: "h-thara", name: "Thekkemadom Tharavadu" },
    { id: "h-chennai", name: "Chennai branch" },
  ],
  people: [
    // Gen 1 — grandparents
    { id: "p-achutan", name: "Achutan Nair", gender: "male", dob: "1948-06-10", place: "Thrissur, Kerala", nativePlace: "Thrissur", householdId: "h-thara" },
    { id: "p-saraswati", name: "Saraswati", nicknames: ["Ammamma"], gender: "female", dob: "1952-02-22", place: "Thrissur, Kerala", nativePlace: "Palakkad", householdId: "h-thara" },
    { id: "p-ganesan", name: "Ganesan Iyer", gender: "male", dob: "1945-11-03", place: "Chennai, Tamil Nadu", nativePlace: "Thanjavur", householdId: "h-chennai", isDeceased: true, dateOfDeath: "2019-08-14" },
    { id: "p-lakshmi", name: "Lakshmi", nicknames: ["Paati"], gender: "female", dob: "1950-07-19", place: "Chennai, Tamil Nadu", nativePlace: "Thanjavur", householdId: "h-chennai" },

    // Gen 2 — parents & their siblings
    { id: "p-ravi", name: "Ravi Nair", gender: "male", dob: "1974-03-15", place: "Kochi, Kerala", nativePlace: "Thrissur", householdId: "h-thara" },
    { id: "p-meena", name: "Meenakshi", nicknames: ["Meena"], gender: "female", dob: "1978-09-28", place: "Kochi, Kerala", nativePlace: "Thanjavur", householdId: "h-thara" },
    { id: "p-suresh", name: "Suresh Nair", gender: "male", dob: "1976-12-01", place: "Bengaluru, Karnataka", nativePlace: "Thrissur", householdId: "h-thara" },
    { id: "p-divya", name: "Divya", gender: "female", dob: "1980-05-09", place: "Bengaluru, Karnataka", householdId: "h-thara" },

    // Gen 3 — children
    { id: "p-arjun", name: "Arjun Nair", nicknames: ["Appu"], gender: "male", dob: "2004-01-20", place: "Kochi, Kerala", householdId: "h-thara" },
    { id: "p-ananya", name: "Ananya Nair", nicknames: ["Ammu"], gender: "female", dob: "2008-06-30", place: "Kochi, Kerala", householdId: "h-thara" },
    { id: "p-karthik", name: "Karthik Nair", gender: "male", dob: "2011-10-11", place: "Bengaluru, Karnataka", householdId: "h-thara" },
  ],
  edges: [
    // spouses (with marriage dates for anniversaries)
    { id: "e1", type: "spouse", from: "p-achutan", to: "p-saraswati", status: "current", since: "1972-05-14" },
    { id: "e2", type: "spouse", from: "p-ganesan", to: "p-lakshmi", status: "current", since: "1969-08-30" },
    { id: "e3", type: "spouse", from: "p-ravi", to: "p-meena", status: "current", since: "2001-11-25" },
    { id: "e4", type: "spouse", from: "p-suresh", to: "p-divya", status: "current", since: "2005-02-10" },

    // Achutan & Saraswati -> Ravi, Suresh
    { id: "e5", type: "parent_child", from: "p-achutan", to: "p-ravi" },
    { id: "e6", type: "parent_child", from: "p-saraswati", to: "p-ravi" },
    { id: "e7", type: "parent_child", from: "p-achutan", to: "p-suresh" },
    { id: "e8", type: "parent_child", from: "p-saraswati", to: "p-suresh" },

    // Ganesan & Lakshmi -> Meenakshi (the Tamil Nadu side, married into Kerala family)
    { id: "e9", type: "parent_child", from: "p-ganesan", to: "p-meena" },
    { id: "e10", type: "parent_child", from: "p-lakshmi", to: "p-meena" },

    // Ravi & Meena -> Arjun, Ananya
    { id: "e11", type: "parent_child", from: "p-ravi", to: "p-arjun" },
    { id: "e12", type: "parent_child", from: "p-meena", to: "p-arjun" },
    { id: "e13", type: "parent_child", from: "p-ravi", to: "p-ananya" },
    { id: "e14", type: "parent_child", from: "p-meena", to: "p-ananya" },

    // Suresh & Divya -> Karthik
    { id: "e15", type: "parent_child", from: "p-suresh", to: "p-karthik" },
    { id: "e16", type: "parent_child", from: "p-divya", to: "p-karthik" },
  ],
};
