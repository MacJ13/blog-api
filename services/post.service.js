const User = require("../models/user.model");
const Post = require("../models/post.model");

const { POSTS_PER_PAGE } = require("../configs/main.config");

const getPostsByQuery = async (query, page) => {
  // skip first n documents depending on current page
  const skip = (page - 1) * POSTS_PER_PAGE;

  const filter = { hidden: false };

  if (query.user) {
    const user = await User.findOne({ nickname: query.user }, "_id nickname");

    // const user = await User.findOne(
    //   { nickname: { $regex: `^${query.user}$`, $options: "i" } },
    //   "_id nickname"
    // );

    if (!user) {
      const noUserPosts = [];

      return [noUserPosts, noUserPosts.length];
    }
    filter.author = user._id;
  }

  if (query.post) {
    filter.title = { $regex: `\\b${query.post}`, $options: "i" };
  }

  // const totalPosts = console.log(totalPosts);

  return await Promise.all([
    await Post.find(filter, "title author timeStamp")
      .limit(POSTS_PER_PAGE)
      .skip(skip)
      .sort({ timeStamp: -1 })
      .populate("author", "nickname")
      .exec(),
    await Post.countDocuments(filter).exec(),
  ]);
};

module.exports = { getPostsByQuery };
