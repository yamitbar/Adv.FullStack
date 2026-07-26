const Memory = require("../models/Memory");

// Confirms the authenticated user owns the memory *before* Multer runs,
// so an unauthorized request never reaches disk. Attaches the loaded
// memory to req.memory so the controller doesn't have to re-fetch it.
const authorizeMemoryImageUpload = async (req, res, next) => {
  try {
    const memory = await Memory.findById(req.params.id);

    if (!memory) {
      return res.status(404).json({
        success: false,
        message: "Memory not found",
      });
    }

    if (
      memory.createdBy.toString() !==
      req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message:
          "Only the memory creator can upload images to this memory",
      });
    }

    req.memory = memory;
    next();
  } catch (error) {
    next(error);
  }
};

module.exports = {
  authorizeMemoryImageUpload,
};
