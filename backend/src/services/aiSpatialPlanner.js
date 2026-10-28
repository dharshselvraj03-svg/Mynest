import OpenAI from "openai";

import {
  generateArchitecturalConcepts,
} from "./architecturalPlanningEngine.js";

/*
|--------------------------------------------------------------------------
| MyNest AI Spatial Planning Integration
|--------------------------------------------------------------------------
|
| AI is responsible for interpreting architectural intent.
|
| The deterministic architectural engine is responsible for geometry.
|
| This separation is intentional:
|
| AI
| ↓
| Structured architectural brief
| ↓
| Architectural planning engine
| ↓
| Validated concepts
|
|--------------------------------------------------------------------------
*/

const client = process.env.OPENAI_API_KEY
  ? new OpenAI({
      apiKey:
        process.env.OPENAI_API_KEY,
    })
  : null;

const MODEL =
  process.env.OPENAI_MODEL ||
  "gpt-6-luna";

/*
|--------------------------------------------------------------------------
| OPTIONAL AI PLANNING INTERPRETATION
|--------------------------------------------------------------------------
|
| The requirement analyzer already produces the structured brief.
|
| This second AI call is deliberately small.
|
| It does NOT generate coordinates.
| It only helps convert nuanced user preferences into
| architectural priorities.
|--------------------------------------------------------------------------
*/

const PLANNING_INTENT_SCHEMA = {
  type: "object",

  additionalProperties: false,

  properties: {
    planningPriorities: {
      type: "array",

      items: {
        type: "string",
      },
    },

    privacyPriorities: {
      type: "array",

      items: {
        type: "string",
      },
    },

    functionalPriorities: {
      type: "array",

      items: {
        type: "string",
      },
    },

    importantRelationships: {
      type: "array",

      items: {
        type: "object",

        additionalProperties:
          false,

        properties: {
          a: {
            type: "string",
          },

          b: {
            type: "string",
          },

          reason: {
            type: "string",
          },
        },

        required: [
          "a",
          "b",
          "reason",
        ],
      },
    },

    importantSeparations: {
      type: "array",

      items: {
        type: "object",

        additionalProperties:
          false,

        properties: {
          a: {
            type: "string",
          },

          b: {
            type: "string",
          },

          reason: {
            type: "string",
          },
        },

        required: [
          "a",
          "b",
          "reason",
        ],
      },
    },

    planningSummary: {
      type: "string",
    },
  },

  required: [
    "planningPriorities",
    "privacyPriorities",
    "functionalPriorities",
    "importantRelationships",
    "importantSeparations",
    "planningSummary",
  ],
};

const SYSTEM_INSTRUCTIONS = `
You are the architectural-intent interpreter for MyNest.

MyNest is an AI-assisted residential planning decision-support
system.

The spatial planning engine generates geometry.

You MUST NOT generate coordinates.

You MUST NOT generate room rectangles.

You MUST NOT invent a floor plan.

Your job is to understand the user's requirements and identify
the architectural priorities that the spatial engine must respect.

Consider:

- plot
- family
- bedrooms
- bathrooms
- lifestyle
- room relationships
- privacy
- furniture
- appliances
- storage
- special requirements
- natural-language preferences
- future expansion
- comfort
- functional access

Preserve explicit user requirements.

Do not replace user requirements with generic architecture.

Return concise structured planning intent.
`;

/*
|--------------------------------------------------------------------------
| FALLBACK
|--------------------------------------------------------------------------
*/

function fallbackIntent(
  requirements,
  aiBrief
) {
  const preferences =
    requirements.preferences ||
    {};

  return {
    planningPriorities: [
      "functional room relationships",
      "logical circulation",
      "privacy",
      "usable room proportions",
      "furniture-aware planning",
    ],

    privacyPriorities: [
      "protect bedrooms from visitor circulation",
      "provide common bathroom access without crossing bedrooms",
    ],

    functionalPriorities: [
      "living connected to dining",
      "dining connected to kitchen",
      "master bedroom connected to attached bathroom",
    ],

    importantRelationships:
      Array.isArray(
        aiBrief?.adjacencyRequirements
      )
        ? aiBrief.adjacencyRequirements
        : [],

    importantSeparations:
      Array.isArray(
        aiBrief?.separationRequirements
      )
        ? aiBrief.separationRequirements
        : [],

    planningSummary:
      preferences.customRequirements ||
      aiBrief?.planningSummary ||
      "Generate a functional personalized residential concept.",
  };
}

/*
|--------------------------------------------------------------------------
| AI INTENT
|--------------------------------------------------------------------------
*/

async function getPlanningIntent(
  requirements,
  aiBrief
) {
  if (!client) {
    return fallbackIntent(
      requirements,
      aiBrief
    );
  }

  try {
    const response =
      await client.responses.create({
        model: MODEL,

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
                  "Interpret these MyNest requirements for the architectural planning engine.\n\n" +
                  JSON.stringify(
                    {
                      requirements,

                      structuredBrief:
                        aiBrief,
                    },
                    null,
                    2
                  ),
              },
            ],
          },
        ],

        text: {
          format: {
            type: "json_schema",

            name:
              "mynest_planning_intent",

            strict: true,

            schema:
              PLANNING_INTENT_SCHEMA,
          },
        },
      });

    return JSON.parse(
      response.output_text
    );
  } catch (error) {
    console.error(
      "MyNest planning-intent AI failed. Using structured fallback.",
      error
    );

    return fallbackIntent(
      requirements,
      aiBrief
    );
  }
}

/*
|--------------------------------------------------------------------------
| PUBLIC API
|--------------------------------------------------------------------------
*/

export async function generateSpatialPlan(
  requirements = {},
  aiAnalysis = {}
) {
  /*
   * First understand nuanced user intent.
   */

  const planningIntent =
    await getPlanningIntent(
      requirements,
      aiAnalysis
    );

  /*
   * Merge the intent into the brief.
   *
   * The deterministic planner consumes this.
   */

  const enrichedBrief = {
    ...aiAnalysis,

    planningPriorities: [
      ...(Array.isArray(
        aiAnalysis?.planningPriorities
      )
        ? aiAnalysis.planningPriorities
        : []),

      ...(planningIntent.planningPriorities ||
        []),
    ],

    adjacencyRequirements: [
      ...(Array.isArray(
        aiAnalysis?.adjacencyRequirements
      )
        ? aiAnalysis.adjacencyRequirements
        : []),

      ...(planningIntent.importantRelationships ||
        []),
    ],

    separationRequirements: [
      ...(Array.isArray(
        aiAnalysis?.separationRequirements
      )
        ? aiAnalysis.separationRequirements
        : []),

      ...(planningIntent.importantSeparations ||
        []),
    ],

    planningSummary:
      planningIntent.planningSummary ||
      aiAnalysis?.planningSummary ||
      "",
  };

  /*
   * Geometry is now generated by the
   * architecture-first engine.
   */

  const result =
    generateArchitecturalConcepts(
      requirements,
      enrichedBrief
    );

  return {
    ...result,

    aiPlanningIntent:
      planningIntent,

    generatedBy:
      "MyNest AI Requirement Understanding + Architectural Planning Engine",
  };
}

/*
|--------------------------------------------------------------------------
| Export for future testing
|--------------------------------------------------------------------------
*/

export {
  generateArchitecturalConcepts,
};