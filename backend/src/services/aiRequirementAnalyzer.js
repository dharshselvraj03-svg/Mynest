import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/*
|--------------------------------------------------------------------------
| MyNest AI Requirement Analyzer
|--------------------------------------------------------------------------
|
| Pipeline:
|
| User Requirements
|        ↓
| Compact Architectural Brief
|        ↓
| AI Requirement Understanding
|        ↓
| Structured Planning Brief
|        ↓
| Architectural Spatial Planning Engine
|
| IMPORTANT:
| The AI does NOT generate room coordinates here.
| Geometry is handled by the architectural planning engine.
|
| If OpenAI is temporarily unavailable or rate-limited,
| MyNest creates a deterministic fallback brief from the
| user's actual requirements so the planning pipeline can continue.
|
|--------------------------------------------------------------------------
*/


/*
|--------------------------------------------------------------------------
| STRUCTURED OUTPUT SCHEMA
|--------------------------------------------------------------------------
*/

const REQUIREMENT_SCHEMA = {
  type: "object",

  additionalProperties: false,

  properties: {
    projectType: {
      type: "string",

      enum: [
        "new_home",
        "existing_home_optimization",
      ],
    },

    plot: {
      type: "object",

      additionalProperties: false,

      properties: {
        width: {
          type: "number",
        },

        length: {
          type: "number",
        },

        area: {
          type: "number",
        },

        unit: {
          type: "string",
        },
      },

      required: [
        "width",
        "length",
        "area",
        "unit",
      ],
    },

    budget: {
      type: "object",

      additionalProperties: false,

      properties: {
        amount: {
          type: "number",
        },

        currency: {
          type: "string",
        },
      },

      required: [
        "amount",
        "currency",
      ],
    },

    household: {
      type: "object",

      additionalProperties: false,

      properties: {
        people: {
          type: "integer",
        },

        bedrooms: {
          type: "integer",
        },

        bathrooms: {
          type: "integer",
        },
      },

      required: [
        "people",
        "bedrooms",
        "bathrooms",
      ],
    },

    requiredSpaces: {
      type: "array",

      items: {
        type: "object",

        additionalProperties: false,

        properties: {
          name: {
            type: "string",
          },

          type: {
            type: "string",
          },

          priority: {
            type: "string",

            enum: [
              "high",
              "medium",
              "low",
            ],
          },

          preferredSize: {
            type: "string",
          },
        },

        required: [
          "name",
          "type",
          "priority",
          "preferredSize",
        ],
      },
    },

    adjacencyRequirements: {
      type: "array",

      items: {
        type: "string",
      },
    },

    separationRequirements: {
      type: "array",

      items: {
        type: "string",
      },
    },

    priorities: {
      type: "array",

      items: {
        type: "string",
      },
    },

    lifestyleRequirements: {
      type: "array",

      items: {
        type: "string",
      },
    },

    comfortRequirements: {
      type: "array",

      items: {
        type: "string",
      },
    },

    specialRequirements: {
      type: "array",

      items: {
        type: "string",
      },
    },

    furnitureConstraints: {
      type: "array",

      items: {
        type: "string",
      },
    },

    applianceConstraints: {
      type: "array",

      items: {
        type: "string",
      },
    },

    naturalLanguageRequirements: {
      type: "array",

      items: {
        type: "string",
      },
    },

    planningPriorities: {
      type: "array",

      items: {
        type: "string",
      },
    },

    conflictsToCheck: {
      type: "array",

      items: {
        type: "string",
      },
    },

    feasibilityQuestions: {
      type: "array",

      items: {
        type: "string",
      },
    },

    planningSummary: {
      type: "string",
    },
  },

  required: [
    "projectType",
    "plot",
    "budget",
    "household",
    "requiredSpaces",
    "adjacencyRequirements",
    "separationRequirements",
    "priorities",
    "lifestyleRequirements",
    "comfortRequirements",
    "specialRequirements",
    "furnitureConstraints",
    "applianceConstraints",
    "naturalLanguageRequirements",
    "planningPriorities",
    "conflictsToCheck",
    "feasibilityQuestions",
    "planningSummary",
  ],
};


/*
|--------------------------------------------------------------------------
| TEXT HELPERS
|--------------------------------------------------------------------------
*/

function cleanText(
  value,
  maxLength = 300
) {
  if (
    value === null ||
    value === undefined
  ) {
    return "";
  }

  return String(value)
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength);
}


function numberValue(
  value,
  fallback = 0
) {
  const parsed =
    Number(value);

  return Number.isFinite(parsed)
    ? parsed
    : fallback;
}


function integerValue(
  value,
  fallback = 0
) {
  const parsed =
    Number(value);

  return Number.isFinite(parsed)
    ? Math.round(parsed)
    : fallback;
}


function uniqueStrings(
  values,
  maxItems = 30
) {
  if (
    !Array.isArray(values)
  ) {
    return [];
  }

  return [
    ...new Set(
      values
        .map((item) =>
          cleanText(item)
        )
        .filter(Boolean)
    ),
  ].slice(
    0,
    maxItems
  );
}


/*
|--------------------------------------------------------------------------
| FURNITURE + APPLIANCE EXTRACTION
|--------------------------------------------------------------------------
|
| Convert the large frontend furniture object into compact
| architectural constraints.
|
|--------------------------------------------------------------------------
*/

function extractFurnitureConstraints(
  furniture
) {
  if (
    !furniture ||
    typeof furniture !==
      "object"
  ) {
    return [];
  }

  const result = [];

  const ownedFurniture =
    Array.isArray(
      furniture.ownedFurniture
    )
      ? furniture.ownedFurniture
      : [];

  const plannedFurniture =
    Array.isArray(
      furniture.plannedFurniture
    )
      ? furniture.plannedFurniture
      : [];

  const ownedAppliances =
    Array.isArray(
      furniture.ownedAppliances
    )
      ? furniture.ownedAppliances
      : [];

  const plannedAppliances =
    Array.isArray(
      furniture.plannedAppliances
    )
      ? furniture.plannedAppliances
      : [];


  /*
   * Existing furniture
   */

  ownedFurniture.forEach(
    (item) => {
      result.push(
        `Existing furniture: ${cleanText(
          item,
          120
        )}`
      );
    }
  );


  /*
   * Planned furniture
   */

  plannedFurniture.forEach(
    (item) => {
      result.push(
        `Planned furniture: ${cleanText(
          item,
          120
        )}`
      );
    }
  );


  /*
   * Furniture dimensions
   */

  if (
    furniture.furnitureDetails &&
    typeof furniture.furnitureDetails ===
      "object"
  ) {
    Object.entries(
      furniture.furnitureDetails
    )
      .slice(0, 30)
      .forEach(
        ([name, details]) => {
          if (
            !details ||
            typeof details !==
              "object"
          ) {
            return;
          }

          const quantity =
            integerValue(
              details.quantity,
              1
            );

          const width =
            cleanText(
              details.width,
              30
            );

          const depth =
            cleanText(
              details.depth,
              30
            );

          const height =
            cleanText(
              details.height,
              30
            );

          result.push(
            `Furniture ${cleanText(
              name,
              80
            )}: quantity ${quantity}, dimensions ${width} × ${depth} × ${height}.`
          );
        }
      );
  }


  /*
   * Custom furniture
   */

  if (
    furniture.customFurniture
  ) {
    result.push(
      `Custom furniture requirement: ${cleanText(
        furniture.customFurniture,
        250
      )}`
    );
  }


  /*
   * Existing appliances
   */

  ownedAppliances.forEach(
    (item) => {
      result.push(
        `Existing appliance: ${cleanText(
          item,
          120
        )}`
      );
    }
  );


  /*
   * Planned appliances
   */

  plannedAppliances.forEach(
    (item) => {
      result.push(
        `Planned appliance: ${cleanText(
          item,
          120
        )}`
      );
    }
  );


  return uniqueStrings(
    result,
    50
  );
}


/*
|--------------------------------------------------------------------------
| COMPACT USER REQUIREMENTS
|--------------------------------------------------------------------------
|
| This is the important TPM fix.
|
| We do NOT send the entire frontend state object to OpenAI.
| We extract only information that matters architecturally.
|
|--------------------------------------------------------------------------
*/

function buildCompactRequirements(
  requirements
) {
  const preferences =
    requirements?.preferences || {};

  const furniture =
    requirements?.furniture || {};


  /*
   * Plot
   */

  const plotWidth =
    numberValue(
      requirements?.plotWidth
    );

  const plotLength =
    numberValue(
      requirements?.plotLength
    );

  const plotArea =
    plotWidth > 0 &&
    plotLength > 0
      ? plotWidth *
        plotLength
      : 0;


  /*
   * Preferences
   */

  const relationships =
    Array.isArray(
      preferences.relationships
    )
      ? preferences.relationships
      : [];

  const separations =
    Array.isArray(
      preferences.separations
    )
      ? preferences.separations
      : [];

  const priorities =
    Array.isArray(
      preferences.priorities
    )
      ? preferences.priorities
      : [];

  const lifestyle =
    Array.isArray(
      preferences.lifestyle
    )
      ? preferences.lifestyle
      : [];

  const comfort =
    Array.isArray(
      preferences.comfort
    )
      ? preferences.comfort
      : [];

  const specialRequirements =
    Array.isArray(
      preferences.specialRequirements
    )
      ? preferences.specialRequirements
      : [];

  const highestPriority =
    cleanText(
      preferences.highestPriority,
      300
    );

  const customRequirements =
    cleanText(
      preferences.customRequirements,
      1200
    );


  /*
   * Furniture
   */

  const furnitureConstraints =
    extractFurnitureConstraints(
      furniture
    );


  /*
   * Compact object
   */

  return {
    projectType:
      requirements?.planningType ===
      "existing"
        ? "existing_home_optimization"
        : "new_home",

    plot: {
      width:
        plotWidth,

      length:
        plotLength,

      area:
        plotArea,

      unit:
        "sq.ft",
    },

    budget: {
      amount:
        numberValue(
          requirements?.budget
        ),

      currency:
        "INR",
    },

    household: {
      people:
        integerValue(
          requirements?.people
        ),

      bedrooms:
        integerValue(
          requirements?.bedrooms
        ),

      bathrooms:
        integerValue(
          requirements?.bathrooms
        ),
    },

    preferences: {
      relationships:
        uniqueStrings(
          relationships,
          20
        ),

      separations:
        uniqueStrings(
          separations,
          20
        ),

      priorities:
        uniqueStrings(
          priorities,
          15
        ),

      highestPriority:
        highestPriority,

      lifestyle:
        uniqueStrings(
          lifestyle,
          15
        ),

      comfort:
        uniqueStrings(
          comfort,
          15
        ),

      specialRequirements:
        uniqueStrings(
          specialRequirements,
          20
        ),

      customRequirements:
        customRequirements,
    },

    furnitureConstraints:
      furnitureConstraints,

    rawNaturalLanguage:
      customRequirements,
  };
}


/*
|--------------------------------------------------------------------------
| AI INSTRUCTIONS
|--------------------------------------------------------------------------
*/

const SYSTEM_INSTRUCTIONS = `
You are the requirement-understanding layer of MyNest.

MyNest is an AI-assisted residential home-planning and
space-optimization platform.

Your task is to convert the supplied user requirements into
a structured architectural planning brief.

DO NOT generate a floor plan.

DO NOT generate room coordinates.

DO NOT generate room rectangles.

DO NOT invent requirements that the user did not provide.

Preserve the user's actual requirements.

Architectural reasoning must consider:

1. Required bedroom and bathroom counts are hard requirements.

2. User-requested room relationships should become adjacency
   requirements.

3. User-requested separations should become privacy/separation
   requirements.

4. High-priority spaces should receive appropriate planning priority.

5. Furniture and appliance dimensions are spatial constraints.

6. Common bathrooms should be reachable from common circulation.

7. Attached bathrooms must serve their intended bedroom.

8. Living, dining and kitchen relationships must be considered.

9. Bedrooms should be protected from inappropriate visitor movement.

10. Circulation must be meaningful rather than decorative.

11. Consider natural light and ventilation.

12. Consider storage requirements.

13. Consider accessibility and practical movement.

14. Consider budget as a planning constraint.

15. Consider future flexibility when explicitly requested.

16. Preserve natural-language requirements.

17. If requirements conflict, report the conflict.

18. Do not silently ignore a user requirement.

19. Distinguish hard requirements from preferences.

20. MyNest produces conceptual planning assistance and is not
    a replacement for licensed architectural or engineering
    drawings.

Return a concise structured planning brief.
`;


/*
|--------------------------------------------------------------------------
| FALLBACK ARCHITECTURAL BRIEF
|--------------------------------------------------------------------------
|
| This is used when the OpenAI API is temporarily unavailable,
| rate-limited, or otherwise fails.
|
| IMPORTANT:
| We do NOT pretend that AI generated this.
|
| The user's actual requirements are preserved and converted
| into deterministic architectural constraints.
|
|--------------------------------------------------------------------------
*/

function createFallbackAnalysis(
  data
) {
  const preferences =
    data.preferences || {};


  const relationships =
    Array.isArray(
      preferences.relationships
    )
      ? preferences.relationships
      : [];


  const separations =
    Array.isArray(
      preferences.separations
    )
      ? preferences.separations
      : [];


  const priorities =
    Array.isArray(
      preferences.priorities
    )
      ? preferences.priorities
      : [];


  const lifestyle =
    Array.isArray(
      preferences.lifestyle
    )
      ? preferences.lifestyle
      : [];


  const comfort =
    Array.isArray(
      preferences.comfort
    )
      ? preferences.comfort
      : [];


  const specialRequirements =
    Array.isArray(
      preferences.specialRequirements
    )
      ? preferences.specialRequirements
      : [];


  const custom =
    cleanText(
      preferences.customRequirements,
      1200
    );


  /*
   * Natural-language requirements
   */

  const naturalLanguage = [];

  if (custom) {
    naturalLanguage.push(
      custom
    );
  }


  /*
   * Core architectural priorities
   */

  const planningPriorities = [
    "logical architectural zoning",
    "functional room relationships",
    "meaningful circulation",
    "bedroom privacy",
    "usable room proportions",
    "furniture-aware planning",
    "natural light and ventilation",
    "efficient use of plot area",
  ];


  /*
   * User's highest priority goes first.
   */

  if (
    preferences.highestPriority
  ) {
    planningPriorities.unshift(
      `Highest user priority: ${cleanText(
        preferences.highestPriority,
        200
      )}`
    );
  }


  /*
   * Basic feasibility conflicts
   */

  const conflicts = [];


  if (
    data.plot.width <= 0 ||
    data.plot.length <= 0
  ) {
    conflicts.push(
      "Plot dimensions are missing or invalid."
    );
  }


  if (
    data.household.bedrooms <= 0
  ) {
    conflicts.push(
      "At least one bedroom is required."
    );
  }


  if (
    data.household.bathrooms <= 0
  ) {
    conflicts.push(
      "At least one bathroom is required."
    );
  }


  /*
   * Preserve the user's relationships.
   */

  const adjacencyRequirements = [
    ...relationships,
  ];


  /*
   * Core architectural relationships.
   */

  adjacencyRequirements.push(
    "Living area should connect naturally to dining.",
    "Dining area should have a direct functional relationship with kitchen.",
    "Master bedroom should directly connect to its attached bathroom.",
    "Common bathrooms should be reachable from common circulation."
  );


  /*
   * Preserve requested separations.
   */

  const separationRequirements = [
    ...separations,

    "Bedrooms should be protected from direct visitor circulation.",

    "Common bathroom access should not require passing through a bedroom.",
  ];


  /*
   * Fallback structured brief.
   */

  return {
    projectType:
      data.projectType,

    plot: {
      width:
        data.plot.width,

      length:
        data.plot.length,

      area:
        data.plot.area,

      unit:
        data.plot.unit,
    },

    budget: {
      amount:
        data.budget.amount,

      currency:
        data.budget.currency,
    },

    household: {
      people:
        data.household.people,

      bedrooms:
        data.household.bedrooms,

      bathrooms:
        data.household.bathrooms,
    },

    requiredSpaces: [],

    adjacencyRequirements:
      uniqueStrings(
        adjacencyRequirements,
        30
      ),

    separationRequirements:
      uniqueStrings(
        separationRequirements,
        30
      ),

    priorities:
      uniqueStrings(
        priorities,
        20
      ),

    lifestyleRequirements:
      uniqueStrings(
        lifestyle,
        20
      ),

    comfortRequirements:
      uniqueStrings(
        comfort,
        20
      ),

    specialRequirements:
      uniqueStrings(
        specialRequirements,
        25
      ),

    furnitureConstraints:
      uniqueStrings(
        data.furnitureConstraints,
        50
      ),

    applianceConstraints: [],

    naturalLanguageRequirements:
      uniqueStrings(
        naturalLanguage,
        20
      ),

    planningPriorities:
      uniqueStrings(
        planningPriorities,
        20
      ),

    conflictsToCheck:
      uniqueStrings(
        conflicts,
        20
      ),

    feasibilityQuestions: [
      "Can all requested rooms fit while maintaining practical room proportions?",

      "Can circulation connect public, private and service zones logically?",

      "Can furniture and appliances fit without compromising circulation?",

      "Can attached and common bathrooms receive appropriate access?",
    ],

    planningSummary:
      "A structured architectural brief was created from the user's collected requirements because the AI service is temporarily unavailable. The MyNest spatial planning engine can continue using these requirements without inventing user preferences.",
  };
}


/*
|--------------------------------------------------------------------------
| MAIN ANALYZER
|--------------------------------------------------------------------------
*/

export async function analyzeRequirements(
  requirements
) {
  /*
   * Check API key.
   *
   * If there is no key, use the fallback instead of
   * completely breaking MyNest.
   */

  const compactRequirements =
    buildCompactRequirements(
      requirements
    );


  if (
    !process.env.OPENAI_API_KEY
  ) {
    console.warn(
      "OPENAI_API_KEY is not configured. Using MyNest architectural fallback."
    );

    return createFallbackAnalysis(
      compactRequirements
    );
  }


  /*
   * Keep the AI input compact.
   */

  const inputText =
    [
      "Analyze this MyNest architectural requirement brief.",
      "",
      JSON.stringify(
        compactRequirements
      ),
    ].join("\n");


  try {
    const response =
      await client.responses.create(
        {
          model:
            process.env.OPENAI_MODEL ||
            "gpt-6-luna",

          store: false,

          instructions:
            SYSTEM_INSTRUCTIONS,

          input: [
            {
              role: "user",

              content: [
                {
                  type: "input_text",

                  text:
                    inputText,
                },
              ],
            },
          ],

          /*
           * The analyzer only needs a compact
           * structured response.
           */

          max_output_tokens:
            3500,

          text: {
            format: {
              type: "json_schema",

              name:
                "mynest_planning_requirements",

              strict: true,

              schema:
                REQUIREMENT_SCHEMA,
            },
          },
        }
      );


    const output =
      response?.output_text;


    if (!output) {
      throw new Error(
        "The AI returned an empty requirement analysis."
      );
    }


    let analysis;


    try {
      analysis =
        JSON.parse(
          output
        );
    } catch {
      throw new Error(
        "The AI returned invalid structured planning data."
      );
    }


    return analysis;

  } catch (error) {

    /*
     * IMPORTANT:
     *
     * Do NOT stop MyNest when the external AI service
     * reaches its rate limit.
     *
     * The fallback preserves the user's requirements
     * and allows the spatial planning engine to continue.
     */

    console.error(
      "MyNest AI requirement analyzer unavailable:",
      error
    );


    console.warn(
      "Continuing with deterministic architectural requirement analysis."
    );


    return createFallbackAnalysis(
      compactRequirements
    );
  }
}