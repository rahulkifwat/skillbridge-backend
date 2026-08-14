const asyncHandler = require("../utils/asyncHandler");
const dashboardService = require("../utils/dashboardService");

const overview = asyncHandler(async (req, res) => {
  res.json({
    success: true,
    data: {
      role: req.user.role,
      overview: dashboardService.getOverview(req.user.role),
    },
  });
});

module.exports = { overview };
