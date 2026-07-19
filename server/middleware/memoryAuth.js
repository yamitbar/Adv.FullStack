const Memory = require("../models/Memory");

// Loads the target memory and confirms the authenticated user is allowed
// to add images to it *before* Multer runs, so a request from someone who
// doesn't own the memory never reaches disk in the first place. Attaches
// the loaded memory to req.memory so the controller doesn't have to
// re-fetch it.
//
// For this MVP only the memory creator may upload images to it.
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
