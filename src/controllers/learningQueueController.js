const VocabularyItem = require("../models/VocabularyItem");
const LearningQueue = require("../models/LearningQueue");

const UNFAMILIAR_SCORE = {
  0: 3,
  1: 2,
  2: 2,
  3: 0,
};

const ITEM_TYPE_WEIGHT = {
  classroom_instruction: 8,
  technical_phrase: 7,
  assignment_phrase: 7,
  speaking_sentence: 6,
  core_term: 5,
  discourse_marker: 4,
  filler: -10,
};

function computePriority(item) {
  const unfamiliarScore = UNFAMILIAR_SCORE[item.familiarityLevel] ?? 0;
  const typeWeight = ITEM_TYPE_WEIGHT[item.itemType] ?? 0;

  return (
    item.globalFrequency * 0.4 +
    item.lessonCount * 2 +
    item.courseCount * 5 +
    unfamiliarScore * 10 +
    typeWeight
  );
}

exports.generate = async (req, res) => {
  try {
    const candidates = await VocabularyItem.find({
      isLearningTarget: true,
      familiarityLevel: { $lt: 3 },
      itemType: { $ne: "filler" },
      $or: [{ globalFrequency: { $gte: 2 } }, { lessonCount: { $gte: 2 } }],
    }).lean();

    let createdCount = 0;
    let updatedCount = 0;

    for (const item of candidates) {
      const score = computePriority(item);

      const result = await LearningQueue.findOneAndUpdate(
        { vocabularyItemId: item._id },
        {
          vocabularyItemId: item._id,
          priorityScore: score,
          $setOnInsert: { learningStatus: "new", reviewCount: 0 },
        },
        { upsert: true, new: true }
      );

      if (result.createdAt.getTime() === result.updatedAt.getTime()) {
        createdCount++;
      } else {
        updatedCount++;
      }
    }

    const skippedCount = await LearningQueue.countDocuments({
      vocabularyItemId: { $nin: candidates.map((c) => c._id) },
    });

    res.json({
      message: "Learning queue generated.",
      data: {
        candidatesFound: candidates.length,
        createdCount,
        updatedCount,
        skippedCount,
      },
    });
  } catch (err) {
    res.status(500).json({ message: "Failed to generate learning queue.", error: err.message });
  }
};
