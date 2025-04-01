// This is a placeholder data structure that will be replaced with actual data from the backend
// Each state should have:
// - id: The state FIPS code used in the GeoJSON map data
// - status: Current legalization status (one of: "Legal", "Decriminalized", "Medical/Therapeutic Only", "Reduced Penalties", "Illegal")
// - details: Optional additional details about laws, regulations, or conditions

export const stateLegalizationData = [
    // States with specific details
    {
        id: "06", // California
        status: "Illegal",
        details:
            "Decriminalized in several cities including Oakland and Santa Cruz.",
    },
    {
        id: "53", // Washington
        status: "Illegal",
        details:
            "Legal for adults 21+ for personal use under specific conditions.",
    },
    {
        id: "08", // Colorado
        status: "Decriminalized",
        details: "Legal for adults 21+ following 2022 ballot initiative.",
    },
    {
        id: "41", // Oregon
        status: "Decriminalized",
        details: "Legal under Measure 109 with regulated therapeutic use.",
    },

    // All other states with illegal status
    { id: "01", status: "Illegal", details: "" }, // Alabama
    { id: "02", status: "Illegal", details: "" }, // Alaska
    { id: "04", status: "Illegal", details: "" }, // Arizona
    { id: "05", status: "Illegal", details: "" }, // Arkansas
    { id: "09", status: "Illegal", details: "" }, // Connecticut
    { id: "10", status: "Illegal", details: "" }, // Delaware
    { id: "11", status: "Illegal", details: "" }, // District of Columbia
    { id: "12", status: "Illegal", details: "" }, // Florida
    { id: "13", status: "Illegal", details: "" }, // Georgia
    { id: "15", status: "Illegal", details: "" }, // Hawaii
    { id: "16", status: "Illegal", details: "" }, // Idaho
    { id: "17", status: "Illegal", details: "" }, // Illinois
    { id: "18", status: "Illegal", details: "" }, // Indiana
    { id: "19", status: "Illegal", details: "" }, // Iowa
    { id: "20", status: "Illegal", details: "" }, // Kansas
    { id: "21", status: "Illegal", details: "" }, // Kentucky
    { id: "22", status: "Illegal", details: "" }, // Louisiana
    { id: "23", status: "Illegal", details: "" }, // Maine
    { id: "24", status: "Illegal", details: "" }, // Maryland
    { id: "25", status: "Illegal", details: "" }, // Massachusetts
    { id: "26", status: "Illegal", details: "" }, // Michigan
    { id: "27", status: "Illegal", details: "" }, // Minnesota
    { id: "28", status: "Illegal", details: "" }, // Mississippi
    { id: "29", status: "Illegal", details: "" }, // Missouri
    { id: "30", status: "Illegal", details: "" }, // Montana
    { id: "31", status: "Illegal", details: "" }, // Nebraska
    { id: "32", status: "Illegal", details: "" }, // Nevada
    { id: "33", status: "Illegal", details: "" }, // New Hampshire
    { id: "34", status: "Illegal", details: "" }, // New Jersey
    { id: "35", status: "Illegal", details: "" }, // New Mexico
    { id: "36", status: "Illegal", details: "" }, // New York
    { id: "37", status: "Illegal", details: "" }, // North Carolina
    { id: "38", status: "Illegal", details: "" }, // North Dakota
    { id: "39", status: "Illegal", details: "" }, // Ohio
    { id: "40", status: "Illegal", details: "" }, // Oklahoma
    { id: "42", status: "Illegal", details: "" }, // Pennsylvania
    { id: "44", status: "Illegal", details: "" }, // Rhode Island
    { id: "45", status: "Illegal", details: "" }, // South Carolina
    { id: "46", status: "Illegal", details: "" }, // South Dakota
    { id: "47", status: "Illegal", details: "" }, // Tennessee
    { id: "48", status: "Illegal", details: "" }, // Texas
    { id: "49", status: "Illegal", details: "" }, // Utah
    { id: "50", status: "Illegal", details: "" }, // Vermont
    { id: "51", status: "Illegal", details: "" }, // Virginia
    { id: "54", status: "Illegal", details: "" }, // West Virginia
    { id: "55", status: "Illegal", details: "" }, // Wisconsin
    { id: "56", status: "Illegal", details: "" }, // Wyoming
];
