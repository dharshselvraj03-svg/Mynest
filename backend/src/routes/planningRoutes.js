import express from "express";

import {
  analyzeRequirements,
} from "../services/aiRequirementAnalyzer.js";

import {
  generateSpatialPlan,
} from "../services/aiSpatialPlanner.js";

const router =
  express.Router();

router.post(
  "/analyze-requirements",
  async (req, res) => {
    try {
      const requirements =
        req.body?.requirements;

      if (
        !requirements ||
        typeof requirements !==
          "object"
      ) {
        return res.status(400).json({
          success: false,
          error:
            "Requirements are required.",
        });
      }

      const analysis =
        await analyzeRequirements(
          requirements
        );

      return res.json({
        success: true,
        analysis,
      });
    } catch (error) {
      console.error(
        "Requirement analysis failed:",
        error
      );

      return res.status(500).json({
        success: false,
        error:
          error?.message ||
          "AI requirement analysis failed.",
      });
    }
  }
);

router.post(
  "/generate-plan",
  async (req, res) => {
    try {
      const requirements =
        req.body?.requirements;

      const aiAnalysis =
        req.body?.aiAnalysis;

      if (
        !requirements ||
        typeof requirements !==
          "object"
      ) {
        return res.status(400).json({
          success: false,
          error:
            "Requirements are required.",
        });
      }

      const plan =
        await generateSpatialPlan(
          requirements,
          aiAnalysis
        );

      return res.json({
        success: true,
        plan,
      });
    } catch (error) {
      console.error(
        "Spatial planning failed:",
        error
      );

      return res.status(500).json({
        success: false,
        error:
          error?.message ||
          "AI spatial planning failed.",
      });
    }
  }
);

export default router;