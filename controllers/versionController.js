exports.getVersionInfo = async (req, res) => {
    try {
      // These values should come from environment variables
      const minVersion = process.env.MIN_APP_VERSION || "1.0.0";
      const latestVersion = process.env.LATEST_APP_VERSION || "1.0.6";
      const forceUpdate = process.env.FORCE_UPDATE === "true";
      const updateMessage = process.env.UPDATE_MESSAGE || "Please update your app to continue using the latest features.";
  
      res.status(200).json({
        success: true,
        data: {
          minVersion,
          latestVersion,
          forceUpdate,
          updateMessage
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  };