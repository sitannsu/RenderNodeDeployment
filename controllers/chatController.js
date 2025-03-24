const Message = require("../models/messageModel");
const User = require("../models/userModel");
const WebSocket = require("ws");
const { clients } = require("../utils/otpUtils");
const upload = require("../middleware/upload.middleware");
const { sendFCMNotification } = require("../utils/notifications");
// Get all chats for admin or superadmin
exports.getAllChats = async (req, res) => {
  const currentUser = req.user;
  const { page = 1, limit = 20 } = req.query;

  try {
    // Check if the user is an admin or superadmin
    if (
      currentUser.userRole !== "admin1" &&
      currentUser.userRole !== "admin2" &&
      currentUser.userRole !== "superadmin"
    ) {
      return res.status(403).json({ message: "Access denied" });
    }
    const chats = await getChats({ page, limit });
    res.status(200).json(chats);
  } catch (error) {
    res.status(500).json({ message: "Internal server error", error });
  }
};

// Get all messages between the current user and the admin/superadmin
exports.getAllMessagesWithUser = async (req, res) => {
  const currentUser = req.user;
  const { page = 1, limit = 20, orderId } = req.query;

  try {
    const adminId = "99999";
    const userId =
      currentUser.userRole === "user"
        ? currentUser.userId
        : req.params.otherUserId;

    // Build the filter object
    let filter = {
      $or: [
        { sender: userId, receiver: adminId },
        { sender: adminId, receiver: userId }
      ]
    };

    if (orderId) {
      filter.orderId = orderId; // Filter by orderId if provided
    }

    const messages = await Message.find(filter)
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .sort({ timestamp: -1 });
    res.status(200).json(messages);
  } catch (error) {
    res.status(500).json({ message: "Internal server error", error });
  }
};

exports.sendMessage = async (req, res) => {
  upload.single("file")(req, res, async err => {
    if (err) {
      return res
        .status(500)
        .json({ message: "File upload failed", error: err });
    }

    const { message, orderId } = req.body;
    const currentUser = req.user;
    const senderId =
      currentUser.userRole === "user" ? currentUser.userId : "99999";
    if (!req?.file?.path && !message) {
      res.status(400).json({ message: "Empty message" });
      return;
    }

    try {
      let receiverId =
        currentUser.userRole === "user" ? "99999" : req.params.otherUserId;

      const newMessage = new Message({
        sender: senderId,
        receiver: receiverId,
        message,
        orderId,
        fileUrl: req?.file?.path || ""
      });

      if (req.file) {
        newMessage.fileUrl = req.file.path; // Save the file URL in the message
      }

      await newMessage.save();

      // Notify admin or user based on the sender role
      if (currentUser.userRole === "user") {
        res.status(201).json(newMessage);
        const admins = clients.get("99999");
        admins &&
          Object.keys(admins).forEach(key => {
            admins[key]?.emit("message", {
              userId: senderId,
              data: newMessage
            });
          });
      } else {
        //CODE FOR NOTIFICATION STARTS
        console.log(receiverId);
        const user = await User.find({ userId: Number(receiverId) });
        const fcmToken = user[0].fcmToken;
        
        if (fcmToken) {
          try {
            await sendFCMNotification(
              fcmToken,
              'New Message',
              message,
              { type: 'chat_message', senderId: senderId.toString() }
            );
          } catch (error) {
            console.error('Error sending FCM notification:', error);
          }
        } else {
          console.log('No FCM token found for user:', receiverId);
        }
        //CODE FOR NOTIFICATION ENDS
        clients.get(Number(receiverId))?.emit("message", {
          userId: senderId,
          data: newMessage
        });
        res.status(201).json(newMessage);
      }
      refreshAllChats(
        senderId,
        currentUser.userRole === "user" ? "admin1" : "user",
        receiverId,
        "sendMessage"
      );
    } catch (error) {
      res.status(500).json({ message: "Internal server error", error });
    }
  });
};

exports.getChatsByUser = async (req, res) => {
  const currentUser = req.user;
  const { page = 1, limit = 20 } = req.query;

  // Determine the userId to filter by
  const userId =
    currentUser.userRole === "user"
      ? currentUser.userId
      : req.params.otherUserId;

  try {
    if (
      currentUser.userRole === "admin1" ||
      currentUser.userRole === "admin2" ||
      currentUser.userRole === "superadmin"
    ) {
      if (!userId) {
        return res.status(400).json({ message: "User ID is required" });
      }
    }

    const chats = await getAllChatsByUser({
      userRole: currentUser.userRole,
      userId,
      page,
      limit
    });

    res.status(200).json(chats);
  } catch (error) {
    res.status(500).json({ message: "Internal server error", error });
  }
};

exports.changeMessageStatus = async (userId, userRole, orderId) => {
  try {
    const senderId = userRole === "user" ? "99999" : userId;
    const receiverId = userRole === "user" ? userId : "99999";
    await Message.updateMany(
      { sender: senderId, receiver: receiverId, orderId: orderId }, // Filter condition
      { $set: { status: "read" } } // Update operation
    );
    refreshAllChats(senderId, userRole, userId);
  } catch (error) {
    console.error("Error updating message status:", error);
    throw error; // Optionally, throw the error to be handled by the caller
  }
};

const getAllChatsByUser = async data => {
  const { userRole, userId, page = 1, limit = 20 } = data;
  try {
    const senderId = userRole === "user" ? "99999" : userId;

    const chats = await Message.aggregate([
      {
        $match: {
          $or: [{ sender: Number(userId) }, { receiver: Number(userId) }]
        }
      },
      {
        $group: {
          _id: {
            orderId: "$orderId"
          },
          lastMessage: { $last: "$$ROOT" },
          unreadMessages: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ["$status", "sent"] },
                    { $eq: ["$sender", Number(senderId)] }
                  ]
                },
                1,
                0
              ]
            }
          }
        }
      },
      { $sort: { "lastMessage.timestamp": -1 } },
      { $skip: (page - 1) * limit },
      { $limit: parseInt(limit) }
    ]);

    const formattedChats = chats.map(chat => ({
      orderId: chat._id.orderId,
      lastMessage: chat.lastMessage.message,
      timestamp: chat.lastMessage.timestamp,
      unreadMessages: chat.unreadMessages
    }));

    return formattedChats;
  } catch (error) {
    res.status(500).json({ message: "Internal server error", error });
  }
};

const getChats = async data => {
  const { page = 1, limit = 20 } = data;
  const chats = await Message.aggregate([
    {
      $group: {
        _id: {
          userId: {
            $cond: [
              { $gt: ["$sender", "$receiver"] },
              ["$sender", "$receiver"],
              ["$receiver", "$sender"]
            ]
          }
        },
        lastMessage: { $last: "$$ROOT" },
        unreadMessages: {
          $sum: {
            $cond: [
              {
                $and: [
                  { $eq: ["$status", "sent"] },
                  { $ne: ["$sender", 99999] },
                  { $eq: ["$receiver", 99999] }
                ]
              },
              1,
              0
            ]
          }
        }
      }
    },
    {
      $lookup: {
        from: "users",
        localField: "_id.userId",
        foreignField: "userId",
        as: "user"
      }
    },
    { $unwind: "$user" },
    { $sort: { "lastMessage.timestamp": -1 } },
    { $skip: (page - 1) * limit },
    { $limit: parseInt(limit) }
  ]);

  const formattedChats = chats.map(chat => ({
    isActive: clients.get(chat.user.userId) ? true : false,
    userId: chat.user.userId,
    userName: chat.user.userName,
    phoneNumber: chat.user.phoneNumber,
    lastMessage: chat.lastMessage.message,
    timestamp: chat.lastMessage.timestamp,
    unreadMessages: chat.unreadMessages
  }));
  return formattedChats;
};

const refreshAllChats = async (senderId, userRole, userId, from = null) => {
  try {
    const chats = await getAllChatsByUser({
      userRole,
      userId: userId === "99999" ? senderId : userId,
      page: 1,
      limit: 20
    });
    const admins = clients.get("99999");
    if (userRole !== "user") {
      admins &&
        Object.keys(admins).forEach(key => {
          admins[key]?.emit("allChatsByUserId", {
            userId: senderId,
            data: chats
          });
        });
    } else if (clients.get(Number(userId))) {
      const clientSocket = clients.get(Number(userId));
      if (clientSocket) {
        clientSocket.emit("allChatsByUserId", {
          userId: senderId,
          data: chats
        });
      }
      if (from === "sendMessage") {
        const allChatsByUserIdForAdmin = await getAllChatsByUser({
          userRole: "admin1",
          userId: userId,
          page: 1,
          limit: 20
        });
        admins &&
          Object.keys(admins).forEach(key => {
            admins[key]?.emit("allChatsByUserId", {
              userId: userId,
              data: allChatsByUserIdForAdmin
            });
          });
      }
    }

    const allChats = await getChats({});
    admins &&
      Object.keys(admins).forEach(key => {
        admins[key]?.emit("allChats", {
          userId: senderId,
          data: allChats
        });
      });
  } catch (err) {
    console.log(err);
  }
};
